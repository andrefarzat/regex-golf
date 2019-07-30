import { Expect, FocusTest, IgnoreTest, Test, TestCase, TestFixture } from "alsatian";

import { IndividualFactory } from "../../src/models/IndividualFactory";
import { Func, FuncTypes } from "../../src/nodes/Func";
import { RepetitionFunc } from "../../src/nodes/RepetitionFunc";
import { Terminal } from "../../src/nodes/Terminal";

@TestFixture('FuncTest')
export class FuncTest {
    private individualFactory = new IndividualFactory(['a', 'b', 'c'], [ 'x', 'y', 'z']);

    @IgnoreTest()
    @TestCase('^abc', '^abc')
    @TestCase('a^bc', '^abc')
    @TestCase('abc$', 'abc$')
    @TestCase('ab$c', 'abc$')
    @Test('Operators positions')
    public testNegationAtEnd(txt: string, expectedResult: string) {
        const ind = this.individualFactory.createFromString(txt);
        Expect(ind.toString()).toBe(expectedResult);
    }

    @TestCase('[^h-u]*', '[^h-u]*')
    @Test('Negative list')
    public testNegativeList(txt: string, expectedResult: string) {
        const ind = this.individualFactory.createFromString(txt);
        Expect(ind.toString()).toBe(expectedResult);
    }
}
