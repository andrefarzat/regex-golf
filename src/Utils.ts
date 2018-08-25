import * as fs from "fs";
import * as path from "path";
import MersenneTwister = require("mersenne-twister");


export default class Utils {
    private static idIndex = 0;
    private static index = 0;
    protected static random: MersenneTwister = new MersenneTwister(new Date().getTime());

    static setSeed(seed: number) {
        this.random = new MersenneTwister(seed);
    }

    static loadInstance(instanceName: string): {left: string[], right: string[]} {
        let pathToLeftFile  = path.join(__dirname, '..', 'instances', instanceName, 'left.txt');
        let pathToRightFile = path.join(__dirname, '..', 'instances', instanceName, 'right.txt');

        return {
            left: Utils.getTxtFileAsArray(pathToLeftFile),
            right: Utils.getTxtFileAsArray(pathToRightFile)
        };
    }

    static getTxtFileAsArray(pathToFile: string): string[] {
        let fileContent = fs.readFileSync(pathToFile);
        return fileContent.toString().split('\n').map(line => line.trim()).filter(line => line);
    }

    static nextInt(max: number = 10): number {
        return Math.round(this.random.random() * max);
    }

    static nextBoolean(): boolean {
        return Utils.nextInt(1) == 0;
    }

    static sortObjectByValue(obj: {[key: string]: number}): {[key: string]: number} {
        let items = Object.keys(obj).map(key => [key, obj[key]]);
        items.sort((first, second) => (<number>second[1]) - (<number>first[1]));

        let newObj: {[key: string]: number} = {};
        items.forEach(item => {
            newObj[item[0]] = item[1] as number;
        });
        return newObj;
    }

    static getRandomlyFromList<T>(list: T[]) {
        let len = list.length;
        let index = Utils.nextInt(len > 0 ? len - 1 : 0);
        return list[index];
    }

    static getUniqueChars(str: string): string {
        let ret: string[] = [];
        (new Set(str)).forEach(s => ret.push(s));
        return ret.join('');
    }

    static setIndex(index: string | number) {
        let i = typeof index === 'string' ? parseInt(index, 10) : index;
        if (isNaN(i)) i = 0;
        Utils.index = i;
    }

    static getNextId() {
        return this.idIndex++;
    }
}