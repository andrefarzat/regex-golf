import { NegativePositive } from './LookaheadFunc';
import Func, { FuncTypes } from "./Func";
import Terminal from "./Terminal";
import Node from './Node';


export default class LookbehindFunc extends Func {
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
        let symbol = this.negative ? '?<!' : '?<=';
        let text  = super.toString();

        return `(${symbol}${text})`;
    }
}