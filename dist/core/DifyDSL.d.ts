import { BaseNode } from "../nodes/base";
import { NodeIndex } from "./NodeIndex";
import { DifyDSLJSON, AppMeta, Dependency, Viewport, EdgeData } from "./types";
/**
 * 7-step pipeline:
 * ① parse(yamlStr)   → raw JSON
 * ② index()          → NodeIndex (typed nodes + edges)
 * ③ (implicit: edges provide connectivity)
 * ④ CRUD             → getNode / addNode / removeNode / updateNode
 * ⑤ Node.methods()   → instance modifications
 * ⑥ toJSON()         → Dify DSL JSON plain object
 * ⑦ toYAML()         → yaml.dump() + replace
 */
export declare class DifyDSL {
    version: string;
    kind: "app";
    app: AppMeta;
    dependencies: Dependency[];
    envVariables: unknown[];
    convVariables: unknown[];
    ragVariables: unknown[];
    features: Record<string, unknown>;
    viewport: Viewport;
    index: NodeIndex;
    private constructor();
    /**
     * Parse YAML string and build the internal index.
     * Steps ① + ② combined.
     */
    static parse(yamlStr: string): DifyDSL;
    getNode(id: string): BaseNode<any> | undefined;
    findByType(type: string): BaseNode<any>[];
    addNode(node: BaseNode<any>): void;
    removeNode(id: string): void;
    /**
     * Get → mutate → sync back.
     * The callback receives the node instance and can call its methods directly.
     * After mutation, the index is already updated (no extra sync needed).
     */
    updateNode<T extends BaseNode<any>>(id: string, fn: (node: T) => void): void;
    /** Get predecessor node IDs (upstream) */
    getPrevIds(id: string): string[];
    /** Get successor node IDs (downstream) */
    getNextIds(id: string): string[];
    /** Get all edges related to a node (incoming + outgoing) */
    getNodeEdges(id: string): EdgeData[];
    /** Convenience type-checked finders (for patch system compat) */
    findStart(id: string): BaseNode<any> | undefined;
    findLLM(id: string): BaseNode<any> | undefined;
    findCode(id: string): BaseNode<any> | undefined;
    findKnowledge(id: string): BaseNode<any> | undefined;
    findAnswer(id: string): BaseNode<any> | undefined;
    findClassifier(id: string): BaseNode<any> | undefined;
    /** Add an edge by source/target IDs */
    addEdge(source: string, target: string, sourceHandle?: string): void;
    /** Remove an edge by id */
    removeEdge(edgeId: string): void;
    /** Number of nodes */
    get nodeCount(): number;
    /** Number of edges */
    get edgeCount(): number;
    /** Mode string */
    get mode(): string;
    /** Save to file */
    save(filePath: string): void;
    setEnv(name: string, value: unknown, type: "string" | "number"): void;
    removeEnv(name: string): void;
    setConv(name: string, type?: "string" | "number"): void;
    toJSON(): DifyDSLJSON;
    validate(): {
        errors: {
            message: string;
        }[];
        warnings: {
            message: string;
        }[];
    };
    toYAML(): string;
}
