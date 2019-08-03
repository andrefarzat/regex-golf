import * as Moment from "moment";
import { EvaluatorFactory } from "../models/EvaluatorFactory";
import { Individual } from "../models/Individual";
import { IndividualFactory } from "../models/IndividualFactory";
import { Utils } from "../Utils";

export interface Solution {
    ind: Individual;
    date: Date;
    count: number;
}

export abstract class LocalSearch {
    public left: string[] = [];
    public right: string[] = [];
    public chars: { left: { [key: string]: number }, right: { [key: string]: number } } = { left: {}, right: {} };
    public factory: IndividualFactory;
    public evaluator: EvaluatorFactory;
    public currentBest: Individual = null;
    public startTime: Date;
    public endTime: Date;
    public seed: number;
    public index: number;
    public ngrams: string[] = [];
    public oldNGrams: string[] = [];

    public budget: number;
    public depth: number = 5;
    public solutions: Individual[] = [];
    public localSolutions: Individual[] = [];
    public hasTimedOut: boolean = false;
    public readonly TWO_MINUTES = 1000 * 60 * 2;
    public readonly TEN_MINUTES = 1000 * 60 * 10;

    constructor(public instanceName: string) {
        const instance = Utils.loadInstance(instanceName);
        this.left = instance.left;
        this.right = instance.right;
    }

    public get validLeftChars(): string[] {
        return Object.keys(this.chars.left);
    }

    public get validRightChars(): string[] {
        return Object.keys(this.chars.right);
    }

    public get leftCharsNotInRight(): string[] {
        return this.validLeftChars.filter((char) => this.validRightChars.indexOf(char) === -1);
    }

    public get rightCharsNotInLeft(): string[] {
        return this.validRightChars.filter((char) => this.validLeftChars.indexOf(char) === -1);
    }

    public init() {
        this.startTime = new Date();

        if (this.depth === 0 || Number.isNaN(this.depth)) {
            this.depth = Math.max(...this.left.map((name) => name.length));
        }

        this.chars.left = this.extractUniqueChars(this.left);
        this.chars.right = this.extractUniqueChars(this.right);
        this.factory = new IndividualFactory(this.validLeftChars, this.validRightChars);
        this.evaluator = new EvaluatorFactory(this.left, this.right);

        if (this.instanceName === 'balance') {
            import('./balance').then(balance => {
                this.ngrams = balance.grams;
                this.oldNGrams = balance.oldNGrams;
            });
        } else {
            this.ngrams = this.extractNGrams();
        }

        return this;
    }

    public extractUniqueChars(text: string[]): { [key: string]: number } {
        const chars: { [key: string]: number } = {};
        text.forEach((name) => {
            const uniqueChars = new Set<string>();
            name.split('').forEach((letter) => uniqueChars.add(letter));

            uniqueChars.forEach((char) => {
                if (!(char in chars)) { chars[char] = 0; }
                chars[char] += 1;
            });
        });

        return Utils.sortObjectByValue(chars);
    }

    public extractNGrams(): string[] {
        const ngrams: string[] = [];
        let left = this.left.concat();

        for (const ngram of this.extractNGramsOLD()) {
            const i = left.length;
            left = left.filter(name => !this.oneMatchesTwo(ngram, name));
            if (i > left.length) { ngrams.push(ngram); }
        }

        return ngrams;
    }

    public extractNGramsOLD(): string[] {
        const n = this.depth;
        const grams: string[] = [];

        this.left.forEach((phrase) => {
            const chars = phrase.split('');
            chars.forEach((char, j) => {
                let i = 1;
                let word = char;
                if (this.isValidRight(word)) { grams.push(word); }
                chars.slice(j + 1).forEach((subchar) => {
                    if (i >= n) { return; }
                    word += subchar;
                    if (this.isValidRight(word)) { grams.push(word); }
                    i += 1;
                });
            });
        });

        const values: {[key: string]: number} = {};
        for (const gram of grams) {
            const ind = this.factory.createFromString(gram, true);
            values[gram] = ind.isValid() ? this.evaluator.evaluateSimple(ind) : -10000;
        }

        grams.sort((a: string, b: string): number => {
            if (values[a] > values[b]) { return -1; }
            if (values[a] < values[b]) { return 1; }

            // untie
            if (a.length < b.length) { return -1; }
            if (a.length > b.length) { return 1; }

            return 0;
        });

        return this.oldNGrams = Array.from(new Set(grams));
    }

    public oneMatchesTwo(one: string, two: string) {
        const regex = new RegExp(one);
        return regex.test(two);
    }

    public isValidLeft(ind: Individual): boolean {
        return this.left.every((name) => ind.test(name));
    }

    // To be right valid, must *not* match any right
    public isValidRight(text: string): boolean {
        try {
            const regex = new RegExp(text);
            return this.right.every((name) => !regex.test(name));
        } catch {
            return false;
        }
    }

    public isBest(ind: Individual): boolean {
        try {
            const fitness = ind.fitness;
            return fitness >= this.getMaxFitness();
        } catch {
            return false;
        }
    }

    public isValidRegex(str: string): boolean {
        try {
            // tslint:disable-next-line:no-unused-expression
            new RegExp(str);
            return true;
        } catch {
            return false;
        }
    }

    public getMaxFitness(): number {
        return this.left.length;
    }

    public shouldStop(): boolean {
        if (this.evaluator.evaluationCount >= this.budget) {
            this.endTime = new Date();
            return true;
        }

        if (Moment().diff(this.startTime, 'ms') > this.TEN_MINUTES) {
            this.hasTimedOut = true;
            this.endTime = new Date();
            return true;
        }

        return false;
    }

    public addSolution(ind: Individual) {
        this.solutions.push(ind);
    }

    public async addLocalSolution(ind: Individual) {
        this.localSolutions.push(ind);
    }

    public generateInitialIndividual(): Individual {
        return this.factory.generateRandom(this.depth);
    }

    public abstract async restartFromSolution(ind: Individual): Promise<Individual>;

    public getBestSolution(): Individual | undefined {
        this.localSolutions.sort(this.sorter);
        this.solutions.sort(this.sorter);

        return this.solutions.length > 0 ? this.solutions[0] : this.localSolutions[0];
    }

    public sorter(a: Individual, b: Individual): number {
        if (a.fitness > b.fitness) { return -1; }
        if (a.fitness < b.fitness) { return 1; }

        if (a.toString().length > b.toString().length) { return 1; }
        if (a.toString().length < b.toString().length) { return -1; }

        if (a.evaluationIndex < b.evaluationIndex) { return -1; }
        if (a.evaluationIndex > b.evaluationIndex) { return 1; }

        return 0;
    }
}
