import * as cp from 'child_process';
import * as moment from 'moment';
import Individual from './models/Individual';

interface EvaluationResult {
    index: number;
    matchesOnLeft: number;
    ourFitness: number;
    matchesOnRight: number;
}

export class Evaluator {
    public worker: cp.ChildProcess;
    public cache: {[key: number]: Individual} = {};
    private isWorking = false;

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

        ind.matchesOnLeft = 0;
        ind.matchesOnRight = 0;
        ind.ourFitness = 0;
        ind.evaluationIndex = index;

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
                        resolve(ind.fitness);
                    } else if (this.isWorking === false) {
                        setTimeout(fn, 10);
                    } else if (diff > 100) {
                        console.log('timedout');
                        ind.hasTimedOut = true;
                        ind.evaluationEndTime = now.toDate();
                        this.cleanWorker();
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
        this.worker.removeAllListeners();
        this.worker.kill();
        this.worker = undefined;
    }


    public finish() {
        this.cleanWorker();
    }

}