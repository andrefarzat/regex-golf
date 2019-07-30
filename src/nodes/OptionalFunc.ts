import { Func, FuncTypes } from './Func';

export class OptionalFunc extends Func {
    public type: FuncTypes = FuncTypes.optional;

    public toString(): string {
        return '?';
    }
}
