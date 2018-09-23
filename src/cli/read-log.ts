import * as fs from 'fs';
const path = require('path');
const colors = require('colors/safe');
const args = require('args');


type Type = 'Initial solution' | 'Found better' | 'Starting neighborhood for'
            | 'Jumped to' | 'Invalid' | 'Neighborhood error';

interface LogFormat {
    level: 'error' | 'info';
    type: Type;
    regex: string;
}

interface JSONLogFormat {
    level: 'error' | 'info';
    message: string;
}

const keypress = async () => {
    process.stdin.setRawMode(true)
    return new Promise(resolve => process.stdin.once('data', () => {
        process.stdin.setRawMode(false)
        resolve()
    }))
}

async function loadJsonLogFile(logFileName: string): Promise<JSONLogFormat[]> {
    return new Promise<JSONLogFormat[]>(resolve => {
        let pathToLogFile = path.join(__dirname, '..', '..', 'results', 'current', logFileName);
        fs.readFile(pathToLogFile, (err, data) => {
            let str = data.toString().trim().split('\n').join(',\n')
            let json = JSON.parse(`[${str}]`);
            resolve(json);
        });
    });
}

function extractMessageFromLog(log: JSONLogFormat): LogFormat | null {
    let result = /^\[([^\]]+)\](.+)$/.exec(log.message);
    if (!result) {
        return null;
        // throw new Error('Invalid log: ' + JSON.stringify(log));
    }

    let type: Type = result[1] as any;
    return { level: log.level, type, regex: result[2].trim() };
}



function print(...str: string[]) {
    console.log("\t", ...str);
}


async function main() {
    let json = await loadJsonLogFile('abba.log');

    // n${j} [ label = "${this.type}" ]

    // n${j} -> n${i}

    let prev: LogFormat;


    console.log("digraph G { \n");

    for (let i in json) {
        let log = extractMessageFromLog(json[i]);
        if (log === null) continue;

        switch (log.type) {
            case 'Initial solution':
                print(`"${log.regex}"`, '[shape=box];')
                break;
            case 'Found better':
                print(`"${prev.regex}" -> "${log.regex}";`);
                break;
            case 'Jumped to':
                print(`"${prev.regex}" -> "${log.regex}";`);
                break;
            case 'Starting neighborhood for':
            case 'Invalid':
            case 'Neighborhood error':
                break;
            default:
                throw new Error('oh porra: ' + log.type);
        }

        prev = log;
    }

    console.log("\n}");
}


main();