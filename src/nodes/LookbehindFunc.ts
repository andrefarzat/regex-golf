import { Func, FuncTypes } from "./Func";
import { NegativePositive } from './LookaheadFunc';
import { Node } from './Node';
import { Terminal } from "./Terminal";

export class LookbehindFunc extends Func {
    public type: FuncTypes = FuncTypes.lookbehind;
    public negative!: boolean;

    public constructor(public children: Node[], public negativePostive: NegativePositive = 'positive') {
        super(children);
        this.negative = negativePostive === 'negative';
    }

    public clone(): LookbehindFunc {
        return new LookbehindFunc(this.children, this.negative ? 'negative' : 'positive');
    }

    public toString(): string {
        const symbol = this.negative ? '?<!' : '?<=';
        const text  = super.toString();

        return `(${symbol}${text})`;
    }
}
