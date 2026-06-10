import { BaseNode } from "./base";
import { XY, BaseNodeData, NodeVariable, CodeOutput } from "../types/common";

interface CodeNodeData extends BaseNodeData {
  type: "code";
  code_language: "python3" | "javascript";
  code: string;
  variables: NodeVariable[];
  outputs: Record<string, CodeOutput>;
}

export class CodeNode extends BaseNode<CodeNodeData> {
  constructor(id: string, data?: Partial<CodeNodeData>) {
    super(id, "custom", {
      type: "code", title: data?.title ?? "", desc: data?.desc ?? "", selected: false,
      code_language: data?.code_language ?? "python3", code: data?.code ?? "",
      variables: data?.variables ?? [], outputs: data?.outputs ?? {},
    }, { height: data?.code ? Math.max(90, data.code.split("\n").length * 20) : 90 });
  }

  toJSON(): Record<string, unknown> {
    const outputs: Record<string, unknown> = {};
    for (const [name, out] of Object.entries(this.data.outputs)) {
      outputs[name] = { children: null, type: out.type };
    }
    return this.outerJSON(this.dataJSON({
      code: this.data.code,
      code_language: this.data.code_language,
      outputs,
      variables: this.data.variables.map(v => {
        const obj: Record<string, unknown> = {
          variable: v.variable,
          value_selector: [v.value_selector[0], v.value_selector[1]],
        };
        if (v.value_type) obj.value_type = v.value_type;
        return obj;
      }),
    }));
  }

  // ─── Methods ───
  setCode(lang: "python3" | "javascript", code: string): this {
    this.data.code_language = lang;
    this.data.code = code;
    return this;
  }

  addVariable(v: NodeVariable): this {
    this.data.variables.push(v);
    return this;
  }

  removeVariable(name: string): this {
    this.data.variables = this.data.variables.filter(x => x.variable !== name);
    return this;
  }

  addOutput(name: string, type: string): this {
    this.data.outputs[name] = { type, children: null };
    return this;
  }

  removeOutput(name: string): this {
    delete this.data.outputs[name];
    return this;
  }

  get code(): string { return this.data.code; }
  get codeLanguage(): string { return this.data.code_language; }
  get inputVariables(): NodeVariable[] { return this.data.variables; }
  get outputDefs(): Record<string, CodeOutput> { return this.data.outputs; }

  static override fromYAML(raw: Record<string, unknown>): CodeNode {
    const d = raw.data as Record<string, unknown>;
    const node = new CodeNode(raw.id as string, {
      title: d.title as string, desc: d.desc as string,
      code_language: d.code_language as "python3" | "javascript",
      code: d.code as string,
      variables: d.variables as NodeVariable[],
      outputs: d.outputs as Record<string, CodeOutput>,
    });
    node.setPosition((raw.position as XY).x, (raw.position as XY).y);
    node.width = raw.width as number;
    node.height = raw.height as number;
    if (raw.zIndex !== undefined) node.zIndex = raw.zIndex as number;
    return node;
  }
}
