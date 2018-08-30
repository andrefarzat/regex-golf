import Individual from "./Individual";
import LocalSearch from "../localsearch/LocalSearch";
import Func, { FuncTypes } from "../nodes/Func";
import Terminal from "../nodes/Terminal";
import RangeFunc from "../nodes/RangeFunc";
import Evaluator from './Evaluator';
import EvaluatorFactory from "./EvaluatorFactory";
import { NodeTypes } from "../nodes/Node";
import Utils from "../Utils";


export default class Neighborhood {
    public constructor(public solution: Individual, public program: LocalSearch) {}
    public readonly specialChars = [`\\b`, `\\B`, `\\w`, `\\W`, `\\d`, `\\D`];
    public maxSimultaneousEvaluations = 2;
    protected hood?: IterableIterator<Individual>;

    public get factory() {
        return this.program.factory;
    }

    public async evaluate(evalFn: (ind: Individual) => void) {
        let i = 0;

        for (let ind of this.getGenerator()) {
            if (!ind.isValid()) continue;

            await Utils.waitFor(() => i < this.maxSimultaneousEvaluations);
            i ++;

            await this.program.evaluator.evaluate(ind);
            evalFn(ind);
            i --;
        }

        await Utils.waitFor(() => i == 0);
    }

    public * getGenerator() {
        let { solution } = this;

        for (let ind of this.generateByRemovingNodes(solution)) {
            yield ind;
        }

        for (let ind of this.generateByAddingStartOperator(solution)) {
            yield ind;
        }

        for (let ind of this.generateByAddingEndOperator(solution)) {
            yield ind;
        }

        for (let ind of this.generateBySwapping(solution)) {
            yield ind;
        }

        for (let ind of this.generateByConcatenating(solution)) {
            yield ind;
        }

        for (let ind of this.generateByAddingOrOperator(solution)) {
            yield ind;
        }

        for (let ind of this.generateByAddingRangeOperator(solution)) {
            yield ind;
        }

        for (let ind of this.generateByAddingNegationOperator(solution)) {
            yield ind;
        }

        // for (let ind of this.generateByConcatenatingFromRightChars(solution)) {
        //     yield ind;
        // }

        for (let ind of this.generateByAddingGivenOperator(solution, FuncTypes.zeroOrMore)) {
            yield ind;
        }

        for (let ind of this.generateByAddingGivenOperator(solution, FuncTypes.oneOrMore)) {
            yield ind;
        }

        for (let ind of this.generateByAddingGivenOperator(solution, FuncTypes.anyChar)) {
            yield ind;
        }

        for (let ind of this.generateByAddingGivenOperator(solution, FuncTypes.optional)) {
            yield ind;
        }

        for (let ind of this.generateByAddingBackrefOperator(solution)) {
            yield ind;
        }
    }

    public * generateByRemovingNodes(solution: Individual) {
        let nodes = solution.getNodes();

        // Removing a node
        for (let node of nodes) {
            if (node.is(NodeTypes.terminal) && node.toString() == '') continue;

            let neo = this.factory.removeNode(solution, node);
            if (neo.isValid()) yield neo;
        }
    }

    public * generateByAddingStartOperator(solution: Individual) {
        // Let's get all OR operators first
        let orNodes = solution.getFuncs().filter(func => func.is(FuncTypes.or));

        if (orNodes.length == 0) {
            // No or nodes. Ok. Let's add a single start operator to the first terminal and that's it
            for (let terminal of solution.getTerminals()) {
                if (terminal.value == '') continue;

                let neo = this.factory.addStartOperatorToTerminal(solution, terminal);
                if (neo.isValid()) {
                    yield neo;
                    break;
                }
            }
        } else {
            // Ok. Let's add a start operator to first terminal together with the OR
            for (let node of orNodes) {
                for (let terminal of node.getLeftTerminals()) {
                    if (terminal.value == '') continue;

                    let neo = this.factory.addStartOperatorToTerminal(solution, terminal);
                    if (neo.isValid()) {
                        yield neo;
                        break;
                    }
                }

                for (let terminal of node.getRightTerminals()) {
                    if (terminal.value == '') continue;

                    let neo = this.factory.addStartOperatorToTerminal(solution, terminal);
                    if (neo.isValid()) {
                        yield neo;
                        break;
                    }
                }
            }
        }
    }

    public * generateByAddingEndOperator(solution: Individual) {
        // Let's get all OR operators first
        let orNodes = solution.getFuncs().filter(func => func.is(FuncTypes.or));

        if (orNodes.length == 0) {
            // No or nodes. Ok. Let's add a single start operator to the last terminal and that's it
            let terminals = solution.getTerminals();
            do {
                let terminal = terminals.pop();
                if (!terminal) break;

                if (terminal.value == '') continue;

                let neo = this.factory.addEndOperatorToTerminal(solution, terminal);
                if (neo.isValid()) {
                    yield neo;
                    break;
                }
            } while (true);
        } else {
            // Ok. Let's add a start operator to last terminal together with the OR
            for (let node of orNodes) {
                let terminals = node.getLeftTerminals();
                do {
                    let terminal = terminals.pop();
                    if (!terminal) break;

                    if (terminal.value == '') continue;

                    let neo = this.factory.addEndOperatorToTerminal(solution, terminal);
                    if (neo.isValid()) {
                        yield neo;
                        break;
                    }
                } while (true);

                terminals = node.getRightTerminals();
                do {
                    let terminal = terminals.pop();
                    if (!terminal) break;

                    if (terminal.value == '') continue;

                    let neo = this.factory.addEndOperatorToTerminal(solution, terminal);
                    if (neo.isValid()) {
                        yield neo;
                        break;
                    }
                } while (true);
            }
        }
    }

    public * generateBySwapping(solution: Individual) {
        let terminals = solution.getTerminals();

        // Replacing / Swap
        for (let terminal of terminals) {
            if (terminal.value == '') continue;

            for (let char of this.program.validLeftChars) {
                let neo = this.factory.replaceNode(solution, terminal, new Terminal(char));
                if (neo.isValid() && neo.toString() !== solution.toString()) yield neo;
            }

            for (let specialChar of this.specialChars) {
                let neo = this.factory.replaceNode(solution, terminal, new Terminal(specialChar));
                if (neo.isValid() && neo.toString() !== solution.toString()) yield neo;
            }
        }
    }

    public * generateByConcatenating(solution: Individual) {
        // Concatenating
        for (let node of solution.getNodes()) {
            if (node.is(NodeTypes.terminal) && node.toString() == '') continue;

            for (let char of this.program.validLeftChars) {
                let neo = this.factory.concatenateToNode(solution, node, new Terminal(char));
                if (neo.isValid()) yield neo;
            }

            for (let char of this.specialChars) {
                let neo = this.factory.concatenateToNode(solution, node, new Terminal(char));
                if (neo.isValid()) yield neo;
            }
        }
    }

    public * generateByAddingOrOperator(solution: Individual) {
        let funcs = solution.getFuncs();
        let terminals = solution.getTerminals();

        // Changing operator concatenating to alternative (or)
        for (let func of funcs) {
            if (func.type != Func.Types.concatenation) continue;
            let neo = this.factory.changeFuncType(solution, func, Func.Types.or);
            if (neo.isValid()) yield neo;
        }

        // // Operator: Or
        // for (let char of this.program.validLeftChars) {
        //     for (let terminal of terminals) {
        //         if (terminal.value == '') continue;

        //         let func = new Func();
        //         func.type = Func.Types.or;
        //         for (let side of ['left', 'right']) {
        //             if (side == 'left') {
        //                 func.left = terminal;
        //                 func.right = new Terminal(char);
        //             } else {
        //                 func.left = new Terminal(char);
        //                 func.right = terminal;
        //             }

        //             let neo = this.factory.replaceNode(solution, terminal, func);
        //             if (neo.isValid()) yield neo;
        //         }
        //     }
        // }
    }

    public getAllRanges(): RangeFunc[] {
        let ranges: RangeFunc[] = [];
        let chars = Object.assign([], this.program.validLeftChars).sort();

        for (let c1 of chars) {
            for (let c2 of chars) {
                if (c1 >= c2) continue;
                let func = new RangeFunc(new Terminal(''), new Terminal(''));

                func.from = c1;
                func.to = c2;

                ranges.push(func);
            }
        }

        return ranges;
    }

    public * generateByAddingRangeOperator(solution: Individual) {
        // Operator: Range
        for (let node of solution.getNodes()) {
            if (node.is(NodeTypes.terminal) && node.toString() == '') continue;
            if (node === solution.tree) continue;

            for(let range of this.getAllRanges()) {
                let neo = this.factory.replaceNode(solution, node, range);
                if (neo.isValid()) yield neo;

                neo = this.factory.concatenateToNode(solution, node, range);
                if (neo.isValid()) yield neo;
            }
        }
    }

    public * generateByAddingNegationOperator(solution: Individual) {
        // Operator: Negation
        for (let node of solution.getNodes()) {
            if (node.toString() == '') continue;
            if (node === solution.tree) continue;

            for (let char of this.program.rightCharsNotInLeft) {
                let func = new Func();
                func.type = Func.Types.negation;
                func.left = new Terminal(char);
                func.right = new Terminal('');

                let neo = this.factory.replaceNode(solution, node, func);
                if (neo.isValid()) yield neo;

                neo = this.factory.concatenateToNode(solution, node, func);
                if (neo.isValid()) yield neo;
            }
        }
    }

    protected * generateByConcatenatingFromRightChars(solution: Individual) {
        let nodes = solution.getNodes();

        // Operator: Concatenation (but from right chars not in left)
        for (let char of this.program.rightCharsNotInLeft) {
            for (let node of nodes) {
                if (node.is(NodeTypes.terminal) && node.toString() == '') continue;
                let neo = this.factory.concatenateToNode(solution, node, new Terminal(char));
                if (neo.isValid()) yield neo;
            }
        }
    }

    public * generateByAddingGivenOperator(solution: Individual, funcType: FuncTypes) {
        let nodes = solution.getNodes();

        // Operators: zeroOrMore, oneOrMore, anyChar and optional
        let func = new Func(funcType, new Terminal(''), new Terminal(''));

        for (let node of nodes) {
            if (node.is(NodeTypes.terminal) && node.toString() == '') continue;
            if (node === solution.tree) continue;

            let neo = this.factory.replaceNode(solution, node, func);
            if (neo.isValid()) yield neo;

            neo = this.factory.concatenateToNode(solution, node, func);
            if (neo.isValid()) yield neo;
        }
    }

    protected * generateByAddingBackrefOperator(solution: Individual) {
        let nodes = solution.getNodes();

        // Operator: Backref
        for (let node of nodes) {
            if (node.is(NodeTypes.terminal) && node.toString() == '') continue;

            let nodeIsWrappedByGroup = this.factory.isNodeWrappedByGroup(node, solution);
            if (nodeIsWrappedByGroup) continue;

            let current = this.factory.wrapNodeWithGroup(solution, node);
            let length = new Set(current.getFuncs().filter(func => func.is(FuncTypes.group))).size;

            // We loop for each group in the current solution to add a backref to each
            for (let i = 1; i <= length; i++) {
                for (let localNode of current.getNodes()) {
                    let localNodeIsWrappedByGroup = this.factory.isNodeWrappedByGroup(localNode, current);
                    if (localNodeIsWrappedByGroup) continue;

                    let neo = this.factory.addBackref(current, localNode, i);
                    if (neo.isValid()) yield neo;
                }
            }
        }
    }
}