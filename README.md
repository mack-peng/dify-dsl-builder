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

# Show node/edge stats
npm run run src/cli.ts info input/app.yml

# Roundtrip test (parse → toYAML → save)
npm run run src/cli.ts roundtrip input/app.yml output/roundtrip.yml

# Apply a YAML patch
npm run run src/cli.ts apply patches/gaokao-v3.yml -i input/app.yml -o output/patched.yml
```

## Library API (quick start)

```ts
import { DifyDSL } from "dify-dsl-builder";
import * as fs from "fs";

// ①+② Parse YAML → typed index
const yamlStr = fs.readFileSync("input/app.yml", "utf-8");
const dsl = DifyDSL.parse(yamlStr);

// ④ CRUD — O(1) lookups
const node = dsl.getNode("node-id");
const llms = dsl.findByType("llm");
const prev = dsl.getPrevIds("node-id");
const next = dsl.getNextIds("node-id");

dsl.addNode(new CodeNode("new-id", { title: "My Code", code: "print(1)" }));
dsl.removeNode("old-node-id");    // auto-removes related edges
dsl.addEdge("source-id", "target-id");

// ⑤ Node-level modifications
node?.setTitle("New Title");
node?.setPosition(100, 200);

// ⑥+⑦ Serialize
const json = dsl.toJSON();    // plain object
const yaml = dsl.toYAML();    // yaml.dump → string
fs.writeFileSync("output.yml", yaml);
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

| Type string | Class | Key methods |
|-------------|-------|-------------|
| `start` | `StartNode` | `addVariable(v)`, `removeVariable(n)`, `updateVariable(n,patch)` |
| `answer` | `AnswerNode` | `setAnswer(tpl)`, `addVariableRef(id,f)` |
| `llm` | `LLMNode` | `setModel(p,n)`, `setTemperature(t)`, `addPromptMessage(m)`, `setMemory(n)` |
| `code` | `CodeNode` | `setCode(lang,code)`, `addVariable(v)`, `addOutput(name,type)` |
| `knowledge-retrieval` | `KnowledgeNode` | `addDataset(id)`, `setQuerySelector(id,f)`, `setTopK(n)` |
| `if-else` | `IfElseNode` | `addCase(c)`, `updateCondition(caseId,idx,patch)` |
| `template-transform` | `TemplateNode` | `setTemplate(tpl)`, `addVariable(v)` |
| `variable-aggregator` | `AggregatorNode` | `addSource(id,f)`, `removeSource(id)`, `setOutputType(t)` |
| `iteration` | `IterationNode` | `addChild(n)`, `removeChild(id)`, `setIterator(id,f)` |
| `tool` | `ToolNode` | `setPlugin(id,uid)`, `setToolParam(k,v)`, `setToolConfig(k,v)` |
| `question-classifier` | `ClassifierNode` | `addClass(c)`, `setModel(p,n)`, `setInstructions(s)` |
| `http-request` | `HTTPNode` | (stub) |
| `document-extractor` | `DocNode` | (stub) |

## License

MIT
