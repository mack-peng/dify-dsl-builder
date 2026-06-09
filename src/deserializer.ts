import * as yaml from "js-yaml";
import * as fs from "fs";
import { Graph } from "./graph";
import { Features, FeaturesConfig } from "./features";
import { NODE_TYPE_MAP, IterationNode, IterationStartNode, AnyNode } from "./nodes";
import { Edge } from "./edge";
import { Dependency, AppMeta } from "./types/common";

interface RawDify {
  version: string;
  kind: "app";
  app: AppMeta;
  dependencies: Dependency[];
  workflow: {
    environment_variables: { name: string; value?: unknown; value_type?: string; description?: string }[];
    conversation_variables: { name: string; value_type?: string; description?: string }[];
    features: Record<string, unknown>;
    graph: {
      nodes: Record<string, unknown>[];
      edges: Record<string, unknown>[];
      viewport?: { x: number; y: number; zoom: number };
    };
    rag_pipeline_variables?: unknown[];
  };
}

export function load(yamlStr: string): {
  version: string;
  kind: "app";
  app: AppMeta;
  dependencies: Dependency[];
  graph: Graph;
  features: Features;
  envVariables: { name: string; value?: unknown; value_type?: string; description?: string }[];
  convVariables: { name: string; value_type?: string; description?: string }[];
} {
  const raw = yaml.load(yamlStr) as RawDify;

  const graph = new Graph();

  // Gather all raw nodes indexed by id
  const rawNodeMap = new Map<string, Record<string, unknown>>();
  for (const rn of raw.workflow.graph.nodes) {
    rawNodeMap.set(rn.id as string, rn);
  }

  // Pass 1: build top-level nodes (skip iteration-start and iteration children)
  const iterStartNodes: Record<string, unknown>[] = [];
  for (const rn of raw.workflow.graph.nodes) {
    const dtype = (rn.data as Record<string, unknown>)?.type as string;
    if (dtype === "iteration-start") {
      iterStartNodes.push(rn);
      continue;
    }
    // Skip iteration children (have parentId) — they're added in Pass 2
    if (rn.parentId) continue;
    const Ctor = NODE_TYPE_MAP[dtype];
    if (!Ctor) {
      console.warn(`Unknown node type: ${dtype} (id=${rn.id}), skipping`);
      continue;
    }
    const node = Ctor.fromYAML(rn);
    graph.add(node as AnyNode);
  }

  // Pass 2: wire up iteration children
  // Connect iteration-start nodes to their parent IterationNode
  for (const rn of iterStartNodes) {
    const parentId = rn.parentId as string;
    const iterNode = graph.findIteration(parentId);
    if (iterNode) {
      const startNode = IterationStartNode.fromYAML(rn);
      iterNode.startNode = startNode;
    }
  }

  // Find any remaining nodes inside iterations (parentId set but not iteration-start)
  for (const rn of raw.workflow.graph.nodes) {
    const parentId = rn.parentId as string | undefined;
    const dtype = (rn.data as Record<string, unknown>)?.type as string;
    if (!parentId || dtype === "iteration-start") continue;

    const iterNode = graph.findIteration(parentId);
    if (iterNode) {
      const Ctor = NODE_TYPE_MAP[dtype];
      if (Ctor) {
        const childNode = Ctor.fromYAML(rn);
        iterNode.addChild(childNode as AnyNode, {});
      }
    }
  }

  // Pass 3: build edges
  for (const re of raw.workflow.graph.edges) {
    const edge = Edge.fromYAML(re);
    graph.addEdge(edge);
  }

  // Features
  const features = Features.fromYAML(raw.workflow.features);

  return {
    version: raw.version,
    kind: raw.kind,
    app: raw.app,
    dependencies: raw.dependencies,
    graph,
    features,
    envVariables: raw.workflow.environment_variables ?? [],
    convVariables: raw.workflow.conversation_variables ?? [],
  };
}

export function loadFromFile(filePath: string) {
  const yamlStr = fs.readFileSync(filePath, "utf-8");
  return load(yamlStr);
}
