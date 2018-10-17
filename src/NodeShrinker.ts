import Node, { NodeTypes } from './nodes/Node';
import Func, { FuncTypes } from './nodes/Func';
import Terminal from './nodes/Terminal';
import Utils from './Utils';
import IndividualFactory from './models/IndividualFactory';
import RepetitionFunc from './nodes/RepetitionFunc';
import RangeFunc from './nodes/RangeFunc';
import ConcatFunc from './nodes/ConcatFunc';
import LineBeginFunc from './nodes/LineBeginFunc';
import OrFunc from './nodes/OrFunc';
import LineEndFunc from './nodes/LineEndFunc';


export default class NodeShrinker {

    public static shrink(node?: Node): Node {
        let neo: Node;

        if (node instanceof Func) {
            neo = NodeShrinker.shrinkFunc(node);
        } else if (node instanceof Terminal) {
            neo = NodeShrinker.shrinkTerminal(node);
        } else if (node === undefined) {
            neo = new Terminal('');
        } else {
            throw new Error('Invalid Node type to Shrink');
        }

        return neo;
    }

    public static shrinkMany(nodes: Node[]): Node[] {
        return nodes.map(node => NodeShrinker.shrink(node));
    }

    public static shrinkTerminal(node: Terminal): Node {
        return node.clone();
    }

    public static shrinkFunc(node: Func): Node {
        switch (node.type) {
            case Func.Types.concatenation: return NodeShrinker.shrinkFuncConcatenation(node);
            case Func.Types.lineBegin: return node.clone();
            case Func.Types.lineEnd: return node.clone();
            // case Func.Types.list: return NodeShrinker.shrinkFuncList(node);
            // case Func.Types.negation: return NodeShrinker.shrinkFuncNegation(node);
            case Func.Types.or: return NodeShrinker.shrinkFuncOr(node as any);
            // case Func.Types.repetition: return NodeShrinker.shrinkRepetition(node as RepetitionFunc);
            // case Func.Types.range: return NodeShrinker.shrinkRange(node as RangeFunc);
        }

        // zeroOrMore = "•*+",
        // oneOrMore = "•?+",
        // group = "(•)",

        // Our default is shrink left and right and return a new Func
        if (node instanceof Func) {
            return node.clone();
        } else {
            // Terminal
            return new ConcatFunc([NodeShrinker.shrink(node)]);
        }
    }

    protected static shrinkFuncConcatenation(func: ConcatFunc): Node {
        let children = func.children.map(node => NodeShrinker.shrink(node));

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