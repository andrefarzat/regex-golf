import Node, { NodeTypes } from './nodes/Node';
import Func, { FuncTypes } from './nodes/Func';
import Terminal from './nodes/Terminal';
import Utils from './Utils';


export default class NodeShrinker {

    public static shrink(node: Node): Node {
        if (node instanceof Func) { return NodeShrinker.shrinkFunc(node); }
        if (node instanceof Terminal) { return NodeShrinker.shrinkTerminal(node); }
        throw new Error('Invalid Node type to Shrink');
    }

    public static shrinkTerminal(node: Terminal): Node {
        return node.clone();
    }

    public static shrinkFunc(node: Func): Node {
        if (node.type == Func.Types.concatenation) {
            let left = NodeShrinker.shrink(node.left);
            let right = NodeShrinker.shrink(node.right);

            let areBothTerminal = left.is(NodeTypes.terminal) && right.is(NodeTypes.terminal);

            if (areBothTerminal) {
                let leftStr = left.toString();
                let rightStr = right.toString();

                if (leftStr.length == 1 && rightStr.length == 1) {
                    if (leftStr == rightStr) {
                        let func = new Func(Func.Types.repetition);
                        func.repetitionNumber = '2';
                        func.left = new Terminal(leftStr);
                        func.right = new Terminal('');
                        return func;
                    }
                }

                return new Terminal(left.toString() + right.toString());
            }

            if (left.is(NodeTypes.terminal) && right.is(FuncTypes.repetition)) {
                let funcRight = right as Func;
                let leftStr = left.toString();
                let whatIsRepetead = funcRight.left.toString();

                if (leftStr == whatIsRepetead) {
                    let func = new Func(FuncTypes.repetition);
                    func.left = new Terminal(leftStr);
                    func.repetitionNumber = NodeShrinker.addToRepetitionNumber(funcRight, 1);
                    func.right = funcRight.right.clone();
                    return func;
                }
            }

            let func = new Func(FuncTypes.concatenation);
            func.left = left;
            func.right = right;
            return func;
        }

        if (node.type == Func.Types.lineBegin) {
            let func = node.clone();
            // We search for all lineBegin and remove them.
            // There must be only ONE lineBegin
            func.getFuncs().forEach(func => {
                if (func.type == Func.Types.lineBegin) {
                    func.type = Func.Types.concatenation;
                }
            });

            let neo = new Func(Func.Types.lineBegin);
            neo.left = new Terminal();
            neo.right = func;
            return neo;
        }

        if (node.type == Func.Types.lineEnd) {
            let func = node.clone();
            // We search for all lineEnd and remove them.
            // There must be only ONE lineEnd
            func.getFuncs().forEach(func => {
                if (func.type == Func.Types.lineEnd) {
                    func.type = Func.Types.concatenation;
                }
            });

            let neo = new Func(Func.Types.lineEnd);
            neo.left = new Terminal();
            neo.right = func;
            return neo;
        }

        if (node.type == Func.Types.list) {
            let func = node.clone();

            func.getFuncs().forEach(func => {
                if (func.type == Func.Types.list) {
                    func.type = Func.Types.concatenation;
                }
            });

            let left = NodeShrinker.shrink(node.left);
            let right = NodeShrinker.shrink(node.right);

            let areBothTerminal = left.nodeType == NodeTypes.terminal
                && right.nodeType == NodeTypes.terminal;

            if (areBothTerminal) {
                let str = Utils.getUniqueChars(left.toString() + right.toString());
                let func = new Func(Func.Types.list);
                func.left = new Terminal();
                func.right = new Terminal(str);
                return func;
            } else if (left.nodeType == NodeTypes.terminal) {
                let str = Utils.getUniqueChars(left.toString());
                let func = new Func(Func.Types.list);
                func.left = new Terminal(str);
                func.right = right;
                return func;
            } else {
                let str = Utils.getUniqueChars(right.toString());
                let func = new Func(Func.Types.list);
                func.left = left;
                func.right = new Terminal(str);
                return func;
            }
        }

        if (node.type == Func.Types.negation) {
            let func = node.clone();

            func.getFuncs().forEach(func => {
                if (func.type == Func.Types.negation) {
                    func.type = Func.Types.concatenation;
                }
            });

            let left = NodeShrinker.shrink(node.left);
            let right = NodeShrinker.shrink(node.right);

            let areBothTerminal = left.nodeType == NodeTypes.terminal
                && right.nodeType == NodeTypes.terminal;

            if (areBothTerminal) {
                let str = Utils.getUniqueChars(left.toString() + right.toString());
                let func = new Func(Func.Types.negation);
                func.left = new Terminal();
                func.right = new Terminal(str);
                return func;
            } else if (left.nodeType == NodeTypes.terminal) {
                let str = Utils.getUniqueChars(left.toString());
                let func = new Func(Func.Types.negation);
                func.left = new Terminal(str);
                func.right = right;
                return func;
            } else {
                let str = Utils.getUniqueChars(right.toString());
                let func = new Func(Func.Types.negation);
                func.left = left;
                func.right = new Terminal(str);
                return func;
            }
        }

        if (node.type == Func.Types.or) {
            let func = new Func(Func.Types.or);
            func.left = NodeShrinker.shrink(node.left);
            func.right = NodeShrinker.shrink(node.right);
            return func;
        }

        // or = "•|•",
        // zeroOrMore = "•*+",
        // oneOrMore = "•?+",
        // group = "(•)",
        // more = "•++",

        // Our default is shrink left and right and return a new Func
        let func = new Func(node.type);
        func.left = NodeShrinker.shrink(node.left);
        func.right = NodeShrinker.shrink(node.right);
        func.repetitionNumber = node.repetitionNumber;
        return func;
    }

    public static addToRepetitionNumber(func: Func, value: number): string {
        let numbers = func.repetitionNumber.split(',');

        switch (numbers.length) {
            case 1: return (parseInt(numbers[0], 10) + value).toString();
            case 2: return (parseInt(numbers[1], 10) + value).toString();
        }

        return value.toString()
    }

}