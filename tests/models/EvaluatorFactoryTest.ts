import { Expect, Test, TestCase, TestFixture, FocusTest, SetupFixture, AsyncTest, Timeout, Teardown, AsyncTeardown, IgnoreTest } from "alsatian";

import EvaluatorFactory from "../../src/models/EvaluatorFactory";
import ILS from "../../src/localsearch/ILS";



@TestFixture("EvaluatorFactory Test")
export default class EvaluatorFactoryTest {
    protected program = new ILS('family');
    protected available = true;

    @SetupFixture
    public setupFixture() {
        this.program.init();
    }

    @AsyncTest()
    public async testEvaluate() {
        let ind = this.program.factory.createFromString('a');

        let evaluator = new EvaluatorFactory(this.program.left, this.program.right);

        let fitness = await evaluator.evaluate(ind);
        Expect(fitness).toBe(1);
        Expect(ind.fitness).toBe(1);
        Expect(ind.matchesOnLeft).toBe(2);
        Expect(ind.matchesOnRight).toBe(1);

        ind = this.program.factory.createFromString('a+');
        fitness = await evaluator.evaluate(ind);
        Expect(fitness).toBe(1);
        Expect(ind.fitness).toBe(1);
        Expect(ind.matchesOnLeft).toBe(2);
        Expect(ind.matchesOnRight).toBe(1);

        evaluator.close();
    }

    @AsyncTest()
    public async testWarmupWeirdCase() {
        let program = new ILS('warmup');
        let ind = this.program.factory.createFromString('n');
        let ind2 = this.program.factory.createFromString('n+');
        Expect(ind.isEvaluated).not.toBeTruthy();

        let evaluator = new EvaluatorFactory(this.program.left, this.program.right);

        let fitness = await evaluator.evaluate(ind);
        Expect(ind.matchesOnLeft).toBe(3);
        Expect(ind.matchesOnRight).toBe(6);
        Expect(fitness).toBe(-3);
        Expect(ind.fitness).toBe(-3);
        Expect(ind.isEvaluated).toBeTruthy();

        fitness = await evaluator.evaluate(ind2);
        Expect(ind.matchesOnLeft).toBe(3);
        Expect(ind.matchesOnRight).toBe(6);
        Expect(fitness).toBe(-3);
        Expect(ind.fitness).toBe(-3);
        Expect(ind.isEvaluated).toBeTruthy();

        evaluator.close();
    }
}