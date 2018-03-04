import Node, {NodeTypes} from "./Node";
import Utils from "../Utils";


export default class Terminal implements Node {
    private static charsToBeEscapted = '^$\\.*+?()[]{}|'.split('');

    constructor(public value: string = '') {
        // pass
    }

    public readonly nodeType = NodeTypes.terminal;

    public mutate(values: string[]): void {
        this.value = Utils.getRandomlyFromList(values);
    }

    public toString(): string {
        let value = this.value.toString();
        return Terminal.charsToBeEscapted.indexOf(value) >= 0 ? '\\' + value : value;
    }

    public toRegex(): RegExp {
        return new RegExp(this.toString());
    }

    public clone(): Terminal {
        let terminal = new Terminal(this.value);
        return terminal;
    }

    public shrink(): Terminal {
        return this.clone();
    }
}
