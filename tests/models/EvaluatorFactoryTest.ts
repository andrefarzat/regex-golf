import { AsyncTest, Expect, TestFixture, Timeout } from "alsatian";

import { ILS } from "../../src/localsearch/ILS";
import { Individual } from "../../src/models/Individual";

@TestFixture("EvaluatorFactory Test")
export class EvaluatorFactoryTest {

    @AsyncTest()
    @Timeout(6000)
    public async testEvaluate() {
        const program = new ILS('family');
        program.init();
        Individual.setWeight(10);

        let ind = program.factory.createFromString('a');

        let fitness = await program.evaluator.evaluate(ind);
        Expect(fitness).toBe(9);
        Expect(ind.fitness).toBe(9);
        Expect(ind.matchesOnLeft).toBe(2);
        Expect(ind.matchesOnRight).toBe(1);

        ind = program.factory.createFromString('a+');
        fitness = await program.evaluator.evaluate(ind);
        Expect(fitness).toBe(8);
        Expect(ind.fitness).toBe(8);
        Expect(ind.matchesOnLeft).toBe(2);
        Expect(ind.matchesOnRight).toBe(1);

        program.evaluator.close();
    }

    @AsyncTest()
    @Timeout(6000)
    public async testWarmupWeirdCase() {
        const program = new ILS('warmup');
        program.init();

        const ind = program.factory.createFromString('n');
        const ind2 = program.factory.createFromString('n+');
        Expect(ind.isEvaluated).not.toBeTruthy();

        let fitness = await program.evaluator.evaluate(ind);
        Expect(ind.matchesOnLeft).toBe(3);
        Expect(ind.matchesOnRight).toBe(6);
        Expect(fitness).toBe(-31);
        Expect(ind.fitness).toBe(-31);
        Expect(ind.isEvaluated).toBeTruthy();

        fitness = await program.evaluator.evaluate(ind2);
        Expect(ind2.matchesOnLeft).toBe(3);
        Expect(ind2.matchesOnRight).toBe(6);
        Expect(fitness).toBe(-32);
        Expect(ind2.fitness).toBe(-32);
        Expect(ind2.isEvaluated).toBeTruthy();

        program.evaluator.close();
    }
}
