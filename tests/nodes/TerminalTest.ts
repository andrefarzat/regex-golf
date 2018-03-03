import { Expect, Test, TestCase, TestFixture, IgnoreTest } from "alsatian";

import Terminal from "../../src/nodes/Terminal";


@TestFixture('TerminalTest')
export default class TerminalTest {

    @Test()
    public testShrink() {
        let terminal = new Terminal('abc');
        Expect(terminal.shrink().toString()).toBe(terminal.toString());
    }

}