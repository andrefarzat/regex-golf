import { Expect, Test, TestCase, TestFixture, FocusTest } from "alsatian";

import IndividualFactory from "../../src/models/IndividualFactory";
import { NodeTypes } from "../../src/nodes/Node";
import Func, { FuncTypes } from "../../src/nodes/Func";
import Terminal from "../../src/nodes/Terminal";


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

        let right = ind.tree.right as Func;
        Expect(right.is(FuncTypes.concatenation)).toBeTruthy();
        Expect(right.left.is(NodeTypes.terminal)).toBeTruthy();
        Expect(right.right.is(FuncTypes.repetition)).toBeTruthy();

        right = right.right as Func;
        Expect(right.nodeType).toEqual(NodeTypes.func);
        Expect(right.type).toEqual(Func.Types.repetition);
        Expect(right.repetitionNumber).toBe('5');
        Expect(right.toString()).toEqual('a{5}');
    }

    @Test('Test creating with range')
    public testCreatingWithRange() {
        let ind = this.factory.createFromString('a[abcdef]z');
        Expect(ind.tree.toString()).toEqual('a[abcdef]z');
    }
}