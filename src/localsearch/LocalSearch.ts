import Func, { FuncTypes } from "../nodes/Func";
import Individual from "../models/Individual";
import Terminal from "../nodes/Terminal";
import { Moment } from "moment";
import Neighborhood from "../models/Neighborhood";
import IndividualFactory from "../models/IndividualFactory";
import Utils from "../Utils";

export interface Solution {
    ind: Individual;
    date: Date;
    count: number;
}


export default abstract class LocalSearch {
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

    public budget: number;
    public depth: number;
    public maxTimeout: Moment;
    public solutions: Individual[] = [];
    public localSolutions: Individual[] = [];
    public hasTimedOut: boolean = false;

    constructor(public instanceName: string) {
        let instance = Utils.loadInstance(instanceName);
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
        return this.validLeftChars.filter(char => this.validRightChars.indexOf(char) === -1);
    }

    public get rightCharsNotInLeft(): string[] {
        return this.validRightChars.filter(char => this.validLeftChars.indexOf(char) === -1);
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

    public async isBest(ind: Individual): Promise<boolean> {
        try {
            let fitness = ind.fitness;
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

    public getMaxFitness(): number {
        return this.left.length;
    }

    public getNextEvaluationIndex(): number {
        return this.evaluationCount ++;
    }

    public shouldStop(): boolean {
        if (this.evaluationCount >= this.budget) {
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
        return this.solutions.length > 0 ? this.solutions[0] : this.localSolutions[0];
    }
}
