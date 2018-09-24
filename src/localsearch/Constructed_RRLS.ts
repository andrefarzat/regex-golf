import Individual from '../models/Individual';
import Terminal from '../nodes/Terminal';
import Func from '../nodes/Func';
import RRLS from './RRLS';
import * as cp from 'child_process';
import * as path from 'path';
import ConcatFunc from '../nodes/ConcatFunc';
import OrFunc from '../nodes/OrFunc';


/**
 * Implemented from Norvig's algo
 * @see https://www.oreilly.com/learning/regex-golf-with-peter-norvig
 */
export default class Constructed_RRLS extends RRLS {

    public generateInitialIndividual(): Individual {
        let index = 0;
        let maxIndex = this.validLeftChars.length - 1;

        let ind = new Individual();
        ind.tree = new ConcatFunc();
        ind.tree.addChild(new Terminal(this.validLeftChars[index]));

        if (this.isValidLeft(ind)) {
            return ind;
        }

        let current = ind.tree;
        while (!this.isValidLeft(ind)) {
            current.type = Func.Types.or;
            index ++;

            if ((index + 1) > maxIndex) {
                break;
            }

            let left = new Terminal(this.validLeftChars[index])
            let right = new Terminal(this.validLeftChars[index + 1]);
            let func = new OrFunc(left, right);

            current = func;
        }

        return ind;
    }
}