import Func, { FuncTypes } from "./Func";
import Node from "./Node";


export default class RangeFunc extends Func {
    public type: FuncTypes = FuncTypes.range;
    public from: string = '';
    public to: string = '';

    public constructor(left?: Node, right?: Node) {
        super(FuncTypes.range, left, right);
    }

    public clone(): RangeFunc {
        let func = new RangeFunc();
        func.left = this.left.clone();
        func.right = this.right.clone();
        func.type = this.type;
        func.from = this.from;
        func.to = this.to;
        return func;
    }

    public toString(): string {
        let left  = this.left ? this.left.toString() : '';
        let right = this.right ? this.right.toString() : '';

        return `[${this.from}-${this.to}]${left}${right}`;
    }

}