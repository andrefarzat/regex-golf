import * as moment from 'moment';

import Func, { FuncTypes } from "../nodes/Func";
import Terminal from "../nodes/Terminal";
import Node, { NodeTypes } from "../nodes/Node";
import NodeShrinker from '../NodeShrinker';
import Utils from "../Utils";
import ConcatFunc from '../nodes/ConcatFunc';


export default class Individual {
    protected _string: string;
    public id = Utils.getNextId();
    public tree: Func;
    public matchesOnLeft: number = 0;
    public matchesOnRight: number = 0;
    public leftPoints: number = 0;
    public rightPoints: number = 0;
    public evaluationStartTime?: Date;
    public evaluationEndTime?: Date;

    public evaluationIndex: number = undefined;

    public readonly COMPLEX_FUNC_TYPES = [FuncTypes.backref, FuncTypes.oneOrMore, FuncTypes.zeroOrMore];

    public createdDate = new Date();
    public hasTimedOut = false;

    public invalidRegexes = ['^', '.*', '^.*',  '.*$', '.+', '.+$', '$', '+?', '[]', '[^]', `\b`];

    public get isEvaluated(): boolean {
        return this.evaluationIndex != undefined;
    }

    public get fitness(): number {
        return this.matchesOnLeft - this.matchesOnRight;
    }

    public get evaluationTime(): number {
        if (!this.evaluationEndTime) return 0;
        return moment(this.evaluationEndTime).diff(this.evaluationStartTime, 'millisecond');
    }

    public toCSV(withDot: boolean = false): string {
        let arr = [
            this.toString(),
            this.shrink().toString(),
            this.fitness,
            this.evaluationIndex,
        ];

        if (withDot) arr.push(this.toDot());

        return arr.join(',');
    }

    public toString(): string {
        if (this._string === undefined) this._string = this.tree.toString();
        return this._string;
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

        let str = this.toString();
        if (str.length == 0) return false;
        if (str.substr(0, 1) == '|') return false;
        if (str.substr(-1) == '|') return false;
        if (this.invalidRegexes.includes(str)) return false;
        if (/\[\^[^\]]*\[\^/.test(str)) { return false; }

        return true;
    }

    public hasComplexEvaluation(): boolean {
        return this.tree.getFuncs().some(func => this.COMPLEX_FUNC_TYPES.includes(func.type));
    }

    public clone(): Individual {
        let ind = new Individual();
        ind.tree = this.tree.clone();
        ind.leftPoints = this.leftPoints;
        ind.rightPoints = this.rightPoints;
        ind.matchesOnLeft = this.matchesOnLeft;
        ind.matchesOnRight = this.matchesOnRight;
        return ind;
    }

    public getParentsOf(node: Node): Func[] {
        let parents: Func[] = [];

        do {
            let parent = this.getParentOf(node);
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
        let funcs = this.getFuncs();

        for (let func of funcs) {
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

    public shrink(): Individual {
        let ind = new Individual();
        let node = NodeShrinker.shrink(this.tree);

        if (node.nodeType === 'terminal') {
            let func = new ConcatFunc([node]);
            node = func;
        }

        ind.tree = node as Func;
        return ind;
    }
}
