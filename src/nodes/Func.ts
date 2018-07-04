import Node, {NodeTypes} from "./Node";
import Terminal from "./Terminal";
import Utils from "../Utils";


export enum FuncTypes {
    concatenation = "•",
    or = "•|•",
    lineBegin = "^•",
    lineEnd = "•$",
    zeroOrMore = "•*",
    oneOrMore = "•+",
    group = "(•)",
    list = "[•]",
    negation = "[^•]",
    range = "[•-•]",
    repetition = "•{#}",
    anyChar = '.•',
    optional = '•?',
    backref = "\\#•",
    wordBoundary = "\\b•",
}


export default class Func implements Node {
    public static placeholder: FuncTypes = FuncTypes.concatenation;
    public static Types = FuncTypes;
    protected static _options: string[] = null;

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
        this.left = left ? left : new Terminal();
        this.right = right ? right : new Terminal();
    }

    public is(type: NodeTypes | FuncTypes): boolean {
        if (type == this.nodeType) return true;
        return type == this.type;
    }

    public toString(): string {
        let left  = this.left ? this.left.toString() : '';
        let right = this.right ? this.right.toString() : '';

        switch (this.type) {
            case FuncTypes.or: return left + "|" + right;
            case FuncTypes.list: return this.type.replace(Func.placeholder, left) + right;
            case FuncTypes.negation: return this.type.replace(Func.placeholder, left) + right;
            case FuncTypes.range: throw new Error('It should be an RangeFunc instance');
            case FuncTypes.repetition: throw new Error('It should be an RepetitionFunc instance');
        }

        let txt = left + right;
        return this.type.replace(Func.placeholder, txt);
    }

    public toDot(i: number): string {
        let j = i;
        let result: string[] = [`n${j} [ label = "${this.type}" ]`];

        i += 1;
        if (this.left) {
            result.push(`n${j} -> n${i}`);
            let str = this.left.toDot(i);
            result.push(str);
            i += (str.match(/label/g) || []).length;
        }

        if (this.right) {
            result.push(`n${j} -> n${i}`);
            result.push(this.right.toDot(i));
        }

        return result.join('; ');
    }

    public toRegex(): RegExp {
        return new RegExp(this.toString());
    }

    public clone(): Func {
        let func = new Func();
        func.left = this.left.clone();
        func.right = this.right.clone();
        func.type = this.type;
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
