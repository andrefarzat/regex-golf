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
import { ConcatenationShrinker } from "./ConcatenationShrinker";


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
        if (node instanceof ConcatFunc) return NodeShrinker.shrinkFuncConcatenation(node);
        if (node instanceof LineBeginFunc) return node.clone();
        if (node instanceof LineEndFunc) return node.clone();
        if (node instanceof ListFunc) return NodeShrinker.shrinkFuncList(node);
        if (node instanceof OrFunc) return NodeShrinker.shrinkFuncOr(node);

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

    protected static shrinkFuncConcatenation(func: ConcatFunc): Node {
        const shrinker = new ConcatenationShrinker();
        return shrinker.shrink(func);
    }

    protected static shrinkFuncList(node: ListFunc): Node {
        let children = node.children.map(c => NodeShrinker.shrink(c));

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

    protected static shrinkFuncOr(node: OrFunc): Node {
        return new OrFunc(NodeShrinker.shrink(node.left), NodeShrinker.shrink(node.right));
    }

    public static addToRepetitionNumber(func: RepetitionFunc, value: number | string): string {
        let numbers = func.repetitionNumber.split(',');

        if (typeof value === 'string') {
            let values = value.split(',');
            value = values.length == 2 ? values[1] : values[0];
            value = parseInt(value, 10);
        }

        switch (numbers.length) {
            case 1: return (parseInt(numbers[0], 10) + value).toString();
            case 2: return (parseInt(numbers[1], 10) + value).toString();
        }

        return value.toString()
    }
}