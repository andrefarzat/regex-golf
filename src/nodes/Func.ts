import Node, {NodeTypes} from "./Node";
import Terminal from "./Terminal";
import Utils from "../Utils";

import AnyCharFunc from './AnyCharFunc';
import GroupFunc from "./GroupFunc";
import LineEndFunc from "./LineEndFunc";
import LineBeginFunc from "./LineBeginFunc";
import RepetitionFunc from "./RepetitionFunc";
import OneOrMoreFunc from "./OneOrMoreFunc";
import ZeroOrMoreFunc from "./ZeroOrMore";
import OrFunc from "./OrFunc";
import ConcatFunc from "./ConcatFunc";
import ListFunc from "./ListFunc";


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


export default abstract class Func implements Node {
    public type: FuncTypes = FuncTypes.concatenation;
    public nodeType: NodeTypes = NodeTypes.func;

    public static Types = FuncTypes;

    public static Concat = ConcatFunc;
    public static AnyChar = AnyCharFunc;
    public static Group = GroupFunc;
    public static LineBegin = LineBeginFunc;
    public static LineEnd = LineEndFunc;
    public static Repetition = RepetitionFunc;
    public static OneOrMore = OneOrMoreFunc;
    public static ZeroOrMore = ZeroOrMoreFunc;
    public static Or = OrFunc;
    public static List = ListFunc;

    protected static _options: string[] = null;

    public static get options(): FuncTypes[] {
        if (!Func._options) { Func._options = Object.keys(FuncTypes).map(key => (FuncTypes as any)[key]); }
        return Func._options as FuncTypes[];
    }

    public constructor(public children: Node[] = []) {}

    public toString(): string {
        return this.children.map(child => child.toString()).join('');
    }

    public addChild(child: Node) {
        this.children.push(child);
    }

    public is(type: NodeTypes | FuncTypes): boolean {
        if (type == this.nodeType) return true;
        return type == this.type;
    }

    public notIn(types: FuncTypes[]): boolean {
        return types.every(type => this.is(type));
    }

    public hasTheChild(node: Node): boolean {
        return this.children.indexOf(node) != -1;
    }

    public removeChild(node: Node) {
        let index = this.children.indexOf(node);
        this.children.splice(index, 1);
    }

    public clone(): Func {
        let func = new (this.constructor as any)();
        func.children = this.children.map(child => child.clone());
        return func;
    }

    public toDot(i: number): string {
        let j = i;
        let result: string[] = [`n${j} [ label = "${this.type}" ]`];

        i += 1;
        for (let node of this.children) {
            result.push(`n${j} -> n${i}`);
            let str = node.toDot(i);
            result.push(str);
            i += (str.match(/label/g) || []).length;
        }

        return result.join('; ');
    }

    public swapChild(oldNode: Node, newNode: Node) {
        let index = this.children.indexOf(oldNode);
        if (index === -1) throw new Error('[Func.swapChild] Invalid child');

        this.children.splice(index, 1, newNode);
    }

    public toRegex(): RegExp {
        return new RegExp(this.toString());
    }

    public getLeastTerminal(): Terminal {
        let nodes = this.getNodes();

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
        let nodes = this.getNodes();

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

        for (let child of this.children) {
            nodes.push(child);
            if (child instanceof Func) {
                nodes = nodes.concat(child.getNodes());
            }
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

    public isEmpty() {
        return false;
    }
}