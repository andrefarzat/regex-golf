import { Expect, Test, TestCase, TestFixture, IgnoreTest, FocusTest } from "alsatian";

import IndividualFactory from '../src/models/IndividualFactory';
import Func, { FuncTypes } from "../src/nodes/Func";
import Terminal from "../src/nodes/Terminal";
import Individual from "../src/models/Individual";
import { NodeTypes } from "../src/nodes/Node";
import RepetitionFunc from "../src/nodes/RepetitionFunc";
import NodeShrinker from "../src/NodeShrinker";


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


    @TestCase('a', 'a')
    @TestCase('bb', 'bb')
    @TestCase('ccc', 'ccc')
    @TestCase('dddd', 'd{4}')
    @TestCase('bcccccccbb', 'bc{7}bb')
    @TestCase('aaaaaa', 'a{6}')
    @TestCase('zza{5}a{5}hh', 'zza{10}hh')
    // @TestCase('abcabc', '(abc){2}')
    @Test('Test Shrink to repetition')
    public testShrinkRepetitionExamples(txt: string, expectedResult: string) {
        let ind = this.individualFactory.createFromString(txt);
        let shrunk = ind.shrink();

        Expect(shrunk.toString()).toEqual(expectedResult);
    }

    @TestCase('a[a]aa', 'a{4}')
    @TestCase('a[abcabcabc]z', 'a[abc]z')
    @TestCase('a[abcdefghijklmnopqrstuvwxyz]z', 'a[a-z]z')
    @TestCase('p[x-z]', 'p[xyz]')
    @TestCase('abcef[a-b]fecba', 'abcef[ab]fecba')
    @TestCase('a[abc][abc]', 'a[abc]{2}')
    @TestCase('abc[abcd][abcd]', 'abc[a-d]{2}')
    @Test('Test Shrink to list or range')
    public testShrinkListExamples(txt: string, expectedResult: string) {
        let ind = this.individualFactory.createFromString(txt);
        let shrunk = ind.shrink();

        Expect(shrunk.toString()).toEqual(expectedResult);
    }


    @TestCase('z[^abcabc]a', 'z[^abc]a')
    @TestCase('a[^abcdefghijklmnopqrstuvwxyz]z', 'a[^a-z]z')
    public testShrinkNegation(txt: string, expectedResult: string) {
        let ind = this.individualFactory.createFromString(txt);
        let shrunk = ind.shrink();

        Expect(shrunk.toString()).toEqual(expectedResult);
    }

    @Test('Test transforming [^] into .')
    public testEmptyNegative() {
        let ind = this.individualFactory.createFromString('ab[^c]');
        let func = ind.tree.getLeastFunc();
        func.left = new Terminal();
        func.right = new Terminal();
        Expect(ind.toString()).toBe('ab[^]');

        let shrunk = ind.shrink();
        Expect(shrunk.toString()).toBe('ab.');
    }

    @Test('Test transforming {1,} into +')
    public testSimpleRepetitionIntoOneAndMore() {
        let func = new RepetitionFunc(new Terminal('a'), new Terminal('b'));
        func.repetitionNumber = '1,';
        Expect(NodeShrinker.shrink(func).toString()).toBe('a+b');
    }
}