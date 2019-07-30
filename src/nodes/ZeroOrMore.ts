import { Func, FuncTypes } from './Func';

export class ZeroOrMoreFunc extends Func {
    public type: FuncTypes = FuncTypes.zeroOrMore;

    public toString(): string {
        return super.toString() + '*';
    }
}
