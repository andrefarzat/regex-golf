import { Expect, Test, TestCase, TestFixture, IgnoreTest, FocusTest } from "alsatian";

import Func from "../../src/nodes/Func";
import IndividualFactory from "../../src/models/IndividualFactory";


@TestFixture('FuncTest')
export class FuncTest {
    private individualFactory = new IndividualFactory(['a', 'b', 'c'], [ 'x', 'y', 'z']);

    @TestCase('abc$', 'abc$')
    @TestCase('ab$c', 'abc$')
    @Test('Negation must be always at the end of the string')
    public testNegationAtEnd(txt: string, expectedResult: string) {
        let ind = this.individualFactory.createFromString(txt);
        Expect(ind.toString()).toBe(expectedResult);
    }
}