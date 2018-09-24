import Func, { FuncTypes } from './Func';


export default class OptionalFunc extends Func {
    public type: FuncTypes = FuncTypes.optional;

    public toString(): string {
        return '?';
    }
}