import * as fs from "fs";
import * as path from "path";
import Func from "./nodes/Func";
import Node from "./nodes/Node";
import MersenneTwister = require("mersenne-twister");

const seeds = [
    946600524769,
    930664507645,
    817011623690,
    351860869256,
    172997522630,
    569738111923,
    377439701338,
    962495572336,
    715744732573,
    390198731553,
    638754023500,
    488638353730,
    870295812448,
    437914337996,
    513315557055,
    150581012801,
    481024974863,
    972388393095,
    509764353392,
    657452459883,
    763367874030,
    418166563613,
    955834666465,
    404640470305,
    232737611637,
    947041428682,
    309675561420,
    837014034550,
    453263833593,
    265217263684,
];


export default class Utils {
    private static index = 0;
    static _random: MersenneTwister;

    static get random(): MersenneTwister {
        if (!Utils._random) {
            if (!Array.isArray(seeds)) throw new Error('Invalid seeds');
            let seed = seeds[Utils.index];
            Utils._random = new MersenneTwister(seed);
        };

        return Utils._random;
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
}