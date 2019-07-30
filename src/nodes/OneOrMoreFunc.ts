import { Func, FuncTypes } from './Func';

export class OneOrMoreFunc extends Func {
    public type: FuncTypes = FuncTypes.oneOrMore;

    public toString(): string {
        return super.toString() + '+';
    }
}
