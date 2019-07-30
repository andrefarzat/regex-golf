import { Func, FuncTypes } from "./Func";
import { Node } from "./Node";
import { OrFunc } from "./OrFunc";

export class ConcatFunc extends Func {
    public type: FuncTypes = FuncTypes.concatenation;

    public toString(): string {
        const orFuncs = this.children.filter((c) => c.is(FuncTypes.or)) as OrFunc[];
        if (orFuncs.length > 0) {
            return orFuncs.map((or) => this.orderOrToString(or)).join('');
        } else {
            return this.orderChildrenToLines(this.children);
        }
    }

    public orderChildrenToLines(children: Node[]) {
        let hasLineBegin = false; children.some((c) => c.is(FuncTypes.lineBegin));
        let hasLineEnd = false; children.some((c) => c.is(FuncTypes.lineEnd));

        const txt: string[] = [];
        for (const child of children) {
            if (child.is(FuncTypes.lineBegin)) {
                hasLineBegin = true;
            } else if (child.is(FuncTypes.lineEnd)) {
                hasLineEnd = true;
            } else {
                txt.push(child.toString());
            }
        }

        return `${hasLineBegin ? '^' : ''}${txt.join('')}${hasLineEnd ? '$' : ''}`;
    }

    public orderOrToString(or: OrFunc): string {
        const txt: string[] = [];

        if (or.left) {
            txt.push(or.left.toString());
        }

        if (or.right) {
            txt.push(or.right.toString());
        }

        return txt.join('');
    }
}
