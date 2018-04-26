import Func, { FuncTypes } from "./Func";
import Node from "./Node";
import Utils from "../Utils";


export default class RepetitionFunc extends Func {
    public type: FuncTypes = FuncTypes.repetition;
    public repetitionNumber: string = '1';

    public constructor(left?: Node, right?: Node) {
        super(FuncTypes.repetition, left, right);
    }

    public clone(): RepetitionFunc {
        let func = new RepetitionFunc();
        func.left = this.left.clone();
        func.right = this.right.clone();
        func.type = this.type;
        func.repetitionNumber = this.repetitionNumber;
        return func;
    }

    public mutate(values: string[]): void {
        this.type = Utils.getRandomlyFromList(Func.options);
        this.repetitionNumber = this.type == FuncTypes.repetition ? Utils.nextInt(9).toString() : '0';
    }

    public toString(): string {
        let left  = this.left ? this.left.toString() : '';
        let right = this.right ? this.right.toString() : '';
        let len = left.length;

        if (this.repetitionNumber === '1') {
            return `${left}${right}`;
        } else if (this.repetitionNumber === '2' && len < 4) {
            return `${left}${left}${right}`;
        } else if (this.repetitionNumber === '3'  && len < 4) {
            return `${left}${left}${left}${right}`;
        }

        return `${left}{${this.repetitionNumber}}${right}`;
    }
}