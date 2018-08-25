import ILS from './ILS';
import Individual from '../models/Individual';
import Evaluator from '../models/Evaluator';
import EvaluatorFactory from '../models/EvaluatorFactory';


export default class ILS_Shrink extends ILS {
    public async restartFromSolution(ind: Individual): Promise<Individual> {
        let shunkCurrentSolution = ind.shrink();

        if (!shunkCurrentSolution.isValid()) {
            // FIXME: We should not shrink to an invalid option
            return super.restartFromSolution(ind);
        }

        try {
            await this.evaluator.evaluate(shunkCurrentSolution);
        } catch {
            return super.restartFromSolution(ind);
        }

        return shunkCurrentSolution.isBetterThan(ind)
            ? shunkCurrentSolution
            : super.restartFromSolution(ind);
    }
}