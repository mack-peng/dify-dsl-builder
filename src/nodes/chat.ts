import { BaseNode } from "./base";
import { XY, BaseNodeData, PromptMessage, ModelConfig, MemoryConfig } from "../types/common";

// ─── StartVariable ───
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

// ─── StartNode ───
export class StartNode extends BaseNode<StartNodeData> {
  constructor(id: string, data?: Partial<StartNodeData>) {
    super(id, "custom", {
      type: "start", title: data?.title ?? "", desc: data?.desc ?? "",
      selected: false, variables: data?.variables ?? [],
    });
  }

  toJSON(): Record<string, unknown> {
    return this.outerJSON(this.dataJSON({
      variables: this.data.variables.map(v => ({
        label: v.label,
        ...(v.max_length != null ? { max_length: v.max_length } : {}),
        options: v.options.length > 0 ? v.options : [],
        placeholder: v.placeholder ?? "",
        required: v.required,
        type: v.type,
        variable: v.variable,
      })),
    }));
  }

  // ─── Methods ───
  addVariable(v: StartVariable): this {
    this.data.variables.push(v);
    return this;
  }

  removeVariable(name: string): this {
    this.data.variables = this.data.variables.filter(v => v.variable !== name);
    return this;
  }

  updateVariable(name: string, patch: Partial<StartVariable>): this {
    const v = this.data.variables.find(x => x.variable === name);
    if (v) Object.assign(v, patch);
    return this;
  }

  get variables(): StartVariable[] { return this.data.variables; }

  static override fromYAML(raw: Record<string, unknown>): StartNode {
    const node = new StartNode(raw.id as string);
    node.setPosition((raw.position as XY).x, (raw.position as XY).y);
    const d = raw.data as Record<string, unknown>;
    node.data.title = d.title as string;
    node.data.desc = d.desc as string;
    node.data.variables = ((d.variables as StartVariable[]) ?? []).map(v => ({
      ...v,
      options: v.options ?? [],
    }));
    node.width = raw.width as number;
    node.height = raw.height as number;
    if (raw.zIndex !== undefined) node.zIndex = raw.zIndex as number;
    return node;
  }
}

// ─── AnswerNodeData ───
interface AnswerNodeData extends BaseNodeData {
  type: "answer";
  answer: string;
  variables: { variable: string; value_selector: [string, string]; value_type?: string }[];
}

// ─── AnswerNode ───
export class AnswerNode extends BaseNode<AnswerNodeData> {
  constructor(id: string, data?: Partial<AnswerNodeData>) {
    super(id, "custom", {
      type: "answer", title: data?.title ?? "", desc: data?.desc ?? "",
      selected: false, answer: data?.answer ?? "", variables: data?.variables ?? [],
    });
  }

  toJSON(): Record<string, unknown> {
    return this.outerJSON(this.dataJSON({
      answer: this.data.answer,
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
  setAnswer(tpl: string): this { this.data.answer = tpl; return this; }
  get answer(): string { return this.data.answer; }

  addVariableRef(nodeId: string, field: string, valueType?: string): this {
    const dotName = `${nodeId}.${field}`;
    this.data.variables.push({ variable: dotName, value_selector: [nodeId, field], value_type: valueType });
    return this;
  }

  removeVariableRef(nodeId: string): this {
    this.data.variables = this.data.variables.filter(v => !v.variable.startsWith(nodeId));
    return this;
  }

  get answerVariables(): AnswerNodeData["variables"] { return this.data.variables; }

  static override fromYAML(raw: Record<string, unknown>): AnswerNode {
    const d = raw.data as Record<string, unknown>;
    const node = new AnswerNode(raw.id as string, {
      title: d.title as string, desc: d.desc as string,
      answer: d.answer as string,
    });
    node.setPosition((raw.position as XY).x, (raw.position as XY).y);
    node.data.variables = (d.variables as AnswerNodeData["variables"]) ?? [];
    node.width = raw.width as number;
    node.height = raw.height as number;
    if (raw.zIndex !== undefined) node.zIndex = raw.zIndex as number;
    return node;
  }
}

// ─── PromptConfig ───
interface PromptConfig {
  jinja2_variables: unknown[];
}

// ─── LLMNodeData ───
interface LLMNodeData extends BaseNodeData {
  type: "llm";
  model: ModelConfig;
  prompt_template: PromptMessage[];
  context: { enabled: boolean; variable_selector: string[] };
  vision: { enabled: boolean };
  memory?: MemoryConfig;
  prompt_config?: PromptConfig;
}

// ─── LLMNode ───
export class LLMNode extends BaseNode<LLMNodeData> {
  constructor(id: string, data?: Partial<LLMNodeData>) {
    super(id, "custom", {
      type: "llm", title: data?.title ?? "", desc: data?.desc ?? "", selected: false,
      model: data?.model ?? { provider: "", name: "", mode: "chat", completion_params: {} },
      prompt_template: data?.prompt_template ?? [],
      context: data?.context ?? { enabled: false, variable_selector: [] },
      vision: data?.vision ?? { enabled: false },
      memory: data?.memory,
      prompt_config: data?.prompt_config,
    });
  }

  toJSON(): Record<string, unknown> {
    const extra: Record<string, unknown> = {
      context: {
        enabled: this.data.context.enabled,
        variable_selector: [...this.data.context.variable_selector],
      },
      model: {
        provider: this.data.model.provider,
        name: this.data.model.name,
        mode: this.data.model.mode,
        completion_params: { ...this.data.model.completion_params },
      },
      prompt_template: this.data.prompt_template.map(p => {
        const obj: Record<string, unknown> = { role: p.role, text: p.text };
        if (p.id) obj.id = p.id;
        return obj;
      }),
      vision: { enabled: this.data.vision.enabled },
    };
    if (this.data.memory) {
      extra.memory = {
        query_prompt_template: this.data.memory.query_prompt_template,
        window: { enabled: this.data.memory.window.enabled, size: this.data.memory.window.size },
        ...(this.data.memory.role_prefix ? {
          role_prefix: {
            assistant: this.data.memory.role_prefix.assistant,
            user: this.data.memory.role_prefix.user,
          },
        } : {}),
      };
    }
    if (this.data.prompt_config) {
      extra.prompt_config = {
        jinja2_variables: [...this.data.prompt_config.jinja2_variables],
      };
    }
    return this.outerJSON(this.dataJSON(extra));
  }

  // ─── Methods ───
  setModel(provider: string, name: string): this {
    this.data.model.provider = provider;
    this.data.model.name = name;
    return this;
  }

  setTemperature(t: number): this {
    (this.data.model.completion_params as any).temperature = t;
    return this;
  }

  setContextEnabled(enabled: boolean): this {
    this.data.context.enabled = enabled;
    return this;
  }

  setContextSelector(nodeId: string, field: string): this {
    this.data.context.variable_selector = [nodeId, field];
    return this;
  }

  addPromptMessage(msg: PromptMessage): this {
    this.data.prompt_template.push(msg);
    return this;
  }

  setMemory(windowSize: number): this {
    this.data.memory = {
      window: { enabled: true, size: windowSize },
      query_prompt_template: "{{#sys.query#}}",
    };
    return this;
  }

  clearMemory(): this {
    this.data.memory = undefined;
    return this;
  }

  get promptMessages(): PromptMessage[] { return this.data.prompt_template; }
  get modelConfig(): ModelConfig { return this.data.model; }
  get hasMemory(): boolean { return !!this.data.memory; }

  static override fromYAML(raw: Record<string, unknown>): LLMNode {
    const d = raw.data as Record<string, unknown>;
    const node = new LLMNode(raw.id as string, {
      title: d.title as string, desc: d.desc as string,
      model: d.model as ModelConfig,
      prompt_template: d.prompt_template as PromptMessage[],
      context: d.context as LLMNodeData["context"],
      vision: d.vision as LLMNodeData["vision"],
      memory: d.memory as MemoryConfig,
      prompt_config: d.prompt_config as PromptConfig,
    });
    node.setPosition((raw.position as XY).x, (raw.position as XY).y);
    node.width = raw.width as number;
    node.height = raw.height as number;
    if (raw.zIndex !== undefined) node.zIndex = raw.zIndex as number;
    return node;
  }
}
