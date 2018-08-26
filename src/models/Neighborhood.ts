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

        for (let ind of this.generateByConcatenatingFromRightChars(solution)) {
            yield ind;
        }

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

    protected * generateByRemovingNodes(solution: Individual) {
        let nodes = solution.getNodes();

        // Removing a node
        for (let node of nodes) {
            if (node.is(NodeTypes.terminal) && node.toString() == '') continue;

            let neo = this.factory.removeNode(solution, node);
            if (neo.isValid()) yield neo;
        }
    }

    protected * generateByAddingStartOperator(solution: Individual) {
        let terminals = solution.getTerminals();

        // Adding start operator
        for (let terminal of terminals) {
            let neo = this.factory.addStartOperatorToTerminal(solution, terminal);
            if (terminal.value == '') continue;
            if (neo.isValid()) yield neo;
        }
    }

    protected * generateByAddingEndOperator(solution: Individual) {
        let terminals = solution.getTerminals();

        // Adding end operator
        for (let terminal of terminals) {
            let neo = this.factory.addEndOperatorToTerminal(solution, terminal);
            if (terminal.value == '') continue;
            if (neo.isValid()) yield neo;
        }
    }

    protected * generateBySwapping(solution: Individual) {
        let terminals = solution.getTerminals();

        // Replacing / Swap
        for (let terminal of terminals) {
            if (terminal.value == '') continue;

            for (let char of this.program.validLeftChars) {
                let neo = this.factory.replaceNode(solution, terminal, new Terminal(char));
                if (neo.isValid()) yield neo;
            }

            for (let specialChar of this.specialChars) {
                let neo = this.factory.replaceNode(solution, terminal, new Terminal(specialChar));
                if (neo.isValid()) yield neo;
            }
        }
    }

    protected * generateByConcatenating(solution: Individual) {
        let nodes = solution.getNodes();

        // Concatenating
        for (let char of this.program.validLeftChars) {
            for (let node of nodes) {
                if (node.is(NodeTypes.terminal) && node.toString() == '') continue;

                let neo = this.factory.concatenateToNode(solution, node, new Terminal(char));
                if (neo.isValid()) yield neo;

                for (let specialChar of this.specialChars) {
                    let neo = this.factory.concatenateToNode(solution, node, new Terminal(specialChar));
                    if (neo.isValid()) yield neo;
                }
            }
        }
    }

    protected * generateByAddingOrOperator(solution: Individual) {
        let funcs = solution.getFuncs();
        let terminals = solution.getTerminals();

        // Changing operator concatenating to alternative (or)
        for (let func of funcs) {
            if (func.type != Func.Types.concatenation) continue;
            let neo = this.factory.changeFuncType(solution, func, Func.Types.or);
            if (neo.isValid()) yield neo;
        }

        // Operator: Or
        for (let char of this.program.validLeftChars) {
            for (let terminal of terminals) {
                if (terminal.value == '') continue;

                let func = new Func();
                func.type = Func.Types.or;
                for (let side of ['left', 'right']) {
                    if (side == 'left') {
                        func.left = terminal;
                        func.right = new Terminal(char);
                    } else {
                        func.left = new Terminal(char);
                        func.right = terminal;
                    }

                    let neo = this.factory.replaceNode(solution, terminal, func);
                    if (neo.isValid()) yield neo;
                }
            }
        }
    }

    protected * generateByAddingRangeOperator(solution: Individual) {
        let nodes = solution.getNodes();

        // Operator: Range
        let ranges: RangeFunc[] = [];
        for (let c1 of this.program.validLeftChars) {
            for(let c2 of this.program.validLeftChars) {
                if (c1 == c2) continue;
                let func = new RangeFunc(new Terminal(''), new Terminal(''));
                if (c1 < c2) {
                    func.from = c1;
                    func.to = c2;
                } else {
                    func.from = c2;
                    func.to = c1;
                }
                ranges.push(func);
            }
        }

        for (let node of nodes) {
            if (node.is(NodeTypes.terminal) && node.toString() == '') continue;

            for(let range of ranges) {
                let neo = this.factory.replaceNode(solution, node, range);
                if (neo.isValid()) yield neo;

                neo = this.factory.concatenateToNode(solution, node, range);
                if (neo.isValid()) yield neo;
            }
        }
    }

    protected * generateByAddingNegationOperator(solution: Individual) {
        let nodes = solution.getNodes();

        // Operator: Negation
        for (let char of this.program.rightCharsNotInLeft) {
            let func = new Func();
            func.type = Func.Types.negation;
            func.left = new Terminal('');
            func.right = new Terminal(char);

            for (let node of nodes) {
                if (node.is(NodeTypes.terminal) && node.toString() == '') continue;

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

    protected * generateByAddingGivenOperator(solution: Individual, funcType: FuncTypes) {
        let nodes = solution.getNodes();

        // Operators: zeroOrMore, oneOrMore, anyChar and optional
        let func = new Func(funcType, new Terminal(''), new Terminal(''));

        for (let node of nodes) {
            if (node.is(NodeTypes.terminal) && node.toString() == '') continue;

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