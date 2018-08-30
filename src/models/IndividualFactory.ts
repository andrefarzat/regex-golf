import * as regexp from "regexp-tree";

import Func, {FuncTypes} from '../nodes/Func';
import Individual from './Individual';
import Node from '../nodes/Node';
import Terminal from '../nodes/Terminal'
import Utils from '../Utils';
import RepetitionFunc from "../nodes/RepetitionFunc";
import RangeFunc from "../nodes/RangeFunc";
import BackrefFunc from "../nodes/BackrefFunc";


export default class IndividualFactory {
    public constructor(public leftChars: string[], public rightChars: string[]) {}

    public createFromString(phrase: string) : Individual {
        let tree = regexp.parse(`/${phrase}/`);
        let body = tree.body as any;
        let expressions = body.expressions
            ? body.expressions as regexp.Node.Expression[]
            : [body] as regexp.Node.Expression[];

        let ind = new Individual();
        let currentFunc = new Func(Func.Types.concatenation);
        ind.tree = currentFunc;

        let i = 0;
        for (let expression of expressions) {
            let node = this.parseExpression(expression);
            let isLast = ++i === expressions.length;

            if (!node) continue;

            if (node instanceof Terminal) {
                if (!currentFunc.left || currentFunc.left.isEmpty()) {
                    currentFunc.left = node;
                } else if (isLast) {
                    currentFunc.right = node;
                } else {
                    let func = new Func();
                    func.type = Func.Types.concatenation;
                    func.left = node;

                    currentFunc.right = func;
                    currentFunc = func;
                }
            } else {
                if (!currentFunc.left) {
                    currentFunc.left = new Terminal('');
                }

                currentFunc.right = node;
                currentFunc = node;
            }
        }

        if (currentFunc && !currentFunc.left)  currentFunc.left  = new Terminal('');
        if (currentFunc && !currentFunc.right) currentFunc.right = new Terminal('');
        return ind;
    }

    public parseExpression(expression: regexp.Node.Expression): Func | Terminal {
        if (expression.type == 'Char') {
            return this.parseChar(expression);
        } else if (expression.type == 'Assertion' && expression.kind == '^') {
            return new Func(Func.Types.lineBegin);
        } else if (expression.type == 'Assertion' && expression.kind == '$') {
            return new Func(Func.Types.lineEnd);
        } else if (expression.type == 'Repetition') {
            if (expression.quantifier && expression.quantifier.kind == 'Range') {
                let node = new RepetitionFunc();
                node.left = new Terminal((expression.expression as any).value);

                if (expression.quantifier.from == expression.quantifier.to) {
                    node.repetitionNumber = expression.quantifier.from.toString();
                } else {
                    node.repetitionNumber = `${expression.quantifier.from},${expression.quantifier.to}`;
                }

                return node;
            } else if (expression.quantifier && expression.quantifier.kind == '+') {
                let node = new Func(FuncTypes.oneOrMore);
                node.left = new Terminal((expression.expression as any).value);

                return node;
            } else if (expression.quantifier && expression.quantifier.kind == '*') {
                let node = new Func(FuncTypes.zeroOrMore);
                node.left = new Terminal((expression.expression as any).value);

                return node;
            } else {
                debugger;
                throw new Error('Unkown expression.type == Repetition');
            }
        } else if (expression.type === 'Disjunction') {
            let exp = expression as any;
            let left = exp.left ? this.parseExpression(exp.left) : new Terminal();
            let right = exp.right ? this.parseExpression(exp.right) : new Terminal();
            return new Func(FuncTypes.or, left, right);
        } else if (expression.type === 'Alternative') {
            let nodes = expression.expressions.map(exp => this.parseExpression(exp));
            let mainFunc = new Func(FuncTypes.concatenation);

            let func = mainFunc;
            for (let node of nodes) {
                if (!func.left) {
                    func.left = node;
                } else {
                    let right = new Func(FuncTypes.concatenation, node);
                    func.right = right;
                    func = right;
                }
            }

            if (!func.right) {
                func.right = new Terminal();
            }

            return mainFunc;
        } else if (expression.type === 'CharacterClass') {
            if (expression.expressions.length == 1) {
                let n = expression.expressions[0];
                if (n.type === 'ClassRange') {
                    let func = new RangeFunc();
                    func.from = n.from.value;
                    func.to = n.to.value;
                    func.negative = expression.negative;
                    return func;
                }
            }

            let nodes = expression.expressions.map((exp: any) => this.parseExpression(exp).toString()).join('');
            let node = new Func(expression.negative ? Func.Types.negation : Func.Types.list);
            node.left = this.createFromString(nodes).tree;
            return node;
        } else {
            return new Terminal((expression as any).value);
        }
    }

    public parseChar(char: regexp.Node.Char): Func | Terminal {
        if (char.kind === 'simple') {
            return new Terminal(char.value);
        } else if (char.kind === 'meta') {
            if (char.value === '.') return new Func(FuncTypes.anyChar);
        } else {
            throw new Error(`No kind ${char.kind} on Char`);
        }
    }

    public getRandomCharFromLeft(): Terminal {
        let char = Utils.getRandomlyFromList(this.leftChars);
        return new Terminal(char);
    }

    public getRandomCharFromRight(): Terminal {
        let char = Utils.getRandomlyFromList(this.rightChars);
        return new Terminal(char);
    }

    public appendAtEnd(ind: Individual, node: Node): Individual {
        let newInd = ind.clone();
        let leaf = newInd.tree.getLeastFunc();
        let func = new Func();
        func.type = Func.Types.concatenation;
        func.left = leaf.right;
        func.right = node;
        return newInd;
    }

    public appendAtBeginning(ind: Individual, node: Node): Individual {
        let newInd = ind.clone();
        let func = new Func();
        func.type = Func.Types.concatenation;
        func.left = node;
        func.right = newInd.tree;
        newInd.tree = func;
        return newInd;
    }

    public insertRandomly(ind: Individual, node: Node): Individual {
        let newInd = ind.clone();
        let currentFunc = Utils.getRandomlyFromList(newInd.getFuncs());
        let func = new Func();
        func.type = Func.Types.concatenation;
        func.left = node;
        func.right = currentFunc;

        let parent = newInd.getParentOf(currentFunc);
        if (parent) {
            if (parent.side == 'left') parent.func.left = func;
            else parent.func.right = func;
        }

        return newInd;
    }

    public swapRandomly(ind: Individual, node: Node): Individual {
        let newInd = ind.clone();
        let currentTerminal = Utils.getRandomlyFromList(newInd.getTerminals());
        let parent = newInd.getParentOf(currentTerminal);
        if (parent) {
            if (parent.side === 'left') parent.func.left = node;
            else parent.func.right = node;
        }

        return newInd;
    }

    public replaceNode(ind: Individual, one: Node, two: Node): Individual {
        let neo = ind.clone();
        let oneIndex = ind.getNodes().indexOf(one);
        let neoOne = neo.getNodes()[oneIndex];

        let parent = neo.getParentOf(neoOne);
        if (!parent) {
            let func = new Func();
            func.left = new Terminal('');
            func.right = two;
            neo.tree = func;
        } else if (parent.side == 'left') {
            parent.func.left = two;
        } else {
            parent.func.right = two;
        }

        return neo;
    }

    public concatenateToNode(ind: Individual, one: Node, two: Node): Individual {
        if (one.is(FuncTypes.negation) && two.is(FuncTypes.negation)) {
            return this.concatenateTwoNegativeOperators(ind, one as Func, two as Func);
        }

        let neo = ind.clone();
        let neoOne = neo.getNodes()[ind.getNodes().indexOf(one)];
        let parent = neo.getParentOf(neoOne);

        let func = new Func();
        func.type = Func.Types.concatenation;
        func.left = neoOne;
        func.right = two;

        if (!parent) {
            neo.tree = func;
        } else if (parent.side == 'left') {
            parent.func.left = func;
        } else {
            parent.func.right = func;
        }

        return neo;
    }

    public concatenateTwoNegativeOperators(ind: Individual, one: Func, two: Func): Individual {
        let neo = ind.clone();
        let neoOne = neo.getNodes()[ind.getNodes().indexOf(one)];
        let parent = neo.getParentOf(neoOne);

        let func = new Func(FuncTypes.negation);
        func.left = new Func(FuncTypes.concatenation, (neoOne as Func).left, two.left);
        func.right = new Terminal();

        if (!parent) {
            neo.tree = func;
        } else if (parent.side == 'left') {
            parent.func.left = func;
        } else {
            parent.func.right = func;
        }

        return neo;

    }

    public changeFuncType(ind: Individual, func: Func, type: FuncTypes): Individual {
        let neo = ind.clone();
        let neoFunc = neo.getFuncs()[ind.getFuncs().indexOf(func)];
        neoFunc.type = type;
        return neo;
    }

    public addStartOperator(ind: Individual): Individual {
        let node = this.getRandomCharFromLeft();
        let newInd = ind.clone();
        let funcStartOperator = newInd.getFuncs().find(current => current.type == Func.Types.lineBegin);

        if (!funcStartOperator) {
            let func = new Func();
            func.type = Func.Types.lineBegin;
            func.left = node;
            func.right = newInd.tree;
            newInd.tree = func;
        } else {
            funcStartOperator.left = node;
        }

        return newInd;
    }

    public addStartOperatorToTerminal(ind: Individual, terminal: Terminal): Individual {
        let index = ind.getTerminals().indexOf(terminal);
        let neo = ind.clone();
        let neoTerminal = neo.getTerminals()[index];
        let parent = neo.getParentOf(neoTerminal);

        let func = new Func();
        func.type = Func.Types.lineBegin;
        func.right = neoTerminal;
        func.left = new Terminal('');

        if (parent.side == 'left') {
            parent.func.left = func;
        } else {
            parent.func.right = func;
        }

        return neo;
    }

    public addEndOperator(ind: Individual): Individual {
        let node = this.getRandomCharFromLeft();
        let newInd = ind.clone();
        let funcEndOperator = newInd.getFuncs().find(current => current.type == Func.Types.lineEnd);

        if (!funcEndOperator) {
            let func = new Func();
            func.type = Func.Types.lineEnd;
            func.left = node;
            func.right = newInd.tree;
            newInd.tree = func;
        } else {
            funcEndOperator.left = node;
        }

        return newInd;
    }

    public addEndOperatorToTerminal(ind: Individual, terminal: Terminal): Individual {
        let index = ind.getTerminals().indexOf(terminal);
        let neo = ind.clone();
        let neoTerminal = neo.getTerminals()[index];
        let parent = neo.getParentOf(neoTerminal);

        let func = new Func();
        func.type = Func.Types.lineEnd;
        func.right = neoTerminal;
        func.left = new Terminal('');

        if (parent.side == 'left') {
            parent.func.left = func;
        } else {
            parent.func.right = func;
        }

        return neo;
    }

    public addToNegation(ind: Individual, node: Node): Individual {
        let newInd = ind.clone();
        let func = newInd.getFuncs().find(current => current.type == Func.Types.negation);

        if (!func) {
            func = new Func();
            func.type = Func.Types.negation;
            func.left = new Terminal('');
            func.right = node;
            return Utils.nextBoolean() ? this.appendAtBeginning(newInd, func) : this.appendAtEnd(newInd, func);
        }

        if (func.left instanceof Terminal && func.left.toString() == '') {
            func.left = node;
        } else if (func.right instanceof Terminal && func.right.toString() == '') {
            func.right = node;
        } else {
            let newFunc = new Func();
            newFunc.type = Func.Types.concatenation;
            newFunc.left = node;
            newFunc.right = func;

            let parent = newInd.getParentOf(func);
            if (parent.side == 'left') parent.func.left = newFunc;
            else parent.func.right = newFunc;
        }

        return newInd;
    }

    public removeRandomChar(ind: Individual): Individual {
        let neo = ind.clone();
        let terminal = Utils.getRandomlyFromList(neo.getTerminals());
        let parent = neo.getParentOf(terminal);

        if (parent.side == 'left') {
            parent.func.left = new Terminal('');
        } else {
            parent.func.right = new Terminal('');
        }

        return neo;
    }

    public removeRandomNode(ind: Individual): Individual {
        let node = Utils.getRandomlyFromList(ind.getNodes());

        return this.removeNode(ind, node);
    }

    public removeNode(ind: Individual, node: Node): Individual {
        let neo = ind.clone();
        let index = ind.getNodes().indexOf(node);
        let nodeToBeRemoved = neo.getNodes()[index];
        let parent = neo.getParentOf(nodeToBeRemoved);

        if (!parent) {
            neo.tree = new Func();
            neo.tree.left = new Terminal('');
            neo.tree.right = new Terminal('');
            return neo;
        }

        if (parent.side == 'left') {
            parent.func.left = new Terminal('');
        } else {
            parent.func.right = new Terminal('');
        }

        return neo;
    }

    public generateNegationNodeFromList(chars: string[]): Func {
        let func = new Func();
        func.type = Func.Types.negation;
        func.left = new Terminal('');
        func.right = this.getRandomCharFromRight();
        return func;
    }

    public generateRandomlyFrom(ind: Individual): Individual {
        let node = Utils.nextBoolean()
            ? this.getRandomCharFromLeft()
            : this.getRandomCharFromRight();

        switch (Utils.nextInt(8)) {
            case 0: return this.appendAtEnd(ind, node);
            case 1: return this.appendAtBeginning(ind, node);
            case 2: return this.insertRandomly(ind, node);
            case 3: return this.swapRandomly(ind, node);
            case 4: return this.addToNegation(ind, node);
            case 5: return this.addStartOperator(ind);
            case 6: return this.addEndOperator(ind);
            case 7: return this.removeRandomChar(ind);
        }

        return this.appendAtEnd(ind, node);
    }

    public generateRandom(depth: number): Individual {
        let ind = new Individual();
        ind.tree = new Func();
        ind.tree.left = this.getRandomCharFromLeft();
        ind.tree.right = this.getRandomCharFromLeft();

        while (--depth > 0) {
            ind = this.generateRandomlyFrom(ind);
        }

        return this.generateRandomlyFrom(ind);
    }

    public wrapNodeWithGroup(ind: Individual, node: Node): Individual {
        let index = ind.getNodes().indexOf(node);
        let neo = ind.clone();
        let neoNode = neo.getNodes()[index];
        let parent = neo.getParentOf(neoNode);

        let func = new Func(FuncTypes.group, new Terminal(''), neoNode);

        if (!parent) {
            neo.tree = func;
        } else if (parent.side == 'left') {
            parent.func.left = func;
        } else {
            parent.func.right = func;
        }

        return neo;
    }

    public addBackref(ind: Individual, node: Node, number: number = 1): Individual {
        let func = new BackrefFunc(new Terminal(''), new Terminal(''));
        func.number = number;
        return this.concatenateToNode(ind, node, func);
    }

    public concatenateToNode2(ind: Individual, one: Node, two: Node): Individual {
        let neo = ind.clone();
        let neoOne = neo.getNodes()[ind.getNodes().indexOf(one)];
        let parent = neo.getParentOf(neoOne);

        let func = new Func();
        func.type = Func.Types.concatenation;
        func.left = neoOne;
        func.right = two;

        if (!parent) {
            neo.tree = func;
        } else if (parent.side == 'left') {
            parent.func.left = func;
        } else {
            parent.func.right = func;
        }

        return neo;
    }

    public isNodeWrappedBy(ind: Individual, node: Node, type: FuncTypes): boolean {
        let parents = ind.getParentsOf(node);
        return parents.some(parent => parent.is(type));
    }

    public isNodeWrappedByGroup(node: Node, ind: Individual): boolean {
        return this.isNodeWrappedBy(ind, node, FuncTypes.group);
    }
}
