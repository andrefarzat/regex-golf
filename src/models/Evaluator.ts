import * as cp from 'child_process';
import * as moment from 'moment';
import Individual from '../models/Individual';
import { resolve } from 'dns';
import Logger from '../Logger';

interface EvaluationResult {
    index: number;
    matchesOnLeft: number;
    ourFitness: number;
    matchesOnRight: number;
}

export default class Evaluator {
    public worker: cp.ChildProcess;
    public cache: {[key: number]: Individual} = {};

    public constructor(public left: string[], public right: string[]) {
        this.onMessage = this.onMessage.bind(this);
    }

    public async getWorker(): Promise<cp.ChildProcess> {
        if (this.worker) {
            if (!this.worker.connected) {
                this.cleanWorker();
                return this.getWorker();
            }

            return Promise.resolve(this.worker);
        }

        this.worker = cp.fork(__dirname + '/sub.js');

        return new Promise<cp.ChildProcess>((resolve) => {
            this.worker.once('message', () => {
                this.worker.on('message', this.onMessage);
                resolve(this.worker);
            });
            this.worker.send({regex: ''});
        });
    }

    public onMessage(result: EvaluationResult) {
        if (typeof result === 'string') return;
        let ind = this.cache[result.index];

        if (!ind) {
            throw new Error('How come?');
        }

        ind.evaluationEndTime = new Date();
        ind.matchesOnLeft = result.matchesOnLeft;
        ind.matchesOnRight = result.matchesOnRight;
        ind.ourFitness = result.ourFitness;

        this.cache[result.index] = undefined;
    }

    public async evaluate(ind: Individual): Promise<number> {
        ind.matchesOnLeft = 0;
        ind.matchesOnRight = 0;
        ind.ourFitness = 0;

        return this.evaluateViaSub(ind);
    }

    public async evaluateViaSub(ind: Individual) {
        return new Promise<number>(async (resolve, reject) => {
            this.cache[ind.evaluationIndex] = ind;

            let worker = await this.getWorker();
            worker.send({ regex: ind.toString(), index: ind.evaluationIndex, left: this.left, right: this.right }, err => {
                if (err) return Logger.error("Super error", err.message);

                ind.evaluationStartTime = new Date();

                let fn = () => {
                    let now = moment();
                    let diff = now.diff(ind.evaluationStartTime, 'milliseconds');

                    if (ind.evaluationEndTime) {
                        resolve(ind.fitness);
                    } else if (diff > 3000) {
                        Logger.warn('timedout: ', diff.toString(), ind.toString());
                        ind.hasTimedOut = true;
                        ind.evaluationEndTime = now.toDate();
                        setImmediate(() => this.cleanWorker());
                        reject(new Error(`Evaluation of ${ind.toString()} has timed out!`));
                    } else {
                        setTimeout(fn, 0);
                    }
                };

                fn();
            });
        });
    }

    public cleanWorker() {
        if (this.worker) {
            this.worker.removeAllListeners();
            this.worker.kill();
            this.worker = undefined;
        }
    }

    public finish() {
        this.cleanWorker();
    }

}