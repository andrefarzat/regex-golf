import Node, {NodeTypes} from "./Node";
import Terminal from "./Terminal";
import Utils from "../Utils";


export enum FuncTypes {
    concatenation = "•",
    or = "•|•",
    lineBegin = "^•",
    lineEnd = "•$",
    zeroOrMore = "•*+",
    oneOrMore = "•?+",
    group = "(•)",
    list = "[•]",
    negation = "[^•]",
    more = "•++",
    repetition = "•{#}"
}


export default class Func implements Node {
    public static placeholder: FuncTypes = FuncTypes.concatenation;
    public static Types = FuncTypes;
    private static _options: string[] = null;
    public repetitionNumber: string = '1';

    public static get options(): FuncTypes[] {
        if (!Func._options) { Func._options = Object.keys(FuncTypes).map(key => (FuncTypes as any)[key]); }
        return Func._options as FuncTypes[];
    }

    public left: Node;
    public right: Node;
    public type: FuncTypes = Func.placeholder;
    public readonly nodeType = NodeTypes.func;

    public constructor(type?: FuncTypes, left?: Node, right?: Node) {
        if (type) this.type = type;
        if (left) this.left = left;
        if (right) this.right = right;
    }

    public mutate(values: string[]): void {
        this.type = Utils.getRandomlyFromList(Func.options);
        this.repetitionNumber = this.type == FuncTypes.repetition ? Utils.nextInt(9).toString() : '0';
    }

    public is(type: NodeTypes | FuncTypes): boolean {
        if (type == this.nodeType) return true;
        return type == this.type;
    }

    public toString(): string {
        let left  = this.left ? this.left.toString() : '';
        let right = this.right ? this.right.toString() : '';

        if (this.type == FuncTypes.or) {
            return left + "|" + right;
        }

        if (this.type == FuncTypes.repetition) {
            if (this.repetitionNumber === '1') {
                return `${left}${right}`;
            } else if (this.repetitionNumber === '2') {
                return `${left}${left}${right}`;
            } else if (this.repetitionNumber === '3') {
                return `${left}${left}${left}${right}`;
            } else {
                return `${left}{${this.repetitionNumber}}${right}`;
            }
        }

        let txt = left + right;
        return this.type.replace(Func.placeholder, txt);
    }

    public toRegex(): RegExp {
        return new RegExp(this.toString());
    }

    public clone(): Func {
        let func = new Func();
        func.left = this.left.clone();
        func.right = this.right.clone();
        func.type = this.type;
        func.repetitionNumber = this.repetitionNumber;
        return func;
    }

    public getLeastTerminal(): Terminal {
        let current: Node = this.right;
        while (current instanceof Func) {
            current = current.right;
        }
        return current as Terminal;
    }

    public getLeastFunc(): Func {
        if (this.right instanceof Terminal) {
            return this;
        }

        let current: Func = this.right as Func;
        while (!(current.right instanceof Terminal)) {
            current = current.right as Func;
        }

        return current;
    }

    public getNodes(): Node[] {
        let nodes: Node[] = [];

        nodes.push(this.left);
        if (this.left instanceof Func) {
            nodes = nodes.concat(this.left.getNodes());
        }

        nodes.push(this.right);
        if (this.right instanceof Func) {
            nodes = nodes.concat(this.right.getNodes());
        }

        return nodes;
    }

    public getTerminals(): Terminal[] {
        let nodes: Terminal[] = [];
        this.getNodes().forEach(node => {
            if (node instanceof Terminal) nodes.push(node);
        });
        return nodes;
    }

    public getFuncs(): Func[] {
        let nodes: Func[] = [this];
        this.getNodes().forEach(node => {
            if (node instanceof Func) nodes.push(node);
        });
        return nodes;
    }

    public equals(node: Node): boolean {
        if (node instanceof Func) {
            if (node.nodeType !== this.nodeType) return false;
            if (node.type !== this.type) return false;
            if (node.toString() !== this.toString()) return false;
            return true;
        }

        return false;
    }

    public asFunc(): Func {
        return this;
    }
}
