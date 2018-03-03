import Individual from "./Individual";
import Utils from "../Utils";
import IndividualFactory from "./IndividualFactory";


export default class Population {
    protected individuals: Individual[] = [];
    private dirty: boolean = true;

    public get length(): number {
        return this.individuals.length;
    }

    public sortToElitism(): void {
        this.individuals.sort(function(a, b) {
            if (a.fitness > b.fitness) return -1;
            if (a.fitness < b.fitness) return 1;

            // tiebreaker
            if (a.toString().length < b.toString().length) return -1;
            if (a.toString().length > b.toString().length) return 1;

            return 0; // Well, we really have a tie
        });
    }

    public forEach(fn: (ind:Individual) => void | boolean): void {
        let len = this.individuals.length;
        for (let i = 0; i < len; i ++) {
            let shouldContinue = fn(this.individuals[i]);
            if (shouldContinue == false) break;
        }
    }

    public get(index: number): Individual {
        return this.individuals[index];
    }

    public add(ind: Individual): void {
        this.individuals.push(ind);
        this.dirty = true;
    }

    public addAll(inds: Individual[]): void {
        inds.forEach(ind => this.add(ind));
    }

    public removeByIndex(index: number): void {
        this.individuals.splice(index, 1);
    }

    public pop(): Individual {
        return this.individuals.pop();
    }

    public isDirty(): boolean {
        return this.dirty;
    }

    public getUsingRoullete(): Individual {
        if (this.isDirty()) {
            // TODO: add the roullete implementation
        }

        let maxTries = 10;

        while (maxTries > 0) {
            // TODO: Improve this
            let ind = Utils.getRandomlyFromList(this.individuals);
            if (ind.fitness > 0) return ind;
            maxTries --;
        }

        throw new Error("10 tries and no valid individual. Something is wrong");
    }
}