import { FuncShrinker } from "./FuncShrinker";
import RepetitionFunc from "../nodes/RepetitionFunc";
import Node, { NodeTypes } from "../nodes/Node";
import { NodeShrinker } from "./NodeShrinker";
import OneOrMoreFunc from "../nodes/OneOrMoreFunc";


export class RepetitionFuncShrinker implements FuncShrinker {
    public shrink(node: RepetitionFunc): Node {
        const children = node.children.map(c => NodeShrinker.shrink(c));

        if (node.repetitionNumber === '1,') {
            return new OneOrMoreFunc(children);
        }

        return node.clone();
    }
}
