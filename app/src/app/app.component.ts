import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { LocalSearchService, LocalSearchConfig } from './local-search.service';
import { LogEntry, LogProgress, LogType } from './logger.service';

import { INSTANCES } from './instances';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
    title = 'regexgolg';
    public isInited = false;
    public currentFitness = 0;
    public instances = INSTANCES;
    public operators: { [key: string]: { count: number } } = {};
    public operatorsTotal = 0;

    protected logTypeMap: { [key in LogType]: string} = {
        [LogType.initialSolution]: 'Initial Solution',
        [LogType.startNeighborhood]: 'Start of neighborhood',
        [LogType.debug]: "Debug",
        [LogType.evaluation]: "Evaluation",
        [LogType.foundBetter]: "Found better",
        [LogType.alreadyVisited]: "Already Visited",
        [LogType.error]: "Error",
        [LogType.jumpedTo]: "Jumped to",
        [LogType.finished]: "Finished",
    };

    public form = {
        left: '',
        right: '',
        budget: 500000,
        depth: 4,
        seed: 2967301147,
        timeout: 120000,
        instance: INSTANCES[0],
    };

    public current = {
        progress: 0,
        index: 0,
        fitness: 0,
        best: '',
    };

    @ViewChild('output') tbodyOutput: ElementRef<HTMLTableSectionElement>;

    public constructor(public localSearch: LocalSearchService) { }

    public get isRunning(): boolean {
        return this.localSearch.isRunning;
    }

    public get operatorNames(): string[] {
        return Object.keys(this.operators);
    }

    public selectInstance(): void {
        this.form.left = this.form.instance.left.join('\n');
        this.form.right = this.form.instance.right.join('\n');
    }

    public toggleRun() {
        if (!this.isInited) {
            var config: LocalSearchConfig = {
                left: this.form.instance.left,
                right: this.form.instance.right,
                budget: this.form.budget,
                depth: this.form.depth,
                seed: this.form.seed,
                timeout: this.form.timeout,
                instanceName: this.form.instance.name,
            };

            this.isInited = true;
            this.localSearch.start(config);
            return;
        }

        if (this.localSearch.isRunning) {
            this.localSearch.pause();
        } else {
            this.localSearch.play();
        }
    }

    public ngOnInit() {
        this.selectInstance();
        this.localSearch.logger.added.subscribe(value => this.addLog(value));
        this.localSearch.logger.progress.subscribe(value => this.updateProgress(value));
    }

    public getOperatorPercentage(count: number): number {
        return Math.round((count * 100) / this.operatorsTotal);
    }

    public addLog(entry: LogEntry): void {
        if (entry.type === LogType.initialSolution) {
            this.tbodyOutput.nativeElement.innerHTML = "";
            return;
        }

        const name: string = this.logTypeMap[entry.type];
        let origin = '';

        if (entry.ind.origin) {
            this.operatorsTotal += 1;
            origin = `${entry.ind.origin.name}(${entry.ind.origin.args.join(', ')})`;

            if (!(entry.ind.origin.name in this.operators)) {
                this.operators[entry.ind.origin.name] = {count: 0};

                this.operators = JSON.parse(JSON.stringify(this.operators));
            }

            this.operators[entry.ind.origin.name].count += 1;
        }

        if (entry.type != LogType.evaluation) {
            const child = `<tr><td>${name}</td><td>${origin}</td><td>${entry.ind.toString()}</td><td>${entry.ind.fitness}</td></tr>`;
            this.tbodyOutput.nativeElement.innerHTML += child;
        }

        if (entry.type === LogType.foundBetter) {
            const fitness = entry.ind.fitness;
            if (fitness > this.current.fitness) {
                this.current.fitness = fitness;
                this.current.best = entry.ind.toString();
            }
        }

        if (entry.type === LogType.finished) {
            this.localSearch.pause();
            this.current.progress = 100;
        }
    }

    public updateProgress(progress: LogProgress): void {
        this.current.progress = progress.percentage;
        this.current.index = progress.evaluationIndex;
    }

    public getItensCount(text: string): string {
        const count = text.split('\n').filter(Boolean).length;
        return count != 0 ? `${count} items` : `${count} item`;
    }

}
