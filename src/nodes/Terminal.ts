import Node, {NodeTypes} from "./Node";
import Utils from "../Utils";


export default class Terminal implements Node {
    constructor(public value: string = '') {
        // pass
    }

    public readonly nodeType = NodeTypes.terminal;

    public mutate(values: string[]): void {
        this.value = Utils.getRandomlyFromList(values);
    }

    public toString(): string {
        return this.value.toString().replace(/\s/g, '\\s');
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
