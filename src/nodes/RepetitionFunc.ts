import Func, { FuncTypes } from "./Func";
import Node from "./Node";
import Utils from "../Utils";


export default class RepetitionFunc extends Func {
    public type: FuncTypes = FuncTypes.repetition;
    public repetitionNumber: string = '1';

    public clone(): RepetitionFunc {
        let func = new RepetitionFunc();
        func.repetitionNumber = this.repetitionNumber;
        func.children = this.children.map(child => child.clone());
        return func;
    }

    public toString(): string {
        let text = super.toString();
        let len = text.length;

        if (this.repetitionNumber === '1') {
            return `${text}{1}`;
        } else if (this.repetitionNumber === '2' && len < 4) {
            return `${text}${text}`;
        } else if (this.repetitionNumber === '3'  && len < 4) {
            return `${text}${text}${text}`;
        } else {
            return `${text}{${this.repetitionNumber}}`;
        }
    }
}