import Func, { FuncTypes } from "./Func";
import Node from "./Node";
import Utils from "../Utils";


export default class BackrefFunc extends Func {
    public type: FuncTypes = FuncTypes.backref;
    public number: number = 1;

    public clone(): BackrefFunc {
        let func = new BackrefFunc();
        func.number = this.number;
        return func;
    }

    public toString(): string {
        return `\\${this.number}`;
    }
}