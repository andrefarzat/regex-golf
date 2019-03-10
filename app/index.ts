import Vue from 'vue/dist/vue.common.js';
import VueForm from 'vue-form';
const moment = require("moment");

import ILS_Shrink from '../src/localsearch/ILS_Shrink';
import Neighborhood from '../src/models/Neighborhood';


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
        matchList: '' as string,
        unmatchList: '' as string,
        budget: 500000,
        depth: 5,
        seed: 2967301147,
        timeout: 120000,
        isRunning: false,
        hasStarted: false,
    };
};

const created = () => {

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
        // main(config);
    },
    hasError(name: string): boolean {
        if (!vue.formstate.$submitted) {
            return false;
        }

        if (vue.formstate[name]) {
            return vue.formstate[name].$invalid as boolean;
        }

        return false;
    },
};

Vue.use(VueForm, {
    validators: {
        'min-items': function(value: string): boolean {
            console.log('min-items', value);
            return value.trim().split('\n').length >= 2;
        }
    },
});


const vue = new Vue({ data, created, methods });

async function init() {
    vue.$mount('#app');
}

async function isRunning() {
    if (vue.isRunning) return Promise.resolve(true);

    return new Promise<boolean>((resolve) => {
        const fn = () => {
            if (vue.isRunning) resolve(true);
            else setTimeout(fn, 100);
        };

        fn();
    });
}


async function main(config: MainConfig) {
    // 1. Carrega a instância do problema
    const instance = { left: config.left, right: config.right };

    // 2. Instância o programa
    const program = new ILS_Shrink(config.left, config.right);
    program.env = 'browser';
    program.instanceName = 'browser';

    // 3. Seta o Budget
    program.budget = config.budget;
    program.depth = config.depth;
    program.seed = config.seed;
    program.index = 1;

    // 4. Seta o Timeout
    program.maxTimeout = moment().add(config.timeout, 'milliseconds');
    program.init();


    // 5. Gera indivíduo inicial
    let currentSolution = program.generateInitialIndividual();
    await program.evaluator.evaluate(currentSolution);
    // Logger.info(`[Initial solution]`, currentSolution.toLog());

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

        await isRunning();

        try {
            await neighborhood.evaluate(ind => {
                // Logger.debug(`[Solution]`, ind.toLog());

                if (ind.evaluationIndex % 10000 === 0) {
                    const time = moment().diff(program.startTime, 'ms');
                    console.log(`${ind.evaluationIndex} evaluated in ${time} ms`);
                }

                // 6.4.1. Neighbor is better than current solution ?
                //        Then -> Current = Neighbor
                //             -> Seta que encontrou melhor
                if (ind.isBetterThan(currentSolution)) {
                    // Logger.info(`[Found better]`, ind.toLog());
                    currentSolution = ind;
                    hasFoundBetter = true;

                    // Testing to see if we have somekind of loop
                    const hasVisitedThisInd = visitedRegexes.includes(ind.toString());
                    if (hasVisitedThisInd) {
                        // Logger.warn(`[Already visited]`, ind.toLog());
                    } else {
                        visitedRegexes.push(ind.toString());
                    }
                }

                if (program.shouldStop()) throw new Error('Stop!');
            });
        } catch (e) {
            if (e.message === 'Stop!' && program.hasTimedOut) {
                // Logger.error('[Timeout]');
            } else {
                // Logger.error(`[Index Neighborhood error]`, e.message);
            }
        }

        // 6.5. Não encontrou melhor?
        //      Then -> Loga solução local
        //           -> Realizar o restart
        if (!hasFoundBetter) {
            program.addLocalSolution(currentSolution);
            currentSolution = await program.restartFromSolution(currentSolution);
            await program.evaluator.evaluate(currentSolution);
            // Logger.info(`[Jumped to]`, currentSolution.toLog());
        }
    } while (true);

    program.evaluator.close();
}

window.init = init;
window.main = main;

document.addEventListener('DOMContentLoaded', function () {
    init();
});