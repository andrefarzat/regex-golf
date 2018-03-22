import Func from "./nodes/Func";
import Individual from "./models/Individual";
import IndividualFactory from "./models/IndividualFactory";
import Terminal from "./nodes/Terminal";
import Utils from "./Utils";


export default abstract class BaseProgram {
    public left: string[] = [];
    public right: string[] = [];
    public chars: {left: {[key: string]: number}, right: {[key: string]: number}} = {left: {}, right: {}};
    public factory: IndividualFactory;
    public currentBest: Individual = null;
    public evaluationCount: number = 0;
    public startTime: Date;
    public endTime: Date;
    public seed: number;
    public index: number;

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
    }

    public init(): void {
        this.startTime = new Date();
        this.chars.left = this.extractUniqueChars(this.left);
        this.chars.right = this.extractUniqueChars(this.right);
        this.factory = new IndividualFactory(this.validLeftChars, this.validRightChars);
    }

    public extractUniqueChars(text: string[]): {[key: string]: number} {
        let chars: {[key: string]: number} = {};
        text.forEach(name => {
            let uniqueChars = new Set();
            name.split('').forEach(letter => uniqueChars.add(letter));

            uniqueChars.forEach(char => {
                if(!(char in chars)) chars[char] = 0;
                chars[char] += 1;
            });
        });

        return Utils.sortObjectByValue(chars);
    }

    public isValidLeft(ind: Individual): boolean {
        return this.left.every(name => ind.test(name));
    }

    public isValid(ind: Individual): boolean {
        this.evaluate(ind);
        return ind.fitness >= this.left.length;
    }

    public isBest(ind: Individual): boolean {
        let fitness = this.evaluate(ind);
        let quantity = this.left.length + this.right.length;
        return fitness >= quantity;
    }

    public isValidRegex(str: string): boolean {
        try {
            new RegExp(str);
            return true;
        } catch {
            return false;
        }
    }

    public evaluate(ind: Individual): number {
        if (ind.isEvaluated) return ind.fitness;

        ind.leftFitness = 0;
        ind.rightFitness = 0;
        this.evaluationCount += 1;
        ind.evaluationIndex = this.evaluationCount;
        let regex = ind.toRegex();

        this.left .forEach(name => ind.leftFitness  += regex.test(name) ? 1 : 0);
        this.right.forEach(name => ind.rightFitness += regex.test(name) ? 0 : 1);
        ind.isEvaluated = true;
        return ind.fitness;
    }

    public getMaxFitness(): number {
        return this.left.length + this.right.length;
    }
}
