import BaseProgram from "./BaseProgram";
import Func from "../nodes/Func";
import Individual from "../Individual";
import Terminal from "../nodes/Terminal";
import Utils from "../Utils";

export interface Solution {
    ind: Individual;
    date: Date;
    count: number;
}


export default class LocalSearch extends BaseProgram {
    public budget: number = 2000;
    public solutions: Solution[] = [];
    public localSolutions: Solution[] = [];

    public shouldStop(): boolean {
        if (this.evalutionCount >= this.budget) {
            this.endTime = new Date();
            return true;
        }

        return false;
    }

    public addSolution(ind: Individual) {
        this.solutions.push({ind, date: new Date(), count: this.evalutionCount});
    }

    public addLocalSolution(ind: Individual) {
        this.evaluate(ind);
        this.localSolutions.push({ind, date: new Date(), count: this.evalutionCount});
    }

    public generateInitialIndividual(): Individual {
        let index = 0;
        let maxIndex = this.validLeftChars.length - 1;

        let ind = new Individual();
        ind.tree = new Func();
        ind.tree.type = Func.Types.concatenation;
        ind.tree.left = new Terminal(this.validLeftChars[index]);
        ind.tree.right = new Terminal('');

        if (this.isValidLeft(ind)) {
            return ind;
        }

        let current = ind.tree;
        while (!this.isValidLeft(ind)) {
            current.type = Func.Types.or;
            index ++;

            if ((index + 1) > maxIndex) {
                break;
            }

            let func = new Func();
            func.type = Func.Types.or;
            func.left = new Terminal(this.validLeftChars[index]);
            func.right = new Terminal(this.validLeftChars[index + 1]);

            current.right = func;
            current = func;
        }

        return ind;
    }

    public getNeighborhoodLength(solution: string): number {
        let ret = 0;
        let len = solution.length;
        let chars = this.validLeftChars.length + 4;

        ret += (chars * len) * 2;
        ret += (chars * len) * 3;
        ret += ((this.validLeftChars.length * 2) * len) * 2;
        ret += (this.rightCharsNotInLeft.length) * len;
        ret += (this.rightCharsNotInLeft.length * 2) * len;

        return ret;
    }

    public * generateNeighborhood(solution: Individual) {
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
            for (let char of this.validLeftChars) {
                let neo = this.factory.replaceNode(solution, terminal, new Terminal(char));
                if (neo.isValid()) yield neo;
            }
        }

        // Concatenating
        for (let char of this.leftCharsNotInRight) {
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
        for (let char of this.leftCharsNotInRight) {
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
        for (let c1 of this.leftCharsNotInRight) {
            for(let c2 of this.leftCharsNotInRight) {
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
        for (let char of this.rightCharsNotInLeft) {
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
        for (let char of this.rightCharsNotInLeft) {
            for (let node of nodes) {
                let neo = this.factory.concatenateToNode(solution, node, new Terminal(char));
                if (neo.isValid()) yield neo;
            }
        }

        // zeroOrMore = "•*+",
        // oneOrMore = "•?+",
        // group = "(•)",
        // more = "•++",
    }

    public getRandomNeighbor(ind: Individual): Individual {
        return this.factory.generateRandomlyFrom(ind);
    }

    public getBestSolution(): Solution {
        return this.solutions.length > 0 ? this.solutions[0] : this.localSolutions[0];
    }

    public generateViaILS(ind: Individual): Individual {
        let count = 5;

        while (--count > 0) {
            let neo = this.factory.generateRandomlyFrom(ind);
            if (!neo.isValid()) continue;
            if (!this.isValidRegex(neo.toString())) continue;

            ind = neo;
        }

        let len = ind.getNodes().length;
        if (len > 5) {
            count = 3;
        } else if (len > 2) {
            count = 1;
        } else {
            count = 0;
        }

        while (--count > 0) {
            let neo = this.factory.removeRandomNode(ind);
            if (!neo.isValid()) continue;
            if (!this.isValidRegex(neo.toString())) continue;

            ind = neo;
        }

        return ind;
    }
}
