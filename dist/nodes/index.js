"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NODE_TYPE_MAP = exports.DocNode = exports.HTTPNode = exports.ClassifierNode = exports.ToolNode = exports.IterationStartNode = exports.IterationNode = exports.AggregatorNode = exports.TemplateNode = exports.IfElseNode = exports.KnowledgeNode = exports.CodeNode = exports.LLMNode = exports.AnswerNode = exports.StartNode = void 0;
const chat_1 = require("./chat");
Object.defineProperty(exports, "StartNode", { enumerable: true, get: function () { return chat_1.StartNode; } });
Object.defineProperty(exports, "AnswerNode", { enumerable: true, get: function () { return chat_1.AnswerNode; } });
Object.defineProperty(exports, "LLMNode", { enumerable: true, get: function () { return chat_1.LLMNode; } });
const code_1 = require("./code");
Object.defineProperty(exports, "CodeNode", { enumerable: true, get: function () { return code_1.CodeNode; } });
const flow_1 = require("./flow");
Object.defineProperty(exports, "KnowledgeNode", { enumerable: true, get: function () { return flow_1.KnowledgeNode; } });
Object.defineProperty(exports, "IfElseNode", { enumerable: true, get: function () { return flow_1.IfElseNode; } });
Object.defineProperty(exports, "TemplateNode", { enumerable: true, get: function () { return flow_1.TemplateNode; } });
Object.defineProperty(exports, "AggregatorNode", { enumerable: true, get: function () { return flow_1.AggregatorNode; } });
Object.defineProperty(exports, "IterationNode", { enumerable: true, get: function () { return flow_1.IterationNode; } });
Object.defineProperty(exports, "IterationStartNode", { enumerable: true, get: function () { return flow_1.IterationStartNode; } });
const tools_1 = require("./tools");
Object.defineProperty(exports, "ToolNode", { enumerable: true, get: function () { return tools_1.ToolNode; } });
Object.defineProperty(exports, "ClassifierNode", { enumerable: true, get: function () { return tools_1.ClassifierNode; } });
Object.defineProperty(exports, "HTTPNode", { enumerable: true, get: function () { return tools_1.HTTPNode; } });
Object.defineProperty(exports, "DocNode", { enumerable: true, get: function () { return tools_1.DocNode; } });
exports.NODE_TYPE_MAP = {
    "start": chat_1.StartNode,
    "answer": chat_1.AnswerNode,
    "llm": chat_1.LLMNode,
    "code": code_1.CodeNode,
    "knowledge-retrieval": flow_1.KnowledgeNode,
    "if-else": flow_1.IfElseNode,
    "template-transform": flow_1.TemplateNode,
    "variable-aggregator": flow_1.AggregatorNode,
    "iteration": flow_1.IterationNode,
    "iteration-start": flow_1.IterationStartNode,
    "tool": tools_1.ToolNode,
    "question-classifier": tools_1.ClassifierNode,
    "http-request": tools_1.HTTPNode,
    "document-extractor": tools_1.DocNode,
};
