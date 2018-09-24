import Func, { FuncTypes } from './Func';
import Node from './Node';


export default class OrFunc extends Func {
    public type: FuncTypes = FuncTypes.or;

    public constructor(public left: Node, public right: Node) {
        super();
    }

    public toString(): string {
        return `${this.left.toString()}|${this.right.toString()}`;
    }
}