import Func, { FuncTypes } from './Func';

import { NegativePositive } from './LookaheadFunc';
import Node, { NodeTypes } from './Node';


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

    public clone() {
        let negativePositive: NegativePositive = this.negative ? 'negative' : 'positive';
        return new ListFunc(this.children.map(child => child.clone()), negativePositive);
    }

    public addChild(child: Node) {
        if (child.is(NodeTypes.terminal)) {
            this.children.push(child);
        } else {
            this.children = this.children.concat(child.asFunc().children);
        }
    }
}