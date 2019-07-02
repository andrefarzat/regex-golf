import { FuncShrinker } from "./FuncShrinker";
import ListFunc from "../nodes/ListFunc";
import Node, { NodeTypes } from "../nodes/Node";
import AnyCharFunc from "../nodes/AnyCharFunc";
import Terminal from "../nodes/Terminal";
import { NodeShrinker } from "./NodeShrinker";
import Utils from "../Utils";
import RangeFunc from "../nodes/RangeFunc";


export class ListFuncShrinker implements FuncShrinker {
    public shrink(node: ListFunc): Node {
        if (node.isEmpty()) {
            return node.negative ? new AnyCharFunc() : new Terminal('');
        }

        const children = node.children.map(c => NodeShrinker.shrink(c));

        let allAreTerminals = children.every(c => c.is(NodeTypes.terminal));
        if (allAreTerminals) {
            let chars = children.map(c => c.toString()).sort().join('');
            chars = Utils.getUniqueChars(chars);

            if (chars.length === 1) {
                return new Terminal(chars);
            }

            let charCode: number = 0;
            let isSequence = Array.from(chars).every(letter => {
                if (charCode < letter.charCodeAt(0)) {
                    charCode = letter.charCodeAt(0);
                    return true;
                } else {
                    return false;
                }
            });

            if (isSequence && chars.length > 3) {
                let func = new RangeFunc();
                func.from = chars.charAt(0);
                func.to = chars.substr(-1);
                func.negative = node.negative;
                return func;
            }

            return new ListFunc(chars.split('').map(c => new Terminal(c)), node.negative ? 'negative' : 'positive');
        }

        return node.clone();
    }
}