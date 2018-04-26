import ILS from './ILS';
import Individual from '../models/Individual';


export default class ILS_Shrink extends ILS {
    public restartFromSolution(ind: Individual): Individual {
        let shunkCurrentSolution = ind.shrink();

        if (!shunkCurrentSolution.isValid()) {
            // FIXME: We should not shrink to an invalid option
            return super.restartFromSolution(ind);
        }

        this.evaluate(shunkCurrentSolution);

        return shunkCurrentSolution.isBetterThan(ind)
            ? shunkCurrentSolution
            : super.restartFromSolution(ind);
    }
}