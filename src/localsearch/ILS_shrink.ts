import { Individual } from '../models/Individual';
import { ILS } from './ILS';
import { OrFunc } from '../nodes/OrFunc';
import { Logger } from '../Logger';

export class ILS_Shrink extends ILS {
    private ngramIndex = 0;

    public getNextNGram(): Individual | null {
        const ngram = this.oldNGrams[this.ngramIndex];
        if (ngram) {
            this.ngramIndex++;
            return this.factory.createFromString(ngram, true);
        } else {
            this.ngramIndex = 0;
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

        const ngram = this.getNextNGram();
        if (ngram) {
            ind = ngram.shrink();
        }

        return super.restartFromSolution(ind);
    }
}
