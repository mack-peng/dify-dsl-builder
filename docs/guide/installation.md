# Dify DSL Builder — Installation & API Reference

面向 AI Agent / 开发者，描述 `dify-dsl-builder` 库的安装、核心 API 和用法。

---

## 1. 安装

```bash
git clone <repo-url>
cd dify-dsl-builder
npm ci
npm run build          # tsc → dist/
npm run web:dev        # (可选) 启动 webpack dev server :3000
```

CLI 命令：

```bash
npm run run src/cli.ts info input/高考志愿推荐助手.yml
npm run run src/cli.ts roundtrip input/高考志愿推荐助手.yml output/roundtrip.yml
```

---

## 2. 核心类：`DifyDSL`

路径：`src/core/DifyDSL.ts`  
导出：`import { DifyDSL } from "dify-dsl-builder";`

### 2.1 解析

```ts
import * as fs from "fs";
import { DifyDSL } from "dify-dsl-builder";

const yamlStr = fs.readFileSync("input/app.yml", "utf-8");
const dsl = DifyDSL.parse(yamlStr);
```

内部自动执行 7 步管线：

| 步骤 | 方法 | 产出 |
|------|------|------|
| ① | `js-yaml.load()` | raw JSON |
| ② | `NodeIndex.rebuild()` | typed `NodeIndex` |
| ③ | edges → adjacency maps | O(1) 连通性查询 |
| ④ | CRUD methods | get/add/remove/update |
| ⑤ | Node instance methods | 节点细节修改 |
| ⑥ | `toJSON()` | Dify DSL JSON plain object |
| ⑦ | `yaml.dump(toJSON())` | YAML 字符串 |

### 2.2 CRUD — 增删改查

```ts
// 查 (全部 O(1))
const node = dsl.getNode("1747000000001");
const allLLMs = dsl.findByType("llm");
const start = dsl.findStart("1747000000001");

// 上下游
const prev = dsl.getPrevIds("1747000006001");  // → ["1780889576194"]
const next = dsl.getNextIds("1747000006001");  // → ["1782000000003", "1787000000001"]

// 增
import { CodeNode } from "dify-dsl-builder";
dsl.addNode(new CodeNode("new-node", { title: "My Code", code: "print(1)" }));
dsl.addEdge("source-id", "target-id");

// 删（自动清理相关边）
dsl.removeNode("old-node-id");
dsl.removeEdge("edge-id");

// 改
dsl.updateNode("node-id", (node) => {
  node.setTitle("新标题");
  node.setDesc("新描述");
});
```

### 2.3 序列化

```ts
const json = dsl.toJSON();
// {
//   version: "0.5.0",
//   kind: "app",
//   app: { name: "...", mode: "advanced-chat", ... },
//   workflow: { graph: { nodes: [...], edges: [...] }, ... }
// }

const yaml = dsl.toYAML();
// yaml.dump(json, { lineWidth: -1, noRefs: true, quotingType: "'" })
```

### 2.4 验证

```ts
const report = dsl.validate();
// { errors: [{ message: "..." }], warnings: [{ message: "..." }] }
```

检查项：Start 节点存在、Answer 节点存在（advanced-chat 模式）、边引用有效节点、Code 输出类型合法。

### 2.5 文件快捷操作

```ts
dsl.save("output.yml");  // toYAML() + writeFileSync
```

---

## 3. 属性 / 方法速查

### 3.1 `DifyDSL`

| 属性/方法 | 类型 | 说明 |
|-----------|------|------|
| `dsl.version` | `string` | DSL 版本号 |
| `dsl.app` | `AppMeta` | 应用元信息 (name/mode/description/icon) |
| `dsl.dependencies` | `Dependency[]` | 插件依赖 |
| `dsl.features` | `Record<string, unknown>` | 功能配置 |
| `dsl.viewport` | `{x, y, zoom}` | 画布视口 |
| `dsl.envVariables` | `unknown[]` | 环境变量 |
| `dsl.convVariables` | `unknown[]` | 对话变量 (advanced-chat) |
| `dsl.index` | `NodeIndex` | 底层索引 (byId/byType/edges) |
| `dsl.nodeCount` | `number` | 节点总数 |
| `dsl.edgeCount` | `number` | 边总数 |
| `dsl.mode` | `string` | `workflow` \| `advanced-chat` |

### 3.2 `NodeIndex`

| 方法 | 返回 | 复杂度 |
|------|------|--------|
| `index.byId.get(id)` | `Node \| undefined` | O(1) |
| `index.byType.get(type)` | `Set<string> \| undefined` | O(1) |
| `index.getNode(id)` | `Node \| undefined` | O(1) |
| `index.getNodesByType(type)` | `Node[]` | O(1) + O(n) |
| `index.getOutEdges(id)` | `EdgeData[]` | O(1) per edge |
| `index.getInEdges(id)` | `EdgeData[]` | O(1) per edge |
| `index.getPrevIds(id)` | `string[]` | O(1) |
| `index.getNextIds(id)` | `string[]` | O(1) |

### 3.3 `BaseNode` — 所有节点基类

```ts
abstract class BaseNode<T extends NodeData> {
  id: string;
  type: string;          // 外层类型 "custom" | "custom-iteration-start"
  title: string;         // getter + setter
  desc: string;          // getter + setter
  position: { x, y };
  width: number;
  height: number;
  zIndex?: number;
  parentId?: string;     // iteration 子节点
  isInIteration?: boolean;
  iterationId?: string;
  data: T;               // 类型化数据

  setTitle(v): this;
  setDesc(v): this;
  setPosition(x, y): this;
  setSize(w, h): this;
  setZIndex(z): this;

  toJSON(): Record<string, unknown>;   // 子类实现
  outerJSON(dataBlock): Record<string, unknown>;   // 生成外层壳
  dataJSON(extra?): Record<string, unknown>;        // 生成 data 块
}
```

---

## 4. 各 Node 子类的方法

### 4.1 `StartNode`

```ts
.addVariable({ variable, label, type, required, options, placeholder })
.removeVariable(name)
.updateVariable(name, patch)
.variables   // getter → StartVariable[]
```

### 4.2 `AnswerNode`

```ts
.setAnswer(template)
.addVariableRef(nodeId, field, valueType?)
.removeVariableRef(nodeId)
.answer          // getter
.answerVariables // getter
```

### 4.3 `LLMNode`

```ts
.setModel(provider, name)
.setTemperature(n)
.setContextEnabled(bool)
.setContextSelector(nodeId, field)
.addPromptMessage({ role, text, id? })
.setMemory(windowSize)
.clearMemory()
.promptMessages  // getter
.modelConfig     // getter
.hasMemory       // boolean
```

### 4.4 `CodeNode`

```ts
.setCode(lang, code)
.addVariable(v)
.removeVariable(name)
.addOutput(name, type)
.removeOutput(name)
.code          // getter
.codeLanguage  // getter
.inputVariables // getter
.outputDefs    // getter
```

### 4.5 `KnowledgeNode`

```ts
.addDataset(id)
.removeDataset(id)
.setQuerySelector(nodeId, field)
.setTopK(n)
```

### 4.6 `IfElseNode`

```ts
.addCase(c)
.removeCase(id)
.updateCondition(caseId, condIdx, patch)
.cases  // getter
```

### 4.7 `TemplateNode`

```ts
.setTemplate(tpl)
.addVariable(v)
.removeVariable(name)
.template  // getter
```

### 4.8 `AggregatorNode`

```ts
.addSource(nodeId, field)
.removeSource(nodeId)
.setOutputType(t)
.sources  // getter
```

### 4.9 `IterationNode`

```ts
.addChild(node)
.removeChild(id)
.findChild(id)
.setIterator(nodeId, field)
.setOutputSelector(nodeId, field)
.children  // IterChildNode[]
.startNode // IterationStartNode | null
```

### 4.10 `ToolNode`

```ts
.setPlugin(pluginId, uniqueId)
.setToolParam(name, { type, value })
.setToolConfig(key, value)
```

### 4.11 `ClassifierNode`

```ts
.addClass({ id, name, description })
.removeClass(id)
.setModel(provider, name)
.setInstructions(s)
```

---

## 5. 类型定义

### `NodeData` — 所有节点 data 块基类

```ts
interface NodeData {
  type: string;
  title: string;
  desc: string;
  selected: boolean;
}
```

### `EdgeData`

```ts
interface EdgeData {
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
```

### `DifyDSLJSON`

```ts
interface DifyDSLJSON {
  version: string;
  kind: "app";
  app: AppMeta;
  dependencies: Dependency[];
  workflow: WorkflowData;
}
```

### `AppMeta`

```ts
interface AppMeta {
  name: string;
  mode: "workflow" | "advanced-chat";
  description: string;
  icon: string;
  icon_background: string;
  use_icon_as_answer_icon: boolean;
}
```

---

## 6. 典型使用模式

### 6.1 加载并检查

```ts
const dsl = DifyDSL.parse(fs.readFileSync("app.yml", "utf-8"));
console.log(dsl.nodeCount, "nodes,", dsl.edgeCount, "edges");
console.log(dsl.findByType("llm").length, "LLM nodes");
console.log(dsl.findByType("tool").length, "tool nodes");

// 检查连通性
const id = "1747000006001";
console.log("上游:", dsl.getPrevIds(id));
console.log("下游:", dsl.getNextIds(id));
```

### 6.2 修改节点后输出

```ts
const dsl = DifyDSL.parse(yamlStr);

dsl.updateNode("1747000006001", (node) => {
  node.setTitle("修改后的 LLM");
  node.setModel("openai", "gpt-4o");
  node.setTemperature(0.5);
});

const outYaml = dsl.toYAML();
fs.writeFileSync("output.yml", outYaml);
```

### 6.3 删除节点并重新接线

```ts
const toRemove = "1782000000002";

// 记录上下游关系（如有需要）
const next = dsl.getNextIds(toRemove);

dsl.removeNode(toRemove);  // 自动清理边

// 重新接线：将原下游接到原上游
dsl.addEdge("1747000003001", next[0]);
```

### 6.4 添加一个 Code 节点

```ts
import { CodeNode } from "dify-dsl-builder";

const code = new CodeNode("my-new-code", {
  title: "处理数据",
  code: `def main(input: str) -> dict:\n    return {"result": input.upper()}`,
  code_language: "python3",
  variables: [{ variable: "input", value_selector: ["upstream-id", "output"] }],
});
code.addOutput("result", "string");
code.setPosition(1000, 500);

dsl.addNode(code);
dsl.addEdge("upstream-id", "my-new-code");
dsl.addEdge("my-new-code", "next-node-id", "source");
```
