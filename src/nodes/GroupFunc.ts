import Func, { FuncTypes } from './Func';
import Node from './Node';


export default class GroupFunc extends Func {
    public type: FuncTypes = FuncTypes.group;

    public toString(): string {
        return `(${super.toString()})`;
    }
}