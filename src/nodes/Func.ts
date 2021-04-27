import { Node, NodeTypes } from "./Node";
import { Terminal } from "./Terminal";

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
    lookahead = "(?•)",
    lookbehind = "(?<•)",
}

export abstract class Func implements Node {

    public static get options(): FuncTypes[] {
        if (!Func._options) { Func._options = Object.keys(FuncTypes).map((key) => (FuncTypes as any)[key]); }
        return Func._options as FuncTypes[];
    }

    // tslint:disable-next-line:variable-name
    public static Types = FuncTypes;
    protected static _options: string[] = null;
    public type: FuncTypes = FuncTypes.concatenation;
    public nodeType: NodeTypes = NodeTypes.func;

    public constructor(public children: Node[] = []) {}

    public toString(): string {
        return this.children.map((child) => child.toString()).join('');
    }

    public childrenToString(): string {
        return this.children.map((child) => child.toString()).join('');
    }

    public addChild(child: Node) {
        this.children.push(child);
    }

    public is(type: NodeTypes | FuncTypes): boolean {
        if (type == this.nodeType) { return true; }
        return type == this.type;
    }

    public notIn(types: FuncTypes[]): boolean {
        return types.every((type) => this.is(type));
    }

    public hasTheChild(node: Node): boolean {
        return this.children.indexOf(node) !== -1;
    }

    public removeChild(node: Node) {
        const index = this.children.indexOf(node);
        this.children.splice(index, 1);
    }

    public clone(): Func {
        const func = new (this.constructor as any)();
        func.children = this.children.map((child) => child.clone());
        return func;
    }

    public toDot(i: number): string {
        const j = i;
        const result: string[] = [`n${j} [ label = "${this.type}" ]`];

        i += 1;
        for (const node of this.children) {
            result.push(`n${j} -> n${i}`);
            const str = node.toDot(i);
            result.push(str);
            i += (str.match(/label/g) || []).length;
        }

        return result.join('; ');
    }

    public swapChild(oldNode: Node, newNode: Node) {
        const index = this.children.indexOf(oldNode);
        if (index === -1) { throw new Error('[Func.swapChild] Invalid child'); }

        this.children.splice(index, 1, newNode);
    }

    public toRegex(): RegExp {
        return new RegExp(this.toString());
    }

    public getLeastTerminal(): Terminal {
        const nodes = this.getNodes();

        let node = nodes.pop();
        while (node) {
            if (node instanceof Terminal) {
                return node;
            }

            node = nodes.pop();
        }

        return null;
    }

    public getLeastFunc(): Func {
        const nodes = this.getNodes();

        let node = nodes.pop();
        while (node) {
            if (node instanceof Func) {
                return node;
            }

            node = nodes.pop();
        }

        return null;
    }

    public getNodes(): Node[] {
        let nodes: Node[] = [];

        for (const child of this.children) {
            nodes.push(child);
            if (child instanceof Func) {
                nodes = nodes.concat(child.getNodes());
            }
        }

        return nodes;
    }

    public getTerminals(): Terminal[] {
        const nodes: Terminal[] = [];
        this.getNodes().forEach((node) => {
            if (node instanceof Terminal) { nodes.push(node); }
        });
        return nodes;
    }

    public getFuncs(): Func[] {
        const nodes: Func[] = [this];
        this.getNodes().forEach((node) => {
            if (node instanceof Func) { nodes.push(node); }
        });
        return nodes;
    }

    public equals(node: Node): boolean {
        if (node instanceof Func) {
            if (node.nodeType !== this.nodeType) { return false; }
            if (node.type !== this.type) { return false; }
            if (node.toString() !== this.toString()) { return false; }
            return true;
        }

        return node.toString() === this.toString();
    }

    public asFunc(): Func {
        return this;
    }

    public isEmpty() {
        return false;
    }

    public getFirstTerminal(): Terminal {
        const nodes = this.getNodes();

        let node = nodes.shift();
        while (node) {
            if (node instanceof Terminal) {
                return node;
            }

            node = nodes.shift();
        }

        return null;
    }
}
