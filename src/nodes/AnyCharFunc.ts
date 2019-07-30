import { Func, FuncTypes } from './Func';

export class AnyCharFunc extends Func {
    public type: FuncTypes = FuncTypes.anyChar;

    public toString(): string {
        return '.';
    }
}
