import { Expect, Test, TestCase, TestFixture, FocusTest, SetupFixture, AsyncTest, Timeout } from "alsatian";

import EvaluatorFactory from "../../src/models/EvaluatorFactory";
import ILS from "../../src/localsearch/ILS";



@TestFixture("EvaluatorFactory Test")
export default class EvaluatorFactoryTest {
    protected program = new ILS('family');

    @SetupFixture
    public setupFixture() {
        this.program.init();
        EvaluatorFactory.setProgram(this.program);
    }

    @Test('constructor')
    public testConstructor() {
        EvaluatorFactory._program = undefined;
        Expect(() => EvaluatorFactory.getInstance()).toThrow();

        EvaluatorFactory.setProgram(this.program);
        Expect(EvaluatorFactory.getInstance().program).toBe(this.program);
    }

    @Timeout(1000 * 60 * 60)
    @FocusTest
    @AsyncTest()
    public async testEvaluate() {
        let ind = this.program.factory.createFromString('a');

        let fitness = await EvaluatorFactory.evaluate(ind);
        Expect(fitness).toBe(1);
        Expect(ind.fitness).toBe(1);
        Expect(ind.matchesOnLeft).toBe(2);
        Expect(ind.matchesOnRight).toBe(1);
        debugger;
        ind = this.program.factory.createFromString('a+');
        fitness = await EvaluatorFactory.evaluate(ind);
        Expect(fitness).toBe(1);
        Expect(ind.fitness).toBe(1);
        Expect(ind.matchesOnLeft).toBe(2);
        Expect(ind.matchesOnRight).toBe(1);
    }
}