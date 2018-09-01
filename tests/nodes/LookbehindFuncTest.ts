import { Expect, Test, TestCase, TestFixture } from "alsatian";

import LookbehindFunc from '../../src/nodes/LookbehindFunc';



@TestFixture()
export default class LookbehindFuncTest {

    @Test()
    public testCreateLookbehindFunc() {
        let func = new LookbehindFunc('ac');
        Expect(func.toString()).toBe('(?<=ac)');

        func = new LookbehindFunc('ac', true);
        Expect(func.toString()).toBe('(?<!ac)');

        let neo = func.clone();
        Expect(func).toBe(func);
        Expect(func).not.toBe(neo);
        Expect(func.toString()).toBe(neo.toString());
    }

}