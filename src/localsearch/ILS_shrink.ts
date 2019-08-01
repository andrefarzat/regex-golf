import { Individual } from '../models/Individual';
import { ILS } from './ILS';

export class ILS_Shrink extends ILS {
    private ngramIndex = 0;

    public generateInitialIndividual(): Individual {
        const ngram = this.getNextNGram();
        return ngram ? ngram : super.generateInitialIndividual();
    }

    public getNextNGram(): Individual | null {
        const ngram = this.ngrams[this.ngramIndex];
        if (ngram) {
            this.ngramIndex++;
            return this.factory.createFromString(ngram);
        }

        return null;
    }

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
        const ngram = this.getNextNGram();
        if (ngram) {
            return ngram;
        }

        // FIXME: We should not shrink to an invalid option
        return super.restartFromSolution(ind);
    }
}
