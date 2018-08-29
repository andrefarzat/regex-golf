import { Expect, Test, AsyncTest, Timeout, TestCase, TestFixture, FocusTest, IgnoreTest, Teardown } from "alsatian";


import Neighborhood from "../../src/models/Neighborhood";
import ILS_Shrink from "../../src/localsearch/ILS_shrink";
import Individual from "../../src/models/Individual";
import { FOCUS } from "alsatian/core/decorators/_metadata-keys";


@TestFixture()
export default class NeighborhoodTest {

    @Timeout(2000)
    @AsyncTest("Neighborhood evaluation")
    @IgnoreTest('Lets finish the neighborhood test first')
    public async testEvaluation() {
        let program = new ILS_Shrink('family');
        program.init();

        let initialInd = program.factory.createFromString('a');
        Expect(initialInd.toString()).toEqual('a');

        let hood = new Neighborhood(initialInd, program);
        hood.maxSimultaneousEvaluations = 1000;

        let count = 0;
        let lastInd: Individual;

        await hood.evaluate(ind => {
            count++;
            Expect(ind.evaluationIndex).toBeDefined();
            lastInd = ind;
        });

        program.evaluator.close();
        Expect(lastInd.evaluationIndex).toBe(476);
        Expect(count).toBe(477);
    }

    @Test("Neighborhood generateByRemovingNodes")
    public testRemoving() {
        let program = (new ILS_Shrink('warmup')).init();

        let initialInd = program.factory.createFromString('abc');
        Expect(initialInd.toString()).toEqual('abc');

        let hood = new Neighborhood(initialInd, program);
        hood.maxSimultaneousEvaluations = 1;

        let generator = hood.generateByRemovingNodes(initialInd);
        const options = ['bc', 'a', 'ac', 'ab'];

        for (let option of options) {
            let ind = generator.next().value;
            Expect(ind.toString()).toEqual(option);
        }
        Expect(generator.next().done).toBeTruthy();
    }

    @Test("Neighborhood generateByAddingStartOperator")
    public testGenerateByAddingStartOperator() {
        let program = (new ILS_Shrink('warmup')).init();

        // First test: Must add only ONE start operator
        let initialInd = program.factory.createFromString('abc');
        Expect(initialInd.toString()).toEqual('abc');

        let hood = new Neighborhood(initialInd, program);
        hood.maxSimultaneousEvaluations = 1;

        let generator = hood.generateByAddingStartOperator(initialInd);
        let options = ['^abc'];

        for (let option of options) {
            let ind = generator.next().value;
            Expect(ind.toString()).toEqual(option);
        }
        Expect(generator.next().done).toBeTruthy();

        // Second test. Must add one start operator for each OR operator
        initialInd = program.factory.createFromString('abc|efg');

        hood = new Neighborhood(initialInd, program);
        hood.maxSimultaneousEvaluations = 1;

        generator = hood.generateByAddingStartOperator(initialInd);
        options = ['^abc|efg', 'abc|^efg'];

        for (let option of options) {
            let ind = generator.next().value;
            Expect(ind.toString()).toEqual(option);
        }
        Expect(generator.next().done).toBeTruthy();
    }

    @Test("Neighborhood generateByAddingEndOperator")
    public testGenerateByAddingEndOperator() {
        let program = (new ILS_Shrink('warmup')).init();

        // First test: Must add only ONE start operator
        let initialInd = program.factory.createFromString('abc');
        Expect(initialInd.toString()).toEqual('abc');

        let hood = new Neighborhood(initialInd, program);
        hood.maxSimultaneousEvaluations = 1;

        let generator = hood.generateByAddingEndOperator(initialInd);
        let options = ['abc$'];

        for (let option of options) {
            let ind = generator.next().value;
            Expect(ind.toString()).toEqual(option);
        }
        Expect(generator.next().done).toBeTruthy();

        // Second test. Must add one start operator for each OR operator
        initialInd = program.factory.createFromString('abc|efg');

        hood = new Neighborhood(initialInd, program);
        hood.maxSimultaneousEvaluations = 1;

        generator = hood.generateByAddingEndOperator(initialInd);
        options = ['abc$|efg', 'abc|efg$'];

        for (let option of options) {
            let ind = generator.next().value;
            Expect(ind.toString()).toEqual(option);
        }
        Expect(generator.next().done).toBeTruthy();
    }

    @FocusTest
    @Test("Neighborhood generateBySwapping")
    public testGenerateBySwapping() {
        let program = (new ILS_Shrink('warmup')).init();

        let initialInd = program.factory.createFromString('abc');
        Expect(initialInd.toString()).toEqual('abc');

        let hood = new Neighborhood(initialInd, program);
        hood.maxSimultaneousEvaluations = 1;

        let generator = hood.generateBySwapping(initialInd);
        let options = [
            "obc", "fbc", "tbc", "ebc", "dbc", "lbc", "sbc", "nbc", "pbc", "hbc", "rbc", "ybc", "gbc", "wbc", "ibc", "cbc", "jbc", "mbc", "ubc", "\\bbc", "\\Bbc", "\\wbc", "\\Wbc", "\\dbc", "\\Dbc",
            "aoc", "afc", "atc", "aac", "aec", "adc", "alc", "asc", "anc", "apc", "ahc", "arc", "ayc", "agc", "awc", "aic", "acc", "ajc", "amc", "auc", "a\\bc", "a\\Bc", "a\\wc", "a\\Wc", "a\\dc", "a\\Dc",
            "abo", "abf", "abt", "aba", "abe", "abd", "abl", "abs", "abn", "abp", "abh", "abr", "aby", "abg", "abw", "abi", "abj", "abm", "abu", "ab\\b", "ab\\B", "ab\\w", "ab\\W", "ab\\d", "ab\\D",
        ];

        for (let option of options) {
            let ind = generator.next().value;
            Expect(ind.toString()).toEqual(option);
        }
        Expect(generator.next().done).toBeTruthy();
    }
}