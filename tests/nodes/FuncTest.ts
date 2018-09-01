import { Expect, Test, TestCase, TestFixture } from "alsatian";

import Func, { FuncTypes } from "../../src/nodes/Func";
import IndividualFactory from "../../src/models/IndividualFactory";
import Terminal from "../../src/nodes/Terminal";
import RepetitionFunc from "../../src/nodes/RepetitionFunc";


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

    @Test('Test .toDot')
    public testToDot() {
        let func = new Func(FuncTypes.concatenation, new Terminal('a'), new Terminal('b'));
        Expect(func.toDot(4)).toBe('n4 [ label = "•" ]; n4 -> n5; n5 [ label = "a" ]; n4 -> n6; n6 [ label = "b" ]');

        let func1 = new Func(FuncTypes.negation, new Func(FuncTypes.concatenation, new Terminal('c'), new Terminal('d')), new Terminal('f'))
        let func2 = new RepetitionFunc(func1, new Terminal('g'));
        func2.repetitionNumber = '2';
        func.right = func2;
        Expect(func.toDot(1)).toBe('n1 [ label = "•" ]; n1 -> n2; n2 [ label = "a" ]; n1 -> n3; n3 [ label = "•{#}" ]; n3 -> n4; n4 [ label = "[^•]" ]; n4 -> n5; n5 [ label = "•" ]; n5 -> n6; n6 [ label = "c" ]; n5 -> n7; n7 [ label = "d" ]; n4 -> n8; n8 [ label = "f" ]; n3 -> n9; n9 [ label = "g" ]');
    }
}