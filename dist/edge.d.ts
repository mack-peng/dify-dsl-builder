import { YAMLWriter } from "./serializer";
export declare class Edge {
    id: string;
    source: string;
    sourceHandle: string;
    target: string;
    targetHandle: string;
    zIndex: number;
    isInIteration: boolean;
    isInLoop: boolean;
    iterationId?: string;
    constructor(source: string, target: string, sourceHandle?: string, targetHandle?: string, opts?: {
        zIndex?: number;
        isInIteration?: boolean;
        isInLoop?: boolean;
        iterationId?: string;
    });
    redirect(newTarget: string): void;
    toYAML(w: YAMLWriter, sourceType: string, targetType: string): void;
    static fromYAML(raw: Record<string, unknown>): Edge;
}
