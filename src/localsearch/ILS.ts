import { Individual } from '../models/Individual';
import { LocalSearch } from './LocalSearch';

export class ILS extends LocalSearch {
    public async generateIndividualToRestart(ind: Individual): Promise<Individual> {
        let count = 5;

        while (--count > 0) {
            const neo = this.factory.generateRandomlyFrom(ind);
            if (!neo.isValid()) { continue; }
            if (!this.isValidRegex(neo.toString())) { continue; }

            ind = neo;
        }

        const len = ind.getNodes().length;
        if (len > 5) {
            count = 3;
        } else if (len > 2) {
            count = 1;
        } else {
            count = 0;
        }

        while (--count > 0) {
            const neo = this.factory.removeRandomNode(ind);
            if (!neo.isValid()) { continue; }
            if (!this.isValidRegex(neo.toString())) { continue; }

            ind = neo;
        }

        return ind.shrink();
    }
}
