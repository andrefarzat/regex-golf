import * as fs from "fs";
import MersenneTwister = require("mersenne-twister");
import * as path from "path";

export class Utils {
    public static hasStarted = false;

    public static setSeed(seed: number) {
        this.random = new MersenneTwister(seed);
    }

    public static loadInstance(instanceName: string): {left: string[], right: string[]} {
        const pathToLeftFile  = path.join(__dirname, '..', 'instances', instanceName, 'left.txt');
        const pathToRightFile = path.join(__dirname, '..', 'instances', instanceName, 'right.txt');

        return {
            left: Utils.getTxtFileAsArray(pathToLeftFile),
            right: Utils.getTxtFileAsArray(pathToRightFile),
        };
    }

    public static getTxtFileAsArray(pathToFile: string): string[] {
        const fileContent = fs.readFileSync(pathToFile);
        return fileContent.toString().split('\n').map((line) => line.trim()).filter((line) => line);
    }

    public static nextInt(max: number = 10): number {
        return Math.round(this.random.random() * max);
    }

    public static nextBoolean(): boolean {
        return Utils.nextInt(1) == 0;
    }

    public static sortObjectByValue(obj: {[key: string]: number}): {[key: string]: number} {
        const items = Object.keys(obj).map((key) => [key, obj[key]]);
        items.sort((first, second) => (second[1] as number) - (first[1] as number));

        const newObj: {[key: string]: number} = {};
        items.forEach((item) => {
            newObj[item[0]] = item[1] as number;
        });
        return newObj;
    }

    public static getRandomlyFromList<T>(list: T[]) {
        const len = list.length;
        const index = Utils.nextInt(len > 0 ? len - 1 : 0);
        return list[index];
    }

    public static getUniqueChars(str: string): string {
        const ret: string[] = [];
        (new Set(str)).forEach((s) => ret.push(s));
        ret.sort();
        return ret.join('');
    }

    public static setIndex(index: string | number) {
        let i = typeof index === 'string' ? parseInt(index, 10) : index;
        if (isNaN(i)) { i = 0; }
        Utils.index = i;
    }

    public static getNextId() {
        if (this.hasStarted) {
            return this.idIndex++;
        }

        return 0;
    }

    public static resetNextId(): void {
        this.idIndex = 0;
    }

    public static async waitFor(conditionFn: () => boolean) {
        return new Promise<void>((resolve) => {
            const fn = () => { conditionFn() ? resolve() : setImmediate(fn); };
            fn();
        });
    }

    public static async wait(seconds: number) {
        return new Promise<void>((resolve) => {
            setTimeout(resolve, seconds * 1000);
        });
    }

    public static times<T>(n: number, fn: (i: number) => T): T[] {
        const accum: T[] = Array(Math.max(0, n));
        for (let i = 0; i < n; i ++) { accum[i] = fn(i); }
        return accum;
    }

    public static isSequence(chars: string): boolean {
        const isNextChar = (one: string, two: string): boolean => {
            const oneCode = one.charCodeAt(0);
            const twoCode = two.charCodeAt(0);

            const diff = Math.abs(oneCode - twoCode);
            return diff === 1;
        };

        let currentChar: string = null;
        return Array.from(chars).every((char) => {
            const is = currentChar === null ? true : isNextChar(currentChar, char);
            currentChar = char;

            return is;
        });

    }
    protected static random: MersenneTwister = new MersenneTwister(new Date().getTime());
    private static idIndex = 0;
    private static index = 0;
}
