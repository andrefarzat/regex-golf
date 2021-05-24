import { ILogger } from "../logger/ILogger";
import { Func } from "../nodes/Func";
import { Node } from "../nodes/Node";
import { ShrinkOperator } from "./NodeShrinker";

export interface FuncShrinker {
    shrink(node: Func): Node;
    logShrinkOperation(operationName: ShrinkOperator, args: string[]): void;
}
