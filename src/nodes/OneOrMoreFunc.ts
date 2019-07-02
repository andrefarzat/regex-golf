import Func, { FuncTypes } from './Func';


export default class OneOrMoreFunc extends Func {
    public type: FuncTypes = FuncTypes.oneOrMore;

    public toString(): string {
        return super.toString() + '+';
    }
}