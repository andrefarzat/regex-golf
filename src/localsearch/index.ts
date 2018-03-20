const colors = require('colors/safe');
const args = require('args');
import * as moment from "moment";

import ILS from './ILS';
import ILS_Shrink from './ILS_Shrink';
import LocalSearch from './LocalSearch';
import RRLS from './RRLS';

import Logger from '../Logger';
import Utils from '../Utils';
import Constructed_RRLS from "./Constructed_RRLS";
import Individual from "../models/Individual";


args.option('name', 'O nome do algoritmo. Opções: "ILS", "ILS_Shrink", "RRLS", "Constructed_RRLS"')
    .option('instance', 'O nome da instância do problema')
    .option('depth', 'O tamanho do depth', 5)
    .option('budget', 'Número máximo de avaliações', 100000 * 6)
    .option('log-level', 'Log level entre 1 e 5', 3)
    .option('index', 'O índice da execução', 1)
    .option('timeout', 'Timeout em miliseconds', 1000 * 60);

const flags: {
    name: 'ILS'| 'ILS_Shrink' | 'RRLS' | 'Constructed_RRLS',
    instance: string,
    depth: number,
    budget: number,
    logLevel: number,
    index: number,
    timeout: number,
} = args.parse(process.argv);

if (!flags.name) {
    args.showHelp();
    process.exit();
}

Utils.setIndex(flags.index);

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

function main() {
    // 1. Carrega a instância do problema
    // 2. Instância o programa
    let program = getProgram();

    // 3. Seta o Budget
    program.budget = flags.budget;
    program.depth = flags.depth;

    // 4. Seta o Timeout
    program.maxTimeout = moment().add(flags.timeout, 'milliseconds');
    program.init();

    let logger = Logger.create(program);
    logger.setLogLevel(flags.logLevel);

    // 5. Gera indivíduo inicial
    let currentSolution = program.generateInitialIndividual();
    logger.logInitialSolution(currentSolution);

    // 6. Loop
    do {
        // 6.1. Has timed out ?
        //      Then -> Set as timed out
        //           -> Stop!
        if (program.maxTimeout.diff(new Date()) < 0) {
            program.hasTimedOut = true;
            break;
        }

        // 6.2. Current Solution is the Best ?
        //      Then -> Add to solutions
        let hasFoundBetter = false;
        if (program.isBest(currentSolution)) {
            program.addSolution(currentSolution);
            logger.log(2, `[Found best][Ind] ${currentSolution.toString()} [Fitness: ${currentSolution.fitness}]`)
        }

        // 6.3. Should stop ?
        //      Then -> Stop !
        if (program.shouldStop()) break;

        // 6.4. Generate Neighborhood
        let neighborhood = program.generateNeighborhood(currentSolution);

        // 6.5. Loop
        do {
            // 6.5.1. Tem neighbor ?
            //        Then -> Avalia neighbor
            //        Else -> Stop !
            let neighbor = neighborhood.next();
            if (neighbor.done) break;
            program.evaluate(neighbor.value);
            logger.logSolution('Ind', neighbor.value);

            // 6.5.2. Neighbor is better than current solution ?
            //        Then -> Current = Neighbor
            //             -> Seta que encontrou melhor
            if (neighbor.value.isBetterThan(currentSolution)) {
                currentSolution = neighbor.value;
                hasFoundBetter = true;
                logger.log(2, `[Found better] ${neighbor.value.toString()} [from fitness ${currentSolution.fitness} to ${neighbor.value.fitness}]`);
            }
        } while (true);

        // 6.6. Não encontrou melhor?
        //      Then -> Loga solução local
        //           -> Realizar o restart
        if (!hasFoundBetter) {
            program.addLocalSolution(currentSolution);
            logger.logSolution('Best local', currentSolution);
            currentSolution = program.restartFromSolution(currentSolution);
            logger.log(3, `[Jumped to] ${currentSolution.toString()}`);
        }
    } while (true);

    // 7. Apresentar resultados
    function sorter(a: Individual, b: Individual): number {
        if (a.fitness > b.fitness) return -1;
        if (a.fitness < b.fitness) return 1;

        if (a.toString().length > b.toString().length) return 1;
        if (a.toString().length < b.toString().length) return -1;

        return 0;
    };

    logger.log(2, `Was found ${program.localSolutions.length} local solution(s)`);
    program.localSolutions.sort(sorter);
    program.localSolutions.forEach(ind => {
        logger.log(3, `[Local Solution]: ${ind.toString()} [Fitness ${ind.fitness} of ${program.getMaxFitness()}] [Length ${ind.toString().length}]`);
    });

    logger.log(2, ' ');
    logger.log(2, `Was found ${program.solutions.length} solution(s)`);

    program.solutions.sort(sorter);
    program.solutions.forEach((ind, i) => {
        let txt = `[Solution]: ${ind.toString()} [Fitness ${ind.fitness} of ${program.getMaxFitness()}] [Length ${ind.toString().length}]`;
        logger.log(1, (i == 0) ? colors.green(txt) : txt);
    });
}

main();