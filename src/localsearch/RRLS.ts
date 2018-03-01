import Individual from '../models/Individual';
import LocalSearch from './LocalSearch';


export default class RRLS extends LocalSearch {
    public restartFromSolution(ind: Individual): Individual {
        return this.factory.generateRandom(this.depth);
    }
}