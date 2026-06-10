import { BaseNode } from "./base";
import { BaseNodeData, PromptMessage, ModelConfig, MemoryConfig } from "../types/common";
export interface StartVariable {
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
    toJSON(): Record<string, unknown>;
    addVariable(v: StartVariable): this;
    removeVariable(name: string): this;
    updateVariable(name: string, patch: Partial<StartVariable>): this;
    get variables(): StartVariable[];
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
    toJSON(): Record<string, unknown>;
    setAnswer(tpl: string): this;
    get answer(): string;
    addVariableRef(nodeId: string, field: string, valueType?: string): this;
    removeVariableRef(nodeId: string): this;
    get answerVariables(): AnswerNodeData["variables"];
    static fromYAML(raw: Record<string, unknown>): AnswerNode;
}
interface PromptConfig {
    jinja2_variables: unknown[];
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
    prompt_config?: PromptConfig;
}
export declare class LLMNode extends BaseNode<LLMNodeData> {
    constructor(id: string, data?: Partial<LLMNodeData>);
    toJSON(): Record<string, unknown>;
    setModel(provider: string, name: string): this;
    setTemperature(t: number): this;
    setContextEnabled(enabled: boolean): this;
    setContextSelector(nodeId: string, field: string): this;
    addPromptMessage(msg: PromptMessage): this;
    setMemory(windowSize: number): this;
    clearMemory(): this;
    get promptMessages(): PromptMessage[];
    get modelConfig(): ModelConfig;
    get hasMemory(): boolean;
    static fromYAML(raw: Record<string, unknown>): LLMNode;
}
export {};
