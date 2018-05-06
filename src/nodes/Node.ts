import Func, { FuncTypes } from "./Func";

export enum NodeTypes {
    terminal = 'terminal',
    func = 'function',
}


export default interface Node {
    clone(): Node;
    toString(): string;
    toDot(i: number): string;
    toRegex(): RegExp;
    readonly nodeType: NodeTypes;

    is(type: NodeTypes | FuncTypes): boolean;
    equals(node: Node): boolean;

    asFunc(): Func;
}

