import { Individual } from "../models/Individual";
import { Neighborhood } from "../models/Neighborhood";
import { Node } from "../nodes/Node";
import { ShrinkOperator } from "../shrinker/NodeShrinker";

export interface ILogger {
    end(): Promise<void>;
    logStop(label: string, data: { [key: string]: string }): void;
    logInitialSolution(ind: Individual): void;
    logJumpedFrom(ind: Individual): void;
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
    logInitShrinker(ind: Individual): void;
    logShrink(ind: Individual, funcName: string, fromNode: Node, toNode: Node): void;
    logFinishShrinker(fromInd: Individual, toInd: Individual): void;
    logGenerateIndividualToRestart(ind: Individual): void;

    logShrinkRoot(ind: Individual): void;
    logShrinkOperation(operationName: ShrinkOperator, args: string[]): void;
    logShrinkRootFinished(ind: Individual, nodeResult: Node): void;
}