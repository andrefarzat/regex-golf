import { InMemoryLogger } from '../loggers/InMemoryLogger';
import { Main } from './main';


async function execute() {
    const logger = new InMemoryLogger();

    const main = new Main(logger);
    main.execute();
}


execute();