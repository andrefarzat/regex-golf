import { Expect, Test, TestCase, TestFixture, IgnoreTest } from "alsatian";

import Individual from "../../src/models/Individual";


@TestFixture("Individual Test")
export default class IndividualTest {

    @IgnoreTest()
    @Test('Test Shrinkness')
    public testShrinkness() {
        Expect(1).toBe(1);
    }
}