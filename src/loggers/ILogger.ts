import { Individual } from "../models/Individual";
import { Neighborhood } from "../models/Neighborhood";

export interface ILogger {
    logStop(label: string, data: { [key: string]: string }): void;
    logInitialSolution(currentSolution: Individual): void;
    logJumpedTo(currentSolution: Individual): void;
    logAddLocalSolution(currentSolution: Individual): void;
    logNeighborhoodError(neighborhood: Neighborhood, e: any): void;
    logHasAlreadyVisited(ind: Individual): void;
    logFoundBetter(ind: Individual): void;
    logEvaluation(ind: Individual): void;
    logAddSolution(currentSolution: Individual): void;
    logBestCurrentSolutionAmongNeighborhoods(solution: Individual): void;
    logStartNeighborhood(solution: Individual): void;
}