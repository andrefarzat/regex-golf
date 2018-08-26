import { Expect, Test, AsyncTest, Timeout, TestCase, TestFixture, FocusTest, IgnoreTest, Teardown } from "alsatian";


import Neighborhood from "../../src/models/Neighborhood";
import LocalSearch from "../../src/localsearch/LocalSearch";
import ILS_Shrink from "../../src/localsearch/ILS_shrink";
import Individual from "../../src/models/Individual";
import EvaluatorFactory from "../../src/models/EvaluatorFactory";


@TestFixture()
export default class NeighborhoodTest {

    @IgnoreTest()
    @Test("Neighborhood generator")
    public testGenerator() {
        let program = new ILS_Shrink('family');
        program.init();

        let initialInd = program.factory.createFromString('a');
        Expect(initialInd.toString()).toEqual('a');

        let hood = new Neighborhood(initialInd, program);
    }

    @Timeout(2000)
    @AsyncTest("Neighborhood evaluation")
    @IgnoreTest("not for now")
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

        Expect(lastInd.evaluationIndex).toBe(476);
        Expect(count).toBe(477);
    }

    @Timeout(2000)
    @AsyncTest("Neighborhood removing")
    @IgnoreTest('Incomplete')
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