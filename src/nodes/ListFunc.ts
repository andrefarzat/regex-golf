import Func, { FuncTypes } from './Func';

import { NegativePositive } from './LookaheadFunc';
import Node from './Node';


export default class ListFunc extends Func {
    public type: FuncTypes = FuncTypes.list;
    public negative: boolean = false;

    public constructor(
        public children: Node[],
        negativePositive: NegativePositive = 'positive'
    ) {
        super(children);
        this.negative = negativePositive == 'negative';
    }

    public toString(): string {
        return this.negative ? `[^${super.toString()}]` : `[${super.toString()}]`;
    }
}