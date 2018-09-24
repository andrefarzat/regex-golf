import Node, { NodeTypes } from './nodes/Node';
import Func, { FuncTypes } from './nodes/Func';
import Terminal from './nodes/Terminal';
import Utils from './Utils';
import IndividualFactory from './models/IndividualFactory';
import RepetitionFunc from './nodes/RepetitionFunc';
import RangeFunc from './nodes/RangeFunc';
import ConcatFunc from './nodes/ConcatFunc';
import LineBeginFunc from './nodes/LineBeginFunc';


export default class NodeShrinker {

    public static shrink(node?: Node): Node {
        return node.clone();
        // let neo: Node;

        // if (node instanceof Func) {
        //     neo = NodeShrinker.shrinkFunc(node);
        // } else if (node instanceof Terminal) {
        //     neo = NodeShrinker.shrinkTerminal(node);
        // } else if (node === undefined) {
        //     neo = new Terminal('');
        // } else {
        //     throw new Error('Invalid Node type to Shrink');
        // }

        // return neo;
    }

    public static shrinkTerminal(node: Terminal): Node {
        return node.clone();
    }

    public static shrinkFunc(node: Func): Node {
        switch (node.type) {
            // case Func.Types.concatenation: return NodeShrinker.shrinkFuncConcatenation(node);
            // case Func.Types.lineBegin: return node.clone();
            // case Func.Types.lineEnd: return node.clone();
            // case Func.Types.list: return NodeShrinker.shrinkFuncList(node);
            // case Func.Types.negation: return NodeShrinker.shrinkFuncNegation(node);
            // case Func.Types.or: return NodeShrinker.shrinkFuncOr(node);
            // case Func.Types.repetition: return NodeShrinker.shrinkRepetition(node as RepetitionFunc);
            // case Func.Types.range: return NodeShrinker.shrinkRange(node as RangeFunc);
        }

        // or = "•|•",
        // zeroOrMore = "•*+",
        // oneOrMore = "•?+",
        // group = "(•)",

        // Our default is shrink left and right and return a new Func
        let func = new ConcatFunc();
        if (node instanceof Func) {
            for (let child of node.children) {
                func.addChild(NodeShrinker.shrink(child));
            }
        } else {
            // Terminal
            func.addChild(NodeShrinker.shrink(node));
        }

        return func;
    }
}