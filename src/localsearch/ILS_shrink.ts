import { Individual } from '../models/Individual';
import { ILS } from './ILS';
import { OrFunc } from '../nodes/OrFunc';
import { Logger } from '../Logger';

export class ILS_Shrink extends ILS {
    private ngramIndex = 0;

    public generateInitialIndividual(): Individual {
        const ngram = this.getNextNGram();
        return ngram ? ngram : super.generateInitialIndividual();
    }

    public getNextNGram(): Individual | null {
        const ngram = this.oldNGrams[this.ngramIndex];
        if (ngram) {
            this.ngramIndex++;
            return this.factory.createFromString(ngram, true);
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
        // const ngram = this.getNextNGram();
        // if (ngram) {
        //     let neo = new Individual();
        //     neo.tree = new OrFunc(ngram.tree, ind.tree.clone());
        //     neo = neo.shrink();
        //     console.log("Restarting to", neo.toString());
        //     return neo;
        // } else {
        //     this.ngramIndex = 0;
        // }

        const ngram = this.getNextNGram();
        if (ngram) {
            ind = ngram.shrink();
        } else {
            this.ngramIndex = 0;
        }

        // do {
        //     const ngram = this.getNextNGram();
        //     if (!ngram) { break; }

        //     const neo = new Individual();
        //     neo.tree = new OrFunc(ind.tree.clone(), ngram.tree);
        //     await this.evaluator.evaluate(neo);

        //     console.log('Evaluating to restart from', ind.toString(), 'to', neo.toString());
        //     if (neo.isBetterThan(ind)) {
        //         console.log('Restarting to', neo.toString());
        //         Logger.info('[Ngram restart to]', neo.toString());
        //         return neo;
        //     }
        // } while (true);

        // Reached here? Well, let's restar the gram index
        // this.ngramIndex = 0;

        // FIXME: We should not shrink to an invalid option
        return super.restartFromSolution(ind);
    }
}
