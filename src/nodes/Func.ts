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
    repetition = "•{#}"
}


export default class Func implements Node {
    public static placeholder: FuncTypes = FuncTypes.concatenation;
    public static Types = FuncTypes;
    private static _options: string[] = null;
    public repetitionNumber: string = '1';

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
        this.repetitionNumber = this.type == FuncTypes.repetition ? Utils.nextInt(9).toString() : '0';
    }

    public is(type: NodeTypes | FuncTypes): boolean {
        if (type == this.nodeType) return true;
        return type == this.type;
    }

    public toString(): string {
        let left  = this.left ? this.left.toString() : '';
        let right = this.right ? this.right.toString() : '';

        if (this.type == FuncTypes.or) {
            return left + "|" + right;
        }

        if (this.type == FuncTypes.repetition) {
            return `${left}{${this.repetitionNumber}}${right}`;
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
        func.repetitionNumber = this.repetitionNumber;
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

            let areBothTerminal = left.is(NodeTypes.terminal) && right.is(NodeTypes.terminal);

            if (areBothTerminal) {
                let leftStr = left.toString();
                let rightStr = right.toString();

                if (leftStr.length == 1 && rightStr.length == 1) {
                    if (leftStr == rightStr) {
                        let func = new Func(Func.Types.repetition);
                        func.repetitionNumber = '2';
                        func.left = new Terminal(leftStr);
                        func.right = new Terminal('');
                        return func;
                    }
                }

                return new Terminal(left.toString() + right.toString());
            }

            if (left.is(NodeTypes.terminal) && right.is(FuncTypes.repetition)) {
                let funcRight = right as Func;
                let leftStr = left.toString();
                let whatIsRepetead = funcRight.left.toString();

                if (leftStr == whatIsRepetead) {
                    let func = new Func(FuncTypes.repetition);
                    func.left = new Terminal(leftStr);
                    func.repetitionNumber = this.addToRepetitionNumber(funcRight, 1);
                    func.right = funcRight.right.clone();
                    return func;
                }
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

        // Our default is shrink left and right and return a new Func
        let func = new Func(this.type);
        func.left = this.left.shrink();
        func.right = this.right.shrink();
        func.repetitionNumber = this.repetitionNumber;
        return func;
    }

    public addToRepetitionNumber(func: Func, value: number): string {
        let numbers = func.repetitionNumber.split(',');

        switch (numbers.length) {
            case 1: return (parseInt(numbers[0], 10) + value).toString();
            case 2: return (parseInt(numbers[1], 10) + value).toString();
        }

        return value.toString()
    }
}
