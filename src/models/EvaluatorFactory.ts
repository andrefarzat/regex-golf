import Evaluator from "./Evaluator";
import BaseProgram from "../BaseProgram";


export default class EvaluatorFactory {
    private evaluators: Evaluator[] = [];
    private evaluatorsStatus: {[key: number]: boolean} = {};
    private readonly MAX_EVALUATORS = 1000;
    protected static instance: EvaluatorFactory;

    public constructor(public program: BaseProgram) { }

    public static getInstance(program: BaseProgram) {
        if (this.instance === undefined) {
            this.instance = new EvaluatorFactory(program);
        }

        return this.instance;
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
                    console.log('Evaluator created index:', len - 1);
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
}