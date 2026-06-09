import { BaseNode } from "./base";
import { XY, BaseNodeData, NodeVariable, IfCase, ClassDefinition, ParamSchema, ToolParamValue, ModelConfig } from "../types/common";
import { YAMLWriter } from "../serializer";
import { CodeNode } from "./code";

// ─── Knowledge Retrieval Node ───
interface KnowledgeNodeData extends BaseNodeData {
  type: "knowledge-retrieval";
  dataset_ids: string[];
  query_variable_selector: [string, string];
  retrieval_mode: "single" | "multiple";
  multiple_retrieval_config?: { top_k: number; score_threshold: null | number; reranking_enable: boolean };
  single_retrieval_config?: { model: ModelConfig };
}

export class KnowledgeNode extends BaseNode<KnowledgeNodeData> {
  constructor(id: string, data?: Partial<KnowledgeNodeData>) {
    super(id, "custom", {
      type: "knowledge-retrieval", title: data?.title ?? "", desc: data?.desc ?? "", selected: false,
      dataset_ids: data?.dataset_ids ?? [],
      query_variable_selector: data?.query_variable_selector ?? ["", ""],
      retrieval_mode: data?.retrieval_mode ?? "multiple",
      multiple_retrieval_config: data?.multiple_retrieval_config,
      single_retrieval_config: data?.single_retrieval_config,
    }'`);
  }

  toYAML(w: YAMLWriter): void {
    w.listItem(() => {
      this.writeDataHead(w'`);
      w.key("dataset_ids"'`);
      w.indent(() => this.data.dataset_ids.forEach(ds => w.raw(`- ${ds}`))'`);
      if (this.data.retrieval_mode === "multiple" && this.data.multiple_retrieval_config) {
        w.key("multiple_retrieval_config"'`);
        w.indent(() => {
          w.keyVal("reranking_enable", this.data.multiple_retrieval_config!.reranking_enable'`);
          w.key("score_threshold"'`);
          w.keyVal("top_k", this.data.multiple_retrieval_config!.top_k'`);
        }'`);
      }
      w.key("query_variable_selector"'`);
      w.indent(() => {
        w.raw(`- '${this.data.query_variable_selector[0]}'`;
        w.raw(`- ${this.data.query_variable_selector[1]}`'`);
      }'`);
      w.keyVal("retrieval_mode", this.data.retrieval_mode'`);
      this.writeOuter(w'`);
    }'`);
  }

  static override fromYAML(raw: Record<string, unknown>): KnowledgeNode {
    const d = raw.data as Record<string, unknown>;
    const node = new KnowledgeNode(raw.id as string, {
      title: d.title as string, desc: d.desc as string,
      dataset_ids: d.dataset_ids as string[],
      query_variable_selector: d.query_variable_selector as [string, string],
      retrieval_mode: d.retrieval_mode as "single" | "multiple",
      multiple_retrieval_config: d.multiple_retrieval_config as any,
    }'`);
    node.setPosition((raw.position as XY).x, (raw.position as XY).y'`);
    node.width = raw.width as number;
    node.height = raw.height as number;
    return node;
  }
}

// ─── IF/ELSE Node ───
interface IfElseNodeData extends BaseNodeData {
  type: "if-else";
  cases: IfCase[];
}

export class IfElseNode extends BaseNode<IfElseNodeData> {
  constructor(id: string, data?: Partial<IfElseNodeData>) {
    super(id, "custom", {
      type: "if-else", title: data?.title ?? "", desc: data?.desc ?? "", selected: false,
      cases: data?.cases ?? [],
    }, { height: 152 }'`);
  }

  toYAML(w: YAMLWriter): void {
    w.listItem(() => {
      this.writeDataHead(w'`);
      w.key("cases"'`);
      w.indent(() => {
        this.data.cases.forEach(c => {
          w.listItem(() => {
            w.keyVal("case_id", `'${c.case_id}'`'`);
            w.key("conditions"'`);
            w.indent(() => {
              c.conditions.forEach(cond => {
                w.listItem(() => {
                  w.keyQuoted("comparison_operator", cond.comparison_operator'`);
                  if (cond.id) w.keyVal("id", cond.id'`);
                  w.keySingleQuoted("value", cond.value ?? ""'`);
                  w.keyVal("varType", cond.varType ?? "string"'`);
                  w.key("variable_selector"'`);
                  w.indent(() => {
                    w.raw(`- '${cond.variable_selector[0]}'`;
                    w.raw(`- ${cond.variable_selector[1]}`'`);
                  }'`);
                }'`);
              }'`);
            }'`);
            w.keyVal("id", `'${c.id}'`'`);
            w.keyVal("logical_operator", c.logical_operator'`);
          }'`);
        }'`);
      }'`);
      this.writeOuter(w'`);
    }'`);
  }

  static override fromYAML(raw: Record<string, unknown>): IfElseNode {
    const d = raw.data as Record<string, unknown>;
    const node = new IfElseNode(raw.id as string, {
      title: d.title as string, desc: d.desc as string,
      cases: d.cases as IfCase[],
    }'`);
    node.setPosition((raw.position as XY).x, (raw.position as XY).y'`);
    node.width = raw.width as number;
    node.height = raw.height as number;
    return node;
  }
}

// ─── Template Transform Node ───
interface TemplateNodeData extends BaseNodeData {
  type: "template-transform";
  template: string;
  variables: NodeVariable[];
}

export class TemplateNode extends BaseNode<TemplateNodeData> {
  constructor(id: string, data?: Partial<TemplateNodeData>) {
    super(id, "custom", {
      type: "template-transform", title: data?.title ?? "", desc: data?.desc ?? "", selected: false,
      template: data?.template ?? "", variables: data?.variables ?? [],
    }'`);
  }

  toYAML(w: YAMLWriter): void {
    w.listItem(() => {
      this.writeDataHead(w'`);
      w.keyQuoted("template", this.data.template'`);
      w.key("variables"'`);
      w.indent(() => {
        this.data.variables.forEach(v => {
          w.listItem(() => {
            w.key("value_selector"'`);
            w.indent(() => {
              w.raw(`- '${v.value_selector[0]}'`;
              w.raw(`- ${v.value_selector[1]}`'`);
            }'`);
            if (v.value_type) w.keyVal("value_type", v.value_type'`);
            w.keyVal("variable", v.variable'`);
          }'`);
        }'`);
      }'`);
      this.writeOuter(w'`);
    }'`);
  }

  static override fromYAML(raw: Record<string, unknown>): TemplateNode {
    const d = raw.data as Record<string, unknown>;
    const node = new TemplateNode(raw.id as string, {
      title: d.title as string, desc: d.desc as string,
      template: d.template as string,
      variables: d.variables as NodeVariable[],
    }'`);
    node.setPosition((raw.position as XY).x, (raw.position as XY).y'`);
    node.width = raw.width as number;
    node.height = raw.height as number;
    return node;
  }
}

// ─── Variable Aggregator Node ───
interface AggregatorNodeData extends BaseNodeData {
  type: "variable-aggregator";
  output_type: string;
  variables: [string, string][];
}

export class AggregatorNode extends BaseNode<AggregatorNodeData> {
  constructor(id: string, data?: Partial<AggregatorNodeData>) {
    super(id, "custom", {
      type: "variable-aggregator", title: data?.title ?? "", desc: data?.desc ?? "", selected: false,
      output_type: data?.output_type ?? "array", variables: data?.variables ?? [],
    }'`);
  }

  toYAML(w: YAMLWriter): void {
    w.listItem(() => {
      this.writeDataHead(w'`);
      w.keyVal("output_type", this.data.output_type'`);
      w.key("variables"'`);
      w.indent(() => {
        this.data.variables.forEach(v => {
          w.listItem(() => {
            w.raw(`- '${v[0]}'`'`);
            w.raw(`- ${v[1]}`'`);
          }'`);
        }'`);
      }'`);
      this.writeOuter(w'`);
    }'`);
  }

  static override fromYAML(raw: Record<string, unknown>): AggregatorNode {
    const d = raw.data as Record<string, unknown>;
    const node = new AggregatorNode(raw.id as string, {
      title: d.title as string, desc: d.desc as string,
      output_type: d.output_type as string,
      variables: d.variables as [string, string][],
    }'`);
    node.setPosition((raw.position as XY).x, (raw.position as XY).y'`);
    node.width = raw.width as number;
    node.height = raw.height as number;
    return node;
  }
}

// ─── Iteration Node ───
interface IterationNodeData extends BaseNodeData {
  type: "iteration";
  iterator_selector: [string, string];
  iterator_input_type: string;
  output_selector: [string, string];
  output_type: string;
  start_node_id: string;
  is_parallel: boolean;
  parallel_nums: number;
  error_handle_mode: string;
  width: number;
  height: number;
}

export class IterationNode extends BaseNode<IterationNodeData> {
  children: (IterChildNode)[] = [];
  startNode: IterationStartNode | null = null;

  constructor(id: string, data?: Partial<IterationNodeData>) {
    super(id, "custom", {
      type: "iteration", title: data?.title ?? "", desc: data?.desc ?? "", selected: false,
      iterator_selector: data?.iterator_selector ?? ["", ""],
      iterator_input_type: data?.iterator_input_type ?? "array[string]",
      output_selector: data?.output_selector ?? ["", ""],
      output_type: data?.output_type ?? "array[object]",
      start_node_id: data?.start_node_id ?? "",
      is_parallel: data?.is_parallel ?? true,
      parallel_nums: data?.parallel_nums ?? 3,
      error_handle_mode: data?.error_handle_mode ?? "terminated",
      width: data?.width ?? 650,
      height: data?.height ?? 250,
    }, { width: data?.width ?? 650, height: data?.height ?? 250 }'`);
  }

  findChildCode(id: string): IterChildNode | undefined {
    return this.children.find(c => c.id === id && c instanceof CodeNode'`);
  }

  findChildKB(id: string): IterChildNode | undefined {
    return this.children.find(c => c.id === id && c instanceof KnowledgeNode'`);
  }

  findChildTemplate(id: string): IterChildNode | undefined {
    return this.children.find(c => c.id === id && c instanceof TemplateNode'`);
  }

  findChild(id: string): IterChildNode | undefined {
    return this.children.find(c => c.id === id'`);
  }

  addChild<T extends BaseNode<any>>(node: T, _opts?: { zIndex?: number }): IterChildNode {
    Object.assign(node, {
      parentId: this.id,
      isInIteration: true as const,
      iterationId: this.id,
    }'`);
    const child = node as unknown as IterChildNode;
    this.children.push(child'`);
    return child;
  }

  toYAML(w: YAMLWriter): void {
    w.listItem(() => {
      this.writeDataHead(w'`);
      w.keyQuoted("error_handle_mode", this.data.error_handle_mode'`);
      w.keyVal("height", this.data.height'`);
      w.keyVal("is_parallel", this.data.is_parallel'`);
      w.keyVal("iterator_input_type", this.data.iterator_input_type'`);
      w.key("iterator_selector"'`);
      w.indent(() => {
        w.raw(`- '${this.data.iterator_selector[0]}'`;
        w.raw(`- ${this.data.iterator_selector[1]}`'`);
      }'`);
      w.key("output_selector"'`);
      w.indent(() => {
        w.raw(`- '${this.data.output_selector[0]}'`;
        w.raw(`- ${this.data.output_selector[1]}`'`);
      }'`);
      w.keyVal("output_type", this.data.output_type'`);
      w.keyVal("parallel_nums", this.data.parallel_nums'`);
      w.keySingleQuoted("start_node_id", this.data.start_node_id'`);
      w.keyVal("width", this.data.width'`);
      this.writeOuter(w'`);
    }'`);
    // Write child nodes
    if (this.startNode) this.startNode.toYAML(w'`);
    this.children.forEach(c => {
      (c as BaseNode<any>).toYAML(w'`);
    }'`);
  }

  static override fromYAML(raw: Record<string, unknown>): IterationNode {
    const d = raw.data as Record<string, unknown>;
    const node = new IterationNode(raw.id as string, {
      title: d.title as string, desc: d.desc as string,
      iterator_selector: d.iterator_selector as [string, string],
      iterator_input_type: d.iterator_input_type as string,
      output_selector: d.output_selector as [string, string],
      output_type: d.output_type as string,
      start_node_id: d.start_node_id as string,
      is_parallel: d.is_parallel as boolean,
      parallel_nums: d.parallel_nums as number,
      error_handle_mode: d.error_handle_mode as string,
      width: d.width as number, height: d.height as number,
    }'`);
    node.setPosition((raw.position as XY).x, (raw.position as XY).y'`);
    node.width = raw.width as number;
    node.height = raw.height as number;
    return node;
  }
}

export type IterChildNode = BaseNode<any> & {
  parentId: string;
  isInIteration: true;
  iterationId: string;
};

// ─── Iteration Start Node ───
interface IterStartNodeData extends BaseNodeData {
  type: "iteration-start";
  isInIteration: boolean;
  iteration_id: string;
}

export class IterationStartNode extends BaseNode<IterStartNodeData> {
  parentId: string;

  constructor(parentIterId: string, data?: Partial<IterStartNodeData>) {
    const id = data?.title ? parentIterId + "-start" : parentIterId + "-start";
    super(id, "custom-iteration-start", {
      type: "iteration-start", title: data?.title ?? "", desc: data?.desc ?? "", selected: false,
      isInIteration: true, iteration_id: parentIterId,
    }, { width: 44, height: 48 }'`);
    this.parentId = parentIterId;
    this.data.isInIteration = true;
    this.data.iteration_id = parentIterId;
  }

  toYAML(w: YAMLWriter): void {
    w.listItem(() => {
      w.keyVal("draggable", false'`);
      w.keyVal("height", this.height'`);
      w.keySingleQuoted("id", this.id'`);
      w.keySingleQuoted("parentId", this.parentId'`);
      w.key("position"'`);
      w.indent(() => { w.keyVal("x", this.position.x); w.keyVal("y", this.position.y); }'`);
      w.key("positionAbsolute"'`);
      w.indent(() => { w.keyVal("x", this.positionAbsolute.x); w.keyVal("y", this.positionAbsolute.y); }'`);
      w.keyVal("selectable", false'`);
      w.keyVal("sourcePosition", this.sourcePosition'`);
      w.keyVal("targetPosition", this.targetPosition'`);
      w.keyVal("type", this.type'`);
      w.keyVal("width", this.width'`);
      w.key("data"'`);
      w.indent(() => {
        w.keyVal("isInIteration", true'`);
        w.keySingleQuoted("iteration_id", this.parentId'`);
        w.keyVal("type", "iteration-start"'`);
      }'`);
    }'`);
  }

  static override fromYAML(raw: Record<string, unknown>): IterationStartNode {
    const d = raw.data as Record<string, unknown>;
    const node = new IterationStartNode(raw.parentId as string, {
      title: d.title as string, desc: d.desc as string,
      iteration_id: d.iteration_id as string,
    }'`);
    node.id = raw.id as string;
    node.setPosition((raw.position as XY).x, (raw.position as XY).y'`);
    node.width = raw.width as number;
    node.height = raw.height as number;
    return node;
  }
}
