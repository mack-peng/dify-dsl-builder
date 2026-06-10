# Dify DSL Builder — Installation & API Reference

面向 AI Agent / 开发者，描述 `@orangemust/dify-dsl-builder` 库的安装、CLI 用法、核心 API 和 Patch 系统。

---

## 1. 安装

### 方式一：npm 全局安装（推荐用于 CLI）

```bash
npm install -g @orangemust/dify-dsl-builder
dify-dsl-cli info my-workflow.yml
```

### 方式二：npx 按需使用

```bash
npx dify-dsl-cli info my-workflow.yml
```

### 方式三：克隆源码开发

```bash
git clone <repo-url>
cd dify-dsl-builder
npm ci
npm run build          # tsc → dist/
```

### 方式四：作为库依赖

```bash
npm install @orangemust/dify-dsl-builder
```

```ts
import { DifyDSL, CodeNode } from "@orangemust/dify-dsl-builder";
```

---

## 2. 核心类：`DifyDSL`

路径：`src/core/DifyDSL.ts`  
导出：`import { DifyDSL } from "@orangemust/dify-dsl-builder";`

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

## 4. 节点创建

所有节点构造器都用同一模式：`new XxxNode(id, data?)`，其中 `data` 是类型化的 Partial 数据对象。构造后通过 `dsl.addNode(node)` 添加到 DSL。

```ts
import {
  StartNode, AnswerNode, LLMNode, CodeNode,
  KnowledgeNode, IfElseNode, TemplateNode, AggregatorNode,
  IterationNode, IterationStartNode, ToolNode, ClassifierNode,
} from "dify-dsl-builder";
```

### 4.1 `StartNode`

```ts
new StartNode("id-001", {
  title: "开始",
  desc: "收集用户信息",
  variables: [
    {
      variable: "user_name",            // 变量名，在 prompt 中用 {{#node_id.user_name#}} 引用
      label: "姓名",
      type: "text-input",               // text-input | paragraph | select | number | url | files | file | file-list | json | json_object | checkbox
      required: true,
      max_length: 100,                  // 可选
      options: [],                      // select 类型时填选项列表
      placeholder: "请输入姓名",         // 可选
      default: "",                      // 可选
    },
  ],
});
```

### 4.2 `AnswerNode`

```ts
new AnswerNode("id-002", {
  title: "回答",
  desc: "输出推荐报告",
  answer: "{{#llm-node.text#}}",        // Jinja2 模板
  variables: [                          // 必须匹配 answer 中所有引用
    { variable: "llm-node.text", value_selector: ["llm-node", "text"], value_type: "string" },
  ],
});
```

### 4.3 `LLMNode`

```ts
new LLMNode("id-003", {
  title: "智能分析",
  desc: "生成推荐",
  model: {
    provider: "langgenius/deepseek/deepseek",
    name: "deepseek-chat",              // 模型名
    mode: "chat",                       // chat | completion
    completion_params: { temperature: 0.3 },
  },
  prompt_template: [
    { role: "system", text: "你是一位高考志愿专家。", id: "prompt-01" },
    { role: "user", text: "请根据信息推荐。", id: "prompt-02" },
  ],
  context: { enabled: false, variable_selector: [] },
  vision: { enabled: false },
  memory: {                             // advanced-chat 模式可选
    window: { enabled: true, size: 10 },
    query_prompt_template: "{{#sys.query#}}",
  },
  prompt_config: {                      // 可选
    jinja2_variables: [],
  },
});
```

### 4.4 `CodeNode`

```ts
new CodeNode("id-004", {
  title: "处理数据",
  desc: "格式化结果",
  code_language: "python3",             // python3 | javascript
  code: `def main(input: str) -> dict:\n    return {"result": input.upper()}`,
  variables: [
    { variable: "input", value_selector: ["upstream-id", "text"], value_type: "string" },
  ],
  outputs: {                             // 每个输出的类型声明
    result: { type: "string", children: null },
  },
});
```

### 4.5 `KnowledgeNode`

```ts
new KnowledgeNode("id-005", {
  title: "知识库搜索",
  desc: "用分数范围搜索大学专业",
  dataset_ids: ["uuid-of-dataset"],    // 知识库 UUID 数组
  query_variable_selector: ["upstream-id", "search_query"],
  retrieval_mode: "multiple",           // single | multiple
  multiple_retrieval_config: {          // multiple 模式必填
    top_k: 8,
    score_threshold: 0.5,
    reranking_enable: false,
  },
});
```

### 4.6 `IfElseNode`

```ts
new IfElseNode("id-006", {
  title: "分数分流",
  desc: ">=450走本科",
  cases: [
    {
      case_id: "true",
      id: "true",
      logical_operator: "and",
      conditions: [
        {
          id: "cond-1",
          variable_selector: ["start-id", "score"],
          comparison_operator: "≥",     // contains | not contains | start with | end with | is | is not | empty | not empty | = | != | > | < | >= | <= | in | not in | null | not null
          value: "450",
          varType: "number",
        },
      ],
    },
  ],
});
```

### 4.7 `TemplateNode`

```ts
new TemplateNode("id-007", {
  title: "构建查询",
  desc: "用当前 item 构建搜索词",
  template: "{{ item }}",              // Jinja2 模板
  variables: [
    { variable: "item", value_selector: ["iteration-id", "item"], value_type: "string" },
  ],
});
```

### 4.8 `AggregatorNode`

```ts
new AggregatorNode("id-008", {
  title: "合并结果",
  desc: "合并多路 KB 搜索结果",
  output_type: "array",                // 必须匹配所有 source 的输出类型
  variables: [                         // 注意：是裸嵌套数组，非对象列表
    ["node-1", "result"],
    ["node-2", "result"],
  ],
});
```

### 4.9 `IterationNode`

```ts
// 外层迭代容器
const iter = new IterationNode("iter-001", {
  title: "迭代专业搜索",
  desc: "逐专业搜索知识库",
  iterator_selector: ["code-node", "majors"],
  iterator_input_type: "array[string]",
  output_selector: ["kb-node", "result"],
  output_type: "array[object]",
  start_node_id: "iter-001-start",      // 必须和内部 iteration-start 节点 ID 一致
  is_parallel: true,
  parallel_nums: 3,
  error_handle_mode: "terminated",
  width: 650,
  height: 250,
});

// 内部 iteration-start 节点
const iterStart = new IterationStartNode("iter-001", {
  title: "",
  desc: "",
});

// 内部子节点（通过 addChild 添加，自动设置 parentId/isInIteration/iterationId）
import { TemplateNode, KnowledgeNode, CodeNode } from "dify-dsl-builder";
const tpl = new TemplateNode("inner-tpl", { template: "{{ item }}", ... });
const kb = new KnowledgeNode("inner-kb", { dataset_ids: [...], ... });

iter.addChild(tpl);
iter.addChild(kb);
iter.startNode = iterStart;

// 添加到 DSL
dsl.addNode(iter);   // 自动将子节点加入索引
```

### 4.10 `ToolNode`

```ts
new ToolNode("id-009", {
  title: "网络搜索",
  desc: "百度智能搜索",
  tool_name: "smart_search",
  tool_label: "智能搜索生成",
  tool_description: "提供AI增强的智能语义搜索工具",
  plugin_id: "qianfan/baidu_ai_search",
  plugin_unique_identifier: "qianfan/baidu_ai_search:0.0.1@97821ba294ff49a4d7fabb6746bfd7993373e27c2a110efd684865bf21f2ff6e",
  provider_id: "qianfan/baidu_ai_search/baidu_ai_search",
  provider_name: "qianfan/baidu_ai_search/baidu_ai_search",
  provider_type: "builtin",
  provider_icon: "/console/api/workspaces/current/plugin/icon?...",
  is_team_authorization: true,
  tool_node_version: "2",
  paramSchemas: [
    {
      name: "query",
      type: "string",
      form: "llm",
      required: true,
      label: { zh_Hans: "搜索查询", en_US: "Search query" },
      human_description: { zh_Hans: "搜索查询关键词或短语", en_US: "Search query keywords or phrases." },
      llm_description: "",
      auto_generate: null, default: null, max: null, min: null,
      options: [], placeholder: null, precision: null, scope: null, template: null,
    },
  ],
  params: { query: "", model: "", temperature: "", top_p: "", resource_type_filter: "" },
  tool_parameters: {
    query: { type: "mixed", value: "{{#upstream-id.search_query#}}" },
    model: { type: "mixed", value: "" },
    temperature: { type: "constant", value: 0.8 },
    top_p: { type: "constant", value: 0.8 },
    resource_type_filter: { type: "constant", value: '[{"type":"web","top_k":10}]' },
  },
  tool_configurations: {},
});
```

### 4.11 `ClassifierNode`

```ts
new ClassifierNode("id-010", {
  title: "意图分类",
  desc: "路由到专科处理路线",
  query_variable_selector: ["sys", "query"],
  model: { provider: "langgenius/deepseek/deepseek", name: "deepseek-chat", mode: "chat", completion_params: { temperature: 0 } },
  classes: [
    { id: "school_recommend", name: "学校推荐", description: "要求推荐学校或专业" },
    { id: "career_prospect", name: "就业前景", description: "询问就业率" },
  ],
  instructions: "",                     // 可选
});
```

### 4.12 `IterationStartNode`（迭代内部起点）

```ts
new IterationStartNode("parent-iteration-id", {
  title: "",
  desc: "",
});
```

注意：`IterationStartNode` 的 ID 自动由父迭代 ID + `-start` 拼接而成。构造后手动设为 `iter.startNode = iterStart`。

### 4.13 `HTTPNode`

```ts
new HTTPNode("id-http", {
  title: "HTTP 请求",
  desc: "调用外部 API",
  method: "GET",                        // GET | POST | PUT | DELETE | PATCH | HEAD
  url: "https://api.example.com/data",
  authorization: { type: "no-auth" },   // no-auth | api-key | custom
  headers: "",
  params: "",
  body: { type: "none", data: "" },     // none | form-data | x-www-form-urlencoded | raw-text | json
  timeout: { connect: 10, read: 30, write: 30 },
});
```

### 4.14 `DocNode`（文档提取器）

```ts
new DocNode("id-doc", {
  title: "提取文档",
  desc: "从上游节点提取文档内容",
  variable_selector: ["upstream-id", "result"],
  is_array_file: false,                 // 可选
});
```

---

## 5. 各 Node 子类的方法

### 5.1 `StartNode`

```ts
.addVariable({ variable, label, type, required, options, placeholder })
.removeVariable(name)
.updateVariable(name, patch)
.variables   // getter → StartVariable[]
```

### 5.2 `AnswerNode`

```ts
.setAnswer(template)
.addVariableRef(nodeId, field, valueType?)
.removeVariableRef(nodeId)
.answer          // getter
.answerVariables // getter
```

### 5.3 `LLMNode`

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

### 5.4 `CodeNode`

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

### 5.5 `KnowledgeNode`

```ts
.addDataset(id)
.removeDataset(id)
.setQuerySelector(nodeId, field)
.setTopK(n)
```

### 5.6 `IfElseNode`

```ts
.addCase(c)
.removeCase(id)
.updateCondition(caseId, condIdx, patch)
.cases  // getter
```

### 5.7 `TemplateNode`

```ts
.setTemplate(tpl)
.addVariable(v)
.removeVariable(name)
.template  // getter
```

### 5.8 `AggregatorNode`

```ts
.addSource(nodeId, field)
.removeSource(nodeId)
.setOutputType(t)
.sources  // getter
```

### 5.9 `IterationNode`

```ts
.addChild(node)
.removeChild(id)
.findChild(id)
.setIterator(nodeId, field)
.setOutputSelector(nodeId, field)
.children  // IterChildNode[]
.startNode // IterationStartNode | null
```

### 5.10 `ToolNode`

```ts
.setPlugin(pluginId, uniqueId)
.setToolParam(name, { type, value })
.setToolConfig(key, value)
```

### 5.11 `ClassifierNode`

```ts
.addClass({ id, name, description })
.removeClass(id)
.setModel(provider, name)
.setInstructions(s)
```

### 5.12 `HTTPNode`

```ts
.setMethod(method)        // "GET" | "POST" | "PUT" | "DELETE"
.setUrl(url)
.setBody(type, data)
```

### 5.13 `DocNode`

```ts
.setVariableSelector(nodeId, field)
```

---

## 6. 类型定义

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

## 7. 典型使用模式

### 7.1 加载并检查

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

### 7.2 修改节点后输出

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

### 7.3 删除节点并重新接线

```ts
const toRemove = "1782000000002";

// 记录上下游关系（如有需要）
const next = dsl.getNextIds(toRemove);

dsl.removeNode(toRemove);  // 自动清理边

// 重新接线：将原下游接到原上游
dsl.addEdge("1747000003001", next[0]);
```

### 7.4 添加一个 Code 节点

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

---

## 8. YAML Patch 系统（实现需求的首选方式）

使用 YAML patch 文件声明式地修改 DSL，无需写 TypeScript 代码。**实现用户需求时，优先编写 patch 描述文件。**

完整编写指南：`docs/guide/patch.md`  
完整示例：`examples/patch-all-steps.yml`

### 8.1 CLI 应用

```bash
npx tsx src/cli.ts apply <patch.yml> -i <input.yml> -o <output.yml>
```

apply 完成后自动调用 `dsl.validate()`，校验不通过则 exit code 非零。

### 8.2 编程应用

```ts
import { loadPatch, applyPatch } from "dify-dsl-builder";
const { description, steps } = loadPatch("my-patch.yml");
const dsl = DifyDSL.parse(yamlStr);
applyPatch(dsl, steps);
dsl.save("output.yml");
```

### 8.3 全部操作速查（17 种）

| 操作 | 用途 | 关键参数 |
|------|------|----------|
| `remove-edge` | 删除边 | `source`, `target`, `sourceHandle?` |
| `add-edge` | 添加边 | `source`, `target`, `handle?` |
| `remove-node` | 删除节点（自动清理关联边） | `id` |
| `add-code-node` | 新增 Code 节点 | `id`, `title`, `code`, `code_language?`, `position?`, `variables?`, `outputs?` |
| `add-classifier-class` | 给分类器新增分类 | `classifier`, `id`, `name` |
| `set-title` | 修改节点标题 | `id`, `value` |
| `set-desc` | 修改节点描述 | `id`, `value` |
| `set-position` | 修改节点位置 | `id`, `x`, `y` |
| `set-prompt` | 替换 LLM 提示词 | `id`, `role`, `replace`, `with` |
| `set-answer` | 修改 Answer 节点模板 | `id`, `answer` |
| `set-code` | 替换 Code 节点代码 | `id`, `replace`, `with` |
| `set-start-var` | 修改 Start 节点变量字段 | `id`, `variable`, `field`, `value` |
| `env-set` | 设置环境变量 | `name`, `value`, `type` |
| `env-remove` | 删除环境变量 | `name` |
| `conv-set` | 设置对话变量 | `name`, `value_type?` |

_`remove-edge` 会自动尝试 3 种 `sourceHandle`：指定值、`"true"`、`"false"`，方便处理 if-else 分支。_

### 8.4 典型示例

#### 删除节点并插入新 Code 节点

```yaml
description: 用 Code 节点替换旧模板节点
steps:
  - remove-edge: { source: "prev", target: "old-template" }
  - remove-edge: { source: "old-template", target: "next" }
  - remove-node: { id: "old-template" }
  - add-code-node:
      id: "new-code"
      title: "替换节点"
      code: |
        def main(input: str) -> dict:
            return {"result": input}
      position: { x: 2000, y: 500 }
  - add-edge: { source: "prev", target: "new-code" }
  - add-edge: { source: "new-code", target: "next" }
```

#### 批量修改提示词

```yaml
description: 统一修改多个 LLM 节点的 system prompt
steps:
  - set-prompt: { id: "llm-1", role: "system", replace: "旧指令", with: "新指令 v2" }
  - set-prompt: { id: "llm-2", role: "system", replace: "旧指令", with: "新指令 v2" }
```

#### 修改节点文本 + 位置

```yaml
description: 重命名并重排节点
steps:
  - set-title: { id: "llm-analysis", value: "智能分析 v2" }
  - set-desc: { id: "llm-analysis", value: "增强后的分析节点" }
  - set-position: { id: "llm-analysis", x: 1200, y: 300 }
```


