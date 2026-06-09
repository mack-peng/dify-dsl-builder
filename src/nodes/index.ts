import { StartNode, AnswerNode, LLMNode } from "./chat";
import { CodeNode } from "./code";
import { KnowledgeNode, IfElseNode, TemplateNode, AggregatorNode, IterationNode, IterationStartNode, IterChildNode } from "./flow";
import { ToolNode, ClassifierNode, HTTPNode, DocNode } from "./tools";

export {
  StartNode, AnswerNode, LLMNode,
  CodeNode,
  KnowledgeNode, IfElseNode, TemplateNode, AggregatorNode, IterationNode, IterationStartNode,
  ToolNode, ClassifierNode, HTTPNode, DocNode,
};
export type { IterChildNode };

export type AnyNode =
  | StartNode
  | AnswerNode
  | LLMNode
  | CodeNode
  | KnowledgeNode
  | IfElseNode
  | TemplateNode
  | AggregatorNode
  | IterationNode
  | IterationStartNode
  | ToolNode
  | ClassifierNode
  | HTTPNode
  | DocNode;

import { BaseNode } from "./base";

// biome-ignore lint/suspicious/noExplicitAny: factory pattern for deserialization
type NodeConstructor = { fromYAML(raw: Record<string, unknown>): BaseNode<any> };

export const NODE_TYPE_MAP: Record<string, NodeConstructor> = {
  "start": StartNode,
  "answer": AnswerNode,
  "llm": LLMNode,
  "code": CodeNode,
  "knowledge-retrieval": KnowledgeNode,
  "if-else": IfElseNode,
  "template-transform": TemplateNode,
  "variable-aggregator": AggregatorNode,
  "iteration": IterationNode,
  "iteration-start": IterationStartNode,
  "tool": ToolNode,
  "question-classifier": ClassifierNode,
  "http-request": HTTPNode,
  "document-extractor": DocNode,
};
