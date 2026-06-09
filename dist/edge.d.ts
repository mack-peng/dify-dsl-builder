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
    constructor(source: string, target: string, sourceHandle?: string, targetHandle?: string, opts?: {
        zIndex?: number;
        isInIteration?: boolean;
        isInLoop?: boolean;
    });
    redirect(newTarget: string): void;
    toYAML(w: YAMLWriter, sourceType: string, targetType: string): void;
    static fromYAML(raw: Record<string, unknown>): Edge;
}
