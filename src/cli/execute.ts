import { FileLogger } from '../loggers/FileLogger';
import { Main } from './main';

import * as path from 'path';


async function execute(instanceName: string, index: number): Promise<void> {
    console.log('Starting', instanceName);

    const logger = new FileLogger();
    logger.setLogFileName(path.join(index.toString(), `${instanceName}.csv`));

    const main = new Main(logger);
    main.setInstanceName(instanceName);
    await main.execute();
    // await logger.end();

    console.log('Finishing', instanceName);
}


async function go(instances: string[], times: number) {
    console.log(`Will execute ${instances.length} instances ${times} times each`);

    for (let i = 1; i <= times; i++) {
        console.log(`Loop number ${i}. Will execute ${instances.length} instances`);
        let instanceIndex = 0;

        for (const instanceName of instances) {
            instanceIndex ++;
            console.log(`Executing ${instanceIndex} of ${instances.length}`);
            await execute(instanceName, i);
        }
    }

    console.log('Done!');
}

// const instances = ['abba', 'alphabetical', 'aman-aplan', 'anchors', 'anyway', 'backrefs', 'balance', 'family', 'four', 'glob',
//                    'it-never-ends', 'long-count', 'movies', 'names', 'order', 'powers', 'powers-2', 'prime', 'ranges', 'regex-of-regex',
//                    'substraction', 'test-timeout', 'tic-tac-toe', 'triples', 'typist', 'warmup', 'words'];

// const instances = ['warmup', 'anchors', 'ranges', 'backrefs', 'abba', 'aman-aplan', 'prime',
//                    'four', 'order', 'triples', 'glob', 'balance', 'powers', 'long-count', 'alphabetical'];

// const instances = ['order', 'triples', 'glob', 'balance', 'powers', 'long-count', 'alphabetical'];

const instances = ['triples'];

const TIMES_PER_INSTANCE = 30;

// go(instances, TIMES_PER_INSTANCE);

async function start() {
    // Esta função é para ser usada na execução pela linha de comando nesse formato:
    // npm run execute -- instanceName index

    const instanceName = process.argv[2];
    const index = parseInt(process.argv[3], 10);

    console.log('Executing', instanceName, 'for the index', index);
    await execute(instanceName, index);
}


start();