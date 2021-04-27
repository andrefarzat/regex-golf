import { Individual } from '../models/Individual';
import { ILS } from './ILS';
import { OrFunc } from '../nodes/OrFunc';
import { Logger } from '../Logger';

import { Utils } from '../Utils';

export class ILS_Shrink extends ILS {
    private ngramIndex = 0;

    public getNextNGram(): Individual | null {
        const ngram = this.oldNGrams[this.ngramIndex];
        if (ngram) {
            this.ngramIndex++;
            const ind = this.factory.createFromString(ngram, true);
            ind.addOrigin('getNextNGram', [this.ngramIndex.toString(), ngram]);
            return ind;
        } else {
            this.ngramIndex = 0;
        }

        return null;
    }

    public async generateIndividualToRestart(ind: Individual): Promise<Individual> {
        const shunkCurrentSolution = ind.shrink(this.logger);
        shunkCurrentSolution.addOrigin('generateIndividualToRestart', [ind.toString()])

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
            // ind = ngram.shrink(this.logger);
            return ngram;
        }

        // Restart aleatório
        ind = this.factory.generateRandom(this.depth);
        return super.generateIndividualToRestart(ind);
    }
}
