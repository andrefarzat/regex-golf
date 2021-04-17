import { Individual } from "../models/Individual";
import { Neighborhood } from "../models/Neighborhood";

export interface ILogger {
    logStop(label: string, data: { [key: string]: string }): void;
    logInitialSolution(ind: Individual): void;
    logJumpedTo(ind: Individual): void;
    logAddLocalSolution(ind: Individual): void;
    logNeighborhoodError(neighborhood: Neighborhood, e: any): void;
    logHasAlreadyVisited(ind: Individual): void;
    logFoundBetter(ind: Individual): void;
    logEvaluation(ind: Individual): void;
    logAddSolution(ind: Individual): void;
    logBestCurrentSolutionAmongNeighborhoods(ind: Individual): void;
    logStartNeighborhood(ind: Individual): void;
    logFinished(bestIndFound: Individual, lastIndEvaluated: Individual): void;
    logShrink(ind: Individual): void;
}