# dify-dsl-builder

CLI tool and TypeScript library for reading, manipulating, and writing [Dify](https://dify.ai) DSL YAML files (`app.yml`).

---

## Installation

```bash
npm install -g @orangemust/dify-dsl-builder
```

Or use via npx without installing:

```bash
npx dify-dsl-cli <command> ...
```

### For LLM Agents

AI Agent 请首先阅读 [`docs/guide/installation.md`](docs/guide/installation.md) 中的 **第 0 节「AI Agent 工作流指南」**，了解如何分析需求、选择原子命令还是 patch、确认后执行。

实现需求时优先使用 YAML Patch 系统（[`docs/guide/patch.md`](docs/guide/patch.md)），编写描述文件优于直接写 TypeScript 代码。

---

## CLI Commands

```
dify-dsl-cli <command> [options]

Commands:
  info       <file>              Print node/edge stats
  roundtrip  <input> [output]    Parse → save, verify round-trip
  validate   <file>              Run Ruby DSL validator (external script)
  apply      <patch> -i <in> -o <out>  Apply YAML patch file
  remove     <file> <id>         Remove a node

Atomic commands (modify file in place):
  node set-title   <file> <id> <title>
  node set-desc    <file> <id> <desc>
  node set-prompt  <file> <id> <role> <replace> <with>
  edge add         <file> <src> <tgt> [handle]
  edge remove      <file> <src> <tgt> [handle]
```

### Examples

```bash
# Inspect a DSL file
dify-dsl-cli info my-workflow.yml

# Apply a YAML patch
dify-dsl-cli apply my-patch.yml -i input.yml -o output.yml

# Modify a node title in place
dify-dsl-cli node set-title workflow.yml "node-id" "新标题"

# Add an edge
dify-dsl-cli edge add workflow.yml "source-id" "target-id"
```

---

## YAML Patch System

Declaratively modify Dify DSL via YAML patch files. **17 operations** — see full guide at [`docs/guide/patch.md`](docs/guide/patch.md).

```yaml
description: 我的补丁
steps:
  - set-title: { id: "node-1", value: "新标题" }
  - remove-node: { id: "node-old" }
  - add-edge: { source: "new-node", target: "answer-node" }
```

---

## Library API

```ts
import { DifyDSL } from "@orangemust/dify-dsl-builder";
import * as fs from "fs";

const dsl = DifyDSL.parse(fs.readFileSync("app.yml", "utf-8"));

// CRUD — O(1) lookups
const node = dsl.getNode("node-id");
const llms = dsl.findByType("llm");
dsl.getPrevIds("node-id");
dsl.getNextIds("node-id");

dsl.addEdge("source-id", "target-id");
dsl.removeNode("old-node-id");  // auto-removes related edges

// Serialize
fs.writeFileSync("output.yml", dsl.toYAML());
```

Full API reference: [`docs/guide/installation.md`](docs/guide/installation.md)

---

## Node Types

| Type string | Class | Key methods |
|-------------|-------|-------------|
| `start` | `StartNode` | `addVariable(v)`, `removeVariable(n)` |
| `answer` | `AnswerNode` | `setAnswer(tpl)`, `addVariableRef(id,f)` |
| `llm` | `LLMNode` | `setModel(p,n)`, `setTemperature(t)`, `addPromptMessage(m)` |
| `code` | `CodeNode` | `setCode(lang,code)`, `addVariable(v)`, `addOutput(name,type)` |
| `knowledge-retrieval` | `KnowledgeNode` | `addDataset(id)`, `setQuerySelector(id,f)` |
| `if-else` | `IfElseNode` | `addCase(c)`, `updateCondition(caseId,idx,patch)` |
| `template-transform` | `TemplateNode` | `setTemplate(tpl)`, `addVariable(v)` |
| `variable-aggregator` | `AggregatorNode` | `addSource(id,f)`, `removeSource(id)` |
| `iteration` | `IterationNode` | `addChild(n)`, `removeChild(id)`, `setIterator(id,f)` |
| `tool` | `ToolNode` | `setPlugin(id,uid)`, `setToolParam(k,v)` |
| `question-classifier` | `ClassifierNode` | `addClass(c)`, `setModel(p,n)` |
| `http-request` | `HTTPNode` | `setMethod(m)`, `setUrl(u)`, `setBody(type,data)` |
| `document-extractor` | `DocNode` | `setVariableSelector(id,field)` |

## License

MIT
