import ConcatFunc from "../nodes/ConcatFunc";
import Node, { NodeTypes } from "../nodes/Node";
import { NodeShrinker } from "./NodeShrinker";
import { FuncTypes } from "../nodes/Func";
import OrFunc from "../nodes/OrFunc";
import Terminal from "../nodes/Terminal";
import RepetitionFunc from "../nodes/RepetitionFunc";
import { SSL_OP_NETSCAPE_DEMO_CIPHER_CHANGE_BUG } from "constants";
import ListFunc from "../nodes/ListFunc";


export class ConcatenationShrinker {

    private shrinkStartAnchor(children: Node[]): Node[] {
        let quantity = 0;

        return children.map(child => {
            if (child.is(FuncTypes.lineBegin)) {
                if (quantity > 0) {
                    return new Terminal('');
                } else {
                    quantity += 1;
                    return child;
                }
            }
            return child;
        });
    }

    private shrinkEndAnchor(children: Node[]): Node[] {
        let quantity = 0;

        return children.reverse().map(child => {
            if (child.is(FuncTypes.lineEnd)) {
                if (quantity > 0) {
                    return new Terminal('');
                } else {
                    quantity += 1;
                    return child;
                }
            }
            return child;
        }).reverse();
    }

    public shrink(func: ConcatFunc): Node {
        let children = func.children.map(node => NodeShrinker.shrink(node));
        const orFuncs = children.filter(func => func.is(FuncTypes.or)) as OrFunc[];
        if (orFuncs.length == 0) {
            children = this.shrinkStartAnchor(children);
            children = this.shrinkEndAnchor(children);
        } else {
            orFuncs.forEach(orFunc => {
                orFunc.left = NodeShrinker.shrink(orFunc.left);
                orFunc.right = NodeShrinker.shrink(orFunc.right);
            });
        }

        children = children.filter(child => child.toString() !== '');
        if (children.length == 1 && children[0].is(NodeTypes.terminal)) {
            return new Terminal(children[0].toString());
        }

        return this.mainShrink(children);
    
    }

    private isOkToSequenceTest(node: Node): boolean {
        if (node.is(NodeTypes.terminal)) return true;
        if (node.is(FuncTypes.list)) return true;
        if (node.is(FuncTypes.negation)) return true;

        return false;
    }
    
    private mainShrink(children: Node[]): ConcatFunc {
        const neoChildren: Node[] = [];

        let i = 0;
        for (let i = 0; i < children.length; i++) {
            const current = children[i];
            debugger;

            if (this.isOkToSequenceTest(current)) {
                const localChildren = children.slice(i + 1);
                let sequenceCount = 0;

                for (const child of localChildren) {
                    if (current.equals(child)) {
                        sequenceCount += 1;
                    } else {
                        break;
                    }
                }

                if (sequenceCount > 0) {
                    const neo = new RepetitionFunc([current.clone()]);
                    neo.repetitionNumber = (sequenceCount + 1).toString();
                    neoChildren.push(neo);
                    i += sequenceCount;
                    continue;
                }
            }

            if (current instanceof RepetitionFunc) {
                const next = children[i + 1];

                if (next.is(NodeTypes.terminal)) {
                    const isEqual = current.childrenToString() === next.toString();
                    if (isEqual) {
                        const neo = new RepetitionFunc(current.children);
                        neo.repetitionNumber = NodeShrinker.addToRepetitionNumber(neo, 1);
                        neoChildren.push(neo);
                        i += 1;
                        continue;
                    }
                }

                if (next instanceof RepetitionFunc) {
                    const isEqual = next.childrenToString() === current.childrenToString();
                    if (isEqual) {
                        const neo = new RepetitionFunc(current.children);
                        neo.repetitionNumber = NodeShrinker.addToRepetitionNumber(neo, next.repetitionNumber);
                        neoChildren.push(neo);
                        i += 1;
                        continue;
                    }
                }
            }

            neoChildren.push(current.clone());
        }

        return new ConcatFunc(neoChildren);
    }
}