import { AnyCharFunc } from "../nodes/AnyCharFunc";
import { ListFunc } from "../nodes/ListFunc";
import { Node, NodeTypes } from "../nodes/Node";
import { RangeFunc } from "../nodes/RangeFunc";
import { Terminal } from "../nodes/Terminal";
import { Utils } from "../Utils";
import { FuncShrinker } from "./FuncShrinker";
import { NodeShrinker } from "./NodeShrinker";

export class ListFuncShrinker implements FuncShrinker {
    public shrink(node: ListFunc): Node {
        if (node.isEmpty()) {
            return node.negative ? new AnyCharFunc() : new Terminal('');
        }

        const children = node.children.map((c) => NodeShrinker.shrink(c)[0]);

        const allAreTerminals = children.every((c) => c.is(NodeTypes.terminal));
        if (allAreTerminals) {
            let chars = children.map((c) => c.toString()).sort().join('');
            chars = Utils.getUniqueChars(chars);

            if (chars.length === 1 && !node.negative) {
                return new Terminal(chars);
            }

            const isSequence = Utils.isSequence(chars);

            if (isSequence && chars.length > 3) {
                const func = new RangeFunc();
                func.from = chars.charAt(0);
                func.to = chars.substr(-1);
                func.negative = node.negative;
                return func;
            }

            return new ListFunc(chars.split('').map((c) => new Terminal(c)), node.negative ? 'negative' : 'positive');
        }

        return node.clone();
    }
}
