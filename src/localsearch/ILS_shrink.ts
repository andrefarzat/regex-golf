import ILS from './ILS';
import Individual from '../models/Individual';


export default class ILS_Shrink extends ILS {
    public async restartFromSolution(ind: Individual): Promise<Individual> {
        let shunkCurrentSolution = ind.shrink();

        if (!shunkCurrentSolution.isValid()) {
            // FIXME: We should not shrink to an invalid option
            return super.restartFromSolution(ind);
        }

        try {
            await this.evaluate(shunkCurrentSolution);
        } catch {
            return super.restartFromSolution(ind);
        }

        return shunkCurrentSolution.isBetterThan(ind)
            ? shunkCurrentSolution
            : super.restartFromSolution(ind);
    }
}