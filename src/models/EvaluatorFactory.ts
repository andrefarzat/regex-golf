import Evaluator from "./Evaluator";
import LocalSearch from "../localsearch/LocalSearch";
import Individual from "./Individual";


export default class EvaluatorFactory {
    private evaluators: Evaluator[] = [];
    private evaluatorsStatus: {[key: number]: boolean} = {};
    private readonly MAX_EVALUATORS = 1000;
    public evaluationCount = 0;

    public constructor(public left: string[], public right: string[]) { }

    public getNextEvaluationIndex(): number {
        return this.evaluationCount ++;
    }

    public async evaluate(ind: Individual): Promise<number> {
        if (ind.isEvaluated) return Promise.resolve(ind.fitness);
        ind.evaluationIndex = this.getNextEvaluationIndex();

        return ind.hasComplexEvaluation()
            ? this.evaluateViaSub(ind)
            : Promise.resolve(this.evaluateSimple(ind));
    }

    protected async evaluateSimple(ind: Individual): Promise<number> {
        let result = {
            matchesOnLeft: 0,
            ourFitness: 0,
            matchesOnRight: 0,
        };

        let regex = ind.toRegex();

        for (let name of this.left) {
            if (regex.test(name)) {
                result.matchesOnLeft += 1;
                result.ourFitness += 1;
            }
        }

        for (let name of this.right) {
            if (regex.test(name)) {
                result.matchesOnRight += 1;
            } else {
                result.ourFitness += 1;
            }
        }

        ind.matchesOnLeft = result.matchesOnLeft;
        ind.matchesOnRight = result.matchesOnRight;
        ind.ourFitness = result.ourFitness;

        return ind.fitness;
    }

    protected async evaluateViaSub(ind: Individual) {
        let evaluator: Evaluator;

        try {
            evaluator = await this.getFreeEvaluator();
            await evaluator.evaluate(ind);
        } catch(e) {
            // TODO: Log here
            debugger;
            console.log('Evaluator error', e);
            process.exit();
        } finally {
            this.setEvaluatorFree(evaluator);
        }

        return ind.fitness;
    }

    public async getFreeEvaluator() {
        return new Promise<Evaluator>((resolve) => {
            let fn = () => {
                for (let index in this.evaluatorsStatus) {
                    let status = this.evaluatorsStatus[index];
                    if (status === true) {
                        this.evaluatorsStatus[index] = false;
                        return resolve(this.evaluators[index]);
                    }
                }

                if (this.evaluators.length < this.MAX_EVALUATORS) {
                    let evaluator = new Evaluator(this.left, this.right);
                    let len = this.evaluators.push(evaluator);
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
        let index = this.evaluators.indexOf(evaluator);
        this.evaluatorsStatus[index] = true;
    }

    public close() {
        for (let evaluator of this.evaluators) {
            evaluator.finish();
        }
    }
}