import Evaluator from "./Evaluator";
import LocalSearch from "../localsearch/LocalSearch";
import Individual from "./Individual";


export default class EvaluatorFactory {
    private evaluators: Evaluator[] = [];
    private evaluatorsStatus: {[key: number]: boolean} = {};
    private readonly MAX_EVALUATORS = 1000;
    protected static instance: EvaluatorFactory;

    public constructor(public program: LocalSearch) { }

    public static setProgram(program: LocalSearch) {
        EvaluatorFactory.getInstance(program);
    }

    public static getInstance(program: LocalSearch) {
        if (this.instance === undefined) {
            this.instance = new EvaluatorFactory(program);
        }

        return this.instance;
    }

    public static async evaluate(ind: Individual): Promise<number> {
        if (!this.instance) throw new Error(`No EvaluatorFactory instance`);

        if (ind.isEvaluated) return ind.fitness;
        ind.evaluationIndex = this.instance.program.getNextEvaluationIndex();

        return ind.hasComplexEvaluation()
            ? await this.evaluateViaSub(ind)
            : await this.evaluateSimple(ind);
    }

    protected static evaluateSimple(ind: Individual): number {
        let result = {
            matchesOnLeft: 0,
            ourFitness: 0,
            matchesOnRight: 0,
        };

        let program = this.instance.program;
        let regex = ind.toRegex();

        for (let name of program.left) {
            if (regex.test(name)) {
                result.matchesOnLeft += 1;
                result.ourFitness += 1;
            }
        }

        for (let name of program.right) {
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

    protected static async evaluateViaSub(ind: Individual) {
        let evaluator: Evaluator;

        try {
            evaluator = await this.instance.getFreeEvaluator();
            await evaluator.evaluate(ind);
        } catch {
            // TODO: Log here
        } finally {
            this.instance.setEvaluatorFree(evaluator);
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
                    let evaluator = new Evaluator(this.program.left, this.program.right);
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