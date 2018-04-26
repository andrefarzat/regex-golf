import { Expect, Test, TestCase, TestFixture, IgnoreTest, FocusTest } from "alsatian";

import Individual from '../src/models/Individual';
import Func from "../src/nodes/Func";
import IndividualFactory from "../src/models/IndividualFactory";
import { NodeTypes } from "../src/nodes/Node";
import Terminal from "../src/nodes/Terminal";


@TestFixture('IndividualTest')
export class IndividualTest {
    private individualFactory = new IndividualFactory(['a', 'b', 'c'], [ 'x', 'y', 'z']);


    @Test('Test createFromString')
    public createFromString() {
        let ind = this.individualFactory.createFromString('abc')
        Expect(ind.toString()).toEqual('abc');
        Expect(ind.tree.nodeType).toEqual(NodeTypes.func);
        Expect(ind.tree.left.nodeType).toEqual(NodeTypes.terminal);
        Expect(ind.tree.left.toString()).toEqual('a');

        Expect(ind.tree.right.nodeType).toEqual(NodeTypes.func);
        let right = ind.tree.right as Func;

        Expect((right.left as Terminal).value).toEqual('b');
        Expect((right.right as Terminal).value).toEqual('c');
    }

}