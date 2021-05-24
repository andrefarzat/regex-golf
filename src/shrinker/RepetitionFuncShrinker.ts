import { ILogger } from "../logger/ILogger";
import { Node, NodeTypes } from "../nodes/Node";
import { OneOrMoreFunc } from "../nodes/OneOrMoreFunc";
import { RepetitionFunc } from "../nodes/RepetitionFunc";
import { FuncShrinker } from "./FuncShrinker";
import { NodeShrinker, ShrinkOperator } from "./NodeShrinker";

export class RepetitionFuncShrinker implements FuncShrinker {
    constructor(public logger: ILogger) { }

    public logShrinkOperation(operationName: ShrinkOperator, args: string[] = []): void {
        this.logger.logShrinkOperation(operationName, args);
    }

    public shrink(node: RepetitionFunc): Node {
        const children = node.children.map((c) => NodeShrinker.shrink(c)[0]);

        if (node.repetitionNumber === '1,') {
            const neo = new OneOrMoreFunc(children);
            this.logShrinkOperation('Convert Range to shorthand', [node.toString(), neo.toString()]);
            return neo;
        }

        return node.clone();
    }
}
