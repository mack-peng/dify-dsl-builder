import { BaseNode } from "./base";
import { BaseNodeData, NodeVariable, CodeOutput } from "../types/common";
interface CodeNodeData extends BaseNodeData {
    type: "code";
    code_language: "python3" | "javascript";
    code: string;
    variables: NodeVariable[];
    outputs: Record<string, CodeOutput>;
}
export declare class CodeNode extends BaseNode<CodeNodeData> {
    constructor(id: string, data?: Partial<CodeNodeData>);
    toJSON(): Record<string, unknown>;
    setCode(lang: "python3" | "javascript", code: string): this;
    addVariable(v: NodeVariable): this;
    removeVariable(name: string): this;
    addOutput(name: string, type: string): this;
    removeOutput(name: string): this;
    get code(): string;
    get codeLanguage(): string;
    get inputVariables(): NodeVariable[];
    get outputDefs(): Record<string, CodeOutput>;
    static fromYAML(raw: Record<string, unknown>): CodeNode;
}
export {};
