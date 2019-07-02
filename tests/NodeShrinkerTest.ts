import { Expect, Test, TestCase, TestFixture, FocusTest } from "alsatian";

import IndividualFactory from '../src/models/IndividualFactory';


@TestFixture('NodeShrinkerTest')
export class NodeShrinkerTest {
    private individualFactory = new IndividualFactory(['a', 'b', 'c'], [ 'x', 'y', 'z']);

    @TestCase('^abc^xyz', '^abcxyz')
    @TestCase('^abc|^xyz', '^abc|^xyz')
    @TestCase('^ab^c|^xyz', '^abc|^xyz')
    @Test('Test Shrink LineBegin')
    public testShrinkLineBegin(txt: string, expectedResult: string) {
        // Let's keep only one lineBegin node
        let tree = this.individualFactory.createFromString(txt);
        Expect(tree.shrink().toString()).toEqual(expectedResult);
    }

    @TestCase('abc$xyz$', 'abcxyz$')
    @TestCase('abc$|xyz$', 'abc$|xyz$')
    @TestCase('ab$c$|x$yz$', 'abc$|xyz$')
    @Test('Test Shrink LineEnd')
    public testShrinkLineEnd(txt: string, expectedResult: string) {
        // Let's keep only one lineEnd node
        let ind = this.individualFactory.createFromString(txt);
        Expect(ind.shrink().toString()).toEqual(expectedResult);
    }

    @TestCase('abc', 'abc')
    @TestCase('aaaaa', 'a{5}')
    @TestCase('aa{5}', 'a{6}')
    @TestCase('[a]a{5}', 'a{6}')
    @TestCase('[abc][abc]{5}', '[abc]{6}')
    @TestCase('[^abc][^abc]{5}', '[^abc]{6}')
    @Test('Test Shrink concatenation')
    public testShrinkConcatenation(txt: string, expectedResult: string) {
        let ind = this.individualFactory.createFromString(txt);
        let shrunk = ind.shrink();

        Expect(shrunk.toString()).toEqual(expectedResult);
    }


    @TestCase('a', 'a')
    @TestCase('bb', 'bb')
    @TestCase('ccc', 'ccc')
    @TestCase('dddd', 'd{4}')
    @TestCase('bcccccccbb', 'bc{7}bb')
    @TestCase('aaaaaa', 'a{6}')
    @TestCase('zza{5}a{5}hh', 'zza{10}hh')
    // @TestCase('abcabc', '(abc){2}') <- this should become '(abc)\1'
    @Test('Test Shrink to repetition')
    public testShrinkRepetitionExamples(txt: string, expectedResult: string) {
        let ind = this.individualFactory.createFromString(txt);
        let shrunk = ind.shrink();

        Expect(shrunk.toString()).toEqual(expectedResult);
    }

    @TestCase('a[a]aa', 'a{4}')
    @TestCase('a[abcabcabc]z', 'a[abc]z')
    @TestCase('a[abcdefghijklmnopqrstuvwxyz]z', 'a[a-z]z')
    @TestCase('p[x-z]', 'p[xyz]')
    @TestCase('abcef[a-b]fecba', 'abcef[ab]fecba')
    @TestCase('a[abc][abc]', 'a[abc]{2}')
    @TestCase('abc[abcd][abcd]', 'abc[a-d]{2}')
    @Test('Test Shrink to list or range')
    public testShrinkListExamples(txt: string, expectedResult: string) {
        let ind = this.individualFactory.createFromString(txt);
        let shrunk = ind.shrink();

        Expect(shrunk.toString()).toEqual(expectedResult);
    }

    @TestCase('z[^abcabc]a', 'z[^abc]a')
    @TestCase('a[^abcdefghijklmnopqrstuvwxyz]z', 'a[^abcdefghijklmnopqrstuvwxyz]z')
    public testShrinkNegation(txt: string, expectedResult: string) {
        let ind = this.individualFactory.createFromString(txt);
        let shrunk = ind.shrink();

        Expect(shrunk.toString()).toEqual(expectedResult);
    }

    // @Test('Test transforming [^] into .')
    // public testEmptyNegative() {
    //     let ind = this.individualFactory.createFromString('ab[^c]');
    //     let func = ind.tree.getLeastFunc();
    //     func.left = new Terminal();
    //     func.right = new Terminal();
    //     Expect(ind.toString()).toBe('ab[^]');

    //     let shrunk = ind.shrink();
    //     Expect(shrunk.toString()).toBe('ab.');
    // }

    // @Test('Test transforming {1,} into +')
    // public testSimpleRepetitionIntoOneAndMore() {
    //     let func = new RepetitionFunc(new Terminal('a'), new Terminal('b'));
    //     func.repetitionNumber = '1,';
    //     Expect(NodeShrinker.shrink(func).toString()).toBe('a+b');
    // }
}