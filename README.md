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
npx tsx src/cli.ts --help

# Show node/edge stats
npx tsx src/cli.ts info input/app.yml

# Roundtrip test (parse → toYAML → save)
npx tsx src/cli.ts roundtrip input/app.yml output/roundtrip.yml

# Apply a YAML patch (see examples/patch-all-steps.yml)
npx tsx src/cli.ts apply examples/patch-all-steps.yml -i input/app.yml -o output/patched.yml
```

## Examples

```bash
# Run the TypeScript API demo
npx tsx examples/basic-usage.ts

# Apply the comprehensive patch demo to the input file
npx tsx src/cli.ts apply examples/patch-all-steps.yml \
  -i input/高考志愿推荐助手.yml \
  -o output/patched.yml
```

## Web debug page

```bash
npm run web:dev     # http://localhost:8300
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

## 节点创建

所有节点构造器都是 `new XxxNode(id, data?)`，构造后用 `dsl.addNode(node)` 添加到 DSL。
完整构造参数见 `docs/guide/installation.md#4-节点创建`。

```ts
import { CodeNode, LLMNode, StartNode, AnswerNode } from "dify-dsl-builder";

// Code 节点
const code = new CodeNode("my-code", {
  title: "处理数据",
  code: `def main(x: str) -> dict:\n  return {"r": x}`,
  code_language: "python3",
  variables: [{ variable: "x", value_selector: ["upstream", "text"] }],
});
code.addOutput("r", "string");
dsl.addNode(code);

// LLM 节点
const llm = new LLMNode("my-llm", {
  title: "智能分析",
  model: { provider: "openai", name: "gpt-4o", mode: "chat", completion_params: {} },
  prompt_template: [{ role: "system", text: "You are helpful." }],
  context: { enabled: false, variable_selector: [] },
  vision: { enabled: false },
});
dsl.addNode(llm);
```

## YAML Patch 系统

使用 YAML patch 文件声明式地修改 DSL。全部 17 种操作见 `examples/patch-all-steps.yml`。

```yaml
description: 我的补丁
steps:
  - set-title: { id: "node-1", value: "新标题" }
  - remove-node: { id: "node-old" }
  - add-edge: { source: "new-node", target: "answer-node" }
```

应用：

```bash
npx tsx src/cli.ts apply examples/patch-all-steps.yml \
  -i input/高考志愿推荐助手.yml \
  -o output/patched.yml
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
