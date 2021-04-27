import { FileLogger } from '../loggers/FileLogger';
import { Main } from './main';


async function execute(instanceName: string): Promise<void> {
    console.log('Starting', instanceName);

    const logger = new FileLogger();
    logger.setLogFileName(`${instanceName}.csv`);

    const main = new Main(logger);
    main.setInstanceName(instanceName);
    await main.execute();
    await logger.end();

    console.log('Finishing', instanceName);
}


async function go(instances: string[]) {
    let i = 0;
    console.log(`Will execute ${instances.length} instances`);

    for (const instanceName of instances) {
        i ++;
        console.log(`Executing ${i} of ${instances.length}`);
        await execute(instanceName);
    }

    console.log('Done!');
}

// const instances = ['abba', 'alphabetical', 'aman-aplan', 'anchors', 'anyway', 'backrefs', 'balance', 'family', 'four', 'glob',
//                    'it-never-ends', 'long-count', 'movies', 'names', 'order', 'powers', 'powers-2', 'prime', 'ranges', 'regex-of-regex',
//                    'substraction', 'test-timeout', 'tic-tac-toe', 'triples', 'typist', 'warmup', 'words'];

// const instances = ['warmup', 'anchors', 'ranges', 'backrefs', 'abba', 'aman-aplan', 'prime',
//                    'four', 'order', 'triples', 'glob', 'balance', 'powers', 'long-count', 'alphabetical'];

const instances = ['order', 'triples', 'glob', 'balance', 'powers', 'long-count', 'alphabetical'];

go(instances);