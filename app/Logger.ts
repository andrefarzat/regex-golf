import Individual from "../src/models/Individual";


type LogLevel = '' | 'primary' | 'secondary' | 'success' | 'warning' | 'alert';

export class Logger {
    private static _div: HTMLDivElement;
    private static _evaluationDiv: HTMLDivElement;

    static get div(): HTMLDivElement {
        if (!Logger._div) {
            Logger._div = document.getElementById('logs') as HTMLDivElement;
        }

        return Logger._div;
    }

    static get evaluationDiv(): HTMLDivElement {
        if (!Logger._evaluationDiv) {
            Logger._evaluationDiv = document.getElementById('evaluation-div') as HTMLDivElement;
        }

        return Logger._evaluationDiv;
    }

    static async log(title: string, msg: string, level: LogLevel = '') {
        const callout = document.createElement('div');
        callout.className = `callout ${level}`;

        const p = document.createElement('p');
        p.innerText = `${title}: ${msg}`;
        callout.appendChild(p);
        
        Logger.div.appendChild(callout);
    }

    static async logInitialSolution(ind: Individual) {
        Logger.log(`Initial solution`, ind.toLog());
    }

    static async logStartNeighborhood(ind: Individual) {
        Logger.log('Start Neighborhood', ind.toLog());
    }

    static async debug(ind: Individual) {
        // console.log('Debug', ind.toLog());
    }

    static async evaluation(ind: Individual, time: number) {
        Logger.evaluationDiv.innerText = `${ind.evaluationIndex} evaluated in ${time} ms`;
    }

    static async foundBetter(ind: Individual) {
        Logger.log('Start Neighborhood', ind.toLog(), 'primary');
    }

    static async alreadyVisited(ind: Individual) {
        Logger.log('Already visited', ind.toLog(), 'warning');
    }

    static async error(title: string, text: string = '') {
        Logger.log(title, text, 'alert');
    }

    static async jumpedTo(ind: Individual) {
        Logger.log('Jumped to', ind.toLog(), 'primary');
    }
}

