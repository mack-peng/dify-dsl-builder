import { BaseNode } from "./base";
import { BaseNodeData, NodeVariable, IfCase, ModelConfig } from "../types/common";
import { YAMLWriter } from "../serializer";
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
    toYAML(w: YAMLWriter): void;
    static fromYAML(raw: Record<string, unknown>): KnowledgeNode;
}
interface IfElseNodeData extends BaseNodeData {
    type: "if-else";
    cases: IfCase[];
}
export declare class IfElseNode extends BaseNode<IfElseNodeData> {
    constructor(id: string, data?: Partial<IfElseNodeData>);
    toYAML(w: YAMLWriter): void;
    static fromYAML(raw: Record<string, unknown>): IfElseNode;
}
interface TemplateNodeData extends BaseNodeData {
    type: "template-transform";
    template: string;
    variables: NodeVariable[];
}
export declare class TemplateNode extends BaseNode<TemplateNodeData> {
    constructor(id: string, data?: Partial<TemplateNodeData>);
    toYAML(w: YAMLWriter): void;
    static fromYAML(raw: Record<string, unknown>): TemplateNode;
}
interface AggregatorNodeData extends BaseNodeData {
    type: "variable-aggregator";
    output_type: string;
    variables: [string, string][];
}
export declare class AggregatorNode extends BaseNode<AggregatorNodeData> {
    constructor(id: string, data?: Partial<AggregatorNodeData>);
    toYAML(w: YAMLWriter): void;
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
export declare class IterationNode extends BaseNode<IterationNodeData> {
    children: (IterChildNode)[];
    startNode: IterationStartNode | null;
    constructor(id: string, data?: Partial<IterationNodeData>);
    findChildCode(id: string): IterChildNode | undefined;
    findChildKB(id: string): IterChildNode | undefined;
    findChildTemplate(id: string): IterChildNode | undefined;
    findChild(id: string): IterChildNode | undefined;
    addChild<T extends BaseNode<any>>(node: T, _opts?: {
        zIndex?: number;
    }): IterChildNode;
    toYAML(w: YAMLWriter): void;
    static fromYAML(raw: Record<string, unknown>): IterationNode;
}
export type IterChildNode = BaseNode<any> & {
    parentId: string;
    isInIteration: true;
    iterationId: string;
};
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
    toYAML(w: YAMLWriter): void;
    static fromYAML(raw: Record<string, unknown>): IterationStartNode;
}
export {};
