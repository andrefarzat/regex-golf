import * as regexp from "regexp-tree";

import Func, { FuncTypes } from '../nodes/Func';
import Individual from './Individual';
import Node from '../nodes/Node';
import Terminal from '../nodes/Terminal'
import Utils from '../Utils';
import RangeFunc from "../nodes/RangeFunc";
import BackrefFunc from "../nodes/BackrefFunc";
import LookaheadFunc, { NegativePositive } from "../nodes/LookaheadFunc";
import LookbehindFunc from "../nodes/LookbehindFunc";
import LineBeginFunc from "../nodes/LineBeginFunc";
import LineEndFunc from "../nodes/LineEndFunc";
import RepetitionFunc from "../nodes/RepetitionFunc";
import OneOrMoreFunc from "../nodes/OneOrMoreFunc";
import ZeroOrMoreFunc from "../nodes/ZeroOrMore";
import OrFunc from "../nodes/OrFunc";
import ConcatFunc from "../nodes/ConcatFunc";
import ListFunc from "../nodes/ListFunc";
import GroupFunc from "../nodes/GroupFunc";
import AnyCharFunc from "../nodes/AnyCharFunc";


export default class IndividualFactory {
    public constructor(public leftChars: string[], public rightChars: string[]) { }

    public createFromString(phrase: string): Individual {
        let tree = regexp.parse(`/${phrase}/`);
        let root = this.parseExpression(tree.body);

        let ind = new Individual();
        ind.tree = root as Func;
        return ind;
    }

    public parseExpression(expression: regexp.Node.Expression): Node {
        if (expression.type == 'Char') {
            return this.parseChar(expression);
        } else if (expression.type == 'Assertion') {
            if (expression.kind == '^') return new LineBeginFunc();
            if (expression.kind == '$') return new LineEndFunc;

            if (expression.kind == 'Lookahead') {
                let content = this.parseExpression(expression.assertion);
                return new LookaheadFunc([content], expression.negative ? 'negative' : 'positive');
            }
            if (expression.kind == 'Lookbehind') {
                let content = this.parseExpression(expression.assertion);
                return new LookbehindFunc([content], expression.negative ? 'negative' : 'positive');
            }

            throw new Error(`Unknown Assertion ${expression.kind}`);
        } else if (expression.type == 'Repetition') {
            if (expression.quantifier && expression.quantifier.kind == 'Range') {
                let node = new RepetitionFunc();
                node.addChild(new Terminal((expression.expression as any).value));

                if (expression.quantifier.from == expression.quantifier.to) {
                    node.repetitionNumber = expression.quantifier.from.toString();
                } else {
                    node.repetitionNumber = `${expression.quantifier.from},${expression.quantifier.to}`;
                }

                return node;
            } else if (expression.quantifier && expression.quantifier.kind == '+') {
                let node = new OneOrMoreFunc();
                node.addChild(new Terminal((expression.expression as any).value));

                return node;
            } else if (expression.quantifier && expression.quantifier.kind == '*') {
                let node = new ZeroOrMoreFunc;
                node.addChild(new Terminal((expression.expression as any).value));

                return node;
            } else {
                debugger;
                throw new Error('Unkown expression.type == Repetition');
            }
        } else if (expression.type === 'Disjunction') {
            let exp = expression as any;
            let left = exp.left ? this.parseExpression(exp.left) : new Terminal();
            let right = exp.right ? this.parseExpression(exp.right) : new Terminal();
            return new OrFunc(left, right);
        } else if (expression.type === 'Alternative') {
            let nodes = expression.expressions.map(exp => this.parseExpression(exp));
            return new ConcatFunc(nodes);
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

            let nodes = expression.expressions.map((exp: any) => this.parseExpression(exp));
            let negativePositive: NegativePositive = expression.negative ? 'negative' : 'positive';
            return new ListFunc(nodes as Terminal[], negativePositive);
        } else if (expression.type === 'Group') {
            let node = this.parseExpression(expression.expression);
            return new GroupFunc([node]);
        } else if (expression.type === "Backreference") {
            let func = new BackrefFunc();
            func.number = expression.number;
            return func;
        } else {
            return new Terminal((expression as any).value);
        }
    }

    public parseChar(char: regexp.Node.Char): Func | Terminal {
        if (char.kind === 'simple') {
            return new Terminal(char.value);
        } else if (char.kind === 'meta') {
            if (char.value === '.') return new AnyCharFunc();
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
        newInd.tree.addChild(node);
        return newInd;
    }

    public appendAtBeginning(ind: Individual, node: Node): Individual {
        let newInd = ind.clone();
        newInd.tree.children.unshift(node);
        return newInd;
    }

    public insertRandomly(ind: Individual, node: Node): Individual {
        let newInd = ind.clone();
        let funcs = newInd.getFuncs();
        let func = Utils.getRandomlyFromList(funcs);
        func.addChild(node);
        return newInd;
    }

    public swapRandomly(ind: Individual, node: Node): Individual {
        let newInd = ind.clone();
        let currentTerminal = Utils.getRandomlyFromList(newInd.getTerminals());
        let parent = newInd.getParentOf(currentTerminal);

        if (parent) {
            parent.swapChild(currentTerminal, node);
        }

        return newInd;
    }

    public replaceNode(ind: Individual, one: Node, two: Node): Individual {
        let neo = ind.clone();
        let oneIndex = ind.getNodes().indexOf(one);
        let neoOne = neo.getNodes()[oneIndex];

        let parent = neo.getParentOf(neoOne);

        if (parent) {
            parent.swapChild(neoOne, two);
        }

        return neo;
    }

    public concatenateToNode(ind: Individual, one: Node, two: Node): Individual {
        let neo = ind.clone();
        let neoIndex = ind.getNodes().indexOf(one);
        let neoOne = neo.getNodes()[neoIndex];

        if (neoOne instanceof Func) {
            neoOne.addChild(two);
        } else {
            let parent = ind.getParentOf(neoOne);
            let index = parent.children.indexOf(neoOne);
            parent.children.splice(index, 0, two);
        }

        return neo;
    }

    public addStartOperator(ind: Individual): Individual {
        let newInd = ind.clone();
        let funcStartOperator = newInd.getFuncs().find(current => current.type == Func.Types.lineBegin);

        if (!funcStartOperator) {
            newInd.tree.children.unshift(new LineBeginFunc());
        }

        return newInd;
    }

    public addStartOperatorToTerminal(ind: Individual, terminal: Terminal): Individual {
        let index = ind.getNodes().indexOf(terminal);
        let neo = ind.clone();
        let neoTerminal = neo.getNodes()[index];
        let parent = neo.getParentOf(neoTerminal);

        parent.children.splice(index, 0, neoTerminal);
        return neo;
    }

    public addEndOperator(ind: Individual): Individual {
        let node = this.getRandomCharFromLeft();
        let newInd = ind.clone();
        let funcEndOperator = newInd.getFuncs().find(current => current.type == Func.Types.lineEnd);

        if (!funcEndOperator) {
            newInd.tree.children.push(new LineEndFunc());
        }

        return newInd;
    }

    public addEndOperatorToTerminal(ind: Individual, terminal: Terminal): Individual {
        let index = ind.getNodes().indexOf(terminal);
        let neo = ind.clone();
        let neoTerminal = neo.getNodes()[index];
        let parent = neo.getParentOf(neoTerminal);

        parent.children.splice(index, 1, neoTerminal, new LineEndFunc());
        return neo;
    }

    public addToNegation(ind: Individual, node: Node): Individual {
        let newInd = ind.clone();
        let func = newInd.getFuncs().find(current => {
            if (current instanceof ListFunc) {
                return current.negative;
            }
            return false;
        });

        if (!func) {
            func = new ListFunc([node], 'negative');
            return Utils.nextBoolean() ? this.appendAtBeginning(newInd, func) : this.appendAtEnd(newInd, func);
        }

        func.addChild(node);
        return newInd;
    }

    public removeRandomChar(ind: Individual): Individual {
        let neo = ind.clone();
        let terminal = Utils.getRandomlyFromList(neo.getTerminals());
        let parent = neo.getParentOf(terminal);
        parent.removeChild(terminal);
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
        parent.removeChild(nodeToBeRemoved);

        return neo;
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
        ind.tree = new ConcatFunc();
        ind.tree.addChild(this.getRandomCharFromLeft());
        ind.tree.addChild(this.getRandomCharFromLeft());

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
        parent.swapChild(neoNode, new GroupFunc([neoNode]));

        return neo;
    }

    public addBackref(ind: Individual, node: Node, number: number = 1): Individual {
        let func = new BackrefFunc();
        func.number = number;
        return this.concatenateToNode(ind, node, func);
    }

    public isNodeWrappedBy(ind: Individual, node: Node, type: FuncTypes): boolean {
        let parents = ind.getParentsOf(node);
        return parents.some(parent => parent.is(type));
    }

    public isNodeWrappedByGroup(node: Node, ind: Individual): boolean {
        return this.isNodeWrappedBy(ind, node, FuncTypes.group);
    }
}
