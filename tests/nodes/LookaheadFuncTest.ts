import { Expect, Test, TestCase, TestFixture } from "alsatian";

import LookaheadFunc from '../../src/nodes/LookaheadFunc';
import Terminal from "../../src/nodes/Terminal";



@TestFixture()
export default class LockaheadFuncTest {


    @Test()
    public testCreateLockaheadFunc() {
        let func = new LookaheadFunc([new Terminal('a'), new Terminal('c')]);
        Expect(func.toString()).toBe('(?=ac)');

        func = new LookaheadFunc([new Terminal('a'), new Terminal('c')], 'negative');
        Expect(func.toString()).toBe('(?!ac)');

        let neo = func.clone();
        Expect(func).toBe(func);
        Expect(func).not.toBe(neo);
        Expect(func.toString()).toBe(neo.toString());
    }



}