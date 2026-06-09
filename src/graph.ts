import { Edge } from "./edge";
import { YAMLWriter } from "./serializer";
import {
  StartNode, AnswerNode, LLMNode, CodeNode,
  KnowledgeNode, IfElseNode, TemplateNode, AggregatorNode,
  IterationNode, IterationStartNode, ToolNode, ClassifierNode,
  AnyNode,
} from "./nodes";

export class Graph {
  private _nodes: Map<string, AnyNode> = new Map();
  private _edges: Edge[] = [];

  get nodeCount(): number { return this._nodes.size; }
  get edgeCount(): number { return this._edges.length; }

  // === Top-level find (no iteration recursion) ===
  find(id: string): AnyNode | undefined { return this._nodes.get(id); }

  findStart(id: string): StartNode | undefined {
    const n = this._nodes.get(id); return n instanceof StartNode ? n : undefined;
  }
  findAnswer(id: string): AnswerNode | undefined {
    const n = this._nodes.get(id); return n instanceof AnswerNode ? n : undefined;
  }
  findLLM(id: string): LLMNode | undefined {
    const n = this._nodes.get(id); return n instanceof LLMNode ? n : undefined;
  }
  findCode(id: string): CodeNode | undefined {
    const n = this._nodes.get(id); return n instanceof CodeNode ? n : undefined;
  }
  findKnowledge(id: string): KnowledgeNode | undefined {
    const n = this._nodes.get(id); return n instanceof KnowledgeNode ? n : undefined;
  }
  findIfElse(id: string): IfElseNode | undefined {
    const n = this._nodes.get(id); return n instanceof IfElseNode ? n : undefined;
  }
  findTemplate(id: string): TemplateNode | undefined {
    const n = this._nodes.get(id); return n instanceof TemplateNode ? n : undefined;
  }
  findAggregator(id: string): AggregatorNode | undefined {
    const n = this._nodes.get(id); return n instanceof AggregatorNode ? n : undefined;
  }
  findIteration(id: string): IterationNode | undefined {
    const n = this._nodes.get(id); return n instanceof IterationNode ? n : undefined;
  }
  findTool(id: string): ToolNode | undefined {
    const n = this._nodes.get(id); return n instanceof ToolNode ? n : undefined;
  }
  findClassifier(id: string): ClassifierNode | undefined {
    const n = this._nodes.get(id); return n instanceof ClassifierNode ? n : undefined;
  }

  // === Batch queries ===
  starts(): StartNode[] { return [...this._nodes.values()].filter((n): n is StartNode => n instanceof StartNode); }
  answers(): AnswerNode[] { return [...this._nodes.values()].filter((n): n is AnswerNode => n instanceof AnswerNode); }
  llms(): LLMNode[] { return [...this._nodes.values()].filter((n): n is LLMNode => n instanceof LLMNode); }
  codes(): CodeNode[] { return [...this._nodes.values()].filter((n): n is CodeNode => n instanceof CodeNode); }
  knowledges(): KnowledgeNode[] { return [...this._nodes.values()].filter((n): n is KnowledgeNode => n instanceof KnowledgeNode); }
  ifElses(): IfElseNode[] { return [...this._nodes.values()].filter((n): n is IfElseNode => n instanceof IfElseNode); }
  templates(): TemplateNode[] { return [...this._nodes.values()].filter((n): n is TemplateNode => n instanceof TemplateNode); }
  aggregators(): AggregatorNode[] { return [...this._nodes.values()].filter((n): n is AggregatorNode => n instanceof AggregatorNode); }
  iterations(): IterationNode[] { return [...this._nodes.values()].filter((n): n is IterationNode => n instanceof IterationNode); }
  tools(): ToolNode[] { return [...this._nodes.values()].filter((n): n is ToolNode => n instanceof ToolNode); }
  classifiers(): ClassifierNode[] { return [...this._nodes.values()].filter((n): n is ClassifierNode => n instanceof ClassifierNode); }

  // === CRUD ===
  add(node: AnyNode): void {
    this._nodes.set(node.id, node);
  }

  remove(id: string): void {
    this._nodes.delete(id);
    // Remove edges referencing this node
    this._edges = this._edges.filter(e => e.source !== id && e.target !== id);
  }

  // === Edges ===
  addEdge(edge: Edge): void {
    this._edges.push(edge);
  }

  removeEdge(edgeId: string): void {
    this._edges = this._edges.filter(e => e.id !== edgeId);
  }

  edgesFrom(sourceId: string): Edge[] {
    return this._edges.filter(e => e.source === sourceId);
  }

  edgesTo(targetId: string): Edge[] {
    return this._edges.filter(e => e.target === targetId);
  }

  findEdge(pred: { source?: string; target?: string; sourceHandle?: string }): Edge | undefined {
    return this._edges.find(e =>
      (pred.source === undefined || e.source === pred.source) &&
      (pred.target === undefined || e.target === pred.target) &&
      (pred.sourceHandle === undefined || e.sourceHandle === pred.sourceHandle)
    );
  }

  get edges(): Edge[] { return this._edges; }

  // === Serialization ===
  toYAML(w: YAMLWriter): void {
    w.key("graph");
    w.indent(() => {
      // Edges
      w.key("edges");
      w.indent(() => {
        this._edges.forEach(e => {
          const srcNode = this.find(e.source);
          const tgtNode = this.find(e.target);
          if (!srcNode || !tgtNode) return;
          let srcType = srcNode.data.type;
          let tgtType = tgtNode.data.type;
          e.toYAML(w, srcType, tgtType);
        });
      });
      // Nodes
      w.key("nodes");
      w.indent(() => {
        // Top-level nodes (not iteration-start, not in iteration)
        for (const n of this._nodes.values()) {
          if (n instanceof IterationStartNode) continue;
          // IterationNode writes itself and all children
          if (n instanceof IterationNode) {
            n.toYAML(w);
            continue;
          }
          n.toYAML(w);
        }
      });
      // viewport
      w.key("viewport");
      w.indent(() => {
        w.keyVal("x", "642.9890265047154");
        w.keyVal("y", "196.87974640057033");
        w.keyVal("zoom", "0.2520881137236488");
      });
    });
  }
}
