import Individual from '../models/Individual';
import { LocalSearch } from './LocalSearch';


export default class RRLS extends LocalSearch {
    public async restartFromSolution(ind: Individual): Promise<Individual> {
        return this.factory.generateRandom(this.depth);
    }
}