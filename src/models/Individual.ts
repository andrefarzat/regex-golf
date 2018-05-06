import Func from "../nodes/Func";
import Terminal from "../nodes/Terminal";
import Node from "../nodes/Node";
import NodeShrinker from '../NodeShrinker';
import Logger from '../Logger';
import Utils from "../Utils";


export default class Individual {
    public id = Utils.getNextId();
    public tree: Func;
    public leftFitness: number = 0;
    public rightFitness: number = 0;
    public evaluationIndex: number = undefined;
    public createdDate = new Date();

    public get isEvaluated(): boolean {
        return this.evaluationIndex != undefined;
    }

    public get fitness(): number {
        return this.leftFitness + this.rightFitness;
    }

    public toCSV(withDot: boolean = false): string {
        let arr = [
            this.toString(),
            this.fitness,
            this.evaluationIndex,
        ];

        if (withDot) arr.push(this.toDot());

        return arr.join(',');
    }

    public toString(): string {
        return this.tree.toString();
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
        if (str.substr(-1) == '|') return false;
        return true;
    }

    public clone(): Individual {
        let ind = new Individual();
        ind.tree = this.tree.clone();
        ind.leftFitness = this.leftFitness;
        ind.rightFitness = this.rightFitness;
        return ind;
    }

    public getParentOf(node: Node): {func: Func, side: 'left' | 'right'} {
        let funcs = this.getFuncs();

        for(let i = 0; i < funcs.length; i ++) {
            let current = funcs[i];
            if (current.left  === node) return {func: current, side: 'left'};
            if (current.right === node) return {func: current, side: 'right'};
        }

        return null;
    }

    public getNodes(): Node[] {
        let nodes: Node[] = [this.tree];
        nodes = nodes.concat(this.tree.getNodes());
        return nodes;
    }

    public getFuncs(): Func[] {
        let funcs: Func[] = [this.tree];
        funcs = funcs.concat(this.tree.getFuncs());
        return funcs;
    }

    public getTerminals(): Terminal[] {
        return this.tree.getTerminals();
    }

    public isBetterThan(ind: Individual): boolean {
        if (this.fitness > ind.fitness) {
            // Logger.log(3, `[Found better ${this.toString()}] from fitness ${ind.fitness} to ${this.fitness}`);
            return true;
        }

        if (this.fitness == ind.fitness) {
            if (this.toString().length < this.toString().length) {
                // Logger.log(3, `[Found shorter ${this.toString()}] from length ${ind.toString().length} to ${this.toString().length}`);
                return true;
            }

            if (this.leftFitness > ind.leftFitness) {
                // Logger.log(3, `[Found better left fitness ${this.toString()}] from ${ind.leftFitness} to ${this.leftFitness}`);
                return true;
            }
        }

        return false;
    }

    public shrink(): Individual {
        let ind = new Individual();
        let node = NodeShrinker.shrink(this.tree);

        if (node.nodeType === 'terminal') {
            let func = new Func();
            func.type = Func.Types.concatenation;
            func.left = new Terminal('');
            func.right = node;
            node = func;
        }

        ind.tree = node as Func;
        return ind;
    }
}
