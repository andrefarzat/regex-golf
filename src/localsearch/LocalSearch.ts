import BaseProgram from "../BaseProgram";
import Func, { FuncTypes } from "../nodes/Func";
import Individual from "../models/Individual";
import Terminal from "../nodes/Terminal";
import { Moment } from "moment";
import Neighborhood from "../models/Neighborhood";

export interface Solution {
    ind: Individual;
    date: Date;
    count: number;
}


export default abstract class LocalSearch extends BaseProgram {
    public budget: number;
    public depth: number;
    public maxTimeout: Moment;
    public solutions: Individual[] = [];
    public localSolutions: Individual[] = [];
    public hasTimedOut: boolean = false;

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
        try {
            await this.evaluate(ind);
            this.localSolutions.push(ind);
        } catch {
            // pass
        }
    }

    public generateInitialIndividual(): Individual {
        return this.factory.generateRandom(this.depth);
    }

    public abstract async restartFromSolution(ind: Individual): Promise<Individual>;

    public generateNeighborhood(solution: Individual) {
        let hood = new Neighborhood(solution, this);
        return hood.getGenerator();
    }

    public getBestSolution(): Individual | undefined {
        return this.solutions.length > 0 ? this.solutions[0] : this.localSolutions[0];
    }
}
