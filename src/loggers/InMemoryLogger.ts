import { Individual } from "../models/Individual";
import { Neighborhood } from "../models/Neighborhood";
import { ILogger } from "./ILogger";

export interface LogEntry {
    index: number;
    event: string;
    regex: string;
    origin: string;
    fitness: number;
}


export class InMemoryLogger implements ILogger {
    public counter = {
        evaluations: 0,
    };

    public localSolutions: string[] = [];

    public logs: LogEntry[] = [];

    private getOriginFromInd(ind: Individual): string {
        if (ind.origin.length == 0) {
            return '';
        }

        const origin = ind.origin[0];
        return `${origin.name}(${origin.args.join(', ')})`;
    }

    public addLogEntry(event: string, ind: Individual): void {
        this.logs.push({
            'index': ind.id,
            event: event,
            regex: ind.toString(),
            origin: this.getOriginFromInd(ind),
            fitness: ind.fitness,
        });
    }

    logBestCurrentSolutionAmongNeighborhoods(solution: Individual): void {
        // nothing
    }

    logStop(label: string, data: { [key: string]: string; }): void {
        // nothing
    }

    logInitialSolution(ind: Individual): void {
        this.addLogEntry('Initial Solution', ind);
    }

    logJumpedTo(ind: Individual): void {
        this.addLogEntry('Jumped to', ind);
    }

    logAddLocalSolution(ind: Individual): void {
        // nothing
    }

    logNeighborhoodError(neighborhood: Neighborhood, e: any): void {
        // nothing
    }

    logHasAlreadyVisited(ind: Individual): void {
        // nothing
    }

    logFoundBetter(ind: Individual): void {
        this.addLogEntry('Found better in neighborhood', ind);
    }

    logEvaluation(ind: Individual): void {
        // nothing
    }

    logAddSolution(ind: Individual): void {
        // nothing
    }

    logStartNeighborhood(ind: Individual): void {
        this.addLogEntry('Starting neighborhood', ind);
    }

}