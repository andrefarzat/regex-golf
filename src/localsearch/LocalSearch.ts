import dayjs from 'dayjs';
import { EvaluatorFactory } from "../models/EvaluatorFactory";
import { Individual } from "../models/Individual";
import { IndividualFactory } from "../models/IndividualFactory";
import { Utils } from "../Utils";
import { Logger } from "../Logger";

export interface Solution {
    ind: Individual;
    date: Date;
    count: number;
}

export abstract class LocalSearch {
    public instanceName: string;
    public chars: { left: { [key: string]: number }, right: { [key: string]: number } } = { left: {}, right: {} };
    public factory: IndividualFactory;
    public evaluator: EvaluatorFactory;
    public currentBest: Individual = null;
    public startTime: Date;
    public endTime: Date;
    public seed: number;
    public index: number;
    public env: 'server' | 'browser' = 'server';
    public ngrams: string[] = [];
    public oldNGrams: string[] = [];
    public evaluationsWithoutImprovement = 0;
    public maxEvaluationsWithoutImprovement = Infinity;
    public hasTimedOut: boolean = false;

    public budget: number;
    public depth: number = 5;
    public solutions: Individual[] = [];
    public localSolutions: Individual[] = [];
    public reasonToStop: 'timeout' | 'withoutImprovement' | 'maxEvaluations' = null;

    public readonly TWO_MINUTES = 1000 * 60 * 2;
    public readonly TEN_MINUTES = 1000 * 60 * 10;

    constructor(public left: string[], public right: string[]) { }

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

    public async init() {
        this.startTime = new Date();

        if (this.depth === 0 || Number.isNaN(this.depth)) {
            this.depth = Math.max(...this.left.map((name) => name.length));
        }

        this.chars.left = this.extractUniqueChars(this.left);
        this.chars.right = this.extractUniqueChars(this.right);
        this.factory = new IndividualFactory(this.validLeftChars, this.validRightChars);
        this.evaluator = new EvaluatorFactory(this.left, this.right, this.env);

        if (this.instanceName === 'balance') {
            import('./balance').then(balance => {
                this.ngrams = balance.grams;
                this.oldNGrams = balance.oldNGrams;
            });
        } else {
            this.ngrams = await this.extractNGrams();
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

    public async extractNGrams(): Promise<string[]> {
        const ngrams: string[] = [];
        let left = this.left.concat();

        for (const ngram of (await this.extractNGramsOLD())) {
            const i = left.length;
            left = left.filter(name => !this.oneMatchesTwo(ngram, name));
            if (i > left.length) { ngrams.push(ngram); }
        }

        return ngrams;
    }

    public async extractNGramsOLD(): Promise<string[]> {
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
            values[gram] = ind.isValid() ? (await this.evaluator.evaluateSimple(ind)) : -10000;
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

    public shouldStop(ind: Individual = null, label: string = ''): boolean {
        if (this.evaluator.evaluationCount >= this.budget) {
            this.endTime = new Date();
            this.reasonToStop = 'maxEvaluations';
            // tslint:disable-next-line
            Logger.info('[shouldStop]', label, 'maxEvaluations', this.evaluator.evaluationCount.toString(), this.budget.toString());
            return true;
        }

        if (this.evaluationsWithoutImprovement >= this.maxEvaluationsWithoutImprovement) {
            this.endTime = new Date();
            this.reasonToStop = 'withoutImprovement';
            // tslint:disable-next-line
            Logger.info('[shouldStop]', label, 'withoutImprovement', this.evaluationsWithoutImprovement.toString(), this.maxEvaluationsWithoutImprovement.toString());
            return true;
        }

        if (dayjs().diff(this.startTime, 'ms') > this.TEN_MINUTES) {
            this.reasonToStop = 'timeout';
            this.endTime = new Date();
            // tslint:disable-next-line
            Logger.info('[shouldStop]', label, 'timeout', this.evaluationsWithoutImprovement.toString(), this.maxEvaluationsWithoutImprovement.toString());
            return true;
        }

        // tslint:disable-next-line
        Logger.info('[shouldStop]', label, 'return false');
        return false;
    }

    public addSolution(ind: Individual) {
        const isAlreadyThere = this.solutions.find(i => i.toString() === ind.toString());
        if (!isAlreadyThere) {
            Logger.info('[addSolution]', ind.toString());
            this.solutions.push(ind);
        }
    }

    public addLocalSolution(ind: Individual) {
        const isAlreadyThere = this.localSolutions.find(i => i.toString() === ind.toString());
        if (!isAlreadyThere) {
            Logger.info('[addLocalSolution]', ind.toString());
            this.localSolutions.push(ind);
        }
    }

    public generateInitialIndividual(): Individual {
        const ind = this.factory.generateRandom(this.depth);
        Logger.info('[generateInitialIndividual]', ind.toString());
        return ind;
    }

    public abstract restartFromSolution(ind: Individual): Promise<Individual>;

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
