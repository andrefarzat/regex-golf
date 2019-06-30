import * as regexpTree from "regexp-tree";

import Node, { NodeTypes } from './nodes/Node';
import Func, { FuncTypes } from './nodes/Func';
import Terminal from './nodes/Terminal';
import Utils from './Utils';
import RepetitionFunc from './nodes/RepetitionFunc';
import RangeFunc from './nodes/RangeFunc';
import ConcatFunc from './nodes/ConcatFunc';
import OrFunc from './nodes/OrFunc';
import ListFunc from './nodes/ListFunc';
import IndividualFactory from "./models/IndividualFactory";
import LineBeginFunc from "./nodes/LineBeginFunc";
import LineEndFunc from "./nodes/LineEndFunc";


export default class NodeShrinker {

    public static shrinkRoot(node: Node): Node {
        let neo = NodeShrinker.shrink(node);

        const options = [
            'charClassToMeta',
            'charClassToSingleChar',
            'charClassRemoveDuplicates',
            'quantifiersMerge',
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
        let children = func.children
            .map(node => NodeShrinker.shrink(node))
            .map(node => NodeShrinker.shrink(node));

        const orFuncs = children.filter(func => func.is(FuncTypes.or)) as OrFunc[];
        if (orFuncs.length == 0) {
            // If there are two or more ^
            let quantity = 0;
            for (let i in children) {
                if (children[i].is(FuncTypes.lineBegin)) {
                    if (quantity > 0) {
                        children[i] = new Terminal('');
                    } else {
                        quantity += 1;
                    }
                }
            }

            // If there are two or more $
            quantity = 0;
            for (let i = children.length - 1; i > 0; i--) {
                if (children[i].is(FuncTypes.lineEnd)) {
                    if (quantity > 0) {
                        children[i] = new Terminal('');
                    } else {
                        quantity += 1;
                    }
                }
            }
        } else {
            for (let orFunc of orFuncs) {
                orFunc.left = NodeShrinker.shrink(orFunc.left);
                orFunc.right = NodeShrinker.shrink(orFunc.right);
            }
        }

        children = children.filter(child => child.toString() !== '');
        if (children.length == 1 && children[0].is(NodeTypes.terminal)) {
            return new Terminal(children[0].toString());
        }

        let neoChildren: Node[] = [];
        let current = children.shift();
        while (true) {
            const next = children.shift();
            if (!next) {
                neoChildren.push(current);
                break;
            };

            if (current.is(NodeTypes.terminal)) {
                if (next.is(NodeTypes.terminal)) {
                    if (current.toString() == next.toString()) {
                        current = new RepetitionFunc([current.clone()]);
                        (current as RepetitionFunc).repetitionNumber = '2';
                        continue;
                    }
                }

                if (next.is(FuncTypes.repetition)) {
                    let whatIsRepetead = next.asFunc().children.map(c => c.toString()).join('');

                    if (current.toString() === whatIsRepetead) {
                        current = new RepetitionFunc([current.clone()]);
                        (current as RepetitionFunc).repetitionNumber = NodeShrinker.addToRepetitionNumber(next as RepetitionFunc, 1);
                        continue;
                    }
                }
            } else if (current.is(FuncTypes.repetition)) {
                if (next.is(NodeTypes.terminal)) {
                    let currentStr = current.asFunc().children.map(c => c.toString()).join('');

                    if (currentStr == next.toString()) {
                        (current as RepetitionFunc).repetitionNumber = NodeShrinker.addToRepetitionNumber(current as any, 1);
                        continue;
                    }
                }

                if (next.is(FuncTypes.repetition)) {
                    if (current.asFunc().childrenToString() === next.asFunc().childrenToString()) {
                        let n = next.asFunc() as RepetitionFunc;
                        (current as RepetitionFunc).repetitionNumber = NodeShrinker.addToRepetitionNumber(n, n.repetitionNumber);
                        continue;
                    }
                }
            }

            neoChildren.push(current);
            current = next;
        }

        return new ConcatFunc(neoChildren);
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

            if (isSequence) {
                let func = new RangeFunc();
                func.from = chars.charAt(0);
                func.to = chars.substr(-1);
                return func;
            }

            return new ListFunc(chars.split('').map(c => new Terminal(c)));
        }

        return node.clone();
    }

    protected static shrinkFuncOr(node: OrFunc): Node {
        return new OrFunc(NodeShrinker.shrink(node.left), NodeShrinker.shrink(node.right));
    }

    protected static addToRepetitionNumber(func: RepetitionFunc, value: number | string): string {
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