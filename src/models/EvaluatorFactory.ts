import Evaluator from "./Evaluator";
import LocalSearch from "../localsearch/LocalSearch";
import Individual from "./Individual";


export default class EvaluatorFactory {
    public static _program?: LocalSearch;
    private evaluators: Evaluator[] = [];
    private evaluatorsStatus: {[key: number]: boolean} = {};
    private readonly MAX_EVALUATORS = 1000;
    protected static instance: EvaluatorFactory;

    public constructor(public program: LocalSearch) { }

    public static setProgram(program: LocalSearch) {
        this._program = program;
    }

    public static getInstance() {
        if (!this._program) {
            throw new Error('You must setup the program first');
        }

        if (this.instance === undefined) {
            this.instance = new EvaluatorFactory(this._program);
        }

        return this.instance;
    }

    public static async evaluate(ind: Individual): Promise<number> {
        let instance = EvaluatorFactory.getInstance();

        if (ind.isEvaluated) return ind.fitness;
        ind.evaluationIndex = instance.program.getNextEvaluationIndex();

        return ind.hasComplexEvaluation()
            ? await instance.evaluateViaSub(ind)
            : Promise.resolve(instance.evaluateSimple(ind));
    }

    protected async evaluateSimple(ind: Individual): Promise<number> {
        let result = {
            matchesOnLeft: 0,
            ourFitness: 0,
            matchesOnRight: 0,
        };

        let program = this.program;
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

    protected async evaluateViaSub(ind: Individual) {
        let evaluator: Evaluator;

        try {
            evaluator = await this.getFreeEvaluator();
            await evaluator.evaluate(ind);
        } catch {
            // TODO: Log here
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