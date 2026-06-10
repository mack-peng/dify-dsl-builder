"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeIndex = void 0;
/**
 * O(1) index over all nodes + edges.
 * Separated from DifyDSL so it can be rebuilt independently.
 */
class NodeIndex {
    /** All nodes keyed by id */
    byId = new Map();
    /** Node IDs grouped by data.type */
    byType = new Map();
    /** Child node IDs grouped by parentId (iteration containers) */
    byParent = new Map();
    /** Edges keyed by id */
    edges = new Map();
    /** Outgoing edge IDs grouped by source node id */
    outEdges = new Map();
    /** Incoming edge IDs grouped by target node id */
    inEdges = new Map();
    // ─── Node operations ───
    addNode(node) {
        this.byId.set(node.id, node);
        const t = node.data.type;
        if (!this.byType.has(t))
            this.byType.set(t, new Set());
        this.byType.get(t).add(node.id);
        if (node.parentId) {
            if (!this.byParent.has(node.parentId))
                this.byParent.set(node.parentId, new Set());
            this.byParent.get(node.parentId).add(node.id);
        }
    }
    removeNode(id) {
        const node = this.byId.get(id);
        if (!node)
            return;
        this.byType.get(node.data.type)?.delete(id);
        if (node.parentId) {
            this.byParent.get(node.parentId)?.delete(id);
        }
        this.byId.delete(id);
        // Clean edges referencing this node
        this._removeEdgesFor(id);
    }
    getNode(id) {
        return this.byId.get(id);
    }
    getNodesByType(type) {
        const ids = this.byType.get(type);
        if (!ids)
            return [];
        return [...ids].map(id => this.byId.get(id));
    }
    getChildren(parentId) {
        const ids = this.byParent.get(parentId);
        if (!ids)
            return [];
        return [...ids].map(id => this.byId.get(id));
    }
    // ─── Edge operations ───
    addEdge(e) {
        this.edges.set(e.id, e);
        if (!this.outEdges.has(e.source))
            this.outEdges.set(e.source, new Set());
        this.outEdges.get(e.source).add(e.id);
        if (!this.inEdges.has(e.target))
            this.inEdges.set(e.target, new Set());
        this.inEdges.get(e.target).add(e.id);
    }
    removeEdge(id) {
        const e = this.edges.get(id);
        if (!e)
            return;
        this.outEdges.get(e.source)?.delete(id);
        this.inEdges.get(e.target)?.delete(id);
        this.edges.delete(id);
    }
    getOutEdges(sourceId) {
        const ids = this.outEdges.get(sourceId);
        if (!ids)
            return [];
        return [...ids].map(id => this.edges.get(id));
    }
    getInEdges(targetId) {
        const ids = this.inEdges.get(targetId);
        if (!ids)
            return [];
        return [...ids].map(id => this.edges.get(id));
    }
    /** Get upstream node IDs (predecessors) */
    getPrevIds(id) {
        return this.getInEdges(id).map(e => e.source);
    }
    /** Get downstream node IDs (successors) */
    getNextIds(id) {
        return this.getOutEdges(id).map(e => e.target);
    }
    // ─── Internal ───
    _removeEdgesFor(id) {
        const toRemove = [];
        for (const [eid, e] of this.edges) {
            if (e.source === id || e.target === id) {
                toRemove.push(eid);
            }
        }
        for (const eid of toRemove) {
            this.removeEdge(eid);
        }
    }
    /** Populate from flat arrays (used during initial parse) */
    rebuild(nodes, edges) {
        this.byId.clear();
        this.byType.clear();
        this.byParent.clear();
        this.edges.clear();
        this.outEdges.clear();
        this.inEdges.clear();
        for (const n of nodes)
            this.addNode(n);
        for (const e of edges)
            this.addEdge(e);
    }
}
exports.NodeIndex = NodeIndex;
