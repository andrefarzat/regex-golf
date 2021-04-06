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
            const ind = this.factory.createFromString(ngram, true);
            ind.addOrigin('getNextNGram', [this.ngramIndex.toString(), ngram]);
        } else {
            this.ngramIndex = 0;
        }

        return null;
    }

    public async restartFromSolution(ind: Individual): Promise<Individual> {
        const shunkCurrentSolution = ind.shrink();
        shunkCurrentSolution.addOrigin('restartFromSolution', [ind.toString()])

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

        // Restart aleatório
        ind = this.factory.generateRandom(this.depth);
        return super.restartFromSolution(ind);
    }
}
