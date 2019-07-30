import { Expect, Test, TestCase, TestFixture, FocusTest, AsyncTest, Timeout } from "alsatian";

import { LocalSearch } from "../../src/localsearch/LocalSearch";
import Utils from "../../src/Utils";


class MyLocalSearch extends LocalSearch {
    public restartFromSolution(): any {
        return null;
    }
}


@TestFixture('LocalSearchTest')
export class LocalSearchTest {

    @AsyncTest('everything')
    @Timeout(1000)
    public async testEverything() {
        const l = new MyLocalSearch('warmup');
        l.init();

        Expect(l.left).toEqual(["afoot", "catfoot", "dogfoot", "fanfoot", "foody", "foolery", "foolish", "fooster", "footage", "foothot", "footle", "footpad", "footway", "hotfoot", "jawfoot", "mafoo", "nonfood", "padfoot", "prefool", "sfoot", "unfool"]);
        Expect(l.right).toEqual(["Atlas", "Aymoro", "Iberic", "Mahran", "Ormazd", "Silipan", "altared", "chandoo", "crenel", "crooked", "fardo", "folksy", "forest", "hebamic", "idgah", "manlike", "marly", "palazzi", "sixfold", "tarrock", "unfold"]);

        Expect(l.validLeftChars).toEqual(["o", "f", "t", "a", "e", "d", "l", "s", "n", "p", "h", "r", "y", "g", "w", "i", "c", "j", "m", "u"]);
        Expect(l.validRightChars).toEqual(["a", "r", "l", "o", "d", "i", "e", "n", "c", "m", "f", "t", "k", "h", "s", "y", "b", "p", "z", "A", "S", "O", "M", "I", "g", "x", "u"]);

        Expect(l.getMaxFitness()).toBe(21);

        let inds = ['afoot', 'foo', 'f.o'].map(name => {
            let ind = l.factory.createFromString(name);
            l.evaluator.evaluate(ind);
            return ind;
        });

        inds[0]

        await Utils.waitFor(() => inds.every(ind => ind.isEvaluated));

        let i = 0;
        inds.forEach(ind => Expect(ind.evaluationIndex).toBe(i++));

        l.addSolution(inds[0]);
        Expect(l.getBestSolution()).toBe(inds[0]);

        l.addSolution(inds[1]);
        Expect(l.getBestSolution()).toBe(inds[1]);

        l.addSolution(inds[2]);
        Expect(l.getBestSolution()).toBe(inds[1]);

        // console.log(l.left);

        // return this.solutions.length > 0 ? this.solutions[0] : this.localSolutions[0];

    }
}