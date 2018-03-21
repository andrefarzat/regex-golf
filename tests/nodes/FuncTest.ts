import { Expect, Test, TestCase, TestFixture, IgnoreTest, FocusTest } from "alsatian";

import IndividualFactory from '../../src/models/IndividualFactory';
import Func from "../../src/nodes/Func";
import Terminal from "../../src/nodes/Terminal";
import Individual from "../../src/models/Individual";
import { NodeTypes } from "../../src/nodes/Node";


@TestFixture('FuncTest')
export class FuncTest {

}

@TestFixture('FuncShrinkTest')
export class FuncShrinkTest {
    private individualFactory = new IndividualFactory(['a', 'b', 'c'], [ 'x', 'y', 'z']);

    @Test('Test Shrink LineBegin')
    public testShrinkLineBegin() {
        // Let's keep only one lineBegin node
        let tree = this.individualFactory.createFromString('^abc^xyz');
        Expect(tree.shrink().toString()).toEqual('^abcxyz');
    }

    @Test('Test Shrink LineEnd')
    public testShrinkLineEnd() {
        // Let's keep only one lineEnd node
        let ind = this.individualFactory.createFromString('abc$xyz$');
        Expect(ind.shrink().toString()).toEqual('abcxyz$');

        ind = this.individualFactory.createFromString('abc\\$xyz$');
        Expect(ind.shrink().toString()).toEqual('abc\\$xyz$');
    }

    @Test('Test Shrink concatenation')
    public testShrinkConcatenation() {
        let ind = this.individualFactory.createFromString('abc');
        let shrunk = ind.shrink();
        Expect(shrunk.toString()).toEqual('abc');
        Expect(shrunk.tree.nodeType).toEqual(NodeTypes.func);
        Expect(shrunk.tree.left.nodeType).toEqual(NodeTypes.terminal);
        Expect(shrunk.tree.right.nodeType).toEqual(NodeTypes.terminal);
        Expect((shrunk.tree.left as Terminal).value).toEqual('');
        Expect((shrunk.tree.right as Terminal).value).toEqual('abc');

        ind = this.individualFactory.createFromString('aaaaa');
        shrunk = ind.shrink();
        Expect(shrunk.toString()).toEqual('a{5}');

        ind = this.individualFactory.createFromString('aa{5}');
        debugger;
        shrunk = ind.shrink();
        Expect(shrunk.toString()).toEqual('a{6}');
    }

}