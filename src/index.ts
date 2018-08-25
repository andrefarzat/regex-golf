const colors = require('colors/safe');
const args = require('args');
const fs = require('fs');
import * as path from 'path';
import * as moment from "moment";

import ILS from './localsearch/ILS';
import ILS_Shrink from './localsearch/ILS_Shrink';
import LocalSearch from './localsearch/LocalSearch';
import RRLS from './localsearch/RRLS';

import Logger from './Logger';
import Utils from './Utils';
import Constructed_RRLS from "./localsearch/Constructed_RRLS";
import Individual from "./models/Individual";
import Neighborhood from './models/Neighborhood';
import EvaluatorFactory from './models/EvaluatorFactory';


args.option('name', 'O nome do algoritmo. Opções: "ILS", "ILS_Shrink", "RRLS", "Constructed_RRLS"')
    .option('instance', 'O nome da instância do problema')
    .option('depth', 'O tamanho do depth', 5)
    .option('budget', 'Número máximo de avaliações', 100000 * 6)
    .option('log-level', 'Log level entre 1 e 5', 3)
    .option('index', 'O índice da execução', 1)
    .option('seed', 'O seed para Random')
    .option('timeout', 'Timeout em miliseconds', 1000 * 60)
    .option('csv', 'Exportar resultado em csv');

const flags: {
    name: 'ILS'| 'ILS_Shrink' | 'RRLS' | 'Constructed_RRLS',
    instance: string,
    depth: number,
    budget: number,
    logLevel: number,
    index: number,
    timeout: number,
    seed: number,
    csv: string,
} = args.parse(process.argv);

if (!flags.name) {
    args.showHelp();
    process.exit();
}


Utils.setIndex(flags.index);
if (flags.seed) Utils.setSeed(flags.seed);

function getProgram(): LocalSearch {
    switch (flags.name) {
        case 'ILS':              return new ILS(flags.instance);
        case 'ILS_Shrink':       return new ILS_Shrink(flags.instance);
        case 'RRLS':             return new RRLS(flags.instance);
        case 'Constructed_RRLS': return new Constructed_RRLS(flags.instance);
    }

    console.log(`${flags.name} não é um algoritmo válido.`);
    process.exit(1);
}

async function main() {
    // 1. Carrega a instância do problema
    // 2. Instância o programa
    let program = getProgram();

    // 3. Seta o Budget
    program.budget = flags.budget;
    program.depth = flags.depth;
    program.seed = flags.seed;
    program.index = flags.index;

    // 4. Seta o Timeout
    program.maxTimeout = moment().add(flags.timeout, 'milliseconds');
    program.init();

    let logger = Logger.create(flags.logLevel, program);

    // 5. Gera indivíduo inicial
    let currentSolution = program.generateInitialIndividual();
    await program.evaluator.evaluate(currentSolution);
    logger.logInitialSolution(currentSolution);

    // 6. Loop
    do {
        // 6.1. Has timed out ?
        //      Then -> Set as timed out
        //           -> Stop!
        if (program.maxTimeout.diff(new Date()) < 0) {
            program.hasTimedOut = true;
            // break;
        }

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

        try {

            await neighborhood.evaluate(ind => {
                logger.logSolution(ind);

                // 6.4.1. Neighbor is better than current solution ?
                //        Then -> Current = Neighbor
                //             -> Seta que encontrou melhor
                if (ind.isBetterThan(currentSolution)) {
                    logger.log(2, `[Found better] [from: ${currentSolution.toString()} fitness: ${currentSolution.fitness}] [to: ${ind.toString()} fitness: ${ind.fitness}]`);
                    currentSolution = ind;
                    hasFoundBetter = true;
                }
            });
        } catch (e) {
            console.log('Neighborhood error: ' + e.message);
        }

        // 6.5. Não encontrou melhor?
        //      Then -> Loga solução local
        //           -> Realizar o restart
        if (!hasFoundBetter) {
            program.addLocalSolution(currentSolution);
            currentSolution = await program.restartFromSolution(currentSolution);
            await program.evaluator.evaluate(currentSolution);
            logger.logEmptyLine();
            logger.log(3, `[Jumped to] ${currentSolution.toString()}`);
        }
    } while (true);

    program.evaluator.close();

    // 7. Apresentar resultados
    function sorter(a: Individual, b: Individual): number {
        if (a.fitness > b.fitness) return -1;
        if (a.fitness < b.fitness) return 1;

        if (a.toString().length > b.toString().length) return 1;
        if (a.toString().length < b.toString().length) return -1;

        return 0;
    };

    logger.logEmptyLine();
    logger.log(2, `Was found ${program.localSolutions.length} local solution(s)`);
    program.localSolutions.sort(sorter);
    program.localSolutions.forEach(ind => {
        logger.logBestLocalSolution(ind);
        logger.log(3, `[Local Solution]: ${ind.toString()} [Fitness ${ind.fitness} of ${program.getMaxFitness()}] [Length ${ind.toString().length}]`);
    });

    logger.logEmptyLine();
    logger.log(2, `Was found ${program.solutions.length} solution(s)`);

    program.solutions.sort(sorter);
    program.solutions.forEach((ind, i) => {
        logger.logBestSolution(ind);
        let txt = `[Solution]: ${ind.toString()} [Fitness ${ind.fitness} of ${program.getMaxFitness()}] [Length ${ind.toString().length}]`;
        logger.log(1, (i == 0) ? colors.green(txt) : txt);
    });

    if (!flags.csv) process.exit();

    !function() {
        let bestSolution = program.getBestSolution();
        // Nome, Depth, i, seed
        let csvLine: (string | number)[] = [program.instanceName, program.depth, flags.index, program.seed];

        let startTime = moment(program.startTime);
        let endTime   = moment(program.endTime);

        if (bestSolution) {
            csvLine.push(bestSolution.toString()); // Melhor_solucao
            csvLine.push(bestSolution.shrink().toString()); // Melhor_solucao_shrunk
            csvLine.push(bestSolution.fitness); // Melhor_fitness
            csvLine.push(bestSolution.ourFitness); // Nossa_fitness
            csvLine.push(bestSolution.evaluationIndex); // Numero_de_comparacoes
            csvLine.push(bestSolution.evaluationTime); // Tempo_avaliacao
            csvLine.push(Math.abs(startTime.diff(bestSolution.createdDate, 'milliseconds'))); // Tempo_para_encontrar_melhor_solucao
        } else {
            csvLine.push('N/A'); // Melhor_solucao
            csvLine.push('N/A'); // Melhor_solucao_shrunk
            csvLine.push('N/A'); // Melhor_fitness
            csvLine.push('N/A'); // Nossa_fitness
            csvLine.push('N/A'); // Numero_de_comparacoes
            csvLine.push('N/A'); // Tempo_avaliacao
            csvLine.push('N/A'); // Tempo_para_encontrar_melhor_solucao
        }

        let totalTime = moment(program.endTime).diff(program.startTime, 'milliseconds');
        csvLine.push(totalTime); // Tempo_total
        csvLine.push(program.hasTimedOut ? 'true' : 'false'); // Timed_out

        let filepath = path.join(__dirname, '..', '..', 'results', flags.csv);
        fs.appendFileSync(filepath, csvLine.join(',') + `\n`);
    }();

    logger.logProgramEnd();
}

(async function() {
    await main();
    process.exit();
})();
