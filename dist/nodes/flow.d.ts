import { BaseNode } from "./base";
import { BaseNodeData, NodeVariable, IfCase, ModelConfig } from "../types/common";
interface KnowledgeNodeData extends BaseNodeData {
    type: "knowledge-retrieval";
    dataset_ids: string[];
    query_variable_selector: [string, string];
    retrieval_mode: "single" | "multiple";
    multiple_retrieval_config?: {
        top_k: number;
        score_threshold: null | number;
        reranking_enable: boolean;
    };
    single_retrieval_config?: {
        model: ModelConfig;
    };
}
export declare class KnowledgeNode extends BaseNode<KnowledgeNodeData> {
    constructor(id: string, data?: Partial<KnowledgeNodeData>);
    toJSON(): Record<string, unknown>;
    addDataset(id: string): this;
    removeDataset(id: string): this;
    setQuerySelector(nodeId: string, field: string): this;
    setTopK(n: number): this;
    static fromYAML(raw: Record<string, unknown>): KnowledgeNode;
}
interface IfElseNodeData extends BaseNodeData {
    type: "if-else";
    cases: IfCase[];
}
export declare class IfElseNode extends BaseNode<IfElseNodeData> {
    constructor(id: string, data?: Partial<IfElseNodeData>);
    toJSON(): Record<string, unknown>;
    addCase(c: IfCase): this;
    removeCase(id: string): this;
    updateCondition(caseId: string, condIdx: number, patch: Record<string, unknown>): this;
    get cases(): IfCase[];
    static fromYAML(raw: Record<string, unknown>): IfElseNode;
}
interface TemplateNodeData extends BaseNodeData {
    type: "template-transform";
    template: string;
    variables: NodeVariable[];
}
export declare class TemplateNode extends BaseNode<TemplateNodeData> {
    constructor(id: string, data?: Partial<TemplateNodeData>);
    toJSON(): Record<string, unknown>;
    setTemplate(tpl: string): this;
    addVariable(v: NodeVariable): this;
    removeVariable(name: string): this;
    get template(): string;
    static fromYAML(raw: Record<string, unknown>): TemplateNode;
}
interface AggregatorNodeData extends BaseNodeData {
    type: "variable-aggregator";
    output_type: string;
    variables: [string, string][];
}
export declare class AggregatorNode extends BaseNode<AggregatorNodeData> {
    constructor(id: string, data?: Partial<AggregatorNodeData>);
    toJSON(): Record<string, unknown>;
    addSource(nodeId: string, field: string): this;
    removeSource(nodeId: string): this;
    setOutputType(t: string): this;
    get sources(): [string, string][];
    static fromYAML(raw: Record<string, unknown>): AggregatorNode;
}
interface IterationNodeData extends BaseNodeData {
    type: "iteration";
    iterator_selector: [string, string];
    iterator_input_type: string;
    output_selector: [string, string];
    output_type: string;
    start_node_id: string;
    is_parallel: boolean;
    parallel_nums: number;
    error_handle_mode: string;
    width: number;
    height: number;
}
export type IterChildNode = BaseNode<any> & {
    parentId: string;
    isInIteration: true;
    iterationId: string;
};
export declare class IterationNode extends BaseNode<IterationNodeData> {
    children: IterChildNode[];
    startNode: IterationStartNode | null;
    constructor(id: string, data?: Partial<IterationNodeData>);
    addChild<T extends BaseNode<any>>(node: T): IterChildNode;
    removeChild(id: string): void;
    findChild(id: string): IterChildNode | undefined;
    setIterator(nodeId: string, field: string): this;
    setOutputSelector(nodeId: string, field: string): this;
    toJSON(): Record<string, unknown>;
    static fromYAML(raw: Record<string, unknown>): IterationNode;
}
interface IterStartNodeData extends BaseNodeData {
    type: "iteration-start";
    isInIteration: boolean;
    iteration_id: string;
    height?: number;
    width?: number;
}
export declare class IterationStartNode extends BaseNode<IterStartNodeData> {
    parentId: string;
    constructor(parentIterId: string, data?: Partial<IterStartNodeData>);
    toJSON(): Record<string, unknown>;
    static fromYAML(raw: Record<string, unknown>): IterationStartNode;
}
export {};
