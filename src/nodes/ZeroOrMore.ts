import Func, { FuncTypes } from './Func';


export default class ZeroOrMoreFunc extends Func {
    public type: FuncTypes = FuncTypes.zeroOrMore;

    public toString(): string {
        return '*';
    }
}