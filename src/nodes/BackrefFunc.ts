import Func, { FuncTypes } from "./Func";
import Node from "./Node";
import Utils from "../Utils";


export default class BackrefFunc extends Func {
    public type: FuncTypes = FuncTypes.backref;
    public number: number = 1;

    public constructor(left?: Node, right?: Node) {
        super(FuncTypes.backref, left, right);
    }

    public clone(): BackrefFunc {
        let func = new BackrefFunc();
        func.left = this.left.clone();
        func.right = this.right.clone();
        func.type = this.type;
        func.number = this.number;
        return func;
    }

    public toString(): string {
        let left  = this.left ? this.left.toString() : '';
        let right = this.right ? this.right.toString() : '';

        return `\\${this.number}${left}${right}`;
    }
}