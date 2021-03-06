import { Func, FuncTypes } from './Func';

export class LineBeginFunc extends Func {
    public type: FuncTypes = FuncTypes.lineBegin;

    public toString(): string {
        return '^';
    }
}
