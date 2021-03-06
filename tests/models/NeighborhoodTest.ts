import { AsyncTest, Expect, IgnoreTest, Test, TestCase, TestFixture, Timeout } from "alsatian";

import { ILS_Shrink } from "../../src/localsearch/ILS_shrink";
import { Neighborhood } from "../../src/models/Neighborhood";
import { AnyCharFunc } from "../../src/nodes/AnyCharFunc";

// tslint:disable max-line-length

@TestFixture()
export class NeighborhoodTest {

    @Timeout(4000)
    @AsyncTest("Neighborhood evaluation")
    public async testEvaluation() {
        const program = (new ILS_Shrink('warmup')).init();

        const initialInd = program.factory.createFromString('a');
        Expect(initialInd.toString()).toEqual('a');

        const hood = new Neighborhood(initialInd, program);
        hood.maxSimultaneousEvaluations = 1000;

        let qtd = 0;

        for (const ind of hood.getGenerator()) {
            qtd += 1;
            Expect(ind.isValid()).toBeTruthy();
            Expect(ind.isEvaluated).not.toBeTruthy();
        }

        let count = 0;
        await hood.evaluate((ind) => {
            count += 1;
            Expect(ind.evaluationIndex).toBeDefined();
        });

        program.evaluator.close();
        Expect(count).toBe(qtd);
    }

    @Test("Neighborhood generateByRemovingNodes")
    public testRemoving() {
        const program = (new ILS_Shrink('warmup')).init();

        const initialInd = program.factory.createFromString('abc');
        Expect(initialInd.toString()).toEqual('abc');

        const hood = new Neighborhood(initialInd, program);
        hood.maxSimultaneousEvaluations = 1;

        const generator = hood.generateByRemovingNodes(initialInd);
        const options = ['bc', 'ac', 'ab'];

        for (const ind of generator) {
            const index = options.indexOf(ind.toString());
            if (index === -1) {
                Expect.fail(`${ind.toString()} fails`);
            } else {
                options.splice(index, 1);
            }
        }

        Expect(generator.next().done).toBeTruthy();

        if (options.length !== 0) {
            Expect.fail(`Remaining: ${options.join(' ; ')}`);
        }
    }

    @Test("Neighborhood generateBySingleNode")
    public testGenerateBySingleNode() {
        const program = (new ILS_Shrink('warmup')).init();

        const initialInd = program.factory.createFromString('a[b-e][^z]x{5}');
        Expect(initialInd.toString()).toEqual('a[b-e][^z]x{5}');

        const hood = new Neighborhood(initialInd, program);
        hood.maxSimultaneousEvaluations = 1;

        const generator = hood.generateByExtractingSingleNode(initialInd);
        const options = ['a', '[b-e]', '[^z]', 'z', 'x{5}', 'x'];

        for (const ind of generator) {
            const index = options.indexOf(ind.toString());
            if (index === -1) {
                Expect.fail(`${ind.toString()} fails`);
            } else {
                options.splice(index, 1);
            }
        }

        Expect(generator.next().done).toBeTruthy();

        if (options.length !== 0) {
            Expect.fail(`Remaining: ${options.join(' ; ')}`);
        }

    }

    @Test("Neighborhood generateByAddingStartOperator")
    public testGenerateByAddingStartOperator() {
        const program = (new ILS_Shrink('warmup')).init();

        // First test: Must add only ONE start operator
        let initialInd = program.factory.createFromString('abc');
        Expect(initialInd.toString()).toEqual('abc');

        let hood = new Neighborhood(initialInd, program);
        hood.maxSimultaneousEvaluations = 1;

        let generator = hood.generateByAddingStartOperator(initialInd);
        let options = ['^abc'];

        for (const option of options) {
            const ind = generator.next().value;
            Expect(ind.toString()).toEqual(option);
        }
        Expect(generator.next().done).toBeTruthy();

        // Second test. Must add one start operator for each OR operator
        initialInd = program.factory.createFromString('abc|efg');

        hood = new Neighborhood(initialInd, program);
        hood.maxSimultaneousEvaluations = 1;

        generator = hood.generateByAddingStartOperator(initialInd);
        options = ['^abc|efg', 'abc|^efg'];

        for (const option of options) {
            const ind = generator.next().value;
            Expect(ind.toString()).toEqual(option);
        }
        Expect(generator.next().done).toBeTruthy();
    }

    @Test("Neighborhood generateByAddingEndOperator")
    public testGenerateByAddingEndOperator() {
        const program = (new ILS_Shrink('warmup')).init();

        // First test: Must add only ONE end operator
        let initialInd = program.factory.createFromString('abc');
        Expect(initialInd.toString()).toEqual('abc');

        let hood = new Neighborhood(initialInd, program);
        hood.maxSimultaneousEvaluations = 1;

        let generator = hood.generateByAddingEndOperator(initialInd);
        let options = ['abc$'];

        for (const option of options) {
            const ind = generator.next().value;
            Expect(ind.toString()).toEqual(option);
        }
        Expect(generator.next().done).toBeTruthy();

        // Second test. Must add one end operator for each OR operator
        initialInd = program.factory.createFromString('abc|efg');

        hood = new Neighborhood(initialInd, program);
        hood.maxSimultaneousEvaluations = 1;

        generator = hood.generateByAddingEndOperator(initialInd);
        options = ['abc$|efg', 'abc|efg$'];

        for (const option of options) {
            const ind = generator.next().value;
            Expect(ind.toString()).toEqual(option);
        }

        Expect(generator.next().done).toBeTruthy();
    }

    @Test("Neighborhood generateBySwapping")
    public testGenerateBySwapping() {
        const program = (new ILS_Shrink('warmup')).init();

        const initialInd = program.factory.createFromString('abc');
        Expect(initialInd.toString()).toEqual('abc');

        const hood = new Neighborhood(initialInd, program);
        hood.maxSimultaneousEvaluations = 1;

        const generator = hood.generateBySwapping(initialInd);
        const options = [
            "obc", "fbc", "tbc", "ebc", "dbc", "lbc", "sbc", "nbc", "pbc", "hbc", "rbc", "ybc", "gbc", "wbc", "ibc", "cbc", "jbc", "mbc", "ubc", "\\bbc", "\\Bbc", "\\wbc", "\\Wbc", "\\dbc", "\\Dbc",
            "aoc", "afc", "atc", "aac", "aec", "adc", "alc", "asc", "anc", "apc", "ahc", "arc", "ayc", "agc", "awc", "aic", "acc", "ajc", "amc", "auc", "a\\bc", "a\\Bc", "a\\wc", "a\\Wc", "a\\dc", "a\\Dc",
            "abo", "abf", "abt", "aba", "abe", "abd", "abl", "abs", "abn", "abp", "abh", "abr", "aby", "abg", "abw", "abi", "abj", "abm", "abu", "ab\\b", "ab\\B", "ab\\w", "ab\\W", "ab\\d", "ab\\D",
        ];

        for (const option of options) {
            const ind = generator.next().value;
            Expect(ind.toString()).toEqual(option);
        }
        Expect(generator.next().done).toBeTruthy();
    }

    @Test("Neighborhood generateByConcatenating")
    public testGenerateByConcatenating() {
        const program = (new ILS_Shrink('warmup')).init();

        const initialInd = program.factory.createFromString('abc');
        Expect(initialInd.toString()).toEqual('abc');

        const hood = new Neighborhood(initialInd, program);
        hood.maxSimultaneousEvaluations = 1;

        const generator = hood.generateByConcatenating(initialInd);

        let options: string[] = program.validLeftChars.map((l) => `a${l}bc`);
        options = options.concat(program.validLeftChars.map((l) => `ab${l}c`));
        options = options.concat(program.validLeftChars.map((l) => `abc${l}`));

        options = options.concat(hood.specialChars.map((l) => `a${l}bc`));
        options = options.concat(hood.specialChars.map((l) => `ab${l}c`));
        options = options.concat(hood.specialChars.map((l) => `abc${l}`));

        for (const ind of generator) {
            const includes = options.includes(ind.toString());
            Expect(includes).toBeTruthy();
        }
        Expect(generator.next().done).toBeTruthy();
    }

    @Test("Neighborhood getAllRanges")
    public testGetAllRanges() {
        const program = (new ILS_Shrink('warmup')).init();

        const initialInd = program.factory.createFromString('abc');
        Expect(initialInd.toString()).toEqual('abc');

        const hood = new Neighborhood(initialInd, program);
        const ranges = hood.getAllRanges();

        const options = [
            "[abc]", "[a-d]", "[a-e]", "[a-f]", "[a-g]", "[a-h]", "[a-i]", "[a-j]", "[a-l]", "[a-m]", "[a-n]", "[a-o]", "[a-p]", "[a-r]", "[a-s]", "[a-t]", "[a-u]", "[a-w]", "[a-y]",
            "[cd]", "[cde]", "[c-f]", "[c-g]", "[c-h]", "[c-i]", "[c-j]", "[c-l]", "[c-m]", "[c-n]", "[c-o]", "[c-p]", "[c-r]", "[c-s]", "[c-t]", "[c-u]", "[c-w]", "[c-y]",
            "[de]", "[def]", "[d-g]", "[d-h]", "[d-i]", "[d-j]", "[d-l]", "[d-m]", "[d-n]", "[d-o]", "[d-p]", "[d-r]", "[d-s]", "[d-t]", "[d-u]", "[d-w]", "[d-y]",
            "[ef]", "[efg]", "[e-h]", "[e-i]", "[e-j]", "[e-l]", "[e-m]", "[e-n]", "[e-o]", "[e-p]", "[e-r]", "[e-s]", "[e-t]", "[e-u]", "[e-w]", "[e-y]",
            "[fg]", "[fgh]", "[f-i]", "[f-j]", "[f-l]", "[f-m]", "[f-n]", "[f-o]", "[f-p]", "[f-r]", "[f-s]", "[f-t]", "[f-u]", "[f-w]", "[f-y]",
            "[gh]", "[ghi]", "[g-j]", "[g-l]", "[g-m]", "[g-n]", "[g-o]", "[g-p]", "[g-r]", "[g-s]", "[g-t]", "[g-u]", "[g-w]", "[g-y]",
            "[hi]", "[hij]", "[h-l]", "[h-m]", "[h-n]", "[h-o]", "[h-p]", "[h-r]", "[h-s]", "[h-t]", "[h-u]", "[h-w]", "[h-y]",
            "[ij]", "[i-l]", "[i-m]", "[i-n]", "[i-o]", "[i-p]", "[i-r]", "[i-s]", "[i-t]", "[i-u]", "[i-w]", "[i-y]",
            "[jkl]", "[j-m]", "[j-n]", "[j-o]", "[j-p]", "[j-r]", "[j-s]", "[j-t]", "[j-u]", "[j-w]", "[j-y]",
            "[lm]", "[lmn]", "[l-o]", "[l-p]", "[l-r]", "[l-s]", "[l-t]", "[l-u]", "[l-w]", "[l-y]",
            "[mn]", "[mno]", "[m-p]", "[m-r]", "[m-s]", "[m-t]", "[m-u]", "[m-w]", "[m-y]",
            "[no]", "[nop]", "[n-r]", "[n-s]", "[n-t]", "[n-u]", "[n-w]", "[n-y]",
            "[op]", "[o-r]", "[o-s]", "[o-t]", "[o-u]", "[o-w]", "[o-y]",
            "[pqr]", "[p-s]", "[p-t]", "[p-u]", "[p-w]", "[p-y]",
            "[rs]", "[rst]", "[r-u]", "[r-w]", "[r-y]",
            "[st]", "[stu]", "[s-w]", "[s-y]",
            "[tu]", "[t-w]", "[t-y]",
            "[uvw]", "[u-y]",
            "[wxy]",
        ];

        let i = 0;

        for (const range of ranges) {
            const includes = options.includes(range.toString());
            if (!includes) {
                Expect.fail(`${range.toString()} doesnt exist`);
            }

            i ++;
        }

        Expect(i).toEqual(options.length);

    }

    @Test("Neighborhood generateByAddingRangeOperator")
    public testGenerateByAddingRangeOperator() {
        const program = (new ILS_Shrink('warmup')).init();

        const initialInd = program.factory.createFromString('abc');
        Expect(initialInd.toString()).toEqual('abc');

        const hood = new Neighborhood(initialInd, program);
        hood.maxSimultaneousEvaluations = 1;

        const ranges = hood.getAllRanges();
        const generator = hood.generateByAddingRangeOperator(initialInd);

        let options: string[] = [];
        options = options.concat(ranges.map((r) => `${r.toString()}bc`));
        options = options.concat(ranges.map((r) => `a${r.toString()}bc`));
        options = options.concat(ranges.map((r) => `a${r.toString()}`));
        options = options.concat(ranges.map((r) => `a${r.toString()}c`));
        options = options.concat(ranges.map((r) => `ab${r.toString()}c`));
        options = options.concat(ranges.map((r) => `ab${r.toString()}`));
        options = options.concat(ranges.map((r) => `abc${r.toString()}`));

        let i = 0;
        for (const ind of generator) {
            const includes = options.includes(ind.toString());
            if (!includes) {
                Expect.fail(`${ind.toString()} doesnt exist`);
            }

            i ++;
        }
        Expect(generator.next().done).toBeTruthy();
    }

    @Test("Neighborhood generateByAddingNegationOperator")
    public testGenerateByAddingNegationOperator() {
        const program = (new ILS_Shrink('warmup')).init();

        const initialInd = program.factory.createFromString('a[^p]c');
        Expect(initialInd.toString()).toEqual('a[^p]c');

        const hood = new Neighborhood(initialInd, program);
        hood.maxSimultaneousEvaluations = 1;

        const generator = hood.generateByAddingNegationOperator(initialInd);

        const chars = ["k", "b", "z", "A", "S", "O", "M", "I", "x"];

        let options: string[] = [];
        // options = options.concat(chars.map(c => `[^${c}]a[^p]c`));
        options = options.concat(chars.map((c) => `[^${c}][^p]c`));
        options = options.concat(chars.map((c) => `a[^${c}][^p]c`));
        options = options.concat(chars.map((c) => `a[^${c}]c`));
        options = options.concat(chars.map((c) => `a[^p][^${c}]c`));
        options = options.concat(chars.map((c) => `a[^p][^${c}]`));
        options = options.concat(chars.map((c) => `a[^p${c}]c`));
        options = options.concat(chars.map((c) => `a[^p]c[^${c}]`));

        for (const ind of generator) {
            const includes = options.includes(ind.toString());
            if (!includes) {
                Expect.fail(`${ind.toString()} doesnt exist on list`);
            } else {
                this.removeFromArray(options, ind.toString());
            }
        }

        Expect(generator.next().done).toBeTruthy();
        Expect(options).toEqual([]);
    }

    @Test("Neighborhood generateByAddingGivenOperator")
    public testGenerateByAddingGivenOperator() {
        const program = (new ILS_Shrink('warmup')).init();

        const initialInd = program.factory.createFromString('a[^b]c');
        Expect(initialInd.toString()).toEqual('a[^b]c');

        const hood = new Neighborhood(initialInd, program);
        hood.maxSimultaneousEvaluations = 1;

        const generator = hood.generateByAddingGivenOperator(initialInd, AnyCharFunc);

        const options: string[] = [
            ".[^b]c", "a.[^b]c", "a[^b]c.", "a[^.]c", "a[^b.]c", "a[^b].c", "a.c", "a[^b].",
        ];

        let i = 0;
        for (const ind of generator) {
            const includes = options.includes(ind.toString());
            if (!includes) {
                Expect.fail(`expect ${ind.toString()} to equal ${options[i]}`);
            } else {
                this.removeFromArray(options, ind.toString());
            }

            i ++;
        }

        Expect(generator.next().done).toBeTruthy();
        Expect(options).toEqual([]);
    }

    @IgnoreTest()
    @Test("Neighborhood generateByAddingBackrefOperator")
    public testGenerateByAddingBackrefOperator() {
        const program = (new ILS_Shrink('warmup')).init();

        const initialInd = program.factory.createFromString('abc');
        Expect(initialInd.toString()).toEqual('abc');

        const hood = new Neighborhood(initialInd, program);
        hood.maxSimultaneousEvaluations = 1;

        const generator = hood.generateByAddingBackrefOperator(initialInd);
        const options: string[] = [
            "(a)\\1bc",
            "(a)b\\1c",
            "(a)bc\\1",

            "a(b)\\1c",
            "a(b)c\\1",

            "ab(c)\\1",

            // "(ab)\\1c",
            // "(ab)c\\1",

            "a(bc)\\1",

            "(abc)\\1",

            // Second level
            // "(a)\\1(b)\\2c",
            // "(a)(b)\\1\\2c",
            // "(a)(b)\\1c\\2",
            // "(a)(b)c\\1\\2",
        ];

        for (const ind of generator) {
            const index = options.indexOf(ind.toString());
            if (index === -1) {
                Expect.fail(`${ind.toString()} fails`);
            } else {
                options.splice(index, 1);
            }
        }

        Expect(generator.next().done).toBeTruthy();

        if (options.length !== 0) {
            Expect.fail(`Remaining: ${options.join(' ; ')}`);
        }
    }

    @TestCase("abc", 1, false)
    @TestCase(`(a)\\1bc`, 1, true)
    @TestCase(`\\1(a)bc`, 1, false)
    @TestCase(`(ab)c\\1`, 1, true)
    @TestCase(`ab\\1(c)`, 1, false)
    @TestCase(`(a)(b)\\1c\\2`, 2, true)
    @TestCase(`(a)\\2(b)\\1c`, 2, false)
    public testIsValidBackref(regex: string, i: number, expectedResult: boolean) {
        const program = (new ILS_Shrink('warmup')).init();

        const initialInd = program.factory.createFromString('abc');
        Expect(initialInd.toString()).toEqual('abc');

        const hood = new Neighborhood(initialInd, program);
        hood.maxSimultaneousEvaluations = 1;

        Expect(hood.isValidBackref(regex, i)).toBe(expectedResult);
    }

    @IgnoreTest()
    @Test()
    public testGenerateLookahead() {
        const program = (new ILS_Shrink('warmup')).init();

        const initialInd = program.factory.createFromString('abc');
        Expect(initialInd.toString()).toEqual('abc');

        const hood = new Neighborhood(initialInd, program);
        hood.maxSimultaneousEvaluations = 1;

        const generator = hood.generateByAddingLookahead(initialInd);
        let options: string[] = program.leftCharsNotInRight.map((c) => `a(?=${c})bc`);
        options = options.concat(program.leftCharsNotInRight.map((c) => `ab(?=${c})c`));
        options = options.concat(program.leftCharsNotInRight.map((c) => `abc(?=${c})`));
        options = options.concat(program.rightCharsNotInLeft.map((c) => `a(?!${c})bc`));
        options = options.concat(program.rightCharsNotInLeft.map((c) => `ab(?!${c})c`));
        options = options.concat(program.rightCharsNotInLeft.map((c) => `abc(?!${c})`));

        for (const ind of generator) {
            const index = options.indexOf(ind.toString());
            if (index === -1) {
                Expect.fail(`${ind.toString()} fails`);
            } else {
                options.splice(index, 1);
            }
        }

        Expect(generator.next().done).toBeTruthy();

        if (options.length !== 0) {
            Expect.fail(`Remaining: ${options.join(' ; ')}`);
        }
    }

    @IgnoreTest()
    @Test()
    public testGenerateLookbehind() {
        const program = (new ILS_Shrink('warmup')).init();

        const initialInd = program.factory.createFromString('abc');
        Expect(initialInd.toString()).toEqual('abc');

        const hood = new Neighborhood(initialInd, program);
        hood.maxSimultaneousEvaluations = 1;

        const generator = hood.generateByAddingLookbehind(initialInd);
        let options: string[] = program.leftCharsNotInRight.map((c) => `a(?<=${c})bc`);
        options = options.concat(program.leftCharsNotInRight.map((c) => `ab(?<=${c})c`));
        options = options.concat(program.leftCharsNotInRight.map((c) => `abc(?<=${c})`));
        options = options.concat(program.rightCharsNotInLeft.map((c) => `a(?<!${c})bc`));
        options = options.concat(program.rightCharsNotInLeft.map((c) => `ab(?<!${c})c`));
        options = options.concat(program.rightCharsNotInLeft.map((c) => `abc(?<!${c})`));

        for (const ind of generator) {
            const index = options.indexOf(ind.toString());
            if (index === -1) {
                Expect.fail(`${ind.toString()} fails`);
            } else {
                options.splice(index, 1);
            }
        }

        Expect(generator.next().done).toBeTruthy();

        if (options.length !== 0) {
            Expect.fail(`Remaining: ${options.join(' ; ')}`);
        }
    }

    private removeFromArray(arr: any[], item: any) {
        const index = arr.indexOf(item);
        if (index !== -1) {
            arr.splice(index, 1);
        }
    }
}
