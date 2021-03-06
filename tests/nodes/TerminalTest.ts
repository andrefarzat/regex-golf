import { Expect, Test, TestCase, TestFixture  } from "alsatian";

import { Terminal } from "../../src/nodes/Terminal";

@TestFixture('TerminalTest')
export class TerminalTest {

    @Test('Check if given terminal is escaped')
    @TestCase('^')
    @TestCase('$')
    @TestCase('\\')
    @TestCase('.')
    @TestCase('*')
    @TestCase('+')
    @TestCase('?')
    @TestCase('(')
    @TestCase(')')
    @TestCase('[')
    @TestCase(']')
    @TestCase('{')
    @TestCase('}')
    @TestCase('|')
    public testSpecialChars(char: string) {
        const terminal = new Terminal(char);
        Expect(terminal.toString()).toBe("\\" + char);
    }

    @TestCase('a', 'n5 [ label = "a" ]')
    public testToDot(char: string, expectedResult: string) {
        const terminal = new Terminal(char);
        Expect(terminal.toDot(5)).toBe(expectedResult);
    }

    @Test('Check if given special terminal is represented correctly')
    @TestCase(`\\b`)
    @TestCase(`\\B`)
    @TestCase(`\\w`)
    @TestCase(`\\W`)
    @TestCase(`\\d`)
    @TestCase(`\\D`)
    public testSpecialTerminals(char: string) {
        const terminal = new Terminal(char);
        Expect(terminal.toString()).toBe(char);
    }

}
