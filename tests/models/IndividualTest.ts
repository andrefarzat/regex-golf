import { Expect, Test, TestCase, TestFixture } from "alsatian";

import Individual from "../../src/models/Individual";


@TestFixture("Individual Test")
export default class IndividualTest {

    @Test('Test Shrinkness')
    public testShrinkness() {




        Expect(1).toBe(1);
    }
}