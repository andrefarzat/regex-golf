import { Injectable } from '@angular/core';
import dayjs from 'dayjs';

import { ILS_Shrink } from '../../../src/localsearch/ILS_Shrink';
import { LoggerService, LogType } from './logger.service';
import { Neighborhood } from '../../../src/models/Neighborhood';
import { Utils } from '../../../src/Utils';

export interface LocalSearchConfig {
    left: string[];
    right: string[];
    budget: number;
    depth: number;
    seed: number;
    timeout: number;
}

@Injectable({
  providedIn: 'root'
})
export class LocalSearchService {
    protected config?: LocalSearchConfig;
    public isRunning = false;

    constructor(public logger: LoggerService) { }

    public pause() {
        this.isRunning = false;
    }

    public play() {
        this.isRunning = true;
    }

    public async start(config: LocalSearchConfig) {
        this.config = config;
        this.play();

        const instance = { left: config.left, right: config.right };

        // 2. Instância o programa
        const program = new ILS_Shrink(instance.left, instance.right);
        program.env = 'browser';
        program.instanceName = 'browser';

        // 3. Seta o Budget
        program.budget = config.budget;
        program.depth = config.depth;
        program.seed = config.seed;
        program.index = 1;

        // 4. Seta o Timeout
        // program.maxTimeout = dayjs().add(config.timeout, 'milliseconds');
        program.init();

        // 5. Gera indivíduo inicial
        let currentSolution = program.generateInitialIndividual();
        await program.evaluator.evaluate(currentSolution);
        this.logger.logInitialSolution(currentSolution);

        let visitedRegexes: string[] = [];
        program.init();

        // 6. Loop
        do {
            // 6.2. Current Solution is the Best ?
            //      Then -> Add to solutions
            let hasFoundBetter = false;
            const isTheBest = program.isBest(currentSolution);
            if (isTheBest) {
                program.addSolution(currentSolution);
            }

            // 6.3. Should stop ?
            //      Then -> Stop !
            if (program.shouldStop()) break;

            // 6.4 Evaluate Neighborhood
            let neighborhood = new Neighborhood(currentSolution, program);
            // Logger.info(`[Starting neighborhood for]`, currentSolution.toLog());
            this.logger.logStartNeighborhood(currentSolution);

            await Utils.waitFor(() => this.isRunning);

            try {
                await Utils.wait(13);
                await neighborhood.evaluate(ind => {
                    this.logger.debug(ind);

                    if (ind.evaluationIndex % 100 === 0) {
                        const time = dayjs().diff(program.startTime, 'ms');
                        this.logger.evaluation(ind, time)
                        // console.log(`${ind.evaluationIndex} evaluated in ${time} ms`);
                    }

                    // 6.4.1. Neighbor is better than current solution ?
                    //        Then -> Current = Neighbor
                    //             -> Seta que encontrou melhor
                    if (ind.isBetterThan(currentSolution)) {
                        this.logger.foundBetter(ind);
                        currentSolution = ind;
                        hasFoundBetter = true;

                        // Testing to see if we have somekind of loop
                        const hasVisitedThisInd = visitedRegexes.includes(ind.toString());
                        if (hasVisitedThisInd) {
                            this.logger.alreadyVisited(ind);
                        } else {
                            visitedRegexes.push(ind.toString());
                        }
                    }

                    if (program.shouldStop()) throw new Error('Stop!');
                });
            } catch (e) {
                if (e.message === 'Stop!' && program.hasTimedOut) {
                    this.logger.error('Error', '[Timeout]');
                } else if (e.message === 'Stop!') {
                    // we are good
                } else {
                    this.logger.error(`[Index Neighborhood error]`, e.message);
                }
            }

            // 6.5. Não encontrou melhor?
            //      Then -> Loga solução local
            //           -> Realizar o restart
            if (!hasFoundBetter) {
                program.addLocalSolution(currentSolution);
                currentSolution = await program.restartFromSolution(currentSolution);
                await program.evaluator.evaluate(currentSolution);
                this.logger.jumpedTo(currentSolution);
            }
        } while (true);

        program.evaluator.close();
    }

}
