import * as regexpTree from "regexp-tree";
import { ILogger } from "../loggers/ILogger";
import { Individual, IndividualOrigin } from "../models/Individual";

import { IndividualFactory } from "../models/IndividualFactory";
import { AnyCharFunc } from "../nodes/AnyCharFunc";
import { ConcatFunc } from '../nodes/ConcatFunc';
import { Func, FuncTypes } from '../nodes/Func';
import { LineBeginFunc } from "../nodes/LineBeginFunc";
import { LineEndFunc } from "../nodes/LineEndFunc";
import { ListFunc } from '../nodes/ListFunc';
import { Node, NodeTypes } from '../nodes/Node';
import { OrFunc } from '../nodes/OrFunc';
import { RangeFunc } from '../nodes/RangeFunc';
import { RepetitionFunc } from '../nodes/RepetitionFunc';
import { Terminal } from '../nodes/Terminal';
import { Utils } from '../Utils';
import { ConcatFuncShrinker } from "./ConcatenationShrinker";
import { ListFuncShrinker } from "./ListFuncShrinker";
import { RepetitionFuncShrinker } from "./RepetitionFuncShrinker";

export class NodeShrinker {
    private static _logger: ILogger;
    private static _individual: Individual;

    public static setCurrentIndividual(ind: Individual): void {
        NodeShrinker._individual = ind;
    }

    public static setLogger(logger: ILogger) {
        NodeShrinker._logger = logger;
    }

    public static log(funcName: string, originalNode: Node, neoNode: Node) {
        if (NodeShrinker._logger) {
            NodeShrinker._logger.logShrink(NodeShrinker._individual, funcName, originalNode, neoNode);
        }
    }

    public static shrinkIndividual(ind: Individual): Individual {
        NodeShrinker.setCurrentIndividual(ind);
        let [node, origin] = NodeShrinker.shrinkRoot(ind.tree);

        if (node.nodeType === 'terminal') {
            const func = new ConcatFunc([node]);
            node = func;
        }

        const neo = new Individual();
        neo.addOrigin(origin.name, origin.args);
        neo.tree = node as Func;

        NodeShrinker._individual = null;
        return neo;
    }

    public static shrinkRoot(node: Node): [Node, IndividualOrigin] {
        const neo = NodeShrinker.shrink(node);

        const options = [
            'charClassToMeta',
            'charClassToSingleChar',
            'charClassRemoveDuplicates',
            'quantifiersMerge',
            'quantifierRangeToSymbol',
            'charClassClassrangesToChars',
            'charClassClassrangesMerge',
            'disjunctionRemoveDuplicates',
            'groupSingleCharsToCharClass',
            'combineRepeatingPatterns',
        ];

        try {
            const originalRe = neo.toRegex();
            const optimizedRe: RegExp = (regexpTree as any).optimize(originalRe, options).toRegExp();

            const factory = new IndividualFactory([], []);
            const ind = factory.createFromString(optimizedRe);
            ind.addOrigin('shrinkRoot', [node.toString()]);
            return ind.isValid() ? [ind.tree, ind.origin[0]] : [neo, ind.origin[0]];
        } catch {
            return [neo, {'name': 'shrinkRoot', 'args': [node.toString()]}];
        }
    }

    public static shrink(node?: Node): Node {
        if (node instanceof Func) {
            return NodeShrinker.shrinkFunc(node);
        } else if (node instanceof Terminal) {
            return NodeShrinker.shrinkTerminal(node);
        } else if (node === undefined) {
            return new Terminal('');
        } else {
            throw new Error('Invalid Node type to Shrink');
        }
    }

    public static shrinkMany(nodes: Node[]): Node[] {
        return nodes.map((node) => NodeShrinker.shrink(node));
    }

    public static shrinkTerminal(node: Terminal): Node {
        return node.clone();
    }

    public static shrinkFunc(node: Func): Node {
        if (node instanceof ConcatFunc) {
            const neoNode = (new ConcatFuncShrinker()).shrink(node);
            this.log('ConcatFuncShrinker', node, neoNode);
            return neoNode;
        }

        if (node instanceof RepetitionFunc) {
            const neoNode = (new RepetitionFuncShrinker()).shrink(node);
            this.log('RepetitionFuncShrinker', node, neoNode);
            return neoNode;
        }

        if (node instanceof ListFunc) {
            const neoNode = (new ListFuncShrinker()).shrink(node);
            this.log('ListFuncShrinker', node, neoNode);
            return neoNode;
        }

        if (node instanceof OrFunc) {
            const neoNode = NodeShrinker.shrinkOrFunc(node);
            this.log('shrinkOrFunc', node, neoNode);
            return neoNode;
        }

        if (node instanceof RangeFunc) {
            return node.clone();
        }

        // Anchors
        if (node instanceof LineBeginFunc || node instanceof LineEndFunc) {
            return node.clone();
        }

        if (node.is(Func.Types.concatenation)) {
            throw new Error('Should not reach here like this');
        }

        // switch (node.type) {
            // case Func.Types.negation: return NodeShrinker.shrinkFuncNegation(node);
            // case Func.Types.repetition: return NodeShrinker.shrinkRepetition(node as RepetitionFunc);
            // case Func.Types.range: return NodeShrinker.shrinkRange(node as RangeFunc);
            // zeroOrMore = "•*+",
            // oneOrMore = "•?+",
            // group = "(•)",
        // }

        // Our default is shrink left and right and return a new Func
        if (node instanceof Func) {
            const neo = node.clone();
            neo.children = NodeShrinker.shrinkMany(neo.children);
            return neo;
        } else {
            // Terminal
            return new ConcatFunc([NodeShrinker.shrink(node)]);
        }
    }

    protected static shrinkOrFunc(node: OrFunc): Node {
        return new OrFunc(NodeShrinker.shrink(node.left), NodeShrinker.shrink(node.right));
    }
}
