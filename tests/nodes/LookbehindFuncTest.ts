import { Expect, Test, TestCase, TestFixture } from "alsatian";

import { LookbehindFunc } from '../../src/nodes/LookbehindFunc';
import { Terminal } from "../../src/nodes/Terminal";

@TestFixture()
export class LookbehindFuncTest {

    @Test()
    public testCreateLookbehindFunc() {
        let func = new LookbehindFunc([new Terminal('a'), new Terminal('c')]);
        Expect(func.toString()).toBe('(?<=ac)');

        func = new LookbehindFunc([new Terminal('a'), new Terminal('c')], 'negative');
        Expect(func.toString()).toBe('(?<!ac)');

        const neo = func.clone();
        Expect(func).toBe(func);
        Expect(func).not.toBe(neo);
        Expect(func.toString()).toBe(neo.toString());
    }

}
