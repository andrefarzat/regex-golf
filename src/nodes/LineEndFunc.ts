import { Func, FuncTypes } from './Func';

export class LineEndFunc extends Func {
    public type: FuncTypes = FuncTypes.lineEnd;

    public toString(): string {
        return '$';
    }
}
