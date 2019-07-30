import Func from "../nodes/Func";
import { Node } from "../nodes/Node";

export interface FuncShrinker {
    shrink(node: Func): Node;
}
