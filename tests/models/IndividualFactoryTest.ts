import { Expect, Test, TestCase, TestFixture, FocusTest } from "alsatian";

import IndividualFactory from "../../src/models/IndividualFactory";
import { NodeTypes } from "../../src/nodes/Node";
import Func, { FuncTypes } from "../../src/nodes/Func";
import Terminal from "../../src/nodes/Terminal";
import RepetitionFunc from "../../src/nodes/RepetitionFunc";
import LookaheadFunc from "../../src/nodes/LookaheadFunc";
import LookbehindFunc from "../../src/nodes/LookbehindFunc";


@TestFixture("IndividualFactory Test")
export default class IndividualFactoryTest {
    private factory = new IndividualFactory(['a', 'b', 'c'], [ 'x', 'y', 'z']);

    @Test('Test createFromString')
    public createFromString() {
        let ind = this.factory.createFromString('abc')
        Expect(ind.toString()).toEqual('abc');
        Expect(ind.tree.nodeType).toEqual(NodeTypes.func);
        Expect(ind.tree.left.nodeType).toEqual(NodeTypes.terminal);
        Expect(ind.tree.left.toString()).toEqual('a');

        Expect(ind.tree.right.nodeType).toEqual(NodeTypes.func);
        let right = ind.tree.right as Func;

        Expect((right.left as Terminal).value).toEqual('b');
        Expect((right.right as Terminal).value).toEqual('c');
    }

    @Test('Test creating from string')
    public testCreateFromString() {
        let ind = this.factory.createFromString('^abc$');
        Expect(ind.tree.toString()).toEqual('^abc$');

        let right = ind.tree.right as Func;
        Expect(right.nodeType).toEqual(NodeTypes.func);
        Expect(right.type).toEqual(Func.Types.lineBegin);

        let least = ind.tree.getLeastFunc();
        Expect(least.nodeType).toEqual(NodeTypes.func);
        Expect(least.type).toEqual(Func.Types.lineEnd);
    }

    @Test('Test creating with repetition')
    public testCreateWithRepetition() {
        let ind = this.factory.createFromString('bba{5}');
        Expect(ind.tree.toString()).toEqual('bba{5}');

        let left = ind.tree.left as Terminal;
        Expect(left.is(NodeTypes.terminal)).toBeTruthy();
        Expect(left.value).toEqual('b');

        let right = ind.tree.right as RepetitionFunc;
        Expect(right.is(FuncTypes.concatenation)).toBeTruthy();
        Expect(right.left.is(NodeTypes.terminal)).toBeTruthy();
        Expect(right.right.is(FuncTypes.repetition)).toBeTruthy();

        right = right.right as RepetitionFunc;
        Expect(right.nodeType).toEqual(NodeTypes.func);
        Expect(right.type).toEqual(Func.Types.repetition);
        Expect(right.repetitionNumber).toBe('5');
        Expect(right.toString()).toEqual('a{5}');
    }

    @Test('Test creating with list and range')
    public testCreatingWithRange() {
        let ind = this.factory.createFromString('a[abcdef]z');
        Expect(ind.tree.toString()).toEqual('a[abcdef]z');

        ind = this.factory.createFromString('a[a-f]z');
        Expect(ind.tree.toString()).toEqual('a[a-f]z');
    }

    @Test('Test creating with + and *')
    public testCreatingWithRepetition() {
        let ind = this.factory.createFromString('a+');
        Expect(ind.tree.toString()).toEqual('a+');

        ind = this.factory.createFromString('a*');
        Expect(ind.tree.toString()).toEqual('a*');
    }

    @Test('Test creating with negation')
    public testCreatingWithNegation() {
        let ind = this.factory.createFromString('a[^abcdef]z');
        Expect(ind.tree.toString()).toEqual('a[^abcdef]z');
    }

    @Test()
    public testConcatenateTwoNegativeOperators() {
        let ind = this.factory.createFromString('a[^b]');
        let one = new Func(Func.Types.negation, new Terminal('a'), new Terminal(''));
        let two = new Func(Func.Types.negation, new Terminal('z'), new Terminal(''));

        let neo = this.factory.concatenateTwoNegativeOperators(ind, ind.tree.right as Func, two);
        Expect(neo.toString()).toEqual('a[^bz]');
    }

    @Test()
    public testLookahead() {
        let ind = this.factory.createFromString('ab(?=cd)');
        Expect(ind.tree.toString()).toEqual('ab(?=cd)');

        Expect(ind.tree.asFunc().is(FuncTypes.concatenation)).toBeTruthy();
        Expect(ind.tree.asFunc().left.toString()).toBe('a');

        let right = ind.tree.asFunc().right.asFunc();
        Expect(right.is(FuncTypes.concatenation)).toBeTruthy();
        Expect(right.left.toString()).toBe('b');
        Expect(right.right.is(FuncTypes.lookahead)).toBeTruthy();
        Expect(right.right.toString()).toBe('(?=cd)');

        // Negative
        ind = this.factory.createFromString('ab(?!cd)');
        Expect(ind.tree.toString()).toEqual('ab(?!cd)');

        Expect(ind.tree.asFunc().is(FuncTypes.concatenation)).toBeTruthy();
        Expect(ind.tree.asFunc().left.toString()).toBe('a');

        right = ind.tree.asFunc().right.asFunc();
        Expect(right.is(FuncTypes.concatenation)).toBeTruthy();
        Expect(right.left.toString()).toBe('b');

        let lookahead = right.right as LookaheadFunc;
        Expect(lookahead.is(FuncTypes.lookahead)).toBeTruthy();
        Expect(lookahead.content).toBe('cd');
        Expect(lookahead.negative).toBeTruthy();
        Expect(lookahead.toString()).toBe('(?!cd)');
    }

    @Test()
    public testLookbehind() {
        let ind = this.factory.createFromString('ab(?<=cd)');
        Expect(ind.tree.toString()).toEqual('ab(?<=cd)');

        Expect(ind.tree.asFunc().is(FuncTypes.concatenation)).toBeTruthy();
        Expect(ind.tree.asFunc().left.toString()).toBe('a');

        let right = ind.tree.asFunc().right.asFunc();
        Expect(right.is(FuncTypes.concatenation)).toBeTruthy();
        Expect(right.left.toString()).toBe('b');
        Expect(right.right.is(FuncTypes.lookbehind)).toBeTruthy();
        Expect(right.right.toString()).toBe('(?<=cd)');

        // Negative
        ind = this.factory.createFromString('ab(?<!cd)');
        Expect(ind.tree.toString()).toEqual('ab(?<!cd)');

        Expect(ind.tree.asFunc().is(FuncTypes.concatenation)).toBeTruthy();
        Expect(ind.tree.asFunc().left.toString()).toBe('a');

        right = ind.tree.asFunc().right.asFunc();
        Expect(right.is(FuncTypes.concatenation)).toBeTruthy();
        Expect(right.left.toString()).toBe('b');

        let lookbehind = right.right as LookbehindFunc;
        Expect(lookbehind.is(FuncTypes.lookbehind)).toBeTruthy();
        Expect(lookbehind.content).toBe('cd');
        Expect(lookbehind.negative).toBeTruthy();
        Expect(lookbehind.toString()).toBe('(?<!cd)');

    }
}