 import * as dayjs from 'dayjs';

import { ILS_Shrink } from "../localsearch/ILS_shrink";
import { Individual } from "../models/Individual";
import { ILogger } from '../loggers/ILogger';
import { Neighborhood } from "../models/Neighborhood";
import { Utils } from '../Utils';


export class Main {
    protected instanceName = 'abba';
    public ils: ILS_Shrink;
    public currentSolution: Individual;
    public q: Promise<void>;

    public visitedRegexes: string[] = [];
    public bestCurrentFitness: number = 0;

    public constructor(public logger: ILogger) {}

    public async execute(): Promise<void> {
        this.init();
        this.currentSolution = await this.generateInitialIndividual();
        return this.loop();
    }

    public setInstanceName(instanceName: string): void {
        this.instanceName = instanceName;
    }

    private async loop() {
        let currentIndInLoop: Individual;
        // 6. Loop
        do {
            // 6.2. Current Solution is the Best ?
            //      Then -> Add to solutions
            let hasFoundBetter = false;
            if (this.ils.isBest(this.currentSolution)) {
                this.ils.addSolution(this.currentSolution);
                this.logger.logAddSolution(this.currentSolution);
            }

            if (this.currentSolution.fitness > this.bestCurrentFitness) {
                this.logger.logBestCurrentSolutionAmongNeighborhoods(this.currentSolution);
                this.bestCurrentFitness = this.currentSolution.fitness;
            }

            // 6.3. Should stop ?
            //      Then -> Stop !
            if (this.ils.shouldStop(null, '1')) { break; }

            // 6.4 Evaluate Neighborhood
            const neighborhood = new Neighborhood(this.currentSolution, this.ils);
            this.logger.logStartNeighborhood(this.currentSolution);

            try {
                await neighborhood.evaluate((ind) => {
                    currentIndInLoop = ind;
                    this.logger.logEvaluation(ind);

                    // 6.4.1. Neighbor is better than current solution ?
                    //        Then -> Current = Neighbor
                    //             -> Seta que encontrou melhor
                    if (ind.isBetterThan(this.currentSolution)) {
                        this.logger.logFoundBetter(ind);
                        this.currentSolution = ind;
                        hasFoundBetter = true;

                        if (this.currentSolution.fitness > this.bestCurrentFitness) {
                            this.bestCurrentFitness = this.currentSolution.fitness;
                            this.ils.evaluationsWithoutImprovement = 0;
                            this.logger.logBestCurrentSolutionAmongNeighborhoods(this.currentSolution);
                        }

                        // Testing to see if we have somekind of loop
                        const hasVisitedThisInd = this.visitedRegexes.includes(ind.toString());
                        if (hasVisitedThisInd) {
                            // Logger.warn(`[Already visited]`, ind.toLog());
                            this.logger.logHasAlreadyVisited(ind);
                        } else {
                            this.visitedRegexes.push(ind.toString());
                        }
                    } else {
                        this.ils.evaluationsWithoutImprovement += 1;
                    }

                    if (this.ils.shouldStop(ind, '2')) {
                        throw new Error('Stop!');
                    }
                });
            } catch (e) {
                if (e.message === 'Stop!') {
                    console.log('Reason to stop:', this.ils.reasonToStop);
                } else {
                    this.logger.logNeighborhoodError(neighborhood, e);
                }
                break;
            }

            // 6.5. Não encontrou melhor?
            //      Then -> Loga solução local
            //           -> Realizar o restart
            if (!hasFoundBetter) {
                Utils.pauseCountingNextId();

                this.logger.logJumpedFrom(this.currentSolution);
                this.ils.addLocalSolution(this.currentSolution);
                this.logger.logAddLocalSolution(this.currentSolution);
                this.currentSolution = await this.ils.generateIndividualToRestart(this.currentSolution);

                // this.logger.logGenerateIndividualToRestart(this.currentSolution);
                Utils.continueCountingNextId();
                this.currentSolution.id = Utils.getNextId();

                await this.ils.evaluator.evaluate(this.currentSolution);
                this.logger.logJumpedTo(this.currentSolution);
            }
        } while (true);

        this.logger.logFinished(this.currentSolution, currentIndInLoop);
        this.finish();
        return Promise.resolve();
    }

    private init() {
        this.ils = new ILS_Shrink(this.instanceName, this.logger);

        this.ils.budget = 100000 * 5;
        this.ils.depth = 5;
        // this.ils.seed = 1234567890;
        this.ils.index = 0;

        this.ils.init();
    }

    private async generateInitialIndividual() {
        this.currentSolution = this.ils.generateInitialIndividual();
        await this.ils.evaluator.evaluate(this.currentSolution);
        this.logger.logInitialSolution(this.currentSolution);
        return this.currentSolution;
    }

    private finish() {
        this.ils.evaluator.close();
    }

}