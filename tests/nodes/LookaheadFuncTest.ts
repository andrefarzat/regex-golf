import { Expect, Test, TestCase, TestFixture } from "alsatian";

import LookaheadFunc from '../../src/nodes/LookaheadFunc';



@TestFixture()
export default class LockaheadFuncTest {


    @Test()
    public testCreateLockaheadFunc() {
        let func = new LookaheadFunc('ac');
        Expect(func.toString()).toBe('(?=ac)');

        func = new LookaheadFunc('ac', true);
        Expect(func.toString()).toBe('(?!ac)');

        let neo = func.clone();
        Expect(func).toBe(func);
        Expect(func).not.toBe(neo);
        Expect(func.toString()).toBe(neo.toString());
    }



}