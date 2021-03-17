import regexp from "regexp-tree";
import { Char, Expression } from "regexp-tree/ast";

import { AnyCharFunc } from "../nodes/AnyCharFunc";
import { BackrefFunc } from "../nodes/BackrefFunc";
import { ConcatFunc } from "../nodes/ConcatFunc";
import { Func, FuncTypes } from '../nodes/Func';
import { GroupFunc } from "../nodes/GroupFunc";
import { LineBeginFunc } from "../nodes/LineBeginFunc";
import { LineEndFunc } from "../nodes/LineEndFunc";
import { ListFunc } from "../nodes/ListFunc";
import { LookaheadFunc, NegativePositive } from "../nodes/LookaheadFunc";
import { LookbehindFunc } from "../nodes/LookbehindFunc";
import { Node, NodeTypes } from '../nodes/Node';
import { OneOrMoreFunc } from "../nodes/OneOrMoreFunc";
import { OrFunc } from "../nodes/OrFunc";
import { RangeFunc } from "../nodes/RangeFunc";
import { RepetitionFunc } from "../nodes/RepetitionFunc";
import { Terminal } from '../nodes/Terminal';
import { ZeroOrMoreFunc } from "../nodes/ZeroOrMore";
import { Utils } from '../Utils';
import { Individual } from './Individual';

export class IndividualFactory {
    public constructor(public leftChars: string[], public rightChars: string[]) { }

    public createFromString(phrase: string | RegExp, escapeEspecialChars: boolean = false): Individual {
        if (typeof phrase === 'string') {
            if (escapeEspecialChars) {
                phrase = phrase.replace(/([.^$|{}\[\]\(\)*+?\\])/g, `\\$1`);
            }

            phrase = `/${phrase}/`;
        }

        const tree = regexp.parse(phrase);
        let root = this.parseExpression(tree.body);

        if (root.is(NodeTypes.terminal)) {
            root = new ConcatFunc([root]);
        }

        const ind = new Individual();
        ind.tree = root as Func;
        ind.origin = {name: 'createFromString', args: [phrase.toString()]};
        return ind;
    }

    public parseExpression(expression: Expression): Node {
        if (expression.type == 'Char') {
            return this.parseChar(expression);
        } else if (expression.type == 'Assertion') {
            if (expression.kind == '^') { return new LineBeginFunc(); }
            if (expression.kind == '$') { return new LineEndFunc(); }

            if (expression.kind == 'Lookahead') {
                const content = this.parseExpression(expression.assertion);
                return new LookaheadFunc([content], expression.negative ? 'negative' : 'positive');
            }
            if (expression.kind == 'Lookbehind') {
                const content = this.parseExpression(expression.assertion);
                return new LookbehindFunc([content], expression.negative ? 'negative' : 'positive');
            }

            throw new Error(`Unknown Assertion ${expression.kind}`);
        } else if (expression.type == 'Repetition') {
            if (expression.quantifier && expression.quantifier.kind == 'Range') {
                const node = new RepetitionFunc();
                node.addChild(this.parseExpression(expression.expression));

                if (expression.quantifier.from == expression.quantifier.to) {
                    node.repetitionNumber = expression.quantifier.from.toString();
                } else {
                    node.repetitionNumber = expression.quantifier.to ?
                        `${expression.quantifier.from},${expression.quantifier.to}`
                        : `${expression.quantifier.from},`;
                }

                return node;
            } else if (expression.quantifier && expression.quantifier.kind == '+') {
                const node = new OneOrMoreFunc();
                node.addChild(this.parseExpression(expression.expression));

                return node;
            } else if (expression.quantifier && expression.quantifier.kind == '*') {
                const node = new ZeroOrMoreFunc();
                node.addChild(this.parseExpression(expression.expression));

                return node;
            } else {
                throw new Error('Unkown expression.type == Repetition');
            }
        } else if (expression.type === 'Disjunction') {
            const exp = expression as any;
            const left = exp.left ? this.parseExpression(exp.left) : new Terminal();
            const right = exp.right ? this.parseExpression(exp.right) : new Terminal();
            return new OrFunc(left, right);
        } else if (expression.type === 'Alternative') {
            const nodes = expression.expressions.map((exp) => this.parseExpression(exp));
            return new ConcatFunc(nodes);
        } else if (expression.type === 'CharacterClass') {
            if (expression.expressions.length == 1) {
                const n = expression.expressions[0];
                if (n.type === 'ClassRange') {
                    const func = new RangeFunc();
                    func.from = n.from.value;
                    func.to = n.to.value;
                    func.negative = expression.negative;
                    return func;
                }
            }

            const nodes = expression.expressions.map((exp: any) => this.parseExpression(exp));
            const negativePositive: NegativePositive = expression.negative ? 'negative' : 'positive';
            return new ListFunc(nodes as Terminal[], negativePositive);
        } else if (expression.type === 'Group') {
            const node = this.parseExpression(expression.expression);
            return new GroupFunc([node]);
        } else if (expression.type === "Backreference") {
            const func = new BackrefFunc();
            func.number = expression.number;
            return func;
        } else {
            return new Terminal((expression as any).value);
        }
    }

    public parseChar(char: Char): Func | Terminal {
        if (char.kind === 'simple') {
            return new Terminal(char.value);
        } else if (char.kind === 'meta') {
            if (char.value === '.') { return new AnyCharFunc(); }
        }

        throw new Error(`No kind ${char.kind} on Char`);
    }

    public getRandomCharFromLeft(): Terminal {
        const char = Utils.getRandomlyFromList(this.leftChars);
        return new Terminal(char);
    }

    public getRandomCharFromRight(): Terminal {
        const char = Utils.getRandomlyFromList(this.rightChars);
        return new Terminal(char);
    }

    public appendAtEnd(ind: Individual, node: Node): Individual {
        const newInd = ind.clone();
        newInd.tree.addChild(node);
        newInd.origin = {name: 'appendAtEnd', args: [node.toString()]};
        return newInd;
    }

    public appendAtBeginning(ind: Individual, node: Node): Individual {
        const newInd = ind.clone();
        newInd.tree.children.unshift(node);
        newInd.origin = {name: 'appendAtBeginning', args: [node.toString()]};
        return newInd;
    }

    public appendToNode(ind: Individual, nodeWhichReceive: Node, nodeWhichWillBeAppended: Node): Individual {
        const neo = ind.clone();
        neo.origin = {name: 'appendToNode', args: [nodeWhichReceive.toString(), nodeWhichWillBeAppended.toString()]};
        const neoIndex = ind.getNodes().indexOf(nodeWhichReceive);
        const neoOne = neo.getNodes()[neoIndex];

        if (neoOne.is(NodeTypes.func)) {
            neoOne.asFunc().addChild(nodeWhichWillBeAppended);
        } else {
            const parent = neo.getParentOf(neoOne);
            const index = parent.children.indexOf(neoOne);
            parent.children.splice(index, 1, neoOne, nodeWhichWillBeAppended);
        }

        return neo;
    }

    public insertRandomly(ind: Individual, node: Node): Individual {
        const newInd = ind.clone();
        newInd.origin = {name: 'insertRandomly', args: [node.toString()]};
        const funcs = newInd.getFuncs();
        const func = Utils.getRandomlyFromList(funcs);
        func.addChild(node);
        return newInd;
    }

    public swapRandomly(ind: Individual, node: Node): Individual {
        const newInd = ind.clone();
        newInd.origin = {name: 'swapRandomly', args: [node.toString()]};
        const currentTerminal = Utils.getRandomlyFromList(newInd.getTerminals());
        const parent = newInd.getParentOf(currentTerminal);

        if (parent) {
            parent.swapChild(currentTerminal, node);
        }

        return newInd;
    }

    public replaceNode(ind: Individual, one: Node, two: Node): Individual {
        const neo = ind.clone();
        neo.origin = {name: 'replaceNode', args: [one.toString(), two.toString()]};
        const oneIndex = ind.getNodes().indexOf(one);
        const neoOne = neo.getNodes()[oneIndex];

        const parent = neo.getParentOf(neoOne);

        if (parent) {
            parent.swapChild(neoOne, two);
        }

        return neo;
    }

    public concatenateToNode(ind: Individual, one: Node, two: Node): Individual {
        const neo = ind.clone();
        neo.origin = {name: 'concatenateToNode', args: [one.toString(), two.toString()]};
        const neoIndex = ind.getNodes().indexOf(one);
        const neoOne = neo.getNodes()[neoIndex];

        const parent = neo.getParentOf(neoOne);

        if (parent) {
            const index = parent.children.indexOf(neoOne);
            parent.children.splice(index, 1, neoOne, two);
        } else if (neo.isTheRootNode(neoOne)) {
            neo.tree.addChild(two);
        } else {
            throw new Error('[concatenateToNode] Should not reach here');
        }

        return neo;
    }

    public replaceNodeWithOrFunc(ind: Individual, one: Node, two: Node): Individual {
        const neo = ind.clone();
        neo.origin = {name: 'replaceNodeWithOrFunc', args: [one.toString(), two.toString()]};
        const neoIndex = ind.getNodes().indexOf(one);
        const neoOne = neo.getNodes()[neoIndex];

        const parent = neo.getParentOf(neoOne);

        if (parent) {
            const index = parent.children.indexOf(neoOne);
            const or = new OrFunc(neoOne, two);
            parent.children.splice(index, 1, neoOne, or);
        } else if (neo.isTheRootNode(neoOne)) {
            neo.tree = new OrFunc(neoOne, two);
        } else {
            throw new Error('[addOrToNode] Should not reach here');
        }

        return neo;
    }

    public addStartOperator(ind: Individual): Individual {
        const newInd = ind.clone();
        newInd.origin = {name: 'addStartOperator', args: [ind.toString()]};
        const funcStartOperator = newInd.getFuncs().find((current) => current.type == Func.Types.lineBegin);

        if (!funcStartOperator) {
            newInd.tree.children.unshift(new LineBeginFunc());
        }

        return newInd;
    }

    public addStartOperatorToTerminal(ind: Individual, terminal: Terminal): Individual {
        let index = ind.getNodes().indexOf(terminal);
        const neo = ind.clone();
        neo.origin = {name: 'addStartOperatorToTerminal', args: [terminal.toString()]};
        const neoTerminal = neo.getNodes()[index];
        const parent = neo.getParentOf(neoTerminal);

        if (parent instanceof OrFunc) {
            const side = parent.getSideOf(neoTerminal);
            const localNeoTerminal = parent[side];
            parent[side] = new ConcatFunc([new LineBeginFunc(), localNeoTerminal]);
        } else {
            index = parent.children.indexOf(neoTerminal);
            parent.children.splice(index, 1, new LineBeginFunc(), neoTerminal);
        }

        return neo;
    }

    public addEndOperator(ind: Individual): Individual {
        const newInd = ind.clone();
        newInd.origin = {name: 'addEndOperator', args: []};
        const funcEndOperator = newInd.getFuncs().find((current) => current.type == Func.Types.lineEnd);

        if (!funcEndOperator) {
            newInd.tree.children.push(new LineEndFunc());
        }

        return newInd;
    }

    public addEndOperatorToTerminal(ind: Individual, terminal: Terminal): Individual {
        let index = ind.getNodes().indexOf(terminal);
        const neo = ind.clone();
        neo.origin = {name: 'addEndOperatorToTerminal', args: [terminal.toString()]};
        const neoTerminal = neo.getNodes()[index];
        const parent = neo.getParentOf(neoTerminal);

        if (parent instanceof OrFunc) {
            const side = parent.getSideOf(neoTerminal);
            const localNeoTerminal = parent[side];
            parent[side] = new ConcatFunc([localNeoTerminal, new LineEndFunc()]);
        } else {
            index = parent.children.indexOf(neoTerminal);
            parent.children.splice(index, 1, neoTerminal, new LineEndFunc());
        }

        return neo;
    }

    public addToNegation(ind: Individual, node: Node): Individual {
        const newInd = ind.clone();
        newInd.origin = {name: 'addToNegation', args: [node.toString()]};
        let func = newInd.getFuncs().find((current) => {
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
        const neo = ind.clone();
        neo.origin = {name: 'removeRandomChar', args: []};
        const terminal = Utils.getRandomlyFromList(neo.getTerminals());
        const parent = neo.getParentOf(terminal);
        if (parent) {
            parent.removeChild(terminal);
        }
        return neo;
    }

    public removeRandomNode(ind: Individual): Individual {
        const node = Utils.getRandomlyFromList(ind.getNodes());
        const neo = this.removeNode(ind, node);
        neo.origin = {name: 'removeRandomNode', args: []};
        return neo;
    }

    public removeNode(ind: Individual, node: Node): Individual {
        const neo = ind.clone();
        neo.origin = {name: 'removeNode', args: [node.toString()]};
        const index = ind.getNodes().indexOf(node);
        const nodeToBeRemoved = neo.getNodes()[index];
        const parent = neo.getParentOf(nodeToBeRemoved);

        if (parent) {
            parent.removeChild(nodeToBeRemoved);
        }

        return neo;
    }

    public generateRandomlyFrom(ind: Individual): Individual {
        const node = Utils.nextBoolean()
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


        const neo = this.generateRandomlyFrom(ind).fix();
        neo.origin = { name: 'generateRandom', args: [depth.toString()]};
        return neo;
    }

    public wrapNodeWithGroup(ind: Individual, node: Node): Individual {
        const index = ind.getNodes().indexOf(node);
        const neo = ind.clone();
        neo.origin = {name: 'removeNode', args: [node.toString()]};
        const neoNode = neo.getNodes()[index];

        if (neo.isTheRootNode(neoNode)) {
            neo.tree = new GroupFunc([neoNode]);
        } else {
            const parent = neo.getParentOf(neoNode);
            if (parent === undefined) { throw new Error('No parent. Maybe it is the Root node?'); }
            parent.swapChild(neoNode, new GroupFunc([neoNode]));
        }

        return neo;
    }

    public addBackref(ind: Individual, node: Node, number: number = 1): Individual {
        const func = new BackrefFunc();
        func.number = number;
        const neo = this.concatenateToNode(ind, node, func);
        neo.origin = {name: 'addBackref', args: [node.toString(), number.toString()]};
        return neo;
    }

    public isNodeWrappedBy(ind: Individual, node: Node, type: FuncTypes): boolean {
        const parents = ind.getParentsOf(node);
        return parents.some((parent) => parent.is(type));
    }

    public isNodeWrappedByGroup(node: Node, ind: Individual): boolean {
        return this.isNodeWrappedBy(ind, node, FuncTypes.group);
    }
}
