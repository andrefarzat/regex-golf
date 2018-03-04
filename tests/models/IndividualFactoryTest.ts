import { Expect, Test, TestCase, TestFixture } from "alsatian";

import IndividualFactory from "../../src/models/IndividualFactory";
import { NodeTypes } from "../../src/nodes/Node";
import Func, { FuncTypes } from "../../src/nodes/Func";


@TestFixture("IndividualFactory Test")
export default class IndividualFactoryTest {
    private factory = new IndividualFactory(['a', 'b', 'c'], [ 'x', 'y', 'z']);

    @Test('Test creating from string')
    public testCreateFromString() {
        let ind = this.factory.createFromString('^abc$');

        Expect(ind.tree.toString()).toEqual('^abc$');

        let right = ind.tree.right as Func;
        Expect(right.nodeType).toEqual(NodeTypes.func);
        Expect(right.type).toEqual(Func.Types.lineBegin);

        let least = ind.tree.getLeastFunc();
        Expect(least.nodeType).toEqual(NodeTypes.func);
        Expect(least.type).toEqual(Func.Types.lineEnd);
    }
}