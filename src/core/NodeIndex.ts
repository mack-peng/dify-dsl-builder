import { BaseNode } from "../nodes/base";
import { EdgeData } from "./types";

/**
 * O(1) index over all nodes + edges.
 * Separated from DifyDSL so it can be rebuilt independently.
 */
export class NodeIndex {
  /** All nodes keyed by id */
  readonly byId = new Map<string, BaseNode<any>>();
  /** Node IDs grouped by data.type */
  readonly byType = new Map<string, Set<string>>();
  /** Child node IDs grouped by parentId (iteration containers) */
  readonly byParent = new Map<string, Set<string>>();
  /** Edges keyed by id */
  readonly edges = new Map<string, EdgeData>();
  /** Outgoing edge IDs grouped by source node id */
  readonly outEdges = new Map<string, Set<string>>();
  /** Incoming edge IDs grouped by target node id */
  readonly inEdges = new Map<string, Set<string>>();

  // ─── Node operations ───

  addNode(node: BaseNode<any>): void {
    this.byId.set(node.id, node);
    const t = node.data.type;
    if (!this.byType.has(t)) this.byType.set(t, new Set());
    this.byType.get(t)!.add(node.id);
    if (node.parentId) {
      if (!this.byParent.has(node.parentId)) this.byParent.set(node.parentId, new Set());
      this.byParent.get(node.parentId)!.add(node.id);
    }
  }

  removeNode(id: string): void {
    const node = this.byId.get(id);
    if (!node) return;
    this.byType.get(node.data.type)?.delete(id);
    if (node.parentId) {
      this.byParent.get(node.parentId)?.delete(id);
    }
    this.byId.delete(id);
    // Clean edges referencing this node
    this._removeEdgesFor(id);
  }

  getNode(id: string): BaseNode<any> | undefined {
    return this.byId.get(id);
  }

  getNodesByType(type: string): BaseNode<any>[] {
    const ids = this.byType.get(type);
    if (!ids) return [];
    return [...ids].map(id => this.byId.get(id)!);
  }

  getChildren(parentId: string): BaseNode<any>[] {
    const ids = this.byParent.get(parentId);
    if (!ids) return [];
    return [...ids].map(id => this.byId.get(id)!);
  }

  // ─── Edge operations ───

  addEdge(e: EdgeData): void {
    this.edges.set(e.id, e);
    if (!this.outEdges.has(e.source)) this.outEdges.set(e.source, new Set());
    this.outEdges.get(e.source)!.add(e.id);
    if (!this.inEdges.has(e.target)) this.inEdges.set(e.target, new Set());
    this.inEdges.get(e.target)!.add(e.id);
  }

  removeEdge(id: string): void {
    const e = this.edges.get(id);
    if (!e) return;
    this.outEdges.get(e.source)?.delete(id);
    this.inEdges.get(e.target)?.delete(id);
    this.edges.delete(id);
  }

  getOutEdges(sourceId: string): EdgeData[] {
    const ids = this.outEdges.get(sourceId);
    if (!ids) return [];
    return [...ids].map(id => this.edges.get(id)!);
  }

  getInEdges(targetId: string): EdgeData[] {
    const ids = this.inEdges.get(targetId);
    if (!ids) return [];
    return [...ids].map(id => this.edges.get(id)!);
  }

  /** Get upstream node IDs (predecessors) */
  getPrevIds(id: string): string[] {
    return this.getInEdges(id).map(e => e.source);
  }

  /** Get downstream node IDs (successors) */
  getNextIds(id: string): string[] {
    return this.getOutEdges(id).map(e => e.target);
  }

  // ─── Internal ───

  private _removeEdgesFor(id: string): void {
    const toRemove = new Set<string>();
    for (const eid of this.outEdges.get(id) ?? []) toRemove.add(eid);
    for (const eid of this.inEdges.get(id) ?? []) toRemove.add(eid);
    for (const eid of toRemove) this.removeEdge(eid);
  }

  /** Populate from flat arrays (used during initial parse) */
  rebuild(
    nodes: BaseNode<any>[],
    edges: EdgeData[],
  ): void {
    this.byId.clear();
    this.byType.clear();
    this.byParent.clear();
    this.edges.clear();
    this.outEdges.clear();
    this.inEdges.clear();

    for (const n of nodes) this.addNode(n);
    for (const e of edges) this.addEdge(e);
  }
}
