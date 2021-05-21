import { Utils } from "../Utils";
import { FuncTypes } from "./Func";
import { Node, NodeTypes } from "./Node";

export class Terminal implements Node {
    private static charsToBeEscapted = '^$\\.*+?()[]{}|'.split('');

    public readonly nodeType = NodeTypes.terminal;

    constructor(public value: string = '') {
        // pass
    }

    public toString(): string {
        const value = this.value.toString();
        return Terminal.charsToBeEscapted.indexOf(value) >= 0 ? '\\' + value : value;
    }

    public toDot(i: number): string {
        return `n${i} [ label = "${this.toString()}" ]`;
    }

    public toRegex(): RegExp {
        return new RegExp(this.toString());
    }

    public clone(): Terminal {
        const terminal = new Terminal(this.value);
        return terminal;
    }

    public is(type: NodeTypes): boolean {
        return type == NodeTypes.terminal;
    }

    public equals(node: Node): boolean {
        if (node instanceof Terminal) {
            if (node.nodeType !== this.nodeType) { return false; }
            if (node.value !== this.value) { return false; }
            return true;
        }

        return false;
    }

    public asFunc(): never {
        throw new Error(`Cannot convert Terminal to Function!`);
    }

    public isEmpty() {
        return this.value === '';
    }

    public addHistory(funcName: string, operatorName: string, fromNode: string) {
        return;
    }
}
