"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Graph = void 0;
const nodes_1 = require("./nodes");
class Graph {
    _nodes = new Map();
    _edges = [];
    get nodeCount() { return this._nodes.size; }
    get edgeCount() { return this._edges.length; }
    // === Top-level find (no iteration recursion) ===
    find(id) {
        const n = this._nodes.get(id);
        if (n)
            return n;
        // Search inside iteration children
        for (const node of this._nodes.values()) {
            if (node instanceof nodes_1.IterationNode) {
                if (node.startNode?.id === id)
                    return node.startNode;
                const child = node.children.find(c => c.id === id);
                if (child)
                    return child;
            }
        }
        return undefined;
    }
    findStart(id) {
        const n = this._nodes.get(id);
        return n instanceof nodes_1.StartNode ? n : undefined;
    }
    findAnswer(id) {
        const n = this._nodes.get(id);
        return n instanceof nodes_1.AnswerNode ? n : undefined;
    }
    findLLM(id) {
        const n = this._nodes.get(id);
        return n instanceof nodes_1.LLMNode ? n : undefined;
    }
    findCode(id) {
        const n = this._nodes.get(id);
        return n instanceof nodes_1.CodeNode ? n : undefined;
    }
    findKnowledge(id) {
        const n = this._nodes.get(id);
        return n instanceof nodes_1.KnowledgeNode ? n : undefined;
    }
    findIfElse(id) {
        const n = this._nodes.get(id);
        return n instanceof nodes_1.IfElseNode ? n : undefined;
    }
    findTemplate(id) {
        const n = this._nodes.get(id);
        return n instanceof nodes_1.TemplateNode ? n : undefined;
    }
    findAggregator(id) {
        const n = this._nodes.get(id);
        return n instanceof nodes_1.AggregatorNode ? n : undefined;
    }
    findIteration(id) {
        const n = this._nodes.get(id);
        return n instanceof nodes_1.IterationNode ? n : undefined;
    }
    findTool(id) {
        const n = this._nodes.get(id);
        return n instanceof nodes_1.ToolNode ? n : undefined;
    }
    findClassifier(id) {
        const n = this._nodes.get(id);
        return n instanceof nodes_1.ClassifierNode ? n : undefined;
    }
    // === Batch queries ===
    starts() { return [...this._nodes.values()].filter((n) => n instanceof nodes_1.StartNode); }
    answers() { return [...this._nodes.values()].filter((n) => n instanceof nodes_1.AnswerNode); }
    llms() { return [...this._nodes.values()].filter((n) => n instanceof nodes_1.LLMNode); }
    codes() { return [...this._nodes.values()].filter((n) => n instanceof nodes_1.CodeNode); }
    knowledges() { return [...this._nodes.values()].filter((n) => n instanceof nodes_1.KnowledgeNode); }
    ifElses() { return [...this._nodes.values()].filter((n) => n instanceof nodes_1.IfElseNode); }
    templates() { return [...this._nodes.values()].filter((n) => n instanceof nodes_1.TemplateNode); }
    aggregators() { return [...this._nodes.values()].filter((n) => n instanceof nodes_1.AggregatorNode); }
    iterations() { return [...this._nodes.values()].filter((n) => n instanceof nodes_1.IterationNode); }
    tools() { return [...this._nodes.values()].filter((n) => n instanceof nodes_1.ToolNode); }
    classifiers() { return [...this._nodes.values()].filter((n) => n instanceof nodes_1.ClassifierNode); }
    // === CRUD ===
    add(node) {
        this._nodes.set(node.id, node);
    }
    remove(id) {
        this._nodes.delete(id);
        // Remove edges referencing this node
        this._edges = this._edges.filter(e => e.source !== id && e.target !== id);
    }
    // === Edges ===
    addEdge(edge) {
        this._edges.push(edge);
    }
    removeEdge(edgeId) {
        this._edges = this._edges.filter(e => e.id !== edgeId);
    }
    edgesFrom(sourceId) {
        return this._edges.filter(e => e.source === sourceId);
    }
    edgesTo(targetId) {
        return this._edges.filter(e => e.target === targetId);
    }
    findEdge(pred) {
        return this._edges.find(e => (pred.source === undefined || e.source === pred.source) &&
            (pred.target === undefined || e.target === pred.target) &&
            (pred.sourceHandle === undefined || e.sourceHandle === pred.sourceHandle));
    }
    get edges() { return this._edges; }
    // === Serialization ===
    toYAML(w) {
        w.key("graph");
        w.indent(() => {
            // Edges
            w.key("edges");
            this._edges.forEach(e => {
                const srcNode = this.find(e.source);
                const tgtNode = this.find(e.target);
                if (!srcNode || !tgtNode)
                    return;
                let srcType = srcNode.data.type;
                let tgtType = tgtNode.data.type;
                e.toYAML(w, srcType, tgtType);
            });
            // Nodes
            w.key("nodes");
            // Top-level nodes (not iteration-start, not in iteration)
            for (const n of this._nodes.values()) {
                if (n instanceof nodes_1.IterationStartNode)
                    continue;
                if (n instanceof nodes_1.IterationNode) {
                    n.toYAML(w);
                    continue;
                }
                n.toYAML(w);
            }
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
exports.Graph = Graph;
