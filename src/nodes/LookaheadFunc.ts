import Func, { FuncTypes } from "./Func";
import Terminal from "./Terminal";

export type NegativePositive = 'positive' | 'negative';

export default class LookaheadFunc extends Func {
    public type: FuncTypes = FuncTypes.lookahead;
    public negative!: boolean;

    public constructor(public content: string, negativePositive: NegativePositive = 'positive') {
        super(FuncTypes.lookahead, new Terminal(), new Terminal());
        this.negative = negativePositive === 'negative';
    }

    public clone(): LookaheadFunc {
        let func = new LookaheadFunc(this.content, this.negative ? 'negative' : 'positive');
        func.left = this.left.clone();
        func.right = this.right.clone();
        func.type = this.type;
        return func;
    }

    public toString(): string {
        let symbol = this.negative ? '?!' : '?=';
        let left  = this.left ? this.left.toString() : '';
        let right = this.right ? this.right.toString() : '';

        return `(${symbol}${this.content})${left}${right}`;
    }
}