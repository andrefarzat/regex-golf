import { EventEmitter, Injectable } from '@angular/core';
import { Individual } from '../../../src/models/Individual';

export enum LogType {
    initialSolution,
    startNeighborhood,
    debug,
    evaluation,
    foundBetter,
    alreadyVisited,
    error,
    jumpedTo,
    finished,
}

export interface LogEntry {
    type: LogType,
    ind: Individual,
}

export interface LogProgress {
    evaluationIndex: number;
    time: number;
    percentage: number;
    ind: Individual;
}

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
    constructor() { }

    public added = new EventEmitter<LogEntry>();
    public progress = new EventEmitter<LogProgress>();

    public maxEvaluations: number = 0;
    private cache: {[key: string]: HTMLDivElement} = {};

    getEl(id: string): HTMLDivElement {
        if (!(id in this.cache)) {
            this.cache[id] = document.getElementById(id) as HTMLDivElement;
        }

        return this.cache[id];
    }

    async finish(ind: Individual) {
        return this.log(LogType.finished, ind);
    }

    async log(type: LogType, ind: Individual, percentage?: number) {
        // const callout = document.createElement('div');
        // callout.className = `callout ${level}`;

        // const p = document.createElement('p');
        // p.innerText = `${title}: ${msg}`;
        // callout.appendChild(p);

        // this.getEl('logs').appendChild(callout);
        const entry: LogEntry = { ind, type };
        this.added.emit(entry);
    }

    async logInitialSolution(ind: Individual) {
        this.log(LogType.initialSolution, ind);
    }

    async logStartNeighborhood(ind: Individual) {
        this.log(LogType.startNeighborhood, ind);
    }

    async debug(ind: Individual) {
        // console.log('Debug', ind);
    }

    async evaluation(ind: Individual, time: number) {
        // this.getEl('evaluation-div').innerText = `${ind.evaluationIndex} evaluated in ${time} ms`;
        // const percentage = Math.ceil((ind.evaluationIndex * 100) / this.maxEvaluations);

        // const progressbar = this.getEl('progressbar');
        // progressbar.style.width = `${percentage}%`;
        // progressbar.innerHTML = `<p class="progress-meter-text">${percentage}%</p>`;

        const evaluationIndex = ind.evaluationIndex;
        const percentage = Math.ceil((ind.evaluationIndex * 100) / this.maxEvaluations);

        this.progress.emit({ evaluationIndex, time, percentage, ind });
        this.log(LogType.evaluation, ind);
    }

    async foundBetter(ind: Individual) {
        this.log(LogType.foundBetter, ind);
    }

    async alreadyVisited(ind: Individual) {
        this.log(LogType.alreadyVisited, ind);
    }

    async error(title: string, text: string = '') {
        // this.log(title, text, 'alert');
    }

    async jumpedTo(ind: Individual) {
        this.log(LogType.jumpedTo, ind);
    }


}
