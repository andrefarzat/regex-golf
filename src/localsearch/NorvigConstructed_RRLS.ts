import Individual from '../models/Individual';
import Terminal from '../nodes/Terminal';
import Func from '../nodes/Func';
import RRLS from './RRLS';
import * as cp from 'child_process';
import * as path from 'path';


/**
 * Implemented from Norvig's algo
 * @see https://www.oreilly.com/learning/regex-golf-with-peter-norvig
 */
export default class NorvigConstructed_RRLS extends RRLS {

    public generateInitialIndividual(): Individual {
        let cmd = path.join('norvig', 'regexgolf.py');
        let norvigResult = cp.execSync(`${cmd} ${this.instanceName}`);
        let str = eval(norvigResult.toString());
        return this.factory.createFromString(str);
    }

    // The set of mistakes made by this regex in classifying winners and losers.
    public mistakes(regex: RegExp, leftList: string[], rightList: string[]) {
        let result: string[] = [];

        for (let word of leftList) {
            if (!regex.test(word)) {
                result.push(`Should have matched: ${word}`);
            }
        }

        for (let word of rightList) {
            if (!regex.test(word)) {
                result.push(`Should not have matched: ${word}`);
            }
        }

        return new Set(result);
    }

    public verify(regex: RegExp, leftList: string[], rightList: string[]) {
        let mistakes = this.mistakes(regex, leftList, rightList);
        console.assert(mistakes.size == 0);
        return true;
    }

    // Find a regex that matches all winners but no losers (sets of strings).
    public findregex(winners: string[], losers: string[], k=4) {
        // Make a pool of regex parts, then pick from them to cover winners.
        // On each iteration, add the 'best' part to 'solution',
        // remove winners covered by best, and keep in 'pool' only parts
        // that still match some winner.
        let pool = Array.from(this.regex_parts(winners, losers));
        let solution = [];

        let score = (a: string, b: string) => {
            let aScore = k * this.matches(a, winners).size - a.length;
            let bScore = k * this.matches(b, winners).size - b.length;
            return aScore - bScore;
        };

        // let score = (part: string) => k * this.matches(part, winners).size - part.length;
        while (winners.length > 0) {
            let best = Array.from(pool).sort(score)[0];
            solution.push(best);

            let matches = Array.from(this.matches(best, winners));
            winners = winners.filter(winner => !matches.includes(winner));
            pool = pool.filter(p => this.matches(p, winners).size > 0);
        }

        return this.OR(solution);
    }

    // Return a set of all the strings that are matched by regex.
    public matches(regex: string, strings: string[]) {
        let r = new RegExp(regex);
        let result = strings.filter(s => r.test(s));
        return new Set(result);
    }

    // Join a sequence of strings with '|' between them
    public OR(strs: string[]): string {
        return strs.join('|');
    }

    // Return parts that match at least one winner, but no loser.
    public regex_parts(winners: string[], losers: string[]) {
        let wholes = winners.map(w => `^${w}$`);
        let parts = new Set<string>();

        for (let whole of wholes) {
            for (let part of this.subparts(whole)) {
                for (let dot of this.dotify(part)) {
                    parts.add(dot);
                }
            }
        }

        let result: Set<string> = new Set<string>(wholes);
        for (let part of parts) {
            if (this.matches(part, losers)) {
                result.add(part);
            }
        }

        return result;
    }

    // Return a set of subparts of word: consecutive characters up to length N (default 4)
    public subparts(word: string, N=4): Set<string> {
        let result: string[] = [];
        let letters = word.split('');

        for (let i = 0; i < letters.length; i++) {
            for (let n = 1; n <= N; n++) {
                result.push(word.substr(i, n));
            }
        }

        result.sort();

        return new Set(result);
    }

    // Return all ways to replace a subset of chars in part with '.'
    public dotify(part: string) {
        let cat = (chars: string[]) => chars.join('');

        let replacements = (c: string) => ['^', '$'].includes(c) ? c : c + '.';
        let choices = part.split('').map(replacements);

        let result = part.split('').map(letter => ['^', '$'].includes(letter) ? letter : letter + '.');
        let vai = result.map(v => v.split(''));
        return new Set(this.product(...vai).map(cat).sort());
    }

    // @see https://gist.github.com/cybercase/db7dde901d7070c98c48
    public product(...args: string[][]): string[][] {
        let fn = require('../product.js');
        return fn(...args);
    }
}