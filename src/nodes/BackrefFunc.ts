import { Func, FuncTypes } from "./Func";

export class BackrefFunc extends Func {
    public type: FuncTypes = FuncTypes.backref;
    public number: number = 1;

    public clone(): BackrefFunc {
        const func = new BackrefFunc();
        func.number = this.number;
        return func;
    }

    public toString(): string {
        return `\\${this.number}`;
    }
}
