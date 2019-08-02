import { LocalSearch } from "../localsearch/LocalSearch";
import { Logger } from "../Logger";
import { AnyCharFunc } from "../nodes/AnyCharFunc";
import { Func, FuncTypes } from "../nodes/Func";
import { ListFunc } from "../nodes/ListFunc";
import { LookaheadFunc } from "../nodes/LookaheadFunc";
import { LookbehindFunc } from "../nodes/LookbehindFunc";
import { NodeTypes } from "../nodes/Node";
import { OneOrMoreFunc } from "../nodes/OneOrMoreFunc";
import { OptionalFunc } from "../nodes/OptionalFunc";
import { OrFunc } from "../nodes/OrFunc";
import { RangeFunc } from "../nodes/RangeFunc";
import { Terminal } from "../nodes/Terminal";
import { ZeroOrMoreFunc } from "../nodes/ZeroOrMore";
import { Utils } from "../Utils";
import { Individual } from "./Individual";

export class Neighborhood {

    public get factory() {
        return this.program.factory;
    }
    public readonly specialChars = [`\\b`, `\\B`, `\\w`, `\\W`, `\\d`, `\\D`];
    public maxSimultaneousEvaluations = 2;
    protected hood?: IterableIterator<Individual>;

    public constructor(public solution: Individual, public program: LocalSearch) { }

    public async evaluate(evalFn: (ind: Individual) => void) {
        let i = 0;

        for (const ind of this.getGenerator()) {
            if (!ind.isValid()) { continue; }

            await Utils.waitFor(() => i < this.maxSimultaneousEvaluations);
            i++;

            await this.program.evaluator.evaluate(ind);
            evalFn(ind);
            i--;
        }

        await Utils.waitFor(() => i === 0);
    }

    public * getGenerator() {
        const { solution } = this;

        for (const ind of this.generateByRemovingNodes(solution)) {
            yield ind;
        }

        for (const ind of this.generateByAddingStartOperator(solution)) {
            yield ind;
        }

        for (const ind of this.generateByAddingEndOperator(solution)) {
            yield ind;
        }

        for (const ind of this.generateBySwapping(solution)) {
            yield ind;
        }

        for (const ind of this.generateByConcatenating(solution)) {
            yield ind;
        }

        for (const ind of this.generateByAddingRangeOperator(solution)) {
            yield ind;
        }

        for (const ind of this.generateByAddingNegationOperator(solution)) {
            yield ind;
        }

        for (const ind of this.generateByAddingGivenOperator(solution, ZeroOrMoreFunc)) {
            yield ind;
        }

        for (const ind of this.generateByAddingGivenOperator(solution, OneOrMoreFunc)) {
            yield ind;
        }

        for (const ind of this.generateByAddingGivenOperator(solution, AnyCharFunc)) {
            yield ind;
        }

        for (const ind of this.generateByAddingGivenOperator(solution, OptionalFunc)) {
            yield ind;
        }

        // for (const ind of this.generateByAddingBackrefOperator(solution)) {
        //     yield ind;
        // }

        // for (const ind of this.generateByAddingLookbehind(solution)) {
        //     yield ind;
        // }

        for (const ind of this.generateByExtractingSingleNode(solution)) {
            yield ind;
        }

        // for (const ind of this.generateByAddingNGram(solution)) {
        //     yield ind;
        // }
    }

    public * generateByRemovingNodes(solution: Individual) {
        const nodes = solution.getNodes();

        // Removing a node
        for (const node of nodes) {
            if (solution.isTheRootNode(node)) { continue; }
            if (node.is(NodeTypes.terminal) && node.toString() == '') { continue; }

            const neo = this.factory.removeNode(solution, node);
            if (neo.isValid()) { yield neo; }
        }
    }

    public * generateByAddingStartOperator(solution: Individual) {
        // Let's get all OR operators first
        const orNodes = solution.getFuncs().filter((func) => func instanceof OrFunc) as OrFunc[];

        if (orNodes.length == 0) {
            // No or nodes. Ok. Let's add a single start operator to the first terminal and that's it
            for (const terminal of solution.getTerminals()) {
                if (terminal.value == '') { continue; }

                const neo = this.factory.addStartOperatorToTerminal(solution, terminal);
                if (neo.isValid()) {
                    yield neo;
                    break;
                }
            }
        } else {
            // Ok. Let's add a start operator to last terminal together with the OR
            for (const orNode of orNodes) {
                for (const side of ['left', 'right']) {
                    const terminal = orNode.getFirstTerminalFrom(side as any);
                    if (!terminal) { break; }

                    const neo = this.factory.addStartOperatorToTerminal(solution, terminal);
                    if (neo.isValid()) {
                        yield neo;
                    }
                }
            }
        }
    }

    public * generateByAddingEndOperator(solution: Individual) {
        // Let's get all OR operators first
        const orNodes = solution.getFuncs().filter((func) => func instanceof OrFunc) as OrFunc[];

        if (orNodes.length == 0) {
            // No or nodes. Ok. Let's add a single start operator to the last terminal and that's it
            const terminals = solution.getTerminals();
            do {
                const terminal = terminals.pop();
                if (!terminal) { break; }

                if (terminal.value == '') { continue; }

                const neo = this.factory.addEndOperatorToTerminal(solution, terminal);
                if (neo.isValid()) {
                    yield neo;
                    break;
                }
            } while (true);
        } else {
            // Ok. Let's add a start operator to last terminal together with the OR
            for (const orNode of orNodes) {
                for (const side of ['left', 'right']) {
                    const terminal = orNode.getLastTerminalFrom(side as any);
                    if (!terminal) { break; }

                    const neo = this.factory.addEndOperatorToTerminal(solution, terminal);
                    if (neo.isValid()) {
                        yield neo;
                    }
                }
            }
        }
    }

    public * generateBySwapping(solution: Individual) {
        const terminals = solution.getTerminals();

        // Replacing / Swap
        for (const terminal of terminals) {
            if (terminal.value == '') { continue; }

            for (const char of this.program.validLeftChars) {
                const neo = this.factory.replaceNode(solution, terminal, new Terminal(char));
                if (neo.isValid() && neo.toString() !== solution.toString()) { yield neo; }
            }

            for (const specialChar of this.specialChars) {
                const neo = this.factory.replaceNode(solution, terminal, new Terminal(specialChar));
                if (neo.isValid() && neo.toString() !== solution.toString()) { yield neo; }
            }
        }
    }

    public * generateByConcatenating(solution: Individual) {
        // Concatenating
        for (const node of solution.getNodes()) {
            if (solution.isTheRootNode(node)) { continue; }
            if (node.is(NodeTypes.terminal) && node.toString() == '') { continue; }

            for (const char of this.program.validLeftChars) {
                const neo = this.factory.concatenateToNode(solution, node, new Terminal(char));
                if (neo.isValid()) { yield neo; }
            }

            for (const char of this.specialChars) {
                const neo = this.factory.concatenateToNode(solution, node, new Terminal(char));
                if (neo.isValid()) { yield neo; }
            }
        }
    }

    public getAllRanges(): RangeFunc[] {
        const ranges: RangeFunc[] = [];
        const chars = Object.assign([], this.program.validLeftChars).sort();

        for (const c1 of chars) {
            for (const c2 of chars) {
                if (c1 >= c2) { continue; }
                const func = new RangeFunc();

                func.from = c1;
                func.to = c2;

                ranges.push(func);
            }
        }

        return ranges;
    }

    public * generateByAddingRangeOperator(solution: Individual) {
        // Operator: Range
        for (const node of solution.getNodes()) {
            if (node.is(NodeTypes.terminal) && node.toString() == '') { continue; }
            if (node === solution.tree) { continue; }

            for (const range of this.getAllRanges()) {
                let neo = this.factory.replaceNode(solution, node, range);
                if (neo.isValid()) { yield neo; }

                neo = this.factory.concatenateToNode(solution, node, range);
                if (neo.isValid()) { yield neo; }
            }
        }
    }

    public * generateByAddingNegationOperator(solution: Individual) {
        // Operator: Negation
        for (const node of solution.getNodes()) {
            if (node.toString() == '') { continue; }
            if (node === solution.tree) { continue; }

            for (const char of this.program.rightCharsNotInLeft) {
                const func = new ListFunc([new Terminal(char)], 'negative');

                let neo = this.factory.replaceNode(solution, node, func);
                if (neo.isValid()) { yield neo; }

                neo = this.factory.concatenateToNode(solution, node, func);
                if (neo.isValid()) { yield neo; }

                if (node.is(FuncTypes.list) && (node as ListFunc).negative) {
                    neo = this.factory.appendToNode(solution, node, func);
                    if (neo.isValid()) { yield neo; }
                }
            }
        }
    }

    // tslint:disable-next-line variable-name
    public * generateByAddingGivenOperator(solution: Individual, FuncClass: any) {
        const nodes = solution.getNodes();

        // Operators: zeroOrMore, oneOrMore, anyChar and optional
        const func = new FuncClass();
        let neo: Individual;
        for (const node of nodes) {
            if (node.is(NodeTypes.terminal) && node.toString() == '') { continue; }
            if (node === solution.tree) { continue; }

            neo = this.factory.replaceNode(solution, node, func);
            if (neo.isValid()) { yield neo; }

            neo = this.factory.concatenateToNode(solution, node, func);
            if (neo.isValid()) { yield neo; }
        }

        neo = this.factory.appendAtEnd(solution, func);
        if (neo.isValid()) { yield neo; }
    }

    public * generateByAddingBackrefOperator(solution: Individual) {
        const alreadyGenerated: string[] = [];

        // Operator: Backref
        for (const node of solution.getNodes()) {
            if (node.toString() === '') { continue; }

            const nodeIsWrappedByGroup = this.factory.isNodeWrappedByGroup(node, solution);
            if (nodeIsWrappedByGroup) { continue; }

            const current = this.factory.wrapNodeWithGroup(solution, node);
            const length = new Set(current.getFuncs().filter((func) => func.is(FuncTypes.group))).size;

            // We loop for each group in the current solution to add a backref to each
            for (let i = 1; i <= length; i++) {
                for (const localNode of current.getNodes()) {
                    if (localNode.toString() === '') { continue; }

                    const localNodeIsWrappedByGroup = this.factory.isNodeWrappedByGroup(localNode, current);
                    if (localNodeIsWrappedByGroup) { continue; }

                    const neo = this.factory.addBackref(current, localNode, i);

                    if (alreadyGenerated.includes(neo.toString())) {
                        continue;
                    }

                    if (!this.isValidBackref(neo.toString(), i)) {
                        continue;
                    }

                    alreadyGenerated.push(neo.toString());
                    if (neo.isValid()) { yield neo; }
                }
            }
        }
    }

    public isValidBackref(str: string, i: number): boolean {
        const groups = Utils.times(i, () => `\\(.*\\)`).join('.*');
        const regex = new RegExp(`^.*${groups}.*\\\\${i}`, "g");
        return regex.test(str);
    }

    public * generateByExtractingSingleNode(solution: Individual) {
        for (const node of solution.getNodes()) {
            if (solution.isTheRootNode(node)) { continue; }
            if (node.toString() === '') { continue; }

            try {
                const neo = this.factory.createFromString(node.toString());
                if (neo.isValid()) {
                    yield neo;
                } else {
                    // Logger.error(`[Invalid generateByExtractingSingleNode]`, neo.toLog());
                }
            } catch (e) {
                // todo: log the invalid
                Logger.error(`[Neighborhood error]`, e.message);
            }
        }
    }

    public * generateByAddingLookahead(solution: Individual) {
        for (const terminal of solution.getTerminals()) {
            if (terminal.toString() === '') { continue; }

            for (const char of this.program.leftCharsNotInRight) {
                const lookahead = new LookaheadFunc([new Terminal(char)], 'positive');
                const neo = this.factory.concatenateToNode(solution, terminal, lookahead);
                if (neo.isValid()) { yield neo; }
            }

            for (const char of this.program.rightCharsNotInLeft) {
                const lookahead = new LookaheadFunc([new Terminal(char)], 'negative');
                const neo = this.factory.concatenateToNode(solution, terminal, lookahead);
                if (neo.isValid()) { yield neo; }
            }
        }
    }

    public * generateByAddingLookbehind(solution: Individual) {
        for (const terminal of solution.getTerminals()) {
            if (terminal.toString() === '') { continue; }

            for (const char of this.program.leftCharsNotInRight) {
                const lookahead = new LookbehindFunc([new Terminal(char)], 'positive');
                const neo = this.factory.concatenateToNode(solution, terminal, lookahead);
                if (neo.isValid()) { yield neo; }
            }

            for (const char of this.program.rightCharsNotInLeft) {
                const lookahead = new LookbehindFunc([new Terminal(char)], 'negative');
                const neo = this.factory.concatenateToNode(solution, terminal, lookahead);
                if (neo.isValid()) { yield neo; }
            }
        }
    }

    public * generateByConcatenatingFromRightChars(solution: Individual) {
        const nodes = solution.getNodes();

        // Operator: Concatenation (but from right chars not in left)
        for (const char of this.program.rightCharsNotInLeft) {
            for (const node of nodes) {
                if (node.is(NodeTypes.terminal) && node.toString() == '') { continue; }
                const neo = this.factory.concatenateToNode(solution, node, new Terminal(char));
                if (neo.isValid()) { yield neo; }
            }
        }
    }

    public * generateByAddingNGram(solution: Individual) {
        for (const ngram of this.program.ngrams) {
            const neo = solution.clone();
            const node = this.program.factory.createFromString(ngram).tree;
            neo.tree = new OrFunc(neo.tree.clone(), node);
            yield neo;
        }
    }
}
