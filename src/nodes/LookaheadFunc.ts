import Func, { FuncTypes } from "./Func";
import Terminal from "./Terminal";
import Node from "./Node";

export type NegativePositive = 'positive' | 'negative';

export default class LookaheadFunc extends Func {
    public type: FuncTypes = FuncTypes.lookahead;
    public negative!: boolean;

    public constructor(public children: Node[], negativePositive: NegativePositive = 'positive') {
        super(children);
        this.negative = negativePositive === 'negative';
    }

    public clone(): LookaheadFunc {
        return new LookaheadFunc(this.children, this.negative ? 'negative' : 'positive');
    }

    public toString(): string {
        let symbol = this.negative ? '?!' : '?=';
        let text = super.toString();

        return `(${symbol}${text})`;
    }
}