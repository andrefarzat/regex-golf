import { createModuleResolutionCache } from 'typescript';
import { FileLogger } from '../loggers/FileLogger';
import { InMemoryLogger } from '../loggers/InMemoryLogger';
import { Main } from './main';


async function execute() {
    // const logger = new InMemoryLogger();
    const logger = new FileLogger();

    console.log('Start');
    const main = new Main(logger);
    await main.execute();

    console.log('Done!');
}


execute();