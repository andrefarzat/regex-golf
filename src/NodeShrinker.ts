import Node, { NodeTypes } from './nodes/Node';
import Func, { FuncTypes } from './nodes/Func';
import Terminal from './nodes/Terminal';
import Utils from './Utils';
import IndividualFactory from './models/IndividualFactory';
import RepetitionFunc from './nodes/RepetitionFunc';
import RangeFunc from './nodes/RangeFunc';


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

    public static shrinkTerminal(node: Terminal): Node {
        return node.clone();
    }

    public static shrinkFunc(node: Func): Node {
        switch (node.type) {
            case Func.Types.concatenation: return NodeShrinker.shrinkFuncConcatenation(node);
            case Func.Types.lineBegin: return NodeShrinker.shrinkFuncLineBegin(node);
            case Func.Types.lineEnd: return NodeShrinker.shrinkFuncLineEnd(node);
            case Func.Types.list: return NodeShrinker.shrinkFuncList(node);
            case Func.Types.negation: return NodeShrinker.shrinkFuncNegation(node);
            case Func.Types.or: return NodeShrinker.shrinkFuncOr(node);
            case Func.Types.repetition: return NodeShrinker.shrinkRepetition(node as RepetitionFunc);
            case Func.Types.range: return NodeShrinker.shrinkRange(node as RangeFunc);
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
        return func;
    }

    protected static shrinkFuncConcatenation(node: Func): Node {
        let left = NodeShrinker.shrink(node.left);
        let right = NodeShrinker.shrink(node.right);

        let areBothTerminal = left.is(NodeTypes.terminal) && right.is(NodeTypes.terminal);

        if (areBothTerminal) {
            let leftStr = left.toString();
            let rightStr = right.toString();

            if (leftStr.length == 1 && rightStr.length == 1) {
                if (leftStr == rightStr) {
                    let func = new RepetitionFunc(new Terminal(leftStr), new Terminal(''));
                    func.repetitionNumber = '2';
                    return func;
                }
            }

            let func = new Func(FuncTypes.concatenation);
            func.left = new Terminal(leftStr);
            func.right = new Terminal(rightStr);
            return func;
        }

        if (left.is(NodeTypes.terminal) && right instanceof Func) {
            let leftStr = left.toString();

            if (right.is(FuncTypes.repetition)) {
                let whatIsRepetead = right.left.toString();

                if (leftStr == whatIsRepetead) {
                    let func = new RepetitionFunc();
                    func.left = new Terminal(leftStr);
                    func.repetitionNumber = NodeShrinker.addToRepetitionNumber(right as RepetitionFunc, 1);
                    func.right = right.right.clone();
                    return func;
                }
            }

            if (right.is(FuncTypes.concatenation)) {
                if (right.left.is(NodeTypes.terminal)) {
                    let rightLeftStr = right.left.toString();
                    if (leftStr === rightLeftStr) {
                        let neoLeft = new RepetitionFunc(new Terminal(leftStr), new Terminal());
                        neoLeft.repetitionNumber = (leftStr.length + rightLeftStr.length).toString();

                        return new Func(FuncTypes.concatenation, neoLeft, right.right);
                    }
                }

                if (right.left.is(FuncTypes.repetition)) {
                    let rightLeftStr = (right.left as Func).left.toString();
                    if (leftStr === rightLeftStr) {
                        let neoLeft = new RepetitionFunc(new Terminal(leftStr), new Terminal());
                        neoLeft.repetitionNumber = NodeShrinker.addToRepetitionNumber(right.left as RepetitionFunc, leftStr.length);

                        return new Func(FuncTypes.concatenation, neoLeft, right.right);
                    }
                }
            }
        }

        let areBothRepetitions = left.is(FuncTypes.repetition) && right.is(FuncTypes.repetition);
        if (areBothRepetitions) {
            let leftStr = (left as Func).left.toString();
            let rightStr = (right as Func).left.toString();

            if (leftStr === rightStr) {
                let func = new RepetitionFunc(new Terminal(leftStr), (right as Func).right);
                func.repetitionNumber = NodeShrinker.addToRepetitionNumber(left as RepetitionFunc, (right as RepetitionFunc).repetitionNumber);
                return func;
            }
        }

        let func = new Func(FuncTypes.concatenation);
        func.left = left;
        func.right = right;
        return func;
    }

    protected static shrinkFuncLineBegin(node: Func): Node {
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

    protected static shrinkFuncLineEnd(node: Func): Node {
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

    protected static shrinkFuncList(node: Func): Node {
        let left = NodeShrinker.shrink(node.left);
        let right = NodeShrinker.shrink(node.right);

        if (left instanceof Terminal) {
            return new Func(FuncTypes.concatenation, left, right);
        }

        if (left.is(FuncTypes.concatenation)) {
            let leftStr = left.toString();
            if (leftStr.length == 1) {
                let func = new Func(FuncTypes.concatenation, new Terminal(leftStr), right);
                return this.shrinkFuncConcatenation(func);
            }
        }

        let leftNodes = left.asFunc().getNodes();
        let allLeftAreTerminals = leftNodes.every(n => n.is(NodeTypes.terminal) || n.is(FuncTypes.concatenation));
        if (allLeftAreTerminals) {
            let leftStr = leftNodes.map(n => n.toString()).sort().join('');
            leftStr = Utils.getUniqueChars(leftStr);

            let charCode: number = 0;
            let isSequence = Array.from(leftStr).every(letter => {
                if (charCode < letter.charCodeAt(0)) {
                    charCode = letter.charCodeAt(0);
                    return true;
                } else {
                    return false;
                }
            });

            if (isSequence) {
                let func = new RangeFunc(new Terminal(), right);
                func.from = leftStr.charAt(0);
                func.to = leftStr.substr(-1);
                return this.shrinkRange(func);
            }

            let neoLeft = new IndividualFactory([], []).createFromString(leftStr);
            let func = new Func(FuncTypes.list, neoLeft.tree, right);
            return this.shrinkFuncList(func);
        }

        if (node.equals(right)) {
            let fRight = new Func(FuncTypes.list, left, new Terminal());
            let func = new RepetitionFunc(fRight, right.asFunc().right);
            func.repetitionNumber = '2';
            return func;
        }

        return new Func(FuncTypes.list, left, right);
    }

    protected static shrinkFuncNegation(node: Func): Node {
        let func = this.shrinkFuncList(node).asFunc();

        if (func.is(FuncTypes.range)) {
            (func as RangeFunc).negative = true;
        } else {
            func.type = FuncTypes.negation;
        }

        return func;
    }

    protected static shrinkRange(node: RangeFunc): Node {
        let left = NodeShrinker.shrink(node.left);
        let right = NodeShrinker.shrink(node.right);

        if (node.equals(left)) {
            let fLeft = new RangeFunc();
            fLeft.from = node.from;
            fLeft.to = node.to;

            let func = new RepetitionFunc(fLeft, right);
            return this.shrinkRepetition(func);
        }

        if (left.toString() == '' && node.equals(right)) {
            let fLeft = new RangeFunc();
            fLeft.from = node.from;
            fLeft.to = node.to;

            let func = new RepetitionFunc(fLeft, right.asFunc().right);
            func.repetitionNumber = '2';
            return this.shrinkRepetition(func);
        }

        let func = new RangeFunc(left, right);
        func.from = node.from;
        func.to = node.to;
        return func;
    }

    protected static shrinkFuncOr(node: Func): Node {
        let func = new Func(Func.Types.or);
        func.left = NodeShrinker.shrink(node.left);
        func.right = NodeShrinker.shrink(node.right);
        return func;
    }

    protected static shrinkRepetition(node: RepetitionFunc): Node {
        let left = NodeShrinker.shrink(node.left);
        let right = NodeShrinker.shrink(node.right);

        let leftStr = left.toString();

        if (right.is(NodeTypes.terminal)) {
            let rightStr = right.toString();

            if (leftStr === rightStr) {
                let func = new RepetitionFunc(left, new Terminal(''));
                func.repetitionNumber = NodeShrinker.addToRepetitionNumber(func, rightStr.length);
                return func;
            }
        }

        if (right.is(Func.Types.repetition)) {
            let rightStr = (right as Func).left.toString();

            if (leftStr === rightStr) {
                let func = new RepetitionFunc(left, right.asFunc().right);
                func.repetitionNumber = NodeShrinker.addToRepetitionNumber(node, node.repetitionNumber);
                return func;
            }
        }

        let func = new RepetitionFunc(left, right);
        func.repetitionNumber = node.repetitionNumber;
        return func;
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