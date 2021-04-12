import * as path from 'path';
import * as winston from 'winston';

import { Individual } from "../models/Individual";
import { Neighborhood } from "../models/Neighborhood";
import { ILogger } from "./ILogger";


export enum LogLevel {
    error = 0,
    warn = 1,
    info = 2,
    verbose = 3,
    debug = 4,
    silly = 5,
}


export class FileLogger implements ILogger {
    protected readonly logFileName = 'execution.log';

    protected get wiston() {
        if (!this._wiston) {
            const reportRootDir = path.join(__dirname, '..', '..', 'results', 'current');

            const errorLog = path.join(reportRootDir, 'error.log');
            const instanceInfo = path.join(reportRootDir, this.logFileName);

            this._wiston = winston.createLogger({
                level: LogLevel.info.toString(),
                format: winston.format.printf(({message}) => message),
                transports: [
                    // new winston.transports.Console({ level: 'info' }),
                    new winston.transports.File({ filename: errorLog, level: 'error' }),
                    new winston.transports.File({ filename: instanceInfo, level: 'info' }),
                ],
            });
        }

        return this._wiston;
    }

    protected _wiston: winston.Logger;

    private getOriginFromInd(ind: Individual): string {
        if (ind.origin.length == 0) {
            return '';
        }

        const origin = ind.origin[0];
        return `${origin.name}(${origin.args.join(', ')})`;
    }

    public addLogEntry(event: string, ind: Individual): void {
        let originName = '';
        let originArgs = '';

        if (ind.origin.length > 0) {
            originName = ind.origin[0].name;
            originArgs = ind.origin[0].args.join(',');
        }

        const line = [ind.id, event, ind.toString(), originName, originArgs, ind.fitness].join(';');
        this.wiston.info(line);
    }


    logStop(label: string, data: { [key: string]: string; }): void {
        // throw new Error("Method not implemented.");
    }
    logInitialSolution(currentSolution: Individual): void {
        this.addLogEntry('Initial solution', currentSolution);
    }
    logJumpedTo(currentSolution: Individual): void {
        this.addLogEntry('Jumped to', currentSolution);
    }
    logAddLocalSolution(currentSolution: Individual): void {
        // this.addLogEntry('Add local solution', currentSolution);
    }
    logNeighborhoodError(neighborhood: Neighborhood, e: any): void {
        // throw new Error("Method not implemented.");
    }
    logHasAlreadyVisited(ind: Individual): void {
        // throw new Error("Method not implemented.");
    }
    logFoundBetter(ind: Individual): void {
        this.addLogEntry('Found better in neighborhood', ind);
    }
    logEvaluation(ind: Individual): void {
        // this.addLogEntry('Evaluation', ind);
    }
    logAddSolution(ind: Individual): void {
        // this.addLogEntry('Add solution', ind);
    }
    logBestCurrentSolutionAmongNeighborhoods(ind: Individual): void {
        this.addLogEntry('Best current solution among neighborhoods', ind);
    }
    logStartNeighborhood(ind: Individual): void {
        this.addLogEntry('Start of neighborhood', ind);
    }

}