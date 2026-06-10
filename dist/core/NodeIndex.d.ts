import { BaseNode } from "../nodes/base";
import { EdgeData } from "./types";
/**
 * O(1) index over all nodes + edges.
 * Separated from DifyDSL so it can be rebuilt independently.
 */
export declare class NodeIndex {
    /** All nodes keyed by id */
    readonly byId: Map<string, BaseNode<any>>;
    /** Node IDs grouped by data.type */
    readonly byType: Map<string, Set<string>>;
    /** Child node IDs grouped by parentId (iteration containers) */
    readonly byParent: Map<string, Set<string>>;
    /** Edges keyed by id */
    readonly edges: Map<string, EdgeData>;
    /** Outgoing edge IDs grouped by source node id */
    readonly outEdges: Map<string, Set<string>>;
    /** Incoming edge IDs grouped by target node id */
    readonly inEdges: Map<string, Set<string>>;
    addNode(node: BaseNode<any>): void;
    removeNode(id: string): void;
    getNode(id: string): BaseNode<any> | undefined;
    getNodesByType(type: string): BaseNode<any>[];
    getChildren(parentId: string): BaseNode<any>[];
    addEdge(e: EdgeData): void;
    removeEdge(id: string): void;
    getOutEdges(sourceId: string): EdgeData[];
    getInEdges(targetId: string): EdgeData[];
    /** Get upstream node IDs (predecessors) */
    getPrevIds(id: string): string[];
    /** Get downstream node IDs (successors) */
    getNextIds(id: string): string[];
    private _removeEdgesFor;
    /** Populate from flat arrays (used during initial parse) */
    rebuild(nodes: BaseNode<any>[], edges: EdgeData[]): void;
}
