import Individual from "./models/Individual";
import IndividualFactory from "./models/IndividualFactory";
import Utils from "./Utils";
import * as cp from 'child_process';
import * as moment from 'moment';
import Evaluator from "./Evaluator";


export default abstract class BaseProgram {
    public left: string[] = [];
    public right: string[] = [];
    public chars: { left: { [key: string]: number }, right: { [key: string]: number } } = { left: {}, right: {} };
    public factory: IndividualFactory;
    public currentBest: Individual = null;
    public evaluationCount: number = 0;
    public startTime: Date;
    public endTime: Date;
    public seed: number;
    public index: number;
    public evaluator: Evaluator;

    public get validLeftChars(): string[] {
        return Object.keys(this.chars.left);
    }

    public get validRightChars(): string[] {
        return Object.keys(this.chars.right);
    }

    public get leftCharsNotInRight(): string[] {
        return this.validLeftChars.filter(char => this.validRightChars.indexOf(char) === -1);
    }

    public get rightCharsNotInLeft(): string[] {
        return this.validRightChars.filter(char => this.validLeftChars.indexOf(char) === -1);
    }

    constructor(public instanceName: string) {
        let instance = Utils.loadInstance(instanceName);
        this.left = instance.left;
        this.right = instance.right;
        this.evaluator = new Evaluator(instance.left, instance.right);
    }

    public init(): void {
        this.startTime = new Date();
        this.chars.left = this.extractUniqueChars(this.left);
        this.chars.right = this.extractUniqueChars(this.right);
        this.factory = new IndividualFactory(this.validLeftChars, this.validRightChars);
    }

    public extractUniqueChars(text: string[]): { [key: string]: number } {
        let chars: { [key: string]: number } = {};
        text.forEach(name => {
            let uniqueChars = new Set();
            name.split('').forEach(letter => uniqueChars.add(letter));

            uniqueChars.forEach(char => {
                if (!(char in chars)) chars[char] = 0;
                chars[char] += 1;
            });
        });

        return Utils.sortObjectByValue(chars);
    }

    public isValidLeft(ind: Individual): boolean {
        return this.left.every(name => ind.test(name));
    }

    public async isValid(ind: Individual): Promise<boolean> {
        try {
            await this.evaluate(ind);
            return ind.fitness >= this.left.length;
        } catch {
            return false;
        }
    }

    public async isBest(ind: Individual): Promise<boolean> {
        try {
            let fitness = await this.evaluate(ind);
            return fitness >= this.getMaxFitness();
        } catch {
            return false;
        }
    }

    public isValidRegex(str: string): boolean {
        try {
            new RegExp(str);
            return true;
        } catch {
            return false;
        }
    }

    public async evaluate(ind: Individual) {
        this.evaluationCount += 1;

        if (this.evaluationCount % 1000 === 0) {
            let currentTime = moment().diff(this.startTime, 'seconds');
            console.log(`${this.evaluationCount} evaludated in ${currentTime} seconds`);
        }

        return this.evaluator.evaluate(ind, this.evaluationCount);
    }

    public getMaxFitness(): number {
        return this.left.length;
    }

    public finish() {
        this.evaluator.finish();
    }
}
