import Func, { FuncTypes } from "./Func";
import Node from "./Node";
import Utils from "../Utils";


export default class ConcatFunc extends Func {
    public type: FuncTypes = FuncTypes.concatenation;
}