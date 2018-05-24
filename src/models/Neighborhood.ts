import Individual from "./Individual";
import BaseProgram from "../BaseProgram";
import Func, { FuncTypes } from "../nodes/Func";
import Terminal from "../nodes/Terminal";


export default class Neighborhood {
    protected next: Individual;

    public constructor(public ind: Individual, public program: BaseProgram) {}

    public get factory() {
        return this.program.factory;
    }

    public * getGenerator() {
        let solution = this.ind;
        let nodes = solution.getNodes();
        let funcs = solution.getFuncs();
        let terminals = solution.getTerminals();

        // Removing a node
        for (let node of nodes) {
            let neo = this.factory.removeNode(solution, node);
            if (neo.isValid()) yield neo;
        }

        // Adding start operator
        for (let terminal of terminals) {
            let neo = this.factory.addStartOperatorToTerminal(solution, terminal);
            if (terminal.value == '') continue;
            if (neo.isValid()) yield neo;
        }

        // Adding end operator
        for (let terminal of terminals) {
            let neo = this.factory.addEndOperatorToTerminal(solution, terminal);
            if (terminal.value == '') continue;
            if (neo.isValid()) yield neo;
        }

        // Replacing
        for (let terminal of terminals) {
            for (let char of this.program.validLeftChars) {
                let neo = this.factory.replaceNode(solution, terminal, new Terminal(char));
                if (neo.isValid()) yield neo;
            }
        }

        // Concatenating
        for (let char of this.program.leftCharsNotInRight) {
            for (let node of nodes) {
                let neo = this.factory.concatenateToNode(solution, node, new Terminal(char));
                if (neo.isValid()) yield neo;
            }
        }

        for (let func of funcs) {
            if (func.type != Func.Types.concatenation) continue;
            let neo = this.factory.changeFuncType(solution, func, Func.Types.or);
            if (neo.isValid()) yield neo;
        }

        // Operator: Or
        for (let char of this.program.leftCharsNotInRight) {
            for (let terminal of terminals) {
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

        // Operator: Range
        let ranges: Terminal[] = [];
        for (let c1 of this.program.leftCharsNotInRight) {
            for(let c2 of this.program.leftCharsNotInRight) {
                if (c1 == c2) continue;
                if (c1 < c2) {
                    let terminal = new Terminal(`[${c1}-${c2}]`);
                    ranges.push(terminal);
                } else {
                    let terminal = new Terminal(`[${c2}-${c1}]`);
                    ranges.push(terminal);
                }
            }
        }

        for (let node of nodes) {
            for(let range of ranges) {
                let neo = this.factory.replaceNode(solution, node, range);
                if (neo.isValid()) yield neo;

                neo = this.factory.concatenateToNode(solution, node, range);
                if (neo.isValid()) yield neo;
            }
        }

        // Operator: Negation
        for (let char of this.program.rightCharsNotInLeft) {
            let func = new Func();
            func.type = Func.Types.negation;
            func.left = new Terminal('');
            func.right = new Terminal(char);

            for (let node of nodes) {
                let neo = this.factory.replaceNode(solution, node, func);
                if (neo.isValid()) yield neo;

                neo = this.factory.concatenateToNode(solution, node, func);
                if (neo.isValid()) yield neo;
            }
        }

        // Operator: Concatenation (but from right chars not in left)
        for (let char of this.program.rightCharsNotInLeft) {
            for (let node of nodes) {
                let neo = this.factory.concatenateToNode(solution, node, new Terminal(char));
                if (neo.isValid()) yield neo;
            }
        }

        // Operator: Backref
        let howManyGroups = funcs.filter(func => func.is(FuncTypes.group)).length;
        if (howManyGroups > 0) {
            // Are there groups ?
        }

        for (let node of nodes) {
            let current = this.factory.wrapNodeWithGroup(solution, node);
            for (let localNode of current.getNodes()) {
                let neo = this.factory.addBackref(current, localNode, 1);
                if (neo.isValid()) yield neo;
            }
        }

        // zeroOrMore = "•*+",
        // oneOrMore = "•?+",
        // group = "(•)",
        // more = "•++",
    }
}