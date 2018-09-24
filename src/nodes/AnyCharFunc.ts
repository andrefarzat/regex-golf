import Func, { FuncTypes } from './Func';


export default class AnyCharFunc extends Func {
    public type: FuncTypes = FuncTypes.anyChar;

    public toString(): string {
        return '.';
    }
}