import { FuncTypes } from "./Func";

export enum NodeTypes {
    terminal = 'terminal',
    func = 'function',
}


export default interface Node {
    clone(): Node;
    mutate(values: string[]): void;
    toString(): string;
    toRegex(): RegExp;
    readonly nodeType: NodeTypes;

    is(type: NodeTypes | FuncTypes): boolean;
}

