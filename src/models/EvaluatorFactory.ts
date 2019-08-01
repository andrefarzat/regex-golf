import { Logger } from "../Logger";
import { Evaluator } from "./Evaluator";
import { Individual } from "./Individual";

export class EvaluatorFactory {
    public evaluationCount = 0;
    private evaluators: Evaluator[] = [];
    private evaluatorsStatus: {[key: number]: boolean} = {};
    private readonly MAX_EVALUATORS = 1000;

    public constructor(public left: string[], public right: string[]) { }

    public getNextEvaluationIndex(): number {
        return this.evaluationCount ++;
    }

    public async evaluate(ind: Individual): Promise<number> {
        if (ind.isEvaluated) { return Promise.resolve(ind.fitness); }
        ind.evaluationIndex = this.getNextEvaluationIndex();

        // return this.evaluateSimple(ind);

        return ind.hasComplexEvaluation()
            ? this.evaluateViaSub(ind)
            : Promise.resolve(this.evaluateSimple(ind));
    }

    public async getFreeEvaluator() {
        return new Promise<Evaluator>((resolve) => {
            const fn = () => {
                // tslint:disable-next-line:forin
                for (const index in this.evaluatorsStatus) {
                    const status = this.evaluatorsStatus[index];
                    if (status === true) {
                        this.evaluatorsStatus[index] = false;
                        return resolve(this.evaluators[index]);
                    }
                }

                if (this.evaluators.length < this.MAX_EVALUATORS) {
                    const evaluator = new Evaluator(this.left, this.right);
                    const len = this.evaluators.push(evaluator);
                    this.evaluatorsStatus[len - 1] = false;
                    return resolve(evaluator);
                } else {
                    setImmediate(fn);
                }
            };

            setImmediate(fn);
        });
    }

    public setEvaluatorFree(evaluator: Evaluator) {
        const index = this.evaluators.indexOf(evaluator);
        this.evaluatorsStatus[index] = true;
    }

    public close() {
        for (const evaluator of this.evaluators) {
            evaluator.finish();
        }
    }

    protected evaluateSimple(ind: Individual): number {
        const result = {
            leftPoints: 0,
            rightPoints: 0,
            matchesOnLeft: 0,
            matchesOnRight: 0,
        };

        const regex = ind.toRegex();

        for (const name of this.left) {
            if (regex.test(name)) {
                result.leftPoints += name.length;
                result.matchesOnLeft += 1;
            }
        }

        for (const name of this.right) {
            if (regex.test(name)) {
                result.matchesOnRight += 1;
            } else {
                result.rightPoints += name.length;
            }
        }

        ind.leftPoints = result.leftPoints;
        ind.rightPoints = result.rightPoints;
        ind.matchesOnLeft = result.matchesOnLeft;
        ind.matchesOnRight = result.matchesOnRight;

        return ind.fitness;
    }

    protected async evaluateViaSub(ind: Individual) {
        let evaluator: Evaluator;

        try {
            evaluator = await this.getFreeEvaluator();
            await evaluator.evaluate(ind);
        } catch (e) {
            Logger.error('[Evaluator error]', e);
            process.exit();
        } finally {
            this.setEvaluatorFree(evaluator);
        }

        return ind.fitness;
    }
}
