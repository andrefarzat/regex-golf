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

        let current: string[] = [this.validLeftChars[index]];
        let ind = this.factory.createFromString(current.join('|'));
        while (!this.isValidLeft(ind)) {
            if ((index + 1) > maxIndex) {
                break;
            }

            index += 1;
            current.push(this.validLeftChars[index]);
            ind = this.factory.createFromString(current.join('|'));
        }

        return ind;
    }
}