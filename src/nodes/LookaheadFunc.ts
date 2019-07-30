import { Func, FuncTypes } from "./Func";
import { Node } from "./Node";
import { Terminal } from "./Terminal";

export type NegativePositive = 'positive' | 'negative';

export class LookaheadFunc extends Func {
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
        const symbol = this.negative ? '?!' : '?=';
        const text = super.toString();

        return `(${symbol}${text})`;
    }
}
