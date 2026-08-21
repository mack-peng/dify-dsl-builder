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
  workflow?: WorkflowData;
  model_config?: CompletionAppConfig;
}

export interface AppMeta {
  name: string;
  mode: "workflow" | "advanced-chat" | "completion";
  description: string;
  icon: string;
  icon_background: string;
  use_icon_as_answer_icon: boolean;
  icon_type?: string;
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

// ─── Completion app（无 workflow，顶层是 model_config）───
export interface CompletionModelConfig {
  provider: string;
  name: string;
  mode: "chat" | "completion";
  completion_params: Record<string, unknown>;
}

export interface CompletionInputFormItem {
  [key: string]: unknown;
  type?: string;
  variable?: string;
  label?: string;
  required?: boolean;
  default?: string;
  hide?: boolean;
  "text-input"?: {
    variable: string;
    label?: string;
    required?: boolean;
    default?: string;
    hide?: boolean;
  };
}

/**
 * completion 应用的顶层 model_config。
 * 保留为宽松结构（字段较多且随 Dify 版本变化），核心字段类型化，其余透传。
 */
export interface CompletionAppConfig {
  agent_mode?: Record<string, unknown>;
  annotation_reply?: { enabled: boolean };
  chat_prompt_config?: {
    prompt?: { role: "system" | "user" | "assistant"; text: string }[];
  };
  completion_prompt_config?: Record<string, unknown>;
  dataset_configs?: Record<string, unknown>;
  dataset_query_variable?: string;
  external_data_tools?: unknown[];
  file_upload?: Record<string, unknown>;
  model: CompletionModelConfig;
  more_like_this?: { enabled: boolean };
  opening_statement?: string | null;
  pre_prompt: string;
  prompt_type?: string;
  retriever_resource?: { enabled: boolean };
  sensitive_word_avoidance?: { enabled: boolean };
  speech_to_text?: { enabled: boolean };
  suggested_questions?: unknown[];
  suggested_questions_after_answer?: { enabled: boolean };
  text_to_speech?: Record<string, unknown>;
  user_input_form?: CompletionInputFormItem[];
  [key: string]: unknown;
}

// ─── Viewport ───
export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}


