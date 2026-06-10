// ─── Base data for all nodes ───
export interface NodeData {
  type: string;
  title: string;
  desc: string;
  selected: boolean;
}

// ─── Position ───
export interface XY {
  x: number;
  y: number;
}

// ─── Edge (原始结构，序列化时直接使用) ───
export interface EdgeData {
  id: string;
  source: string;
  sourceHandle: string;
  target: string;
  targetHandle: string;
  type: string;
  zIndex: number;
  data: {
    sourceType: string;
    targetType: string;
    isInIteration: boolean;
    isInLoop: boolean;
    iteration_id?: string;
  };
}

// ─── DSL 顶层结构 ───
export interface DifyDSLJSON {
  version: string;
  kind: "app";
  app: AppMeta;
  dependencies: Dependency[];
  workflow: WorkflowData;
}

export interface AppMeta {
  name: string;
  mode: "workflow" | "advanced-chat";
  description: string;
  icon: string;
  icon_background: string;
  use_icon_as_answer_icon: boolean;
}

export interface Dependency {
  current_identifier: null;
  type: "marketplace";
  value: {
    marketplace_plugin_unique_identifier: string;
    version: null;
  };
}

export interface WorkflowData {
  conversation_variables: unknown[];
  environment_variables: unknown[];
  features: Record<string, unknown>;
  graph: {
    nodes: Record<string, unknown>[];
    edges: Record<string, unknown>[];
    viewport?: { x: number; y: number; zoom: number };
  };
  rag_pipeline_variables: unknown[];
}

// ─── Viewport ───
export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}


