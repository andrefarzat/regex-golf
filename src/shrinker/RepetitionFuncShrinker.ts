import { Node, NodeTypes } from "../nodes/Node";
import { OneOrMoreFunc } from "../nodes/OneOrMoreFunc";
import { RepetitionFunc } from "../nodes/RepetitionFunc";
import { FuncShrinker } from "./FuncShrinker";
import { NodeShrinker } from "./NodeShrinker";

export class RepetitionFuncShrinker implements FuncShrinker {
    public shrink(node: RepetitionFunc): Node {
        const children = node.children.map((c) => NodeShrinker.shrink(c)[0]);

        if (node.repetitionNumber === '1,') {
            return new OneOrMoreFunc(children);
        }

        return node.clone();
    }
}
