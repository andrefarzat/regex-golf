import Func, { FuncTypes } from './Func';
import Terminal from './Terminal';

import { NegativePositive } from './LookaheadFunc';


export default class ListFunc extends Func {
    public type: FuncTypes = FuncTypes.list;

    public constructor(
        public children: Node[],
        public negative: NegativePositive = 'positive'
    ) {
        super(children);
    }

    public toString(): string {
        return `[${super.toString()}]`;
    }
}