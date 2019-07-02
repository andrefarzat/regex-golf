import { TestFixture, Test, Expect, TestCase } from "alsatian";
import Utils from "../src/Utils";

@TestFixture('UtilsTest')
export class UtilsTest {

    @Test('testGetUniqueChars')
    @TestCase('aabbcc', 'abc')
    @TestCase('ccbbaa', 'abc')
    @TestCase('asjdlqjwelkasdnsa,mfngkwdfkfnksnks', ',adefgjklmnqsw')
    public testGetUniqueChars(str: string, expectedResult: string[]) {
        Expect(Utils.getUniqueChars(str)).toEqual(expectedResult);
    }


    @Test('testIsSequence')
    @TestCase('abc', true)
    @TestCase('xyz', true)
    @TestCase('123456789', true)
    @TestCase('fghijklmn', true)
    @TestCase('a1bc2', false)
    public testIsSequence(str: string, result: boolean) {
        Expect(Utils.isSequence(str)).toBe(result);
    }
}