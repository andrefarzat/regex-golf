import ILS from './ILS';
import Individual from '../models/Individual';


export default class ILS_Shrink extends ILS {
    public restartFromSolution(ind: Individual): Individual {
        let shunkCurrentSolution = ind.shrink();
        this.evaluate(shunkCurrentSolution);

        return shunkCurrentSolution.isBetterThan(ind)
            ? shunkCurrentSolution
            : super.restartFromSolution(ind);
    }
}