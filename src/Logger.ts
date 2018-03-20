import * as Moment from 'moment';
import BaseProgram from "./BaseProgram";
import Individual from './models/Individual';

export default class Logger {
    private logLevel = 3;
    private program!: BaseProgram;

    public static create(program: BaseProgram): Logger {
        let logger = new Logger();
        logger.program = program;

        logger.log(logger.logLevel, `[Program started] ${program.constructor.name}`);
        return logger;
    }

    public setLogLevel(level: number): void {
        this.logLevel = level;
    }

    public log(level: number, message: string) {
        if (level <= this.logLevel) console.log(message);
    }

    private formatDateToDisplay(date: Date | Moment.Moment): string {
        return Moment(date).format('HH:mm:ss');
    }

    public logInitialSolution(ind: Individual) {
        this.log(3, `[Initial ind] ${ind.toString()} [Fitness: ${ind.fitness}]`);
    }

    public logSolution(prefix: string, ind: Individual) {
        this.log(3, `[${prefix}] ${ind.toString()} [Fitness:    ${ind.fitness}]`);
    }
}