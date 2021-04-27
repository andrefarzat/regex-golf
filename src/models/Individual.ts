import * as moment from 'moment';

import { ConcatFunc } from '../nodes/ConcatFunc';
import { Func, FuncTypes } from "../nodes/Func";
import { Node, NodeTypes } from "../nodes/Node";
import { Terminal } from "../nodes/Terminal";
import { NodeShrinker } from '../shrinker/NodeShrinker';
import { Utils } from "../Utils";
import { OrFunc } from '../nodes/OrFunc';
import { ListFunc } from '../nodes/ListFunc';
import { ILogger } from '../loggers/ILogger';

export interface IndividualOrigin {
    name: string;
    args: string[]
}

export class Individual {
    private static weight = 10;

    public static setWeight(weight: number) {
        Individual.weight = weight;
    }

    public static getWeight() {
        return Individual.weight;
    }

    public get isEvaluated(): boolean {
        return this.evaluationIndex != undefined;
    }

    public get simpleFitness(): number {
        return this.matchesOnLeft - this.matchesOnRight;
    }

    public get fitness(): number {
        return (Individual.weight * (this.matchesOnLeft - this.matchesOnRight)) - this.toString().length;
    }

    public get evaluationTime(): number {
        if (!this.evaluationEndTime) { return 0; }
        return moment(this.evaluationEndTime).diff(this.evaluationStartTime, 'millisecond');
    }

    public id = Utils.getNextId();
    public tree: Func;
    public matchesOnLeft: number = 0;
    public matchesOnRight: number = 0;
    public leftPoints: number = 0;
    public rightPoints: number = 0;
    public evaluationStartTime?: Date;
    public evaluationEndTime?: Date;
    public origin: {name: string; args: string[]}[] = [];

    public evaluationIndex: number = undefined;

    public readonly COMPLEX_FUNC_TYPES = [FuncTypes.backref, FuncTypes.oneOrMore, FuncTypes.zeroOrMore];

    public createdDate = new Date();
    public hasTimedOut = false;

    public invalidRegexes = ['^', '.*', '^.*',  '.*$', '.+', '.+$', '$', '+?', '[]', '[^]', `\b`];

    public addOrigin(name: string | IndividualOrigin, args: string[] = []) {
        if (typeof name === 'string') {
            this.origin.push({ name, args });
        } else {
            this.origin.push(name);
        }
    }

    public toCSV(withDot: boolean = false): string {
        const arr = [
            this.toString(),
            this.shrink().toString(),
            this.fitness,
            this.evaluationIndex,
        ];

        if (withDot) { arr.push(this.toDot()); }

        return arr.join(',');
    }

    public toString(): string {
        return this.tree.toString();
    }

    public toLog(): string {
        return `${this.toString()} [fitness: ${this.fitness}]`;
    }

    public toJSON() {
        return {
            regex: this.toString(),
            evaluationIndex: this.evaluationIndex,
            fitness: this.fitness,
            matchesOnLeft: this.matchesOnLeft,
            matchesOnRight: this.matchesOnRight,
            evaluationTime: this.evaluationTime,
        };
    }

    public toDot(): string {
        return this.tree.toDot(1);
    }

    public toRegex(): RegExp {
        return this.tree.toRegex();
    }

    public test(name: string): boolean {
        return this.tree.toRegex().test(name);
    }

    public isValid(): boolean {
        try {
            this.toRegex();
        } catch {
            return false;
        }

        const str = this.toString();
        if (str.length == 0) { return false; }
        if (str.substr(0, 1) == '|') { return false; }
        if (str.substr(-1) == '|') { return false; }
        if (this.invalidRegexes.includes(str)) { return false; }
        if (/\[\^[^\]]*\[\^/.test(str)) { return false; }
        if (/^\\n/.test(str)) { return false; }
        if (/\/\?/.test(str)) { return false; }
        if (this.hasComplexEvaluation()) { return false; }

        return true;
    }

    public isTheRootNode(node: Node): boolean {
        return this.tree == node;
    }

    public hasComplexEvaluation(): boolean {
        const funcs = this.tree.getFuncs();
        const ors = funcs.filter((func) => func.is(FuncTypes.or)) as OrFunc[];

        if (ors.length === 0) {
            return this.hasMoreThanOneComplexFuncType(this.tree);
        }

        for (const or of ors) {
            if (or.left.is(NodeTypes.func) && this.hasMoreThanOneComplexFuncType(or.left.asFunc())) {
                return true;
            }

            if (or.right.is(NodeTypes.func) && this.hasMoreThanOneComplexFuncType(or.right.asFunc())) {
                return true;
            }
        }

        return false;
    }

    public hasMoreThanOneComplexFuncType(func: Func): boolean {
        const nodes = func.getFuncs().filter((f) => this.COMPLEX_FUNC_TYPES.includes(f.type));
        return nodes.length > 1;
    }

    public clone(): Individual {
        const ind = new Individual();
        ind.tree = this.tree.clone();
        ind.leftPoints = this.leftPoints;
        ind.rightPoints = this.rightPoints;
        ind.matchesOnLeft = this.matchesOnLeft;
        ind.matchesOnRight = this.matchesOnRight;
        ind.origin = JSON.parse(JSON.stringify(this.origin));
        return ind;
    }

    public getParentsOf(node: Node): Func[] {
        const parents: Func[] = [];

        do {
            const parent = this.getParentOf(node);
            if (parent) {
                parents.unshift(parent);
                node = parent;
            } else {
                break;
            }
        } while (true);

        return parents;
    }

    public getParentOf(node: Node): Func | undefined {
        const funcs = this.getFuncs();

        for (const func of funcs) {
            if (func.hasTheChild(node)) {
                return func;
            }
        }

        return undefined;
    }

    public getNodes(): Node[] {
        let nodes: Node[] = [this.tree];

        if (this.tree.is(NodeTypes.func)) {
            nodes = nodes.concat(this.tree.getNodes());
        }

        return nodes;
    }

    public getFuncs(): Func[] {
        let funcs: Func[] = [];

        if (this.tree.is(NodeTypes.func)) {
            funcs = [].concat(this.tree.getFuncs());
        }

        return funcs;
    }

    public getTerminals(): Terminal[] {
        return this.tree.getTerminals();
    }

    public isBetterThan(ind: Individual): boolean {
        if (!this.isEvaluated || !ind.isEvaluated) {
            throw new Error('Individual must have been evaluated');
        }

        if (this.fitness > ind.fitness) {
            return true;
        }

        if (this.fitness == ind.fitness) {
            if (this.toString().length < ind.toString().length) {
                return true;
            }
        }

        return false;
    }

    public shrink(logger: ILogger = null): Individual {
        if (logger) {
            logger.logInitShrinker(this);
            NodeShrinker.setLogger(logger);
        }

        const ind = NodeShrinker.shrinkIndividual(this);
        ind.addOrigin('shrink', []);

        if (logger) {
            logger.logFinishShrinker(this, ind);
        }

        return ind;
    }

    public fix(): Individual {
        Utils.pauseCountingNextId();
        const ind = new Individual();
        ind.tree = this.tree.clone();
        Utils.continueCountingNextId();

        ind.tree.children = ind.tree.children.map(child => {
            if (child instanceof ListFunc) { return NodeShrinker.shrinkFunc(child)[0]; }
            return child.clone();
        });

        return ind;
    }
}
