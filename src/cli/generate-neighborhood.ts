const args = require('args');

import { ILS_Shrink } from '../localsearch/ILS_shrink';
import { Neighborhood } from '../models/Neighborhood';
import { Individual } from '../models/Individual';

// tslint:disable no-console

args.option('instance', 'O nome da instância do problema')
    .option('solution', 'A solução da qual será gerada a vizinhança')
    .option('depth', 'A profundidade da árvore', 5)
    .option('log-level', 'Log level entre 1 e 5', 3);

const flags: {
    instance: string,
    solution: string,
    depth: number,
    logLevel: number,
} = args.parse(process.argv);

if (!flags.instance || !flags.solution) {
    args.showHelp();
    process.exit();
}

/** Start */

const program = new ILS_Shrink(flags.instance);
program.depth = flags.depth;
program.init();

const initialInd = program.factory.createFromString(flags.solution);
const hood = new Neighborhood(initialInd, program);

console.log('');
console.log(`Neighborhood for solution ${initialInd.toString()} in instance ${flags.instance}`);
console.log('');
console.log('Left chars:', program.validLeftChars);
console.log('Right chars:', program.validLeftChars);
console.log('Left chars not in right:', program.leftCharsNotInRight);
console.log('Right chars not in left:', program.rightCharsNotInLeft);
console.log('N-grams:', program.ngrams);
console.log('old N-grams:', program.oldNGrams);
console.log('');
console.log('');

let i = 0;
for (const ind of hood.getGenerator()) {
    // console.log(ind.toString());
    i ++;
}

console.log('');
console.log(`Total of ${i} neighbors`);
