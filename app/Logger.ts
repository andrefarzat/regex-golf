import Individual from "../src/models/Individual";


type LogLevel = '' | 'primary' | 'secondary' | 'success' | 'warning' | 'alert';

export class Logger {
    public static maxEvaluations: number = 0;
    private static cache: {[key: string]: HTMLDivElement} = {};

    static getEl(id: string): HTMLDivElement {
        if (!(id in Logger.cache)) {
            Logger.cache[id] = document.getElementById(id) as HTMLDivElement;
        }

        return Logger.cache[id];
    }

    static async log(title: string, msg: string, level: LogLevel = '') {
        const callout = document.createElement('div');
        callout.className = `callout ${level}`;

        const p = document.createElement('p');
        p.innerText = `${title}: ${msg}`;
        callout.appendChild(p);
        
        Logger.getEl('logs').appendChild(callout);
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
        Logger.getEl('evaluation-div').innerText = `${ind.evaluationIndex} evaluated in ${time} ms`;
        const percentage = Math.ceil((ind.evaluationIndex * 100) / Logger.maxEvaluations);

        const progressbar = Logger.getEl('progressbar');
        progressbar.style.width = `${percentage}%`;
        progressbar.innerHTML = `<p class="progress-meter-text">${percentage}%</p>`;
    }

    static async foundBetter(ind: Individual) {
        Logger.log('Found Better', ind.toLog(), 'success');
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

