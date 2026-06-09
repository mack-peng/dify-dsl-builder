import { BaseNode } from "./base";
import { BaseNodeData, PromptMessage, ModelConfig, MemoryConfig } from "../types/common";
import { YAMLWriter } from "../serializer";
interface StartVariable {
    variable: string;
    label: string;
    type: string;
    required: boolean;
    max_length?: number;
    options: string[];
    placeholder?: string;
    default?: string;
}
interface StartNodeData extends BaseNodeData {
    type: "start";
    variables: StartVariable[];
}
export declare class StartNode extends BaseNode<StartNodeData> {
    constructor(id: string, data?: Partial<StartNodeData>);
    toYAML(w: YAMLWriter): void;
    static fromYAML(raw: Record<string, unknown>): StartNode;
}
interface AnswerNodeData extends BaseNodeData {
    type: "answer";
    answer: string;
    variables: {
        variable: string;
        value_selector: [string, string];
        value_type?: string;
    }[];
}
export declare class AnswerNode extends BaseNode<AnswerNodeData> {
    constructor(id: string, data?: Partial<AnswerNodeData>);
    toYAML(w: YAMLWriter): void;
    static fromYAML(raw: Record<string, unknown>): AnswerNode;
}
interface LLMNodeData extends BaseNodeData {
    type: "llm";
    model: ModelConfig;
    prompt_template: PromptMessage[];
    context: {
        enabled: boolean;
        variable_selector: string[];
    };
    vision: {
        enabled: boolean;
    };
    memory?: MemoryConfig;
}
export declare class LLMNode extends BaseNode<LLMNodeData> {
    constructor(id: string, data?: Partial<LLMNodeData>);
    toYAML(w: YAMLWriter): void;
    static fromYAML(raw: Record<string, unknown>): LLMNode;
}
export {};
