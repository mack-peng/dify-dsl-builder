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

When working in this repo (clone + dev), fetch the guides:

```bash
curl -s https://raw.githubusercontent.com/mack-peng/dify-dsl-builder/main/docs/guide/installation.md
curl -s https://raw.githubusercontent.com/mack-peng/dify-dsl-builder/main/docs/guide/patch.md
```

实现需求时优先使用 YAML Patch 系统（[`docs/guide/patch.md`](docs/guide/patch.md)），编写描述文件优于直接写 TypeScript 代码。

---

## CLI Commands

### Inspect

```
dify-dsl-cli info <file>                 # node/edge counts by type
dify-dsl-cli flow <file> [--short]       # workflow topology tree
dify-dsl-cli find <file> <text>          # search across all node content
dify-dsl-cli node show <file> <id>       # dump full node data
dify-dsl-cli node show <file> <id> --json  # machine-readable JSON
dify-dsl-cli node list <file> [type]     # tabular overview, optional type filter
dify-dsl-cli edge list <file> [node-id]  # edge table
dify-dsl-cli path <file> <from> <to>     # shortest path between nodes
```

### Verify

```
dify-dsl-cli diff <yml1> <yml2>          # semantic diff (nodes, edges, prompts, conditions)
dify-dsl-cli roundtrip <in> [out]        # parse → save, verify fidelity
dify-dsl-cli validate <file>             # Ruby DSL validator (requires Ruby runtime)
```

### Apply Patches

```
dify-dsl-cli apply <patch.yml> -i <in> -o <out>   # 19 patch operations + auto-validation
```

### Atomic Modify (in-place)

```
dify-dsl-cli remove           <file> <id>
dify-dsl-cli node set-title    <file> <id> <title>
dify-dsl-cli node set-desc     <file> <id> <desc>
dify-dsl-cli node set-prompt   <file> <id> <role> <replace> <with>
dify-dsl-cli node set-code     <file> <id> <replace> <with>
dify-dsl-cli node set-condition <file> <id> <case_id> <field> <value>
dify-dsl-cli edge add          <file> <src> <tgt> [handle]
dify-dsl-cli edge remove       <file> <src> <tgt> [handle]
```

### Examples

```bash
# Understand the workflow
dify-dsl-cli flow app.yml
dify-dsl-cli find app.yml "温度"           # find all mentions of a keyword
dify-dsl-cli node show app.yml "llm-001"   # inspect a specific LLM node

# Apply a YAML patch
dify-dsl-cli apply my-patch.yml -i app.yml -o patched.yml

# Quick inline modification
dify-dsl-cli node set-title app.yml "node-42" "New Title"
dify-dsl-cli node set-condition app.yml "if-1" "true" "value" 420

# Verify changes
dify-dsl-cli diff app.yml patched.yml
```

---

## YAML Patch System

Declaratively modify Dify DSL via YAML patch files. **19 operations** — see full guide at [`docs/guide/patch.md`](docs/guide/patch.md).

```yaml
description: My patch
steps:
  - set-title: { id: "node-1", value: "New Title" }
  - remove-node: { id: "node-old" }
  - add-edge: { source: "new-node", target: "answer-node" }
  - set-prompt:
      id: "llm-1"
      role: "system"
      replace: "old text"
      with: "new text"
      replaceAll: true
  - update-condition:
      id: "if-else-1"
      case_id: "true"
      field: "value"
      value: 420
  - remove-classifier-class:
      classifier: "cls-1"
      id: "deprecated-class"
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
