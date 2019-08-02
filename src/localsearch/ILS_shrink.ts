import { Individual } from '../models/Individual';
import { ILS } from './ILS';

export class ILS_Shrink extends ILS {
    private ngramIndex = 0;

    public async restartFromSolution(ind: Individual): Promise<Individual> {
        const shunkCurrentSolution = ind.shrink();

        if (shunkCurrentSolution.isValid()) {
            try {
                await this.evaluator.evaluate(shunkCurrentSolution);
                if (shunkCurrentSolution.isBetterThan(ind)) {
                    return shunkCurrentSolution;
                }
            } catch {
                // pass
            }
        }

        // Let's shrink to a N-GRAM instead ?
        const ngram = this.ngrams[this.ngramIndex];
        if (ngram) {
            this.ngramIndex++;
            return this.factory.createFromString(ngram, true);
        }

        // FIXME: We should not shrink to an invalid option
        return super.restartFromSolution(ind);
    }
}
