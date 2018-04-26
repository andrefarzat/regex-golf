import { Expect, Test, TestCase, TestFixture, IgnoreTest, FocusTest } from "alsatian";

import IndividualFactory from '../src/models/IndividualFactory';
import Func from "../src/nodes/Func";
import Terminal from "../src/nodes/Terminal";
import Individual from "../src/models/Individual";
import { NodeTypes } from "../src/nodes/Node";


@TestFixture('NodeShrinkerTest')
export class NodeShrinkerTest {
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
        Expect(shrunk.tree.left.toString()).toEqual('a');

        Expect(shrunk.tree.right.nodeType).toEqual(NodeTypes.func);
        let right = shrunk.tree.right as Func;

        Expect((right.left as Terminal).value).toEqual('b');
        Expect((right.right as Terminal).value).toEqual('c');

        ind = this.individualFactory.createFromString('aaaaa');
        shrunk = ind.shrink();
        Expect(shrunk.toString()).toEqual('a{5}');

        ind = this.individualFactory.createFromString('aa{5}');
        shrunk = ind.shrink();
        Expect(shrunk.toString()).toEqual('a{6}');
    }


    @FocusTest
    @TestCase('a', 'a')
    @TestCase('bb', 'bb')
    @TestCase('ccc', 'ccc')
    @TestCase('dddd', 'd{4}')
    @TestCase('bcccccccbb', 'bc{7}bb')
    @TestCase('aaaaaa', 'a{6}')
    // @TestCase('zza{5}a{5}hh', 'zza{10}hh')
    // @TestCase('[x-z]', '[xz]')
    // @TestCase('abcef[a-b]fecba', 'abcef[ab]fecba')
    @Test('Test Shrink to repetition')
    public testShrinkExamples(txt: string, expectedResult: string) {
        let ind = this.individualFactory.createFromString(txt);
        let shrunk = ind.shrink();

        Expect(shrunk.toString()).toEqual(expectedResult);
    }

    @Test('Test shrink concatenation with repetition')
    public testShrinkConcatenationWithRepetition() {
        let ind = this.individualFactory.createFromString('aabbbb');
        let shrunk = ind.shrink();
        Expect(shrunk.toString()).toEqual('aab{4}');

        Expect(shrunk.tree.left).toEqual('a');
        Expect((shrunk.tree.right as Func).left.toString()).toBe('a');
    }


}