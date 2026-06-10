# dify-dsl-builder

TypeScript library for reading, manipulating, and writing [Dify](https://dify.ai) DSL YAML files (`app.yml`).

## Install

```bash
npm ci
npm run build
```

## CLI

```bash
# Show help
npm run run src/cli.ts --help

# Roundtrip test (load → save → validate)
npm run run src/cli.ts roundtrip input/app.yml output/app.yml

# Validate a DSL file
npm run run src/cli.ts validate input/app.yml

# Show node/edge stats
npm run run src/cli.ts info input/app.yml

# Apply a patch
npm run run src/cli.ts apply patches/gaokao-v3.yml -i input/app.yml -o output/patched.yml
```

## Library API

```ts
import { DifyDSL, Edge, CodeNode } from "dify-dsl-builder";

// Load
const dsl = DifyDSL.load("input/app.yml");

// Inspect
console.log(dsl.mode);           // "workflow" | "advanced-chat"
console.log(dsl.graph.nodeCount);
const start = dsl.graph.find("start-node-id");
const llm = dsl.graph.findLLM("llm-node-id");

// Mutate
dsl.graph.add(new CodeNode("new-code", { title: "My Code", code: "print(1)" }));
dsl.graph.addEdge(new Edge("start-node-id", "new-code"));
dsl.setEnv("API_KEY", "12345", "string");

// Validate
const report = dsl.validate();
if (!report.ok) console.error(report.errors);

// Save
dsl.save("output/app.yml");
```

## Patch files

Declarative YAML patches with a `steps:` array. See `patches/` for examples.

```yaml
description: My patch
steps:
  - set-title: { id: "node-1", value: "New Title" }
  - remove-node: { id: "node-old" }
  - add-edge: { source: "new-node", target: "answer-node" }
```

## Node types

| Type string | Class |
|---|---|
| `start` | `StartNode` |
| `answer` | `AnswerNode` |
| `llm` | `LLMNode` |
| `code` | `CodeNode` |
| `knowledge-retrieval` | `KnowledgeNode` |
| `if-else` | `IfElseNode` |
| `template-transform` | `TemplateNode` |
| `variable-aggregator` | `AggregatorNode` |
| `iteration` | `IterationNode` |
| `tool` | `ToolNode` |
| `question-classifier` | `ClassifierNode` |
| `http-request` | `HTTPNode` |
| `document-extractor` | `DocNode` |

## License

MIT
