import { Expect, TestFixture, AsyncTest, Timeout, FocusTest } from "alsatian";

// import EvaluatorFactory from "../../src/models/EvaluatorFactory";
import ILS from "../../src/localsearch/ILS";
import Utils from "../../src/Utils";



@TestFixture("EvaluatorFactory Test")
export default class EvaluatorFactoryTest {

    @AsyncTest()
    @Timeout(6000)
    public async testEvaluate() {
        const instance = Utils.loadInstance('family');
        let program = new ILS(instance.left, instance.right);
        program.init();

        let ind = program.factory.createFromString('a');

        let fitness = await program.evaluator.evaluate(ind);
        Expect(fitness).toBe(1);
        Expect(ind.fitness).toBe(1);
        Expect(ind.matchesOnLeft).toBe(2);
        Expect(ind.matchesOnRight).toBe(1);

        ind = program.factory.createFromString('a+');
        fitness = await program.evaluator.evaluate(ind);
        Expect(fitness).toBe(1);
        Expect(ind.fitness).toBe(1);
        Expect(ind.matchesOnLeft).toBe(2);
        Expect(ind.matchesOnRight).toBe(1);

        program.evaluator.close();
    }

    @AsyncTest()
    @Timeout(6000)
    public async testWarmupWeirdCase() {
        const instance = Utils.loadInstance('warmup');
        let program = new ILS(instance.left, instance.right);
        program.init();

        let ind = program.factory.createFromString('n');
        let ind2 = program.factory.createFromString('n+');
        Expect(ind.isEvaluated).not.toBeTruthy();

        let fitness = await program.evaluator.evaluate(ind);
        Expect(ind.matchesOnLeft).toBe(3);
        Expect(ind.matchesOnRight).toBe(6);
        Expect(fitness).toBe(-3);
        Expect(ind.fitness).toBe(-3);
        Expect(ind.isEvaluated).toBeTruthy();

        fitness = await program.evaluator.evaluate(ind2);
        Expect(ind.matchesOnLeft).toBe(3);
        Expect(ind.matchesOnRight).toBe(6);
        Expect(fitness).toBe(-3);
        Expect(ind.fitness).toBe(-3);
        Expect(ind.isEvaluated).toBeTruthy();

        program.evaluator.close();
    }
}