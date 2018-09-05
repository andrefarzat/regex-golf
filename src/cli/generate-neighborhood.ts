const colors = require('colors/safe');
const args = require('args');

import ILS_S from '../localsearch/ILS';
import Neighborhood from '../models/Neighborhood';



args.option('instance', 'O nome da instância do problema')
    .option('solution', 'A solução da qual será gerada a vizinhança')
    .option('log-level', 'Log level entre 1 e 5', 3);


const flags: {
    instance: string,
    solution: string,
    logLevel: number,
} = args.parse(process.argv);

if (!flags.instance || !flags.solution) {
    args.showHelp();
    process.exit();
}

/** Start */

let program = (new ILS_S(flags.instance)).init();
let initialInd = program.factory.createFromString(flags.solution);
let hood = new Neighborhood(initialInd, program);
hood.logger.setLogLevel(flags.logLevel);


console.log('');
console.log(`Neighborhood for solution ${initialInd.toString()} in instance ${flags.instance}`);
console.log('');
console.log('Left chars:', program.validLeftChars);
console.log('Right chars:', program.validLeftChars);
console.log('Left chars not in right:', program.leftCharsNotInRight);
console.log('Right chars not in left:', program.rightCharsNotInLeft);
console.log('');
console.log('');

let i = 0;
for (let ind of hood.getGenerator()) {
    console.log(ind.toString());
    i ++;
}

console.log('');
console.log(`Total of ${i} neighbors`);