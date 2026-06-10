import { BaseNode } from "./base";
import { XY, BaseNodeData, NodeVariable, IfCase, ModelConfig } from "../types/common";

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
    });
  }

  toJSON(): Record<string, unknown> {
    const extra: Record<string, unknown> = {
      dataset_ids: [...this.data.dataset_ids],
      query_variable_selector: [this.data.query_variable_selector[0], this.data.query_variable_selector[1]],
      retrieval_mode: this.data.retrieval_mode,
    };
    if (this.data.retrieval_mode === "multiple" && this.data.multiple_retrieval_config) {
      extra.multiple_retrieval_config = {
        reranking_enable: this.data.multiple_retrieval_config.reranking_enable,
        score_threshold: this.data.multiple_retrieval_config.score_threshold,
        top_k: this.data.multiple_retrieval_config.top_k,
      };
    }
    return this.outerJSON(this.dataJSON(extra));
  }

  // ─── Methods ───
  addDataset(id: string): this { this.data.dataset_ids.push(id); return this; }
  removeDataset(id: string): this {
    this.data.dataset_ids = this.data.dataset_ids.filter(d => d !== id);
    return this;
  }
  setQuerySelector(nodeId: string, field: string): this {
    this.data.query_variable_selector = [nodeId, field];
    return this;
  }
  setTopK(n: number): this {
    if (!this.data.multiple_retrieval_config) {
      this.data.multiple_retrieval_config = { top_k: n, score_threshold: null, reranking_enable: false };
    } else {
      this.data.multiple_retrieval_config.top_k = n;
    }
    return this;
  }

  static override fromYAML(raw: Record<string, unknown>): KnowledgeNode {
    const d = raw.data as Record<string, unknown>;
    const node = new KnowledgeNode(raw.id as string, {
      title: d.title as string, desc: d.desc as string,
      dataset_ids: d.dataset_ids as string[],
      query_variable_selector: d.query_variable_selector as [string, string],
      retrieval_mode: d.retrieval_mode as "single" | "multiple",
      multiple_retrieval_config: d.multiple_retrieval_config as any,
    });
    node.setPosition((raw.position as XY).x, (raw.position as XY).y);
    node.width = raw.width as number;
    node.height = raw.height as number;
    if (raw.zIndex !== undefined) node.zIndex = raw.zIndex as number;
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
    }, { height: 152 });
  }

  toJSON(): Record<string, unknown> {
    return this.outerJSON(this.dataJSON({
      cases: this.data.cases.map(c => ({
        case_id: c.case_id,
        id: c.id,
        logical_operator: c.logical_operator,
        conditions: c.conditions.map(cond => {
          const obj: Record<string, unknown> = {
            comparison_operator: cond.comparison_operator,
            variable_selector: [cond.variable_selector[0], cond.variable_selector[1]],
            value: cond.value,
            varType: cond.varType ?? "string",
          };
          if (cond.id) obj.id = cond.id;
          return obj;
        }),
      })),
    }));
  }

  // ─── Methods ───
  addCase(c: IfCase): this { this.data.cases.push(c); return this; }
  removeCase(id: string): this {
    this.data.cases = this.data.cases.filter(c => c.id !== id);
    return this;
  }
  updateCondition(caseId: string, condIdx: number, patch: Record<string, unknown>): this {
    const c = this.data.cases.find(x => x.id === caseId);
    if (c && c.conditions[condIdx]) Object.assign(c.conditions[condIdx], patch);
    return this;
  }

  get cases(): IfCase[] { return this.data.cases; }

  static override fromYAML(raw: Record<string, unknown>): IfElseNode {
    const d = raw.data as Record<string, unknown>;
    const node = new IfElseNode(raw.id as string, {
      title: d.title as string, desc: d.desc as string,
      cases: d.cases as IfCase[],
    });
    node.setPosition((raw.position as XY).x, (raw.position as XY).y);
    node.width = raw.width as number;
    node.height = raw.height as number;
    if (raw.zIndex !== undefined) node.zIndex = raw.zIndex as number;
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
    });
  }

  toJSON(): Record<string, unknown> {
    return this.outerJSON(this.dataJSON({
      template: this.data.template,
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
  setTemplate(tpl: string): this { this.data.template = tpl; return this; }
  addVariable(v: NodeVariable): this { this.data.variables.push(v); return this; }
  removeVariable(name: string): this {
    this.data.variables = this.data.variables.filter(x => x.variable !== name);
    return this;
  }
  get template(): string { return this.data.template; }

  static override fromYAML(raw: Record<string, unknown>): TemplateNode {
    const d = raw.data as Record<string, unknown>;
    const node = new TemplateNode(raw.id as string, {
      title: d.title as string, desc: d.desc as string,
      template: d.template as string,
      variables: d.variables as NodeVariable[],
    });
    node.setPosition((raw.position as XY).x, (raw.position as XY).y);
    node.width = raw.width as number;
    node.height = raw.height as number;
    if (raw.zIndex !== undefined) node.zIndex = raw.zIndex as number;
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
    });
  }

  toJSON(): Record<string, unknown> {
    return this.outerJSON(this.dataJSON({
      output_type: this.data.output_type,
      variables: this.data.variables.map(v => [v[0], v[1]]),
    }));
  }

  // ─── Methods ───
  addSource(nodeId: string, field: string): this {
    this.data.variables.push([nodeId, field]);
    return this;
  }
  removeSource(nodeId: string): this {
    this.data.variables = this.data.variables.filter(v => v[0] !== nodeId);
    return this;
  }
  setOutputType(t: string): this { this.data.output_type = t; return this; }
  get sources(): [string, string][] { return this.data.variables; }

  static override fromYAML(raw: Record<string, unknown>): AggregatorNode {
    const d = raw.data as Record<string, unknown>;
    const node = new AggregatorNode(raw.id as string, {
      title: d.title as string, desc: d.desc as string,
      output_type: d.output_type as string,
      variables: d.variables as [string, string][],
    });
    node.setPosition((raw.position as XY).x, (raw.position as XY).y);
    node.width = raw.width as number;
    node.height = raw.height as number;
    if (raw.zIndex !== undefined) node.zIndex = raw.zIndex as number;
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

export type IterChildNode = BaseNode<any> & {
  parentId: string;
  isInIteration: true;
  iterationId: string;
};

export class IterationNode extends BaseNode<IterationNodeData> {
  children: IterChildNode[] = [];
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
    }, { width: data?.width ?? 650, height: data?.height ?? 250 });
  }

  addChild<T extends BaseNode<any>>(node: T): IterChildNode {
    Object.assign(node, {
      parentId: this.id,
      isInIteration: true as const,
      iterationId: this.id,
    });
    const child = node as unknown as IterChildNode;
    this.children.push(child);
    return child;
  }

  removeChild(id: string): void {
    this.children = this.children.filter(c => c.id !== id);
  }

  findChild(id: string): IterChildNode | undefined {
    return this.children.find(c => c.id === id);
  }

  setIterator(nodeId: string, field: string): this {
    this.data.iterator_selector = [nodeId, field];
    return this;
  }

  setOutputSelector(nodeId: string, field: string): this {
    this.data.output_selector = [nodeId, field];
    return this;
  }

  toJSON(): Record<string, unknown> {
    return this.outerJSON(this.dataJSON({
      error_handle_mode: this.data.error_handle_mode,
      height: this.data.height,
      is_parallel: this.data.is_parallel,
      iterator_input_type: this.data.iterator_input_type,
      iterator_selector: [this.data.iterator_selector[0], this.data.iterator_selector[1]],
      output_selector: [this.data.output_selector[0], this.data.output_selector[1]],
      output_type: this.data.output_type,
      parallel_nums: this.data.parallel_nums,
      start_node_id: this.data.start_node_id,
      width: this.data.width,
    }));
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
    });
    node.setPosition((raw.position as XY).x, (raw.position as XY).y);
    node.width = raw.width as number;
    node.height = raw.height as number;
    if (raw.zIndex !== undefined) node.zIndex = raw.zIndex as number;
    return node;
  }
}

// ─── Iteration Start Node ───
interface IterStartNodeData extends BaseNodeData {
  type: "iteration-start";
  isInIteration: boolean;
  iteration_id: string;
  height?: number;
  width?: number;
}

export class IterationStartNode extends BaseNode<IterStartNodeData> {
  parentId: string;

  constructor(parentIterId: string, data?: Partial<IterStartNodeData>) {
    const id = parentIterId + "-start";
    super(id, "custom-iteration-start", {
      type: "iteration-start", title: data?.title ?? "", desc: data?.desc ?? "", selected: false,
      isInIteration: true, iteration_id: parentIterId,
      height: data?.height ?? 64, width: data?.width ?? 44,
    }, { width: data?.width ?? 44, height: 48 });
    this.parentId = parentIterId;
    this.data.isInIteration = true;
    this.data.iteration_id = parentIterId;
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      type: this.type,
      parentId: this.parentId,
      position: { x: this.position.x, y: this.position.y },
      positionAbsolute: { x: this.positionAbsolute.x, y: this.positionAbsolute.y },
      width: this.width,
      height: this.height,
      selected: this.selected,
      sourcePosition: this.sourcePosition,
      targetPosition: this.targetPosition,
      draggable: false,
      selectable: false,
      data: {
        desc: this.data.desc,
        height: this.data.height ?? this.height,
        isInIteration: true,
        iteration_id: this.parentId,
        selected: false,
        title: this.data.title,
        type: "iteration-start",
        width: this.data.width ?? this.width,
      },
    };
  }

  static override fromYAML(raw: Record<string, unknown>): IterationStartNode {
    const d = raw.data as Record<string, unknown>;
    const node = new IterationStartNode(raw.parentId as string, {
      title: d.title as string, desc: d.desc as string,
      iteration_id: d.iteration_id as string,
      height: d.height as number, width: d.width as number,
    });
    node.id = raw.id as string;
    node.setPosition((raw.position as XY).x, (raw.position as XY).y);
    node.width = raw.width as number;
    node.height = raw.height as number;
    return node;
  }
}
