import Node, {NodeTypes} from "./Node";
import Utils from "../Utils";
import { FuncTypes } from "./Func";


export default class Terminal implements Node {
    private static charsToBeEscapted = '^$\\.*+?()[]{}|'.split('');

    constructor(public value: string = '') {
        // pass
    }

    public readonly nodeType = NodeTypes.terminal;

    public toString(): string {
        let value = this.value.toString();
        return Terminal.charsToBeEscapted.indexOf(value) >= 0 ? '\\' + value : value;
    }

    public toDot(i: number): string {
        return `n${i} [ label = "${this.toString()}" ]`;
    }

    public toRegex(): RegExp {
        return new RegExp(this.toString());
    }

    public clone(): Terminal {
        let terminal = new Terminal(this.value);
        return terminal;
    }

    public is(type: NodeTypes): boolean {
        return type == NodeTypes.terminal;
    }

    public equals(node: Node): boolean {
        if (node instanceof Terminal) {
            if (node.nodeType !== this.nodeType) return false;
            if (node.value !== this.value) return false;
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
}
