import { Func, FuncTypes } from "./Func";

export enum NodeTypes {
    terminal = 'terminal',
    func = 'function',
}

export type NodeOperator = "Remove redundant operators";

export interface NodeHistory {
    funcName: string;
    operatorName: NodeOperator;
    fromNode: string;
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
    addHistory(funcName: string, operatorName: string, fromNode: string): void;
}
