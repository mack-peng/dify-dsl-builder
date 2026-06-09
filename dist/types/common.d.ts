export interface XY {
    x: number;
    y: number;
}
export interface BaseNodeData {
    type: string;
    title: string;
    desc: string;
    selected: boolean;
}
export interface NodeVariable {
    variable: string;
    value_selector: [string, string];
    value_type?: string;
}
export interface PromptMessage {
    id?: string;
    role: "system" | "user" | "assistant";
    text: string;
}
export interface ModelConfig {
    provider: string;
    name: string;
    mode: "chat" | "completion";
    completion_params: Record<string, unknown>;
}
export interface MemoryConfig {
    window: {
        enabled: boolean;
        size: number;
    };
    query_prompt_template: string;
    role_prefix?: {
        assistant: string;
        user: string;
    };
}
export interface CodeOutput {
    type: string;
    children: null;
}
export interface IfCondition {
    id?: string;
    variable_selector: [string, string];
    comparison_operator: string;
    value: string;
    varType?: string;
}
export interface IfCase {
    case_id: "true" | "false";
    id: string;
    logical_operator: "and" | "or";
    conditions: IfCondition[];
}
export interface ClassDefinition {
    id: string;
    name: string;
    description: string;
}
export interface Dependency {
    current_identifier: null;
    type: "marketplace";
    value: {
        marketplace_plugin_unique_identifier: string;
        version: null;
    };
}
export interface AppMeta {
    name: string;
    mode: "workflow" | "advanced-chat";
    description: string;
    icon: string;
    icon_background: string;
    use_icon_as_answer_icon: boolean;
}
export interface ParamSchema {
    auto_generate: null;
    default: unknown;
    form: "llm";
    human_description: Record<string, string>;
    label: Record<string, string>;
    llm_description: string;
    max: number | null;
    min: number | null;
    name: string;
    options: unknown[];
    placeholder: null;
    precision: null;
    required: boolean;
    scope: null;
    template: null;
    type: string;
}
export interface ToolParamValue {
    type: "mixed" | "constant";
    value: string | number;
}
