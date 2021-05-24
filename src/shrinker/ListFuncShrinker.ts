import { FileLogger } from "../logger/FileLogger";
import { ILogger } from "../logger/ILogger";
import { AnyCharFunc } from "../nodes/AnyCharFunc";
import { ListFunc } from "../nodes/ListFunc";
import { Node, NodeTypes } from "../nodes/Node";
import { RangeFunc } from "../nodes/RangeFunc";
import { Terminal } from "../nodes/Terminal";
import { Utils } from "../Utils";
import { FuncShrinker } from "./FuncShrinker";
import { NodeShrinker, ShrinkOperator } from "./NodeShrinker";

export class ListFuncShrinker implements FuncShrinker {
    protected logger: ILogger;

    constructor(logger: ILogger) {
        this.logger = logger ? logger : FileLogger.getInstance();
    }

    public logShrinkOperation(operationName: ShrinkOperator, args: string[] = []): void {
        this.logger.logShrinkOperation(operationName, args);
    }

    public shrink(node: ListFunc): Node {
        if (node.isEmpty()) {

            if (node.negative) {
                this.logger.logShrinkOperation('Simplify Negation', ['[^]', '.']);
                return new AnyCharFunc();
            } else {
                this.logger.logShrinkOperation('Simplify Ranges', ['[]', '']);
                return new Terminal('');
            }
        }

        const children = node.children.map((c) => NodeShrinker.shrink(c)[0]);

        const allAreTerminals = children.every((c) => c.is(NodeTypes.terminal));
        if (allAreTerminals) {
            let chars = children.map((c) => c.toString()).sort().join('');
            chars = Utils.getUniqueChars(chars);

            if (chars.length === 1 && !node.negative) {
                if (children.length > 2) {
                    this.logger.logShrinkOperation('Remove Duplicate Values', [children.map(c => c.toString()).join(''), chars]);
                }
                return new Terminal(chars);
            }

            const isSequence = Utils.isSequence(chars);

            if (isSequence && chars.length > 3) {
                const func = new RangeFunc();
                func.from = chars.charAt(0);
                func.to = chars.substr(-1);
                func.negative = node.negative;

                this.logger.logShrinkOperation('Simplify Ranges', [children.map(c => c.toString()).join(''), func.toString()]);
                return func;
            }

            if (chars.length < children.length) {
                this.logger.logShrinkOperation('Remove Duplicate Values', [children.map(c => c.toString()).join(''), chars]);
            }

            return new ListFunc(chars.split('').map((c) => new Terminal(c)), node.negative ? 'negative' : 'positive');
        }

        return node.clone();
    }
}
