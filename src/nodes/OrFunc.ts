import Func, { FuncTypes } from './Func';
import Node, { NodeTypes } from './Node';
import Terminal from './Terminal';


export default class OrFunc extends Func {
    public type: FuncTypes = FuncTypes.or;

    public constructor(public left: Node, public right: Node) {
        super();
    }

    public toString(): string {
        return `${this.left.toString()}|${this.right.toString()}`;
    }

    public getNodes(): Node[] {
        let nodes: Node[] = [];

        if (this.left) {
            nodes = this.left.is(NodeTypes.func)
                ? nodes.concat(this.left.asFunc().getNodes())
                : nodes.concat([this.left]);
        }

        if (this.right) {
            nodes = this.right.is(NodeTypes.func)
                ? nodes.concat(this.right.asFunc().getNodes())
                : nodes.concat([this.right]);
        }

        return nodes;
    }

    public hasTheChild(node: Node): boolean {
        return this.getNodes().indexOf(node) !== -1;
    }

    public clone(): Func {
        let func = new OrFunc(this.left.clone(), this.right.clone());
        func.children = this.children.map(child => child.clone());
        return func;
    }

    public getFirstTerminalFrom(side: 'left' | 'right'): Terminal {
        const node = side === 'left' ? this.left : this.right;

        if (node.is(NodeTypes.terminal)) {
            return node as Terminal;
        }

        const terminals = node.asFunc().getTerminals();
        return terminals[0];
    }

    public getLastTerminalFrom(side: 'left' | 'right'): Terminal {
        const node = side === 'left' ? this.left : this.right;

        if (node.is(NodeTypes.terminal)) {
            return node as Terminal;
        }

        const terminals = node.asFunc().getTerminals();
        return terminals[terminals.length - 1];
    }

    public getSideOf(node: Node): 'left' | 'right' | null {
        if (this.left.is(NodeTypes.func)) {
            let isChildOfLeft = (this.left as Func).getNodes().indexOf(node) >= 0;
            if (isChildOfLeft) {
                return 'left';
            }
        }

        if (this.right.is(NodeTypes.func)) {
            let isChildOfRight = (this.right as Func).getNodes().indexOf(node) >= 0;
            if (isChildOfRight) {
                return 'right';
            }
        }

        return null;
    }

    private trySwapChild(oldNode: Node, newNode: Node): boolean {
        if (this.left === oldNode) {
            this.left = newNode;
            return true;
        } else if (this.left instanceof OrFunc) {
            if (this.left.trySwapChild(oldNode, newNode)) {
                return true;
            }
        } else if (this.left instanceof Func) {
            if (this.trySwapChildByChildren(this.left.children, oldNode, newNode)) {
                return true;
            }
        } 

        if (this.right === oldNode) {
            this.right = newNode;
            return true;
        } else if (this.right instanceof OrFunc) {
            if (this.right.trySwapChild(oldNode, newNode)) {
                return true;
            }
        } else if (this.right instanceof Func) {
            if (this.trySwapChildByChildren(this.right.children, oldNode, newNode)) {
                return true;
            }
        } 

        return true;
    }

    public swapChild(oldNode: Node, newNode: Node) {
        let hasSwapped = this.trySwapChild(oldNode, newNode);

        if (!hasSwapped) {
            debugger;
            throw new Error('[OrFunc.swapChild] Invalid child');
        }
    }

    private trySwapChildByChildren(children: Node[], oldNode: Node, newNode: Node): boolean {
        let index = children.indexOf(oldNode);
        if (index === -1) return false;
        children.splice(index, 1, newNode);
        return true;
    }
}