import Vue from 'vue/dist/vue.common.js';
import VueForm from 'vue-form';
const moment = require("moment");

import ILS_Shrink from '../src/localsearch/ILS_Shrink';
import Neighborhood from '../src/models/Neighborhood';
import { Logger } from './Logger';
import Utils from '../src/Utils';

import { instances } from './instances';

declare const window: any;

interface MainConfig {
    left: string[];
    right: string[];
    budget: number;
    depth: number;
    seed: number;
    timeout: number;
}


const data = () => {
    return {
        formstate: {} as any,
        matchList: instances.warmup.left.join('\n'),
        unmatchList: instances.warmup.right.join('\n'),
        budget: 500000,
        depth: 5,
        seed: 2967301147,
        timeout: 120000,
        isRunning: false,
        hasStarted: false,
    };
};

const computed = {
    instances() { return instances; }
};

const methods = {
    async letsRoll() {
        if (vue.formstate.$invalid) {
            return;
        }

        const left = vue.matchList.split('\n');
        const right = vue.unmatchList.split('\n');

        const config: MainConfig = {
            left, right,
            budget: vue.budget,
            depth: vue.depth,
            seed: vue.seed,
            timeout: vue.timeout,
        };

        vue.isRunning = true;
        vue.hasStarted = true;
        setTimeout(async () => main(config), 100);
    },
    hasError(name: string): boolean {
        if (!vue.formstate.$touched) {
            return false;
        }

        if (vue.formstate[name]) {
            return vue.formstate[name].$invalid as boolean;
        }

        return false;
    },
    fulfillFromInstance(instance: {left: string[], right: string[]}) {
        this.matchList = instance.left.join('\n');
        this.unmatchList = instance.right.join('\n');
    }
};

Vue.use(VueForm, {
    validators: {
        'min-items': function(value: string): boolean {
            return value.trim().split('\n').length >= 2;
        }
    },
});


const vue = new Vue({ data, computed, methods });

async function init() {
    vue.$mount('#app');

    document.getElementById('btn-start').addEventListener('click', letsRoll);
}

async function letsRoll() {
    if (vue.formstate.$invalid) {
        return;
    }

    const left = vue.matchList.split('\n');
    const right = vue.unmatchList.split('\n');

    const config: MainConfig = {
        left, right,
        budget: vue.budget,
        depth: vue.depth,
        seed: vue.seed,
        timeout: vue.timeout,
    };

    vue.isRunning = true;
    vue.hasStarted = true;
    setTimeout(async () => main(config), 100);
}


async function main(config: MainConfig) {
    // 1. Carrega a instância do problema
    const instance = { left: config.left, right: config.right };

    // 2. Instância o programa
    const program = new ILS_Shrink(instance.left, instance.right);
    program.env = 'browser';
    program.instanceName = 'browser';

    // 3. Seta o Budget
    program.budget = Logger.maxEvaluations = config.budget;
    program.depth = config.depth;
    program.seed = config.seed;
    program.index = 1;

    // 4. Seta o Timeout
    program.maxTimeout = moment().add(config.timeout, 'milliseconds');
    program.init();


    // 5. Gera indivíduo inicial
    let currentSolution = program.generateInitialIndividual();
    await program.evaluator.evaluate(currentSolution);
    Logger.logInitialSolution(currentSolution);

    let visitedRegexes: string[] = [];
    program.init();

    // 6. Loop
    do {
        // 6.2. Current Solution is the Best ?
        //      Then -> Add to solutions
        let hasFoundBetter = false;
        if (await program.isBest(currentSolution)) {
            program.addSolution(currentSolution);
        }

        // 6.3. Should stop ?
        //      Then -> Stop !
        if (program.shouldStop()) break;

        // 6.4 Evaluate Neighborhood
        let neighborhood = new Neighborhood(currentSolution, program);
        // Logger.info(`[Starting neighborhood for]`, currentSolution.toLog());
        Logger.logStartNeighborhood(currentSolution);

        await Utils.waitFor(() => vue.isRunning);

        try {
            await Utils.wait(13);
            await neighborhood.evaluate(ind => {
                Logger.debug(ind);

                if (ind.evaluationIndex % 100 === 0) {
                    const time = moment().diff(program.startTime, 'ms');
                    Logger.evaluation(ind, time)
                    // console.log(`${ind.evaluationIndex} evaluated in ${time} ms`);
                }

                // 6.4.1. Neighbor is better than current solution ?
                //        Then -> Current = Neighbor
                //             -> Seta que encontrou melhor
                if (ind.isBetterThan(currentSolution)) {
                    Logger.foundBetter(ind);
                    currentSolution = ind;
                    hasFoundBetter = true;

                    // Testing to see if we have somekind of loop
                    const hasVisitedThisInd = visitedRegexes.includes(ind.toString());
                    if (hasVisitedThisInd) {
                        Logger.alreadyVisited(ind);
                    } else {
                        visitedRegexes.push(ind.toString());
                    }
                }

                if (program.shouldStop()) throw new Error('Stop!');
            });
        } catch (e) {
            if (e.message === 'Stop!' && program.hasTimedOut) {
                Logger.error('Error', '[Timeout]');
            } else {
                Logger.error(`[Index Neighborhood error]`, e.message);
            }
        }

        // 6.5. Não encontrou melhor?
        //      Then -> Loga solução local
        //           -> Realizar o restart
        if (!hasFoundBetter) {
            program.addLocalSolution(currentSolution);
            currentSolution = await program.restartFromSolution(currentSolution);
            await program.evaluator.evaluate(currentSolution);
            Logger.jumpedTo(currentSolution);
        }
    } while (true);

    program.evaluator.close();
}

window.init = init;
window.main = main;

document.addEventListener('DOMContentLoaded', function () {
    init();
});