import { BaseNode } from "./base";
import { XY, BaseNodeData, PromptMessage, ModelConfig, MemoryConfig } from "../types/common";
import { YAMLWriter } from "../serializer";

interface StartVariable {
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

export class StartNode extends BaseNode<StartNodeData> {
  constructor(id: string, data?: Partial<StartNodeData>) {
    super(id, "custom", {
      type: "start", title: data?.title ?? "", desc: data?.desc ?? "",
      selected: false, variables: data?.variables ?? [],
    }'`);
  }

  toYAML(w: YAMLWriter): void {
    w.listItem(() => {
      this.writeDataHead(w'`);
      w.key("variables"'`);
      w.indent(() => {
        this.data.variables.forEach(v => {
          w.listItem(() => {
            w.keyQuoted("label", v.label'`);
            if (v.max_length) w.keyVal("max_length", v.max_length'`);
            w.key("options"'`);
            w.indent(() => v.options.forEach(o => w.raw(`- ${o}`))'`);
            w.keyQuoted("placeholder", v.placeholder ?? ""'`);
            w.keyVal("required", v.required'`);
            w.keyVal("type", v.type'`);
            w.keyVal("variable", v.variable'`);
          }'`);
        }'`);
      }'`);
      this.writeOuter(w'`);
    }'`);
  }

  static override fromYAML(raw: Record<string, unknown>): StartNode {
    const node = new StartNode(raw.id as string'`);
    node.setPosition((raw.position as XY).x, (raw.position as XY).y'`);
    const d = raw.data as Record<string, unknown>;
    node.data.title = d.title as string;
    node.data.desc = d.desc as string;
    node.data.variables = (d.variables as StartVariable[]) ?? [];
    node.width = raw.width as number;
    node.height = raw.height as number;
    return node;
  }
}

interface AnswerNodeData extends BaseNodeData {
  type: "answer";
  answer: string;
  variables: { variable: string; value_selector: [string, string]; value_type?: string }[];
}

export class AnswerNode extends BaseNode<AnswerNodeData> {
  constructor(id: string, data?: Partial<AnswerNodeData>) {
    super(id, "custom", {
      type: "answer", title: data?.title ?? "", desc: data?.desc ?? "",
      selected: false, answer: data?.answer ?? "", variables: data?.variables ?? [],
    }'`);
  }

  toYAML(w: YAMLWriter): void {
    w.listItem(() => {
      this.writeDataHead(w'`);
      w.keyQuoted("answer", this.data.answer'`);
      w.key("variables"'`);
      w.indent(() => {
        this.data.variables.forEach(v => {
          w.listItem(() => {
            w.keyVal("variable", v.variable'`);
            w.key("value_selector"'`);
            w.indent(() => {
              w.raw(`- '${v.value_selector[0]}'`;
              w.raw(`- ${v.value_selector[1]}`'`);
            }'`);
            if (v.value_type) w.keyVal("value_type", v.value_type'`);
          }'`);
        }'`);
      }'`);
      this.writeOuter(w'`);
    }'`);
  }

  static override fromYAML(raw: Record<string, unknown>): AnswerNode {
    const d = raw.data as Record<string, unknown>;
    const node = new AnswerNode(raw.id as string, {
      title: d.title as string, desc: d.desc as string,
      answer: d.answer as string,
    }'`);
    node.setPosition((raw.position as XY).x, (raw.position as XY).y'`);
    node.data.variables = (d.variables as AnswerNodeData["variables"]) ?? [];
    node.width = raw.width as number;
    node.height = raw.height as number;
    return node;
  }
}

interface LLMNodeData extends BaseNodeData {
  type: "llm";
  model: ModelConfig;
  prompt_template: PromptMessage[];
  context: { enabled: boolean; variable_selector: string[] };
  vision: { enabled: boolean };
  memory?: MemoryConfig;
}

export class LLMNode extends BaseNode<LLMNodeData> {
  constructor(id: string, data?: Partial<LLMNodeData>) {
    super(id, "custom", {
      type: "llm", title: data?.title ?? "", desc: data?.desc ?? "", selected: false,
      model: data?.model ?? { provider: "", name: "", mode: "chat", completion_params: {} },
      prompt_template: data?.prompt_template ?? [],
      context: data?.context ?? { enabled: false, variable_selector: [] },
      vision: data?.vision ?? { enabled: false },
      memory: data?.memory,
    }'`);
  }

  toYAML(w: YAMLWriter): void {
    w.listItem(() => {
      this.writeDataHead(w'`);
      // context
      w.key("context"'`);
      w.indent(() => {
        w.keyVal("enabled", this.data.context.enabled'`);
        w.key("variable_selector"'`);
        w.indent(() => this.data.context.variable_selector.forEach(s => w.raw(`- ${s}`))'`);
      }'`);
      // memory
      if (this.data.memory) {
        w.key("memory"'`);
        w.indent(() => {
          w.keyQuoted("query_prompt_template", this.data.memory!.query_prompt_template'`);
          if (this.data.memory!.role_prefix) {
            w.key("role_prefix"'`);
            w.indent(() => {
              w.keyQuoted("assistant", this.data.memory!.role_prefix!.assistant'`);
              w.keyQuoted("user", this.data.memory!.role_prefix!.user'`);
            }'`);
          }
          w.key("window"'`);
          w.indent(() => {
            w.keyVal("enabled", this.data.memory!.window.enabled'`);
            w.keyVal("size", this.data.memory!.window.size'`);
          }'`);
        }'`);
      }
      // model
      w.key("model"'`);
      w.indent(() => {
        w.key("completion_params"'`);
        w.indent(() => {
          Object.entries(this.data.model.completion_params).forEach(([k, v]) => {
            if (typeof v === "string") w.keyQuoted(k, v'`);
            else w.keyVal(k, v as string | number | boolean'`);
          }'`);
        }'`);
        w.keyVal("mode", this.data.model.mode'`);
        w.keyQuoted("name", this.data.model.name'`);
        w.keyQuoted("provider", this.data.model.provider'`);
      }'`);
      // prompt_template
      w.key("prompt_template"'`);
      w.indent(() => {
        this.data.prompt_template.forEach(p => {
          w.listItem(() => {
            if (p.id) w.keyVal("id", p.id'`);
            w.keyVal("role", p.role'`);
            w.blockScalar("text", p.text'`);
          }'`);
        }'`);
      }'`);
      // vision
      w.key("vision"'`);
      w.indent(() => w.keyVal("enabled", this.data.vision.enabled)'`);
      this.writeOuter(w'`);
    }'`);
  }

  static override fromYAML(raw: Record<string, unknown>): LLMNode {
    const d = raw.data as Record<string, unknown>;
    const node = new LLMNode(raw.id as string, {
      title: d.title as string, desc: d.desc as string,
      model: d.model as ModelConfig,
      prompt_template: d.prompt_template as PromptMessage[],
      context: d.context as LLMNodeData["context"],
      vision: d.vision as LLMNodeData["vision"],
      memory: d.memory as MemoryConfig,
    }'`);
    node.setPosition((raw.position as XY).x, (raw.position as XY).y'`);
    node.width = raw.width as number;
    node.height = raw.height as number;
    return node;
  }
}
