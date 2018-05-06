import * as fs from 'fs';
import * as path from 'path';
import * as Moment from 'moment';

import BaseProgram from "./BaseProgram";
import Individual from './models/Individual';
import LocalSearch from './localsearch/LocalSearch';
import Utils from './Utils';

export default class Logger {
    private logLevel = 3;
    private program!: BaseProgram;
    private shouldLogEmptyLine = false;
    private reportRootDir!: string;

    private csv!: { invalids: fs.WriteStream, solutions: fs.WriteStream, bestLocals: fs.WriteStream, bests: fs.WriteStream };

    public static create(logLevel: number, program: LocalSearch): Logger {
        let logger = new Logger();
        logger.program = program;
        logger.setLogLevel(logLevel);

        let currentResultDir = path.join(__dirname, '..', 'results', 'current');
        if (!fs.existsSync(currentResultDir)) {
            fs.mkdirSync(currentResultDir);
        }

        logger.reportRootDir = path.join(currentResultDir, program.instanceName);
        if (!fs.existsSync(logger.reportRootDir)) {
            fs.mkdirSync(logger.reportRootDir);
        }

        logger.csv = {
            invalids: fs.createWriteStream(path.join(logger.reportRootDir, 'invalids.csv'), {flags: 'a'}),
            solutions: fs.createWriteStream(path.join(logger.reportRootDir, 'solutions.csv'), {flags: 'a'}),
            bestLocals: fs.createWriteStream(path.join(logger.reportRootDir, 'bestLocals.csv'), {flags: 'a'}),
            bests: fs.createWriteStream(path.join(logger.reportRootDir, 'bests.csv'), {flags: 'a'}),
        };

        logger.log(1, `[Program started] ${program.constructor.name} instance: ${program.instanceName} depth: ${program.depth} i: ${program.index} seed: ${program.seed}`);

        return logger;
    }

    public logProgramEnd() {
        this.csv.invalids.close();
        this.csv.solutions.close();
        this.csv.bestLocals.close();
        this.csv.bests.close();
    }

    public setLogLevel(level: number): void {
        this.logLevel = level;
    }

    public log(level: number, message: string) {
        if (level <= this.logLevel) {
            if (this.shouldLogEmptyLine) console.log('');
            console.log(message);
        }

        this.shouldLogEmptyLine = false
    }

    private formatDateToDisplay(date: Date | Moment.Moment): string {
        return Moment(date).format('HH:mm:ss');
    }

    public logInitialSolution(ind: Individual) {
        this.log(3, `[Initial ind] ${ind.toString()} [Fitness: ${ind.fitness}]`);
        this.csv.solutions.write(ind.toCSV());
    }

    public logSolution(ind: Individual) {
        this.csv.solutions.write(ind.toCSV());
    }

    public logBestSolution(ind: Individual) {
        this.csv.bests.write(ind.toCSV());
        this.log(2, `[Found best][Ind] ${ind.toString()} [Fitness: ${ind.fitness}]`)
    }

    public logInvalidSolution(ind: Individual) {
        this.csv.invalids.write(ind.toCSV());
    }

    public logBestLocalSolution(ind: Individual) {
        this.csv.bestLocals.write(ind.toCSV());
    }

    public logEmptyLine() {
        this.shouldLogEmptyLine = true;
    }
}