const args = require('args');
const fs = require('fs');
import * as moment from "moment";
import * as path from 'path';

import { ILS } from './localsearch/ILS';
import { ILS_Shrink } from './localsearch/ILS_shrink';
import { LocalSearch } from './localsearch/LocalSearch';

import { Logger } from './Logger';
import { Individual } from "./models/Individual";
import { Neighborhood } from './models/Neighborhood';
import { Utils } from './Utils';

// tslint:disable no-console

args.option('name', 'O nome do algoritmo. Opções: "ILS", "ILS_Shrink", "RRLS", "Constructed_RRLS"')
    .option('instance', 'O nome da instância do problema')
    .option('weight', 'O peso da fitness', 1)
    .option('depth', 'O tamanho do depth')
    .option('budget', 'Número máximo de avaliações', 100000 * 5)
    .option('log-level', 'Log level entre 1 e 5', 3)
    .option('index', 'O índice da execução', 0)
    .option('seed', 'O seed para Random')
    .option('max-evaluations', 'O número máximo de avaliações sem melhorias', 0)
    .option('timeout', 'Timeout em miliseconds', 10000 * 60)
    .option('csv', 'Exportar resultado em csv');

const flags: {
    name: 'ILS'| 'ILS_Shrink' | 'RRLS' | 'Constructed_RRLS',
    instance: string,
    weight: number,
    depth: string,
    budget: number,
    logLevel: number,
    index: number,
    maxEvaluations: number,
    timeout: number,
    seed: number,
    csv: string,
} = args.parse(process.argv);

if (!flags.name) {
    args.showHelp();
    process.exit();
}

Utils.setIndex(flags.index);
Individual.setWeight(flags.weight);
if (flags.seed) { Utils.setSeed(flags.seed); }
Logger.init({logLevel: flags.logLevel, instanceName: flags.instance});

function getProgram(): LocalSearch {
    switch (flags.name) {
        case 'ILS':              return new ILS(flags.instance);
        case 'ILS_Shrink':       return new ILS_Shrink(flags.instance);
    }

    console.log(`${flags.name} não é um algoritmo válido.`);
    process.exit(1);
}

async function main() {
    // 1. Carrega a instância do problema
    // 2. Instância o programa
    const program = getProgram();

    // 3. Seta o Budget
    program.budget = flags.budget;
    program.depth = parseInt(flags.depth, 10);
    program.seed = flags.seed;
    program.index = flags.index;

    if (flags.maxEvaluations > 0) {
        program.maxEvaluationsWithoutImprovement = flags.maxEvaluations;
    }

    // 4. Start
    program.init();

    // 5. Gera indivíduo inicial
    let currentSolution = program.generateInitialIndividual();
    await program.evaluator.evaluate(currentSolution);
    Logger.info(`[Initial solution]`, currentSolution.toLog());

    const visitedRegexes: string[] = [];
    let bestCurrentFitness = currentSolution.fitness;

    // 6. Loop
    do {
        // 6.2. Current Solution is the Best ?
        //      Then -> Add to solutions
        let hasFoundBetter = false;
        if (program.isBest(currentSolution)) {
            program.addSolution(currentSolution);
        }

        if (currentSolution.fitness > bestCurrentFitness) {
            Logger.info(`[New best current fitness (1)]`, currentSolution.toLog());
            bestCurrentFitness = currentSolution.fitness;
        }

        // 6.3. Should stop ?
        //      Then -> Stop !
        if (program.shouldStop(null, '1')) { break; }

        // 6.4 Evaluate Neighborhood
        const neighborhood = new Neighborhood(currentSolution, program);
        Logger.info(`[Starting neighborhood for]`, currentSolution.toLog());

        try {
            await neighborhood.evaluate((ind) => {
                Logger.debug(`[Solution]`, ind.toLog());

                if (ind.evaluationIndex % 10000 === 0) {
                    const time = moment().diff(program.startTime, 'ms');
                    // tslint:disable-next-line no-console max-line-length
                    console.log(`${ind.evaluationIndex} evaluated in ${time} ms. [actual best: ${bestCurrentFitness}] [eval count: ${program.evaluationsWithoutImprovement} of ${program.maxEvaluationsWithoutImprovement}]`);
                }

                // 6.4.1. Neighbor is better than current solution ?
                //        Then -> Current = Neighbor
                //             -> Seta que encontrou melhor
                if (ind.isBetterThan(currentSolution)) {
                    Logger.info(`[Found better]`, ind.toLog());
                    currentSolution = ind;
                    hasFoundBetter = true;

                    if (currentSolution.fitness > bestCurrentFitness) {
                        bestCurrentFitness = currentSolution.fitness;
                        program.evaluationsWithoutImprovement = 0;
                        Logger.info(`[New best current fitness (2)]`, currentSolution.toLog());
                    }

                    // Testing to see if we have somekind of loop
                    const hasVisitedThisInd = visitedRegexes.includes(ind.toString());
                    if (hasVisitedThisInd) {
                        // Logger.warn(`[Already visited]`, ind.toLog());
                    } else {
                        visitedRegexes.push(ind.toString());
                    }
                } else {
                    program.evaluationsWithoutImprovement += 1;
                }

                if (program.shouldStop(ind, '2')) {
                    throw new Error('Stop!');
                }
            });
        } catch (e) {
            if (e.message === 'Stop!') {
                console.log('Reason to stop:', program.reasonToStop);
                Logger.error('[Stop]', program.reasonToStop);
            } else {
                console.log('Neighborhood error:', e.message);
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
            Logger.info(`[Jumped to]`, currentSolution.toLog());
        }
    } while (true);

    program.evaluator.close();

    // 7. Apresentar resultados
    const bestSolution = program.getBestSolution() || currentSolution;

    Logger.info(`Was found ${program.localSolutions.length} local solution(s)`);
    program.localSolutions.forEach((ind) => {
        Logger.info(`[Local Solution]`, ind.toLog());
    });

    Logger.info(`Was found ${program.solutions.length} solution(s)`);

    program.solutions.forEach((ind) => {
        Logger.info(`[Solution]`, ind.toLog());
    });

    if (!flags.csv) { process.exit(); }

    // Nome, Depth
    const csvLine: Array<string | number> = [program.instanceName, program.depth];

    const startTime = moment(program.startTime);
    const totalTime = moment(program.endTime).diff(program.startTime, 'milliseconds');
    const maxFitess = flags.weight * program.left.length;

    const bestShrunkSolution = bestSolution.shrink();
    await program.evaluator.evaluate(bestShrunkSolution);

    csvLine.push(bestSolution.fitness); // Melhor_fitness
    csvLine.push(bestShrunkSolution.fitness); // Melhor_fitness_shrunk
    csvLine.push(maxFitess); // Maximo_finess
    csvLine.push(bestSolution.matchesOnLeft); // Matches_on_left
    csvLine.push(bestSolution.matchesOnRight); // Matches_on_right
    csvLine.push(bestSolution.evaluationIndex); // Numero_de_comparacoes
    csvLine.push(program.evaluator.evaluationCount); // Numero_total_de_comparacoes
    // Tempo_para_encontrar_melhor_solucao
    csvLine.push(Math.abs(startTime.diff(bestSolution.createdDate, 'milliseconds')));
    csvLine.push(totalTime); // Tempo_total
    csvLine.push(flags.index); // Index
    csvLine.push(program.seed); // Seed
    csvLine.push(bestSolution.simpleFitness); // Simple_fitness
    csvLine.push(bestSolution.toString()); // Melhor_solucao
    csvLine.push(bestShrunkSolution.toString()); // Melhor_solucao_shrunk
    csvLine.push(program.budget); // Orçamento
    csvLine.push(program.reasonToStop); // Reason to stop

    const filepath = path.join(__dirname, '..', 'results', flags.csv);
    fs.appendFileSync(filepath, csvLine.join(';') + `\n`);

    Logger.info(`[Program finished] total time: ${program.endTime.getTime() - program.startTime.getTime()}`);
}

(async function() {
    try {
        await main();
        console.log('Done!');
    } catch (e) {
        console.log('Error:');
        console.error(e);
    }
})();
