import { BaseNode } from "./base";
import { XY, BaseNodeData, ParamSchema, ToolParamValue, ModelConfig, ClassDefinition } from "../types/common";
import { YAMLWriter } from "../serializer";

// ─── Tool Node ───
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

export class ToolNode extends BaseNode<ToolNodeData> {
  constructor(id: string, data?: Partial<ToolNodeData>) {
    super(id, "custom", {
      type: "tool", title: data?.title ?? "", desc: data?.desc ?? "", selected: false,
      is_team_authorization: data?.is_team_authorization ?? true,
      paramSchemas: data?.paramSchemas ?? [],
      params: data?.params ?? {},
      plugin_id: data?.plugin_id ?? "",
      plugin_unique_identifier: data?.plugin_unique_identifier ?? "",
      provider_icon: data?.provider_icon ?? "",
      provider_id: data?.provider_id ?? "",
      provider_name: data?.provider_name ?? "",
      provider_type: data?.provider_type ?? "builtin",
      tool_configurations: data?.tool_configurations ?? {},
      tool_description: data?.tool_description ?? "",
      tool_label: data?.tool_label ?? "",
      tool_name: data?.tool_name ?? "",
      tool_node_version: data?.tool_node_version ?? "2",
      tool_parameters: data?.tool_parameters ?? {},
    });
  }

  toYAML(w: YAMLWriter): void {
    w.listItem(() => {
      this.writeDataHead(w);
      w.keyVal("is_team_authorization", this.data.is_team_authorization);
      // paramSchemas
      w.key("paramSchemas");
      w.incIndent();
      this.data.paramSchemas.forEach(ps => {
        w.listItem(() => {
          w.key("auto_generate");
          w.key("default");
          w.keyVal("form", ps.form);
          w.key("human_description");
          w.incIndent();
          Object.entries(ps.human_description).forEach(([k, v]) => w.keyQuoted(k, v));
          w.decIndent();
          w.key("label");
          w.incIndent();
          Object.entries(ps.label).forEach(([k, v]) => w.keyQuoted(k, v));
          w.decIndent();
          w.keyQuoted("llm_description", ps.llm_description);
          w.key("max");
          w.key("min");
          w.keyVal("name", ps.name);
          w.raw("options: []");
          w.key("placeholder");
          w.key("precision");
          w.keyVal("required", ps.required);
          w.key("scope");
          w.key("template");
          w.keyVal("type", ps.type);
        });
      });
      w.decIndent();
      // params
      w.key("params");
      w.incIndent();
      Object.entries(this.data.params).forEach(([k, v]) => w.keyQuoted(k, v));
      w.decIndent();
      w.keyQuoted("plugin_id", this.data.plugin_id);
      w.keyQuoted("plugin_unique_identifier", this.data.plugin_unique_identifier);
      w.keyQuoted("provider_icon", this.data.provider_icon);
      w.keyQuoted("provider_id", this.data.provider_id);
      w.keyQuoted("provider_name", this.data.provider_name);
      w.keyVal("provider_type", this.data.provider_type);
      w.raw("tool_configurations: {}");
      w.keyQuoted("tool_description", this.data.tool_description);
      w.keyQuoted("tool_label", this.data.tool_label);
      w.keyQuoted("tool_name", this.data.tool_name);
      w.keyQuoted("tool_node_version", this.data.tool_node_version);
      w.key("tool_parameters");
      w.incIndent();
      Object.entries(this.data.tool_parameters).forEach(([k, v]) => {
        w.key(k);
        w.incIndent();
        w.keyVal("type", v.type);
        if (v.type === "mixed") w.keyQuoted("value", typeof v.value === "string" ? v.value : String(v.value ?? ""));
        else w.keySingleQuoted("value", typeof v.value === "string" ? v.value : String(v.value ?? ""));
        w.decIndent();
      });
      w.decIndent();
      this.closeData(w);
      this.writeOuter(w);
    });
  }

  static override fromYAML(raw: Record<string, unknown>): ToolNode {
    const d = raw.data as Record<string, unknown>;
    const node = new ToolNode(raw.id as string, {
      title: d.title as string, desc: d.desc as string,
      paramSchemas: d.paramSchemas as ParamSchema[],
      params: d.params as Record<string, string>,
      plugin_id: d.plugin_id as string,
      plugin_unique_identifier: d.plugin_unique_identifier as string,
      provider_icon: d.provider_icon as string,
      provider_id: d.provider_id as string,
      provider_name: d.provider_name as string,
      provider_type: d.provider_type as string,
      tool_name: d.tool_name as string,
      tool_label: d.tool_label as string,
      tool_description: d.tool_description as string,
      tool_node_version: d.tool_node_version as string,
      tool_parameters: d.tool_parameters as Record<string, ToolParamValue>,
    });
    node.setPosition((raw.position as XY).x, (raw.position as XY).y);
    node.width = raw.width as number;
    node.height = raw.height as number;
    return node;
  }
}

// ─── Question Classifier Node ───
interface ClassifierNodeData extends BaseNodeData {
  type: "question-classifier";
  query_variable_selector: [string, string];
  model: ModelConfig;
  classes: ClassDefinition[];
  instructions?: string;
}

export class ClassifierNode extends BaseNode<ClassifierNodeData> {
  constructor(id: string, data?: Partial<ClassifierNodeData>) {
    super(id, "custom", {
      type: "question-classifier", title: data?.title ?? "", desc: data?.desc ?? "", selected: false,
      query_variable_selector: data?.query_variable_selector ?? ["sys", "query"],
      model: data?.model ?? { provider: "", name: "", mode: "chat", completion_params: {} },
      classes: data?.classes ?? [],
      instructions: data?.instructions,
    }, { height: 200 + (data?.classes?.length ?? 0) * 30 });
  }

  toYAML(w: YAMLWriter): void {
    w.listItem(() => {
      this.writeDataHead(w);
      w.key("classes");
      w.incIndent();
      this.data.classes.forEach(c => {
        w.listItem(() => {
          w.keyQuoted("description", c.description);
          w.keyVal("id", c.id);
          w.keyQuoted("name", c.name);
        });
      });
      w.decIndent();
      if (this.data.instructions !== undefined) w.keyQuoted("instructions", this.data.instructions);
      w.key("model");
      w.incIndent();
      w.key("completion_params");
      w.incIndent();
      Object.entries(this.data.model.completion_params).forEach(([k, v]) => {
        if (typeof v === "string") w.keyQuoted(k, v);
        else w.keyVal(k, v as string | number | boolean);
      });
      w.decIndent();
      w.keyVal("mode", this.data.model.mode);
      w.keyQuoted("name", this.data.model.name);
      w.keyQuoted("provider", this.data.model.provider);
      w.decIndent();
      w.key("query_variable_selector");
      w.incIndent();
      w.raw(`- ${this.data.query_variable_selector[0]}`);
      w.raw(`- ${this.data.query_variable_selector[1]}`);
      w.decIndent();
      w.key("vision");
      w.incIndent();
      w.keyVal("enabled", false);
      w.decIndent();
      this.closeData(w);
      this.writeOuter(w);
    });
  }

  static override fromYAML(raw: Record<string, unknown>): ClassifierNode {
    const d = raw.data as Record<string, unknown>;
    const node = new ClassifierNode(raw.id as string, {
      title: d.title as string, desc: d.desc as string,
      query_variable_selector: d.query_variable_selector as [string, string],
      model: d.model as ModelConfig,
      classes: d.classes as ClassDefinition[],
      instructions: d.instructions as string,
    });
    node.setPosition((raw.position as XY).x, (raw.position as XY).y);
    node.width = raw.width as number;
    node.height = raw.height as number;
    return node;
  }
}

// ─── HTTP Request Node (stub) ───
interface HTTPNodeData extends BaseNodeData {
  type: "http-request";
  method: string;
  url: string;
  authorization: { type: string };
  headers: string;
  params: string;
  body: { type: string; data: string };
  timeout: { connect: number; read: number; write: number };
}

export class HTTPNode extends BaseNode<HTTPNodeData> {
  constructor(id: string, data?: Partial<HTTPNodeData>) {
    super(id, "custom", {
      type: "http-request", title: data?.title ?? "", desc: data?.desc ?? "", selected: false,
      method: data?.method ?? "GET", url: data?.url ?? "",
      authorization: data?.authorization ?? { type: "no-auth" },
      headers: data?.headers ?? "", params: data?.params ?? "",
      body: data?.body ?? { type: "none", data: "" },
      timeout: data?.timeout ?? { connect: 10, read: 30, write: 30 },
    });
  }

  toYAML(w: YAMLWriter): void {
    w.listItem(() => {
      this.writeDataHead(w);
      this.closeData(w);
      this.writeOuter(w);
    });
  }

  static override fromYAML(raw: Record<string, unknown>): HTTPNode {
    const d = raw.data as Record<string, unknown>;
    return new HTTPNode(raw.id as string, { title: d.title as string, desc: d.desc as string });
  }
}

// ─── Document Extractor Node (stub) ───
interface DocNodeData extends BaseNodeData {
  type: "document-extractor";
  variable_selector: [string, string];
  is_array_file?: boolean;
}

export class DocNode extends BaseNode<DocNodeData> {
  constructor(id: string, data?: Partial<DocNodeData>) {
    super(id, "custom", {
      type: "document-extractor", title: data?.title ?? "", desc: data?.desc ?? "", selected: false,
      variable_selector: data?.variable_selector ?? ["", ""],
      is_array_file: data?.is_array_file,
    });
  }

  toYAML(w: YAMLWriter): void {
    w.listItem(() => {
      this.writeDataHead(w);
      this.closeData(w);
      this.writeOuter(w);
    });
  }

  static override fromYAML(raw: Record<string, unknown>): DocNode {
    const d = raw.data as Record<string, unknown>;
    return new DocNode(raw.id as string, { title: d.title as string, desc: d.desc as string });
  }
}
