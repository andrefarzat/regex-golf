import { Expect, Test, TestCase, TestFixture, IgnoreTest } from "alsatian";

import IndividualFactory from '../../src/models/IndividualFactory';
import Func from "../../src/nodes/Func";
import Terminal from "../../src/nodes/Terminal";


@TestFixture('FuncTest')
export class FuncTest {

    @Test()
    public testShrink() {

        // Func.Types
        // Func.Types.concatenation
        // Func.Types.lineBegin
        // Func.Types.lineEnd
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
        let tree = this.individualFactory.createFromString('^abc^xyz');
        Expect(tree.shrink().toString()).toEqual('^abcxyz');
    }

}