import { BaseNode } from "./base";
import { BaseNodeData, ParamSchema, ToolParamValue, ModelConfig, ClassDefinition } from "../types/common";
interface ToolNodeData extends BaseNodeData {
    type: "tool";
    is_team_authorization: boolean;
    paramSchemas: ParamSchema[];
    params: Record<string, string>;
    plugin_id: string;
    plugin_unique_identifier: string;
    provider_icon: string;
    provider_id: string;
    provider_name: string;
    provider_type: string;
    tool_configurations: Record<string, unknown>;
    tool_description: string;
    tool_label: string;
    tool_name: string;
    tool_node_version: string;
    tool_parameters: Record<string, ToolParamValue>;
}
export declare class ToolNode extends BaseNode<ToolNodeData> {
    constructor(id: string, data?: Partial<ToolNodeData>);
    toJSON(): Record<string, unknown>;
    setPlugin(pluginId: string, uniqueId: string): this;
    setToolParam(name: string, value: ToolParamValue): this;
    setToolConfig(key: string, value: unknown): this;
    static fromYAML(raw: Record<string, unknown>): ToolNode;
}
interface ClassifierNodeData extends BaseNodeData {
    type: "question-classifier";
    query_variable_selector: [string, string];
    model: ModelConfig;
    classes: ClassDefinition[];
    instructions?: string;
}
export declare class ClassifierNode extends BaseNode<ClassifierNodeData> {
    constructor(id: string, data?: Partial<ClassifierNodeData>);
    toJSON(): Record<string, unknown>;
    addClass(cls: ClassDefinition): this;
    removeClass(id: string): this;
    setModel(provider: string, name: string): this;
    setInstructions(instructions: string): this;
    static fromYAML(raw: Record<string, unknown>): ClassifierNode;
}
interface HTTPNodeData extends BaseNodeData {
    type: "http-request";
    method: string;
    url: string;
    authorization: {
        type: string;
    };
    headers: string;
    params: string;
    body: {
        type: string;
        data: string;
    };
    timeout: {
        connect: number;
        read: number;
        write: number;
    };
}
export declare class HTTPNode extends BaseNode<HTTPNodeData> {
    constructor(id: string, data?: Partial<HTTPNodeData>);
    toJSON(): Record<string, unknown>;
    static fromYAML(raw: Record<string, unknown>): HTTPNode;
}
interface DocNodeData extends BaseNodeData {
    type: "document-extractor";
    variable_selector: [string, string];
    is_array_file?: boolean;
}
export declare class DocNode extends BaseNode<DocNodeData> {
    constructor(id: string, data?: Partial<DocNodeData>);
    toJSON(): Record<string, unknown>;
    static fromYAML(raw: Record<string, unknown>): DocNode;
}
export {};
