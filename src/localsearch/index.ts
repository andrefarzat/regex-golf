const args = require('args');
import * as moment from "moment";

import LocalSearch from './LocalSearch';
import Logger from '../Logger';
import Utils from '../Utils';


args.option('name', 'O nome da instancia')
    .option('depth', 'O tamanho do depth', 5)
    .option('budget', 'Número máximo de avaliações', 100000 * 6)
    .option('log-level', "Log level entre 1 e 5", 3)
    .option('index', 'O índice da execução', 1)
    .option('timeout', "Timeout em miliseconds", 1000 * 60);

const flags: {
    name: string,
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

const programs: {[key: string]: LocalSearch} = {};

function main() {
    // 1. Carrega a instância do problema
    // 2. Instância o programa
    let program = programs['oi'];

    // 3. Seta o Budget
    program.budget = flags.budget;
    program.depth = flags.depth;

    // 4. Seta o Timeout
    const maxTimeout = moment().add(flags.timeout, 'milliseconds');
    let hasTimedOut: boolean = false;

    // 5. Gera indivíduo inicial
    program.init();
    let currentSolution = program.generateInitialIndividual();

    // 6. Loop
    do {
        // 6.1. Has timed out ?
        //      Then -> Set as timed out
        //           -> Stop!
        if (maxTimeout.diff(new Date()) < 0) {
            hasTimedOut = true;
        }
        if (hasTimedOut) break;

        // 6.2. Current Solution is the Best ?
        //      Then -> Add to solutions
        let hasFoundBetter = false;
        if (program.isBest(currentSolution)) {
            program.addSolution(currentSolution);
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

            // 6.5.2. Neighbor is better than current solution ?
            //        Then -> Current = Neighbor
            //             -> Seta que encontrou melhor
            if (neighbor.value.isBetterThan(currentSolution)) {
                currentSolution = neighbor.value;
                hasFoundBetter = true;
            }
        } while (true);

        // 6.6. Não encontrou melhor?
        //      Then -> Loga solução local
        //           -> Realizar o restart
        if (!hasFoundBetter) {
            program.addLocalSolution(currentSolution);
            currentSolution = program.restartFromSolution(currentSolution);
        }
    } while (true);

    // 7. Apresentar resultados
    // TODO:
}

main();