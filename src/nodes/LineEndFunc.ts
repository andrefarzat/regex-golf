import Func, { FuncTypes } from './Func';


export default class LineEndFunc extends Func {
    public type: FuncTypes = FuncTypes.lineEnd;

    public toString(): string {
        return '$';
    }
}