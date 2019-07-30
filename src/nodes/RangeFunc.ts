import { Func, FuncTypes } from "./Func";
import { Node } from "./Node";

export class RangeFunc extends Func {
    public type: FuncTypes = FuncTypes.range;
    public from: string = '';
    public to: string = '';
    public negative: boolean = false;

    public clone(): RangeFunc {
        const func = new RangeFunc();
        func.children = this.children.map((child) => child.clone());
        func.from = this.from;
        func.to = this.to;
        func.negative = this.negative;
        return func;
    }

    public getRangeAsString(): string {
        const diff = this.to.charCodeAt(0) - this.from.charCodeAt(0);

        if (diff > 2) {
            return `${this.from}-${this.to}`;
        } else {
            let txt = '';
            let currentCharCode = this.from.charCodeAt(0);
            while (currentCharCode <= this.to.charCodeAt(0)) {
                txt += String.fromCharCode(currentCharCode);
                currentCharCode++;
            }

            return txt;
        }
    }

    public toString(): string {
        const text = super.toString();
        const range = this.getRangeAsString();
        const symbol = this.negative ? '^' : '';

        return `[${symbol}${range}]${text}`;
    }

    public equals(node: Node): boolean {
        if (node instanceof Func) {
            if (node.nodeType !== this.nodeType) { return false; }
            if (node.type === this.type) { return (node as RangeFunc).getRangeAsString() === this.getRangeAsString(); }
            if (node.type === FuncTypes.list) { return node.toString() === this.getRangeAsString(); }
        }

        return false;
    }

    public isEmpty(): boolean {
        return this.children.every((child) => child.toString() === '');
    }

}
