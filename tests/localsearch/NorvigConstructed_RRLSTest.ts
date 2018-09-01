import { Expect, Test, TestCase } from "alsatian";

import NorvigConstructed_RRLS from "../../src/localsearch/NorvigConstructed_RRLS";



export default class NorvigConstructed_RRLSTest {

    @TestCase('abba', '.u|.hi|te|z|gy|t$|rs|rit')
    @TestCase('alphabetical', 'es.n|r. r|e e| ae|a t|ne s|^rer|r es|^.nt|r sn')
    @TestCase('aman-aplan', '^r|oo|d$|^..v|r..$|x|la|eb|ak|ten')
    @TestCase('anchors', 'k$')
    @TestCase('backrefs', 'l$|e.a|e.t|r.u|o.h|u.t|oa|yh|ry|l.g')
    @TestCase('balance', '^.>$|^<><>$|^<<>>$|^<<<><<><>>>>$|^<<<><>><<<>>>>$|^<<<<<>>>><>><<>>$|^<<<<<>>><>><<<>>>><<>>$|^<<<<>>><<<<>><>><<<>>>>>$|^<<<<>>><<<><<>>><><<>>>><<>>$|^<<<>>><<><<<<>>>><<><<<>>>>>$|^<<<<<>>>><<<><>>>><<<<<>><>>>>$|^<<<<><<>>><<<>>>>><<<<<>><>>><<>>>$|^<<<<<>>><<>><<>>><<>>><<<<><<>>>><<<<>>>>>$|^<<<>><<<><<>>><<<>><>>>><><<<<><<>>>>><<<>>>$|^<<<>><><<<><>>>><<<<>><<>><<<>>>><<<<>>><<>><>>>$|^<<<><<<>>>><<<<>>><>>><<<>>><<<<>>><<<>><<<>><>>>>$|^<<<<>>>><<<><<>>>><><<<<>>>><<<><<<>><<>>>><<<<>>>>>$|^<<>><<<<<>>>>><<<<<>><<>>><<><<>>>><>><<><<<<<<>>>>>>>$|^<<<<<>>><<<>><>>><<<>>>><><<<><<<>><>>><>><<><<><<><>>><>>$|^<<><<<<>><>>>><<<><<<>>><<>>><<<>><<><<>>>><<<>><<<>><<>>>>>$|^<<<<<>><<>>><<>>><<><>><<>>><<<<<>>>>><<<><>><<<<>><>>>><<><>>$|^<<<<<>>>><><<<<>>>>><<<<>><<>>><<<>><>><<<<>><<>>><<>><<<>><>>>><>$|^<<>><<<<>><<<>>><<<>>>><>><<<<<>><>><<><>>><<>><<><><<<>><<>>>>><<<<<>>>>>$|^<<<<>>><<><<<>><>>><<><<><<>>><<>>>><<<><<<>>><<><<>>>><<<<>>><>><<<<>><<>>><><<>>>>$|^<<<<<>><>>>><<<>><<<<>>>>><<<<<>><>>><<<><<>>>><<<<>>>><<<<>>><<>>>><<<<<>><>><<<>><>>>>$|^<<<<>><<<>>>><<><<>>>><<<<>><>><<><<>><<><<>>>>><<<<<>>><<<>>>><<<<>><<>>><<<>>><<<>>>><<>>>$|^<<<<<>><>><>><<<<>>><<>><<>>>><<<<<>><<>>>><<<><<>>><<<>>>>><<<<<>><<>>><<<>><<>>>><<<<>>><>>><<<<>>>>$|^<<<<<>>>><<<<>>>><<<>>><<<<>>><<>>>><<<<><<>>><><<><<>>>><<><>>><<<<<>><<>>>><<<><<>>>><<<>><<<>><>>>>$|^<<<<<>><>><<><<>>>><>><<<<<>><<>>><<><<>>>><<<>>><<<><<>>><<<>>>><<<<>><<>>>>><<<<>>><<><<>><>><<<<>>><<<>>>>>$|^<<<<<>>>><><<<>><><<<>><<>>>>><<><<>><><<<<>><<>>><<<>><>>>><><<<><<<>>>><<><<>><<<>>>><><<<>>>><<<><<>>><<<>>><<<><<>>>><>>$|^<<<<<>>><<><>>><<<>>><<<<>>><>><<<<>><<>>><><<>>>><<<><<>>><<<<>>><<<>>>>><<<<>>><<<<>>><<>><<<>>>><<>>><<<><<<>>>><<><<><>>><<<<>><<>>><<<>>>><<><<>>>>$')
    @TestCase('four', 'o.o|ara|vi|es|el..')
    @TestCase('glob', 'y.|^p|de|fa|i.o|r.a| b|rr|ro')
    @TestCase('it-never-ends', 'u$')
    @TestCase('long-count', '^0000 0001 0010 0011 0100 0101 0110 0111 1000 1001 1010 1011 1100 1101 1110 1111$')
    @TestCase('movies', 't.. |A|L|E')
    @TestCase('names', 'e.$|a.$|a.o')
    @TestCase('order', 'lo|^c|fi|os|de|cc|ps')
    @TestCase('powers', "^x$|^x.$|^xxxx$|^xxxxxxxx$|^xxxxxxxxxxxxxxxx$|^xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx$|^xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx$|^xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx$|^xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx$|^xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx$|^xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx$")
    // @TestCase('powers-2', '')
    // @TestCase('prime', '')
    @TestCase('ranges', 'de|a..$|.b|ad|ff|ee')
    // @TestCase('regex-of-regex', '')
    // @TestCase('substraction', '')
    @TestCase('triples', '4.2|.17|1.4|06|55|009|00$|602|0.2|003|015')
    @TestCase('warmup', 'f.o')
    @TestCase('words', '^r|oo|d$|^..v|r..$|x|la|eb|ak|ten')
    public testGenerateInitialIndividual(instanceName: string, expectedResult: string) {
        let rrls = new NorvigConstructed_RRLS(instanceName);
        rrls.init();

        let result = rrls.generateInitialIndividual();
        Expect(result.toString()).toEqual(expectedResult);
    }

    @Test("subparts")
    public testSubparts() {
        let rrls = new NorvigConstructed_RRLS('warmup');

        let expectedResult = new Set(['a', 'an', 'and', 'andr', 'd',  'dr', 'dre', 'e', 'n', 'nd', 'ndr', 'ndre', 'r', 're']);
        let result = rrls.subparts('andre');
        Expect(Array.from(result)).toEqual(Array.from(expectedResult));
    }

    @Test("dotify")
    public testDotify() {
        let rrls = new NorvigConstructed_RRLS('warmup');

        let expectedResult = new Set(['...', '..d', '.n.', '.nd', 'a..', 'a.d', 'an.', 'and']);
        let result = rrls.dotify('and');
        Expect(Array.from(result)).toEqual(Array.from(expectedResult));
    }

    @Test("product")
    public testProduct() {
        let rrls = new NorvigConstructed_RRLS('warmup');

        let expectedResult = [
            ['f', 'a', '1'],
            ['f', 'a', '2'],
            ['f', 'a', '3'],
            ['f', 'b', '1'],
            ['f', 'b', '2'],
            ['f', 'b', '3'],
            ['f', 'c', '1'],
            ['f', 'c', '2'],
            ['f', 'c', '3'],
            ['o', 'a', '1'],
            ['o', 'a', '2'],
            ['o', 'a', '3'],
            ['o', 'b', '1'],
            ['o', 'b', '2'],
            ['o', 'b', '3'],
            ['o', 'c', '1'],
            ['o', 'c', '2'],
            ['o', 'c', '3'],
            ['o', 'a', '1'],
            ['o', 'a', '2'],
            ['o', 'a', '3'],
            ['o', 'b', '1'],
            ['o', 'b', '2'],
            ['o', 'b', '3'],
            ['o', 'c', '1'],
            ['o', 'c', '2'],
            ['o', 'c', '3']
        ];
        let result = rrls.product(['f', 'o', 'o'], ['a', 'b', 'c'], ['1', '2', '3']);
        Expect(result).toEqual(expectedResult);
    }
}