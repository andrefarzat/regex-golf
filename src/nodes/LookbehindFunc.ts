import { NegativePositive } from './LookaheadFunc';
import Func, { FuncTypes } from "./Func";
import Terminal from "./Terminal";


export default class LookbehindFunc extends Func {
    public type: FuncTypes = FuncTypes.lookbehind;
    public negative!: boolean;

    public constructor(public content: string, public negativePostive: NegativePositive = 'positive') {
        super(FuncTypes.lookbehind, new Terminal(), new Terminal());
        this.negative = negativePostive === 'negative';
    }

    public clone(): LookbehindFunc {
        let func = new LookbehindFunc(this.content, this.negative ? 'negative' : 'positive');
        func.left = this.left ? this.left.clone() : undefined;
        func.right = this.right ? this.right.clone() : undefined;
        func.type = this.type;
        return func;
    }

    public toString(): string {
        let symbol = this.negative ? '?<!' : '?<=';
        let left  = this.left ? this.left.toString() : '';
        let right = this.right ? this.right.toString() : '';

        return `(${symbol}${this.content})${left}${right}`;
    }
}