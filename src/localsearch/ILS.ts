import Individual from '../models/Individual';
import LocalSearch from './LocalSearch';


export default class ILS extends LocalSearch {
    public async restartFromSolution(ind: Individual): Promise<Individual> {
        let count = 5;

        while (--count > 0) {
            let neo = this.factory.generateRandomlyFrom(ind);
            if (!neo.isValid()) continue;
            if (!this.isValidRegex(neo.toString())) continue;

            ind = neo;
        }

        let len = ind.getNodes().length;
        if (len > 5) {
            count = 3;
        } else if (len > 2) {
            count = 1;
        } else {
            count = 0;
        }

        while (--count > 0) {
            let neo = this.factory.removeRandomNode(ind);
            if (!neo.isValid()) continue;
            if (!this.isValidRegex(neo.toString())) continue;

            ind = neo;
        }

        try {
            await this.evaluate(ind);
        } catch {
            // throw new Error("generated an invalid individual");
        }

        return ind;
    }
}