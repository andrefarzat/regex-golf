import { Expect, Test, TestCase, TestFixture, IgnoreTest } from "alsatian";

import IndividualFactory from '../../src/models/IndividualFactory';
import Func from "../../src/nodes/Func";
import Terminal from "../../src/nodes/Terminal";
import Individual from "../../src/models/Individual";


@TestFixture('FuncTest')
export class FuncTest {

    @Test()
    public testShrink() {

        // Func.Types
        // Func.Types.concatenation
        // Func.Types.list
        // Func.Types.negation
        // Func.Types.or


        // let func = new Func();
        // func.shrink();
        // func.sh
    }
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
        let tree = this.individualFactory.createFromString('abc$xyz$');
        Expect(tree.shrink().toString()).toEqual('abcxyz$');

        tree = this.individualFactory.createFromString('abc\\$xyz$');
        Expect(tree.shrink().toString()).toEqual('abc\\$xyz$');
    }

    @Test('Test Shrink concatenation')
    public testShrinkConcatenation() {
        let tree = this.individualFactory.createFromString('abc');
        Expect(tree.shrink().toString()).toEqual('abc');
    }

}