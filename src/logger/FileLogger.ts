import * as path from 'path';
import * as winston from 'winston';

import { Individual } from "../models/Individual";
import { Neighborhood } from "../models/Neighborhood";
import { Node } from '../nodes/Node';
import { Utils } from '../Utils';
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
    protected _wiston: winston.Logger;
    protected logFileName: string = 'execution.log';
    protected transports: any = [];

    protected _shrinkerHasInited: boolean = false;

    public setLogFileName(logFileName: string): void {
        this.logFileName = logFileName;
    }

    protected get wiston() {
        if (!this._wiston) {
            const reportRootDir = path.join(__dirname, '..', '..', 'results', 'current');

            const errorLog = path.join(reportRootDir, 'error.log');
            const instanceInfo = path.join(reportRootDir, this.logFileName);

            this.transports = [
                // new winston.transports.Console({ level: 'info' }),
                new winston.transports.File({ filename: errorLog, level: 'error' }),
                new winston.transports.File({ filename: instanceInfo, level: 'info' })
            ];

            this._wiston = winston.createLogger({
                level: LogLevel.info.toString(),
                format: winston.format.printf(({message}) => message),
                transports: this.transports,
            });
        }

        return this._wiston;
    }

    private getOriginFromInd(ind: Individual): string {
        if (ind.origin.length == 0) {
            return '';
        }

        const origin = ind.origin[0];
        return `${origin.name}(${origin.args.join(', ')})`;
    }

    private getOriginListFromInd(ind: Individual): string {
        const origins = ind.origin.map(origin => `${origin.name}(${origin.args.join(', ')})`);
        return `[${origins}]`;
    }

    public addLogEntry(event: string, ind: Individual): void {
        let originName = '';
        let originArgs = '';

        if (ind.origin.length > 0) {
            originName = ind.origin[ind.origin.length - 1].name;
            originArgs = ind.origin[ind.origin.length - 1].args.join(',');
        }

        const wasShrunk = ind.origin.some(origin => origin.name === 'shrink');

        // const line = [ind.id, event, ind.toString(), originName, originArgs, wasShrunk, ind.fitness].join(';');
        // const line = [ind.id, event, ind.toString(), this.getOriginListFromInd(ind), ind.fitness].join(';');

        let operatorName = 'Initial';
        let originalSolution = '';
        let args = '';

        if (ind.history.length > 0) {
            const history = ind.history[0];
            operatorName = history.operatorName;
            args = history.args.join(',');
            originalSolution = history.originalSolution.regex;
        }

        const line = [ind.id, event, ind.toString(), operatorName, args, originalSolution, ind.fitness].join(';');
        this.wiston.info(line);
    }

    public async end(): Promise<void> {
        await this.waitForWinston();
        return Promise.resolve();
    }

    protected async waitForWinston(): Promise<void> {
        return new Promise<void>(async (resolve, _reject) => {
            for (const transport of this.transports) {
                try {
                    await this.closeWinstonTransportAndWaitForFinish(transport);
                } catch (err) {
                    console.log(err);
                }
            }
            resolve();
        });
    };

    protected async closeWinstonTransportAndWaitForFinish(transport: any): Promise<void> {
        if (!transport.close) {
            // e.g. transport.name === 'console'
            return Promise.resolve();
        }
        // e.g. transport.name === 'file'

        return new Promise<void>(async (resolve, _reject) => {
            transport._doneFinish = false;
            function done() {
                if (transport._doneFinish) {
                    return; // avoid resolving twice, for example timeout after successful 'finish' event
                }
                transport._doneFinish = true;
                resolve();
            }
            setTimeout(() => { done(); }, 5000); // just in case the 'finish' event never occurs
            const finished = () => { done(); };

            transport.once('finish', finished);
            transport.close();
        });
    };

    logStop(label: string, data: { [key: string]: string; }): void {
        // throw new Error("Method not implemented.");
    }
    logInitialSolution(ind: Individual): void {
        ind.id = 0;
        Utils.resetNextId();
        Utils.hasStarted = true;
        this.addLogEntry('Initial solution', ind);
    }
    logJumpedFrom(ind: Individual): void {
        this.addLogEntry('Jumped from', ind);
    }
    logJumpedTo(ind: Individual): void {
        this.addLogEntry('Jumped to', ind);
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
        this.addLogEntry('Found better in current neighborhood', ind);
    }
    logEvaluation(ind: Individual): void {
        this.addLogEntry('Evaluation', ind);
    }
    logAddSolution(ind: Individual): void {
        // this.addLogEntry('Add solution', ind);
    }
    logBestCurrentSolutionAmongNeighborhoods(ind: Individual): void {
        this.addLogEntry('Found better current solution among all neighborhoods', ind);
    }
    logStartNeighborhood(ind: Individual): void {
        this.addLogEntry('Start of neighborhood', ind);
    }

    logFinished(bestInd: Individual, lastIndEvaluated: Individual): void {
        this.addLogEntry('Finished. The best found is here', bestInd);
    }

    logInitShrinker(ind: Individual): void {
        this._shrinkerHasInited = true;
        this.addLogEntry('Init shrinker', ind);
    }

    logShrink(ind: Individual, funcName: string, fromNode: Node, toNode: Node): void {
        if (!this._shrinkerHasInited) {
            return;
        }

        if (fromNode.equals(toNode)) {
            return;
        }

        const indId = ind ? ind.id : null;
        const indFitness = ind ? ind.fitness : 0;
        const wasShrunk = ind ? ind.origin.some(origin => origin.name === 'shrink') : false;

        // index; event; funcName; fromNode; toNode; wasShunk; fitness
        const line = [indId, 'shink', funcName, fromNode.toString(), toNode.toString(), wasShrunk, indFitness].join(';');
        this.wiston.info(line);
    }

    logGenerateIndividualToRestart(ind: Individual): void {
        this.addLogEntry('Individual generated to restart', ind);
    }

    logFinishShrinker(fromInd: Individual, toInd: Individual): void {
        this._shrinkerHasInited = false;
        const isBetter = fromInd.toString().length > toInd.toString().length;

        // index; event; fromInd; toInd; fromIsBetter;
        const line = [toInd.id, 'Finished shrinker', fromInd.toString(), toInd.toString(), isBetter].join(';');
        this.wiston.info(line);
    }

}