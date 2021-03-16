import { Component, OnInit } from '@angular/core';
import { LocalSearchService, LocalSearchConfig } from './local-search.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
    title = 'regexgolg';

    public config: LocalSearchConfig = {
        left: instances['warmup'].left,
        right: instances['warmup'].right,
        budget: 500000,
        depth: 4,
        seed: 2967301147,
        timeout: 120000,
    };

    public constructor(public localSearch: LocalSearchService) { }

    public start() {
        this.localSearch.start(this.config);
    }

    public pause() {
        this.localSearch.pause();
    }

    public ngOnInit() {
        // this.localSearch.logger.added.subscribe(value => this.addLog(value));
        // this.localSearch.logger.progress.subscribe(value => this.updateProgress(value));
    }

}


const instances: { [key: string]: {left: string[], right: string[]}} = {
    warmup: {
        left: ["afoot", "catfoot", "dogfoot", "fanfoot", "foody", "foolery", "foolish", "fooster", "footage", "foothot", "footle", "footpad", "footway", "hotfoot", "jawfoot", "mafoo", "nonfood", "padfoot", "prefool", "sfoot", "unfool"],
        right: ["Atlas", "Aymoro", "Iberic", "Mahran", "Ormazd", "Silipan", "altared", "chandoo", "crenel", "crooked", "fardo", "folksy", "forest", "hebamic", "idgah", "manlike", "marly", "palazzi", "sixfold", "tarrock", "unfold"],
    }
};
