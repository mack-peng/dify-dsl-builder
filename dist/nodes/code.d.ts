import { BaseNode } from "./base";
import { BaseNodeData, NodeVariable, CodeOutput } from "../types/common";
import { YAMLWriter } from "../serializer";
interface CodeNodeData extends BaseNodeData {
    type: "code";
    code_language: "python3" | "javascript";
    code: string;
    variables: NodeVariable[];
    outputs: Record<string, CodeOutput>;
}
export declare class CodeNode extends BaseNode<CodeNodeData> {
    constructor(id: string, data?: Partial<CodeNodeData>);
    toYAML(w: YAMLWriter): void;
    static fromYAML(raw: Record<string, unknown>): CodeNode;
}
export {};
