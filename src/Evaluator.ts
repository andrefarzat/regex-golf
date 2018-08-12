import * as cp from 'child_process';
import * as moment from 'moment';
import Individual from './models/Individual';
import Logger from './Logger';

interface EvaluationResult {
    index: number;
    matchesOnLeft: number;
    ourFitness: number;
    matchesOnRight: number;
}

export default class Evaluator {
    public worker: cp.ChildProcess;
    public cache: {[key: number]: Individual} = {};
    private isWorking = false;
    public isFree = true;

    public constructor(public left: string[], public right: string[]) {
        this.onMessage = this.onMessage.bind(this);
    }

    public getWorker(): cp.ChildProcess {
        if (! this.worker) {
            this.isWorking = false;
            this.worker = cp.fork(__dirname + '/sub.js');
            this.worker.on('message', this.onMessage);
        }

        return this.worker;
    }

    public onMessage(result: EvaluationResult) {
        this.isFree = true;
        this.isWorking = true;
        let ind = this.cache[result.index];
        if (!ind) throw new Error('How come?');

        ind.evaluationEndTime = new Date();
        ind.matchesOnLeft = result.matchesOnLeft;
        ind.matchesOnRight = result.matchesOnRight;
        ind.ourFitness = result.ourFitness;

        this.cache[result.index] = undefined;
    }

    public async evaluate(ind: Individual, index: number): Promise<number> {
        if (ind.isEvaluated) return Promise.resolve(ind.fitness);
        this.isFree = false;

        ind.matchesOnLeft = 0;
        ind.matchesOnRight = 0;
        ind.ourFitness = 0;
        ind.evaluationIndex = index;

        if (ind.hasComplexEvaluation()) {
            // console.log(`Complex evaluation: ${ind.toString()}`);
            return this.evaluateViaSub(ind);
        } else {
            // console.log(`Simple evaluation: ${ind.toString()}`);
            this.isFree = true;
            return Promise.resolve(this.evaluateLocal(ind));
        }
    }

    public async evaluateViaSub(ind: Individual) {
        return new Promise<number>((resolve, reject) => {
            this.cache[ind.evaluationIndex] = ind;

            let worker = this.getWorker();
            worker.send({ regex: ind.toString(), index: ind.evaluationIndex, left: this.left, right: this.right }, err => {
                if (err) return console.log("Super error", err);

                ind.evaluationStartTime = new Date();

                let fn = () => {
                    let now = moment();
                    let diff = now.diff(ind.evaluationStartTime, 'milliseconds');

                    if (ind.evaluationEndTime) {
                        // console.log(`resolved: ${ind.toString()}`);
                        resolve(ind.fitness);
                    } else if (this.isWorking === false) {
                        if (diff > 2000) {
                            console.log('timedout via worker: ', ind.toString());
                            ind.hasTimedOut = true;
                            ind.evaluationEndTime = now.toDate();
                            this.cleanWorker();
                            reject(new Error(`Evaluation of ${ind.toString()} has timed out!`));
                        } else {
                            setTimeout(fn, 0);
                        }
                    } else if (diff > 100) {
                        console.log('timedout: ', ind.toString());
                        ind.hasTimedOut = true;
                        ind.evaluationEndTime = now.toDate();
                        setImmediate(() => this.cleanWorker());
                        reject(new Error(`Evaluation of ${ind.toString()} has timed out!`));
                    } else {
                        // console.log(`tick: ${ind.toString()}`);
                        setTimeout(fn, 0);
                    }
                };

                fn();
            });
        });
    }

    public evaluateLocal(ind: Individual) {
        ind.evaluationStartTime = new Date();
        let regex = new RegExp(ind.toString());

        for (let name of this.left) {
            if (regex.test(name)) {
                ind.matchesOnLeft += 1;
                ind.ourFitness += 1;
            }
        }

        for (let name of this.right) {
            if (regex.test(name)) {
                ind.matchesOnRight += 1;
            } else {
                ind.ourFitness += 1;
            }
        }

        ind.evaluationEndTime = new Date();
        return ind.fitness;
    }

    public cleanWorker() {
        if (this.worker) {
            this.worker.removeAllListeners();
            this.worker.kill();
            this.worker = undefined;
        }

        this.isFree = true;
    }


    public finish() {
        this.cleanWorker();
    }

}