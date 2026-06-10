import * as fs from "fs";
import * as yaml from "js-yaml";
import { BaseNode } from "../nodes/base";
import { NodeIndex } from "./NodeIndex";
import { DifyDSLJSON, AppMeta, Dependency, Viewport, EdgeData } from "./types";

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
  }

  // ─────── ① parse ───────

  /**
   * Parse YAML string and build the internal index.
   * Steps ① + ② combined.
   */
  static parse(yamlStr: string): DifyDSL {
    const raw = yaml.load(yamlStr) as any;
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
    else { this.envVariables.push({ name, value, value_type: type, description: "" }); }
  }
  removeEnv(name: string): void {
    this.envVariables = this.envVariables.filter((e: any) => e.name !== name);
  }
  setConv(name: string, type = "string"): void {
    const existing = this.convVariables.find((c: any) => c.name === name) as any;
    if (existing) existing.value_type = type;
    else { this.convVariables.push({ name, value_type: type, description: "" }); }
  }

  // ─────── ⑥ toJSON ───────

  toJSON(): DifyDSLJSON {
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

  validate(): { errors: { message: string }[]; warnings: { message: string }[] } {
    const errors: { message: string }[] = [];
    const warnings: { message: string }[] = [];

    // 1. Start node exists
    const starts = this.findByType("start");
    if (starts.length === 0) errors.push({ message: "Missing Start node" });
    if (starts.length > 1) warnings.push({ message: "Multiple Start nodes" });

    // 2. Answer/End check
    if (this.app.mode === "advanced-chat" && this.findByType("answer").length === 0) {
      errors.push({ message: "advanced-chat mode requires Answer node" });
    }

    // 3. Edge node refs
    for (const e of this.index.edges.values()) {
      if (!this.index.byId.has(e.source)) errors.push({ message: `Edge source '${e.source}' not found` });
      if (!this.index.byId.has(e.target)) errors.push({ message: `Edge target '${e.target}' not found` });
    }

    // 4. Code output types
    const validTypes = new Set([
      "string","number","integer","float","boolean","object","file","secret",
      "array[string]","array[number]","array[integer]","array[float]","array[object]",
      "array[boolean]","array[file]","array[any]","none","group",
    ]);
    for (const n of this.findByType("code")) {
      const outputs = (n as any).data.outputs || {};
      for (const [name, out] of Object.entries(outputs as Record<string, any>)) {
        if (!validTypes.has(out.type)) {
          errors.push({ message: `Code ${n.id} output '${name}' type '${out.type}' is invalid` });
        }
      }
    }

    return { errors, warnings };
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

import { NODE_TYPE_MAP, IterationStartNode } from "../nodes/index";

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

  // Pass 2: wire iteration-start + children to their parent
  for (const rn of pendingStart) {
    const parentId = rn.parentId as string;
    const parent = nodes.find(n => n.id === parentId);
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
