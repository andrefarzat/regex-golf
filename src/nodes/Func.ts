import Node, {NodeTypes} from "./Node";
import Terminal from "./Terminal";
import Utils from "../Utils";


export enum FuncTypes {
    concatenation = "•",
    or = "•|•",
    lineBegin = "^•",
    lineEnd = "•$",
    zeroOrMore = "•*+",
    oneOrMore = "•?+",
    group = "(•)",
    list = "[•]",
    negation = "[^•]",
    more = "•++",
}


export default class Func implements Node {
    public static placeholder: FuncTypes = FuncTypes.concatenation;
    public static Types = FuncTypes;
    private static _options: string[] = null;

    public static get options(): FuncTypes[] {
        if (!Func._options) { Func._options = Object.keys(FuncTypes).map(key => (FuncTypes as any)[key]); }
        return Func._options as FuncTypes[];
    }

    public left: Node;
    public right: Node;
    public type: FuncTypes = Func.placeholder;
    public readonly nodeType = NodeTypes.func;

    public constructor(type?: FuncTypes) {
        if (type) this.type = type;
    }

    public mutate(values: string[]): void {
        this.type = Utils.getRandomlyFromList(Func.options);
    }

    public toString(): string {
        let left  = this.left ? this.left.toString() : '';
        let right = this.right ? this.right.toString() : '';

        if (this.type == FuncTypes.or) {
            return left + "|" + right;
        }

        let txt = left + right;
        return this.type.replace(Func.placeholder, txt);
    }

    public toRegex(): RegExp {
        return new RegExp(this.toString());
    }

    public clone(): Func {
        let func = new Func();
        func.left = this.left.clone();
        func.right = this.right.clone();
        func.type = this.type;
        return func;
    }

    public getLeastTerminal(): Terminal {
        let current: Node = this.right;
        while (current instanceof Func) {
            current = current.right;
        }
        return current as Terminal;
    }

    public getLeastFunc(): Func {
        if (this.right instanceof Terminal) {
            return this;
        }

        let current: Func = this.right as Func;
        while (!(current.right instanceof Terminal)) {
            current = current.right as Func;
        }

        return current;
    }

    public getNodes(): Node[] {
        let nodes: Node[] = [];

        nodes.push(this.left);
        if (this.left instanceof Func) {
            nodes = nodes.concat(this.left.getNodes());
        }

        nodes.push(this.right);
        if (this.right instanceof Func) {
            nodes = nodes.concat(this.right.getNodes());
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

    public shrink(): Node {
        if (this.type == Func.Types.concatenation) {
            let left = this.left.shrink();
            let right = this.right.shrink();

            let areBothTerminal = left.nodeType == 'terminal'
                && right.nodeType == 'terminal';

            if (areBothTerminal) {
                return new Terminal(left.toString() + right.toString());
            }

            let func = new Func(FuncTypes.concatenation);
            func.left = left;
            func.right = right;
            return func;
        }

        if (this.type == Func.Types.lineBegin) {
            let func = this.clone();
            // We search for all lineBegin and remove them.
            // There must be only ONE lineBegin
            func.getFuncs().forEach(func => {
                if (func.type == Func.Types.lineBegin) {
                    func.type = Func.Types.concatenation;
                }
            });

            let neo = new Func(Func.Types.lineBegin);
            neo.left = new Terminal();
            neo.right = func;
            return neo;
        }

        if (this.type == Func.Types.lineEnd) {
            let func = this.clone();
            // We search for all lineEnd and remove them.
            // There must be only ONE lineEnd
            func.getFuncs().forEach(func => {
                if (func.type == Func.Types.lineEnd) {
                    func.type = Func.Types.concatenation;
                }
            });

            let neo = new Func(Func.Types.lineEnd);
            neo.left = new Terminal();
            neo.right = func;
            return neo;
        }

        if (this.type == Func.Types.list) {
            let func = this.clone();

            func.getFuncs().forEach(func => {
                if (func.type == Func.Types.list) {
                    func.type = Func.Types.concatenation;
                }
            });

            let left = this.left.shrink();
            let right = this.right.shrink();

            let areBothTerminal = left.nodeType == NodeTypes.terminal
                && right.nodeType == NodeTypes.terminal;

            if (areBothTerminal) {
                let str = Utils.getUniqueChars(left.toString() + right.toString());
                let func = new Func(Func.Types.list);
                func.left = new Terminal();
                func.right = new Terminal(str);
                return func;
            } else if (left.nodeType == NodeTypes.terminal) {
                let str = Utils.getUniqueChars(left.toString());
                let func = new Func(Func.Types.list);
                func.left = new Terminal(str);
                func.right = right;
                return func;
            } else {
                let str = Utils.getUniqueChars(right.toString());
                let func = new Func(Func.Types.list);
                func.left = left;
                func.right = new Terminal(str);
                return func;
            }
        }

        if (this.type == Func.Types.negation) {
            let func = this.clone();

            func.getFuncs().forEach(func => {
                if (func.type == Func.Types.negation) {
                    func.type = Func.Types.concatenation;
                }
            });

            let left = this.left.shrink();
            let right = this.right.shrink();

            let areBothTerminal = left.nodeType == NodeTypes.terminal
                && right.nodeType == NodeTypes.terminal;

            if (areBothTerminal) {
                let str = Utils.getUniqueChars(left.toString() + right.toString());
                let func = new Func(Func.Types.negation);
                func.left = new Terminal();
                func.right = new Terminal(str);
                return func;
            } else if (left.nodeType == NodeTypes.terminal) {
                let str = Utils.getUniqueChars(left.toString());
                let func = new Func(Func.Types.negation);
                func.left = new Terminal(str);
                func.right = right;
                return func;
            } else {
                let str = Utils.getUniqueChars(right.toString());
                let func = new Func(Func.Types.negation);
                func.left = left;
                func.right = new Terminal(str);
                return func;
            }
        }

        if (this.type == Func.Types.or) {
            let func = new Func(Func.Types.or);
            func.left = this.left.shrink();
            func.right = this.right.shrink();
            return func;
        }

        // or = "•|•",
        // zeroOrMore = "•*+",
        // oneOrMore = "•?+",
        // group = "(•)",
        // more = "•++",
        let func = new Func(this.type);
        func.left = this.left.shrink();
        func.right = this.right.shrink();
        return func;
    }
}
