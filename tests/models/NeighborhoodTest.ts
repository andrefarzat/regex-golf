import { Expect, Test, AsyncTest, Timeout, TestCase, TestFixture, FocusTest, IgnoreTest } from "alsatian";


import Neighborhood from "../../src/models/Neighborhood";
import BaseProgram from "../../src/BaseProgram";
import ILS_Shrink from "../../src/localsearch/ILS_shrink";
import Individual from "../../src/models/Individual";


export default class NeighborhoodTest {

    @TestCase("Neighborhood test")
    public test() {

    }

    @Test("Neighborhood generator")
    public testGenerator() {
        let program = new ILS_Shrink('family');
        program.init();

        let initialInd = program.factory.createFromString('a');
        Expect(initialInd.toString()).toEqual('a');

        let hood = new Neighborhood(initialInd, program);
    }

    @Timeout(60 * 1000)
    @AsyncTest("Neighborhood evaluation")
    public async testEvaluation() {
        let program = new ILS_Shrink('family');
        program.init();

        let initialInd = program.factory.createFromString('a');
        Expect(initialInd.toString()).toEqual('a');

        let hood = new Neighborhood(initialInd, program);
        hood.maxSimultaneousEvaluations = 1000;

        let count = 0;
        let currentBest: Individual;

        await hood.evaluate(ind => {
            count++;
        });

        Expect(count).toBe(477);
    }


    @AsyncTest("Neighborhood removing")
    public async testRemoving() {
        let program = new ILS_Shrink('warmup');
        program.init();

        let initialInd = program.factory.createFromString('foo|o^');
        Expect(initialInd.toString()).toEqual('foo|o^');

        let hood = new Neighborhood(initialInd, program);
        hood.maxSimultaneousEvaluations = 1;

        for (let ind of hood.getGenerator()) {
            Expect(ind.toString()).toBe('oo|o^');
        }
    }
}