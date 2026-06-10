import { BaseNode } from "./base";
import { XY, BaseNodeData, ParamSchema, ToolParamValue, ModelConfig, ClassDefinition } from "../types/common";

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

  toJSON(): Record<string, unknown> {
    const toolParams: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(this.data.tool_parameters)) {
      toolParams[k] = { type: v.type, value: v.value };
    }
    return this.outerJSON(this.dataJSON({
      is_team_authorization: this.data.is_team_authorization,
      paramSchemas: this.data.paramSchemas.map(ps => ({
        auto_generate: ps.auto_generate,
        default: ps.default,
        form: ps.form,
        human_description: { ...ps.human_description },
        label: { ...ps.label },
        llm_description: ps.llm_description,
        max: ps.max,
        min: ps.min,
        name: ps.name,
        options: [],
        placeholder: ps.placeholder,
        precision: ps.precision,
        required: ps.required,
        scope: ps.scope,
        template: ps.template,
        type: ps.type,
      })),
      params: { ...this.data.params },
      plugin_id: this.data.plugin_id,
      plugin_unique_identifier: this.data.plugin_unique_identifier,
      provider_icon: this.data.provider_icon,
      provider_id: this.data.provider_id,
      provider_name: this.data.provider_name,
      provider_type: this.data.provider_type,
      tool_configurations: { ...this.data.tool_configurations },
      tool_description: this.data.tool_description,
      tool_label: this.data.tool_label,
      tool_name: this.data.tool_name,
      tool_node_version: this.data.tool_node_version,
      tool_parameters: toolParams,
    }));
  }

  // ─── Methods ───
  setPlugin(pluginId: string, uniqueId: string): this {
    this.data.plugin_id = pluginId;
    this.data.plugin_unique_identifier = uniqueId;
    return this;
  }
  setToolParam(name: string, value: ToolParamValue): this {
    this.data.tool_parameters[name] = value;
    return this;
  }
  setToolConfig(key: string, value: unknown): this {
    this.data.tool_configurations[key] = value;
    return this;
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
    if (raw.zIndex !== undefined) node.zIndex = raw.zIndex as number;
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

  toJSON(): Record<string, unknown> {
    const extra: Record<string, unknown> = {
      classes: this.data.classes.map(c => ({
        description: c.description,
        id: c.id,
        name: c.name,
      })),
      model: {
        provider: this.data.model.provider,
        name: this.data.model.name,
        mode: this.data.model.mode,
        completion_params: { ...this.data.model.completion_params },
      },
      query_variable_selector: [this.data.query_variable_selector[0], this.data.query_variable_selector[1]],
      vision: { enabled: false },
    };
    if (this.data.instructions !== undefined) extra.instructions = this.data.instructions;
    return this.outerJSON(this.dataJSON(extra));
  }

  // ─── Methods ───
  addClass(cls: ClassDefinition): this { this.data.classes.push(cls); return this; }
  removeClass(id: string): this {
    this.data.classes = this.data.classes.filter(c => c.id !== id);
    return this;
  }
  setModel(provider: string, name: string): this {
    this.data.model.provider = provider;
    this.data.model.name = name;
    return this;
  }
  setInstructions(instructions: string): this {
    this.data.instructions = instructions;
    return this;
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
    if (raw.zIndex !== undefined) node.zIndex = raw.zIndex as number;
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

  toJSON(): Record<string, unknown> {
    return this.outerJSON(this.dataJSON({
      method: this.data.method, url: this.data.url,
      authorization: { ...this.data.authorization },
      headers: this.data.headers, params: this.data.params,
      body: { ...this.data.body },
      timeout: { ...this.data.timeout },
    }));
  }

  static override fromYAML(raw: Record<string, unknown>): HTTPNode {
    const d = raw.data as Record<string, unknown>;
    return new HTTPNode(raw.id as string, {
      title: d.title as string, desc: d.desc as string,
      method: d.method as string,
      url: d.url as string,
      authorization: d.authorization as { type: string },
      headers: d.headers as string,
      params: d.params as string,
      body: d.body as { type: string; data: string },
      timeout: d.timeout as { connect: number; read: number; write: number },
    });
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

  toJSON(): Record<string, unknown> {
    return this.outerJSON(this.dataJSON({
      variable_selector: [...this.data.variable_selector],
      is_array_file: this.data.is_array_file,
    }));
  }

  static override fromYAML(raw: Record<string, unknown>): DocNode {
    const d = raw.data as Record<string, unknown>;
    return new DocNode(raw.id as string, {
      title: d.title as string, desc: d.desc as string,
      variable_selector: d.variable_selector as [string, string],
      is_array_file: d.is_array_file as boolean,
    });
  }
}
