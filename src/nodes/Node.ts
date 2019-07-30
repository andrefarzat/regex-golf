import { Func, FuncTypes } from "./Func";

export enum NodeTypes {
    terminal = 'terminal',
    func = 'function',
}

export interface Node {
    readonly nodeType: NodeTypes;
    clone(): Node;
    toString(): string;
    toDot(i: number): string;
    toRegex(): RegExp;
    isEmpty(): boolean;

    is(type: NodeTypes | FuncTypes): boolean;
    equals(node: Node): boolean;

    asFunc(): Func;
}
