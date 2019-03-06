import { Evaluator } from "./Evaluator";
import Individual from "./Individual";

export class BrowserEvaluator extends Evaluator {

    public async evaluate(ind: Individual): Promise<number> {
        return Promise.resolve(1);
    }

    public finish() {
        console.log("BrowserEvaluator Finished");
    }
}