import * as regexpTree from "regexp-tree";

import Node, { NodeTypes } from '../nodes/Node';
import Func, { FuncTypes } from '../nodes/Func';
import Terminal from '../nodes/Terminal';
import Utils from '../Utils';
import RepetitionFunc from '../nodes/RepetitionFunc';
import RangeFunc from '../nodes/RangeFunc';
import ConcatFunc from '../nodes/ConcatFunc';
import OrFunc from '../nodes/OrFunc';
import ListFunc from '../nodes/ListFunc';
import IndividualFactory from "../models/IndividualFactory";
import LineBeginFunc from "../nodes/LineBeginFunc";
import LineEndFunc from "../nodes/LineEndFunc";
import { ConcatFuncShrinker } from "./ConcatenationShrinker";
import AnyCharFunc from "../nodes/AnyCharFunc";
import { RepetitionFuncShrinker } from "./RepetitionFuncShrinker";
import { ListFuncShrinker } from "./ListFuncShrinker";


export class NodeShrinker {

    public static shrinkRoot(node: Node): Node {
        let neo = NodeShrinker.shrink(node);

        const options = [
            'charClassToMeta',
            'charClassToSingleChar',
            'charClassRemoveDuplicates',
            'quantifiersMerge',
            'quantifierRangeToSymbol',
            'charClassClassrangesToChars',
            'charClassClassrangesMerge',
            'disjunctionRemoveDuplicates',
            'groupSingleCharsToCharClass',
            'combineRepeatingPatterns',
        ];

        try {
            const originalRe = neo.toRegex();
            const optimizedRe: RegExp = (regexpTree as any).optimize(originalRe, options).toRegExp();

            let factory = new IndividualFactory([], []);
            let ind = factory.createFromString(optimizedRe);
            return ind.isValid() ? ind.tree : neo;
        } catch {
            return neo;
        }
    }

    public static shrink(node?: Node): Node {
        if (node instanceof Func) {
            return NodeShrinker.shrinkFunc(node);
        } else if (node instanceof Terminal) {
            return NodeShrinker.shrinkTerminal(node);
        } else if (node === undefined) {
            return new Terminal('');
        } else {
            throw new Error('Invalid Node type to Shrink');
        }
    }

    public static shrinkMany(nodes: Node[]): Node[] {
        return nodes.map(node => NodeShrinker.shrink(node));
    }

    public static shrinkTerminal(node: Terminal): Node {
        return node.clone();
    }

    public static shrinkFunc(node: Func): Node {
        if (node instanceof ConcatFunc) return (new ConcatFuncShrinker()).shrink(node);
        if (node instanceof RepetitionFunc) return (new RepetitionFuncShrinker()).shrink(node);
        if (node instanceof ListFunc) return (new ListFuncShrinker()).shrink(node);
        if (node instanceof OrFunc) return NodeShrinker.shrinkOrFunc(node);
        if (node instanceof RangeFunc) return node.clone();

        // Anchors
        if (node instanceof LineBeginFunc || node instanceof LineEndFunc) {
            return node.clone();
        }

        if (node.is(Func.Types.concatenation)) {
            throw new Error('Should not reach here like this');
        }
        
        // switch (node.type) {
            // case Func.Types.negation: return NodeShrinker.shrinkFuncNegation(node);
            // case Func.Types.repetition: return NodeShrinker.shrinkRepetition(node as RepetitionFunc);
            // case Func.Types.range: return NodeShrinker.shrinkRange(node as RangeFunc);
            // zeroOrMore = "•*+",
            // oneOrMore = "•?+",
            // group = "(•)",
        // }

        // Our default is shrink left and right and return a new Func
        if (node instanceof Func) {
            const neo = node.clone();
            neo.children = NodeShrinker.shrinkMany(neo.children);
            return neo;
        } else {
            // Terminal
            return new ConcatFunc([NodeShrinker.shrink(node)]);
        }
    }

    protected static shrinkOrFunc(node: OrFunc): Node {
        return new OrFunc(NodeShrinker.shrink(node.left), NodeShrinker.shrink(node.right));
    }
}