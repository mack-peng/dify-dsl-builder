import * as fs from "fs";
import * as yaml from "js-yaml";
import { BaseNode } from "../nodes/base";
import { NODE_TYPE_MAP, IterationStartNode } from "../nodes/index";
import { NodeIndex } from "./NodeIndex";
import { DifyDSLJSON, AppMeta, Dependency, Viewport, EdgeData, CompletionAppConfig, CompletionModelConfig, CompletionInputFormItem } from "./types";
import { ValidationReport, createReport } from "../types/validation";
import {
  checkStartNode,
  checkAnswerNode,
  checkEdgeRefs,
  checkCodeOutputs,
  checkEnvVars,
  checkConvVars,
  checkLLMFields,
  checkIfElseVars,
  checkCompletionConfig,
} from "../validators";

/**
 * 7-step pipeline:
 * ① parse(yamlStr)   → raw JSON
 * ② index()          → NodeIndex (typed nodes + edges)
 * ③ (implicit: edges provide connectivity)
 * ④ CRUD             → getNode / addNode / removeNode / updateNode
 * ⑤ Node.methods()   → instance modifications
 * ⑥ toJSON()         → Dify DSL JSON plain object
 * ⑦ toYAML()         → yaml.dump() + replace
 */
export class DifyDSL {
  version: string;
  kind: "app" = "app";
  app: AppMeta;
  dependencies: Dependency[];
  envVariables: unknown[];
  convVariables: unknown[];
  ragVariables: unknown[];
  features: Record<string, unknown>;
  viewport: Viewport;

  index: NodeIndex;

  /** completion 应用（无 workflow）的原始 model_config；workflow 应用为 null */
  completionConfig: CompletionAppConfig | null;

  private constructor(
    version: string,
    app: AppMeta,
    deps: Dependency[],
    envVars: unknown[],
    convVars: unknown[],
    ragVars: unknown[],
    features: Record<string, unknown>,
    viewport: Viewport,
    index: NodeIndex,
    completionConfig: CompletionAppConfig | null = null,
  ) {
    this.version = version;
    this.app = app;
    this.dependencies = deps;
    this.envVariables = envVars;
    this.convVariables = convVars;
    this.ragVariables = ragVars;
    this.features = features;
    this.viewport = viewport;
    this.index = index;
    this.completionConfig = completionConfig;
  }

  /** 是否 completion 应用（无 graph，顶层是 model_config） */
  get isCompletion(): boolean {
    return this.completionConfig !== null;
  }

  // ─────── ① parse ───────

  /**
   * Parse YAML string and build the internal index.
   * Steps ① + ② combined.
   */
  static parse(yamlStr: string): DifyDSL {
    const raw = yaml.load(yamlStr) as any;

    // ── completion 应用：顶层是 model_config，无 workflow/graph ──
    if (raw.model_config && !raw.workflow) {
      const index = new NodeIndex(); // 空索引
      return new DifyDSL(
        raw.version,
        raw.app,
        raw.dependencies ?? [],
        [],
        [],
        [],
        {},
        { x: 0, y: 0, zoom: 0.7 },
        index,
        raw.model_config as CompletionAppConfig,
      );
    }

    const workflow = raw.workflow;

    // Build typed nodes from raw
    const nodes = buildNodes(workflow.graph.nodes);
    const edges = buildEdges(workflow.graph.edges);

    const index = new NodeIndex();
    index.rebuild(nodes, edges);

    return new DifyDSL(
      raw.version,
      raw.app,
      raw.dependencies ?? [],
      workflow.environment_variables ?? [],
      workflow.conversation_variables ?? [],
      workflow.rag_pipeline_variables ?? [],
      workflow.features ?? {},
      workflow.graph.viewport ?? { x: 0, y: 0, zoom: 0.7 },
      index,
    );
  }

  // ─────── ③ connectivity (implicit: index provides it) ───────

  // ─────── ④ CRUD ───────

  getNode(id: string): BaseNode<any> | undefined {
    return this.index.getNode(id);
  }

  findByType(type: string): BaseNode<any>[] {
    return this.index.getNodesByType(type);
  }

  addNode(node: BaseNode<any>): void {
    this.index.addNode(node);
  }

  removeNode(id: string): void {
    this.index.removeNode(id);
  }

  /**
   * Get → mutate → sync back.
   * The callback receives the node instance and can call its methods directly.
   * After mutation, the index is already updated (no extra sync needed).
   */
  updateNode<T extends BaseNode<any>>(
    id: string,
    fn: (node: T) => void,
  ): void {
    const node = this.index.getNode(id) as T | undefined;
    if (!node) throw new Error(`Node not found: ${id}`);
    fn(node);
  }

  /** Get predecessor node IDs (upstream) */
  getPrevIds(id: string): string[] {
    return this.index.getPrevIds(id);
  }

  // ─── Completion app 专属方法（无 graph）───

  /** completion 应用：获取 pre_prompt */
  getPrePrompt(): string | null {
    return this.completionConfig?.pre_prompt ?? null;
  }

  /** completion 应用：设置 pre_prompt */
  setPrePrompt(text: string): void {
    if (!this.completionConfig) throw new Error("Not a completion app");
    this.completionConfig.pre_prompt = text;
  }

  /** completion 应用：替换 pre_prompt 中的文本（精确/正则均支持），返回替换次数 */
  replacePrePrompt(search: string | RegExp, replacement: string): number {
    if (!this.completionConfig) throw new Error("Not a completion app");
    let count = 0;
    const next = this.completionConfig.pre_prompt.replace(search, (...args) => {
      count += 1;
      return replacement;
    });
    this.completionConfig.pre_prompt = next;
    return count;
  }

  /** completion 应用：获取 model 配置 */
  getCompletionModel(): CompletionModelConfig | null {
    return this.completionConfig?.model ?? null;
  }

  /** completion 应用：设置 model.completion_params 中的任意参数 */
  setCompletionParam(name: string, value: unknown): void {
    if (!this.completionConfig) throw new Error("Not a completion app");
    this.completionConfig.model.completion_params[name] = value;
  }

  /** completion 应用：删除 model.completion_params 中的参数 */
  removeCompletionParam(name: string): void {
    if (!this.completionConfig) throw new Error("Not a completion app");
    delete this.completionConfig.model.completion_params[name];
  }

  /** completion 应用：获取 user_input_form（输入变量列表） */
  getInputForm(): CompletionInputFormItem[] {
    return this.completionConfig?.user_input_form ?? [];
  }

  /** completion 应用：获取单个输入变量（返回 text-input 条目内容） */
  getInputVariable(variable: string): Record<string, unknown> | undefined {
    const form = this.getInputForm();
    for (const item of form) {
      const entry = item["text-input"] as Record<string, unknown> | undefined;
      if (entry && entry.variable === variable) return entry;
    }
    return undefined;
  }

  /** completion 应用：追加输入变量（text-input） */
  addInputVariable(variable: string, label: string, required = true): void {
    if (!this.completionConfig) throw new Error("Not a completion app");
    if (!this.completionConfig.user_input_form) this.completionConfig.user_input_form = [];
    this.completionConfig.user_input_form.push({
      "text-input": {
        default: "",
        hide: false,
        label,
        required,
        variable,
      },
    });
  }

  /** completion 应用：删除输入变量 */
  removeInputVariable(variable: string): boolean {
    if (!this.completionConfig?.user_input_form) return false;
    const before = this.completionConfig.user_input_form.length;
    this.completionConfig.user_input_form = this.completionConfig.user_input_form.filter(
      (item) => (item["text-input"] as Record<string, unknown> | undefined)?.variable !== variable,
    );
    return this.completionConfig.user_input_form.length < before;
  }

  /** completion 应用：替换输入变量的标签 */
  setInputLabel(variable: string, label: string): boolean {
    const item = this.getInputVariable(variable);
    if (!item) return false;
    item.label = label;
    return true;
  }

  /** Get successor node IDs (downstream) */
  getNextIds(id: string): string[] {
    return this.index.getNextIds(id);
  }

  /** Get all edges related to a node (incoming + outgoing) */
  getNodeEdges(id: string): EdgeData[] {
    return [...this.index.getInEdges(id), ...this.index.getOutEdges(id)];
  }

  /** Convenience type-checked finders (for patch system compat) */
  findStart(id: string): BaseNode<any> | undefined {
    const n = this.index.getNode(id); return n?.data.type === "start" ? n : undefined;
  }
  findLLM(id: string): BaseNode<any> | undefined {
    const n = this.index.getNode(id); return n?.data.type === "llm" ? n : undefined;
  }
  findCode(id: string): BaseNode<any> | undefined {
    const n = this.index.getNode(id); return n?.data.type === "code" ? n : undefined;
  }
  findKnowledge(id: string): BaseNode<any> | undefined {
    const n = this.index.getNode(id); return n?.data.type === "knowledge-retrieval" ? n : undefined;
  }
  findAnswer(id: string): BaseNode<any> | undefined {
    const n = this.index.getNode(id); return n?.data.type === "answer" ? n : undefined;
  }
  findClassifier(id: string): BaseNode<any> | undefined {
    const n = this.index.getNode(id); return n?.data.type === "question-classifier" ? n : undefined;
  }

  /** Add an edge by source/target IDs */
  addEdge(source: string, target: string, sourceHandle = "source"): void {
    const src = this.index.getNode(source);
    const tgt = this.index.getNode(target);
    if (!src || !tgt) throw new Error(`addEdge: node not found: ${source} or ${target}`);
    const eid = `${source}-${sourceHandle}-${target}-target`;
    this.index.addEdge({
      id: eid, source, sourceHandle, target,
      targetHandle: "target", type: "custom", zIndex: 0,
      data: {
        sourceType: src.data.type,
        targetType: tgt.data.type,
        isInIteration: false, isInLoop: false,
      },
    });
  }

  /** Remove an edge by id */
  removeEdge(edgeId: string): void { this.index.removeEdge(edgeId); }

  /** Number of nodes */
  get nodeCount(): number { return this.index.byId.size; }
  /** Number of edges */
  get edgeCount(): number { return this.index.edges.size; }
  /** Mode string */
  get mode(): string { return this.app.mode; }

  /** Save to file */
  save(filePath: string): void {
    fs.writeFileSync(filePath, this.toYAML(), "utf-8");
  }

  // ─── Environment / conversation variables (for patch compat) ───
  setEnv(name: string, value: unknown, type: "string" | "number"): void {
    const existing = this.envVariables.find((e: any) => e.name === name) as any;
    if (existing) { existing.value = value; existing.value_type = type; }
    else {
      this.envVariables.push({
        id: crypto.randomUUID(),
        name,
        value,
        value_type: type,
        description: "",
        selector: ["env", name],
      });
    }
  }
  removeEnv(name: string): void {
    this.envVariables = this.envVariables.filter((e: any) => e.name !== name);
  }
  setConv(name: string, type: "string" | "number" = "string"): void {
    const existing = this.convVariables.find((c: any) => c.name === name) as any;
    if (existing) { existing.value_type = type; }
    else {
      this.convVariables.push({
        id: crypto.randomUUID(),
        name,
        value_type: type,
        description: "",
        selector: ["conversation", name],
        value: type === "number" ? 0 : "",
      });
    }
  }

  // ─────── ⑥ toJSON ───────

  toJSON(): DifyDSLJSON {
    // ── completion 应用：原样输出 model_config，无 workflow ──
    if (this.completionConfig) {
      return {
        version: this.version,
        kind: "app",
        app: { ...this.app },
        dependencies: [...this.dependencies],
        model_config: JSON.parse(JSON.stringify(this.completionConfig)),
      };
    }

    const nodeJSONs: Record<string, unknown>[] = [];
    const edgeJSONs: Record<string, unknown>[] = [];

    // Collect all nodes (including iteration children)
    const visited = new Set<string>();
    for (const n of this.index.byId.values()) {
      if (visited.has(n.id)) continue;
      visited.add(n.id);
      nodeJSONs.push(n.toJSON());
    }

    for (const e of this.index.edges.values()) {
      edgeJSONs.push({
        id: e.id,
        source: e.source,
        sourceHandle: e.sourceHandle,
        target: e.target,
        targetHandle: e.targetHandle,
        type: e.type,
        zIndex: e.zIndex,
        data: e.data,
      });
    }

    return {
      version: this.version,
      kind: "app",
      app: { ...this.app },
      dependencies: [...this.dependencies],
      workflow: {
        conversation_variables: [...this.convVariables],
        environment_variables: [...this.envVariables],
        features: { ...this.features },
        graph: {
          nodes: nodeJSONs,
          edges: edgeJSONs,
          viewport: { ...this.viewport },
        },
        rag_pipeline_variables: [...this.ragVariables],
      },
    };
  }

  // ─────── Validation ───────

  validate(): ValidationReport {
    const report = createReport();

    // completion 应用：无图结构，走 model_config 校验
    if (this.isCompletion) {
      checkCompletionConfig(report, this.completionConfig!, this.app);
      return report;
    }

    checkStartNode(report, this.findByType("start"));
    checkAnswerNode(report, this.findByType("answer"), this.app.mode);
    checkEdgeRefs(report, [...this.index.edges.values()], new Set(this.index.byId.keys()));
    checkCodeOutputs(report, this.findByType("code"));
    checkEnvVars(report, this.envVariables);
    checkConvVars(report, this.convVariables);
    checkLLMFields(report, this.findByType("llm"));
    checkIfElseVars(report, this.findByType("if-else"));

    return report;
  }

  /**
   * Validate a condition's variable_selector before allowing modification.
   * Returns an error message string if invalid, or null if OK.
   */
  static validateConditionVar(id: string, variableSelector: string[]): string | null {
    if (!variableSelector || variableSelector.length < 2) return null;
    if (variableSelector[0] === "env" || variableSelector[0] === "conversation") {
      return `if-else ${id}: variable_selector ["${variableSelector.join('", "')}"] references ${variableSelector[0]} variable — Dify does not support env/conversation in if-else conditions. Insert a Code node before the if-else to read the variable and expose it as a node output, then reference that node in the condition.`;
    }
    return null;
  }

  // ─────── ⑦ toYAML ───────

  toYAML(): string {
    const json = this.toJSON();
    let y = yaml.dump(json as any, {
      lineWidth: -1,
      noRefs: true,
      quotingType: "'",
      forceQuotes: false,
    });
    return y;
  }
}

// ─────── Internal helpers ───────

function buildNodes(rawNodes: Record<string, unknown>[]): BaseNode<any>[] {
  const nodes: BaseNode<any>[] = [];
  const pendingStart: Record<string, unknown>[] = [];

  // Pass 1: build top-level nodes (skip iteration-start and parentId nodes)
  for (const rn of rawNodes) {
    const dtype = (rn.data as Record<string, unknown>)?.type as string;
    if (dtype === "iteration-start") {
      pendingStart.push(rn);
      continue;
    }
    if (rn.parentId) {
      pendingStart.push(rn);
      continue;
    }
    const Ctor = NODE_TYPE_MAP[dtype];
    if (!Ctor) {
      console.warn(`Unknown node type: ${dtype} (id=${rn.id}), skipping`);
      continue;
    }
    const node = Ctor.fromYAML(rn);
    nodes.push(node as BaseNode<any>);
  }

  // Build id→node map for O(1) parent lookup in pass 2
  const nodeById = new Map(nodes.map(n => [n.id, n]));

  // Pass 2: wire iteration-start + children to their parent
  for (const rn of pendingStart) {
    const parentId = rn.parentId as string;
    const parent = nodeById.get(parentId);
    if (!parent) continue;
    const dtype = (rn.data as Record<string, unknown>)?.type as string;

    if (dtype === "iteration-start") {
      const startNode = IterationStartNode.fromYAML(rn);
      (parent as any).startNode = startNode;
      nodes.push(startNode); // also track in index
    } else {
      const Ctor = NODE_TYPE_MAP[dtype];
      if (Ctor) {
        const child = Ctor.fromYAML(rn) as BaseNode<any>;
        if ((parent as any).addChild) {
          (parent as any).addChild(child);
        }
        nodes.push(child); // also track in index
      }
    }
  }

  return nodes;
}

function buildEdges(rawEdges: Record<string, unknown>[]): EdgeData[] {
  return rawEdges.map((re) => {
    const d = (re.data as Record<string, unknown>) || {};
    return {
      id: re.id as string,
      source: re.source as string,
      sourceHandle: re.sourceHandle as string,
      target: re.target as string,
      targetHandle: re.targetHandle as string,
      type: re.type as string,
      zIndex: (re.zIndex as number) ?? 0,
      data: {
        sourceType: d.sourceType as string,
        targetType: d.targetType as string,
        isInIteration: (d.isInIteration as boolean) ?? false,
        isInLoop: (d.isInLoop as boolean) ?? false,
        iteration_id: d.iteration_id as string | undefined,
      },
    };
  });
}
