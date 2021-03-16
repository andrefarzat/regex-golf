import { Individual } from "./Individual";


export abstract class Evaluator {
    public cache: {[key: number]: Individual} = {};

    public constructor(public left: string[], public right: string[]) { }
    public abstract evaluate(ind: Individual): Promise<number>;
    public abstract finish(): void;
}