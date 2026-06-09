import { BaseNode } from "./base";
import { XY, BaseNodeData, NodeVariable, CodeOutput, IfCase, ClassDefinition, ParamSchema, ToolParamValue, ModelConfig } from "../types/common";
import { YAMLWriter } from "../serializer";

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

  toYAML(w: YAMLWriter): void {
    w.listItem(() => {
      this.writeDataHead(w);
      w.blockScalar("code", this.data.code);
      w.keyVal("code_language", this.data.code_language);
      // outputs
      w.key("outputs");
      w.incIndent();
      Object.entries(this.data.outputs).forEach(([name, out]) => {
        w.key(name);
        w.incIndent();
        w.key("children");
        w.keyVal("type", out.type);
        w.decIndent();
      });
      w.decIndent();
      // variables
      w.key("variables");
      w.incIndent();
      this.data.variables.forEach(v => {
        w.listItem(() => {
          w.key("value_selector");
          w.incIndent();
          w.raw(`- '${v.value_selector[0]}'`);
          w.raw(`- ${v.value_selector[1]}`);
          w.decIndent();
          if (v.value_type) w.keyVal("value_type", v.value_type);
          w.keyVal("variable", v.variable);
        });
      });
      w.decIndent();
      this.closeData(w);
      this.writeOuter(w);
    });
  }

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
    return node;
  }
}
