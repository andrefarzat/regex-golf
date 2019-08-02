import { Expect, Test, TestCase, TestFixture } from "alsatian";

import { ILS_Shrink } from '../../src/localsearch/ILS_shrink';

@TestFixture("IndividualTest")
export class IndividualTest {

    @Test('ComplexEvaluations Cases')
    @TestCase('abc*', false)
    @TestCase('ab*c*', true)
    @TestCase('ab*c|abc*', false)
    @TestCase('ab*c|ab+c*', true)
    @TestCase('(ab)*\\1', true)
    @TestCase('(ab)*|\\1', false)
    @TestCase('(ab)*|a+\\1', true)
    @TestCase('>>>(.*)*<<>>\\1', true)
    public testComplexEvaluations(txt: string, isComplex: boolean) {
        const program = new ILS_Shrink('warmup');
        program.init();

        const ind = program.factory.createFromString(txt);
        Expect(ind.hasComplexEvaluation()).toBe(isComplex);
    }
}