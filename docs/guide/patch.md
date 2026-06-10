# YAML Patch 文件编写指南

通过 YAML patch 文件声明式地修改 Dify DSL，无需写 TypeScript 代码。

---

## 1. 基础结构

```yaml
description: 补丁描述（可选）
steps:
  - <操作名>: { <参数> }
  - <操作名>: { <参数> }
```

- `description` — 可选，描述此补丁的用途
- `steps` — 必填，操作步骤数组，**按顺序执行**

---

## 2. 应用方式

### CLI

```bash
npx tsx src/cli.ts apply <patch.yml> -i <input.yml> -o <output.yml>
```

apply 会在补丁完成后自动调用 `dsl.validate()`，校验失败则退出码非零。

### 编程方式

```ts
import { loadPatch, applyPatch } from "dify-dsl-builder";

const { description, steps } = loadPatch("my-patch.yml");
const dsl = DifyDSL.parse(yamlStr);
applyPatch(dsl, steps);
dsl.save("output.yml");
```

---

## 3. 全部操作类型（17 种）

### 3.1 `remove-edge` — 删除边

按 source / target 匹配删除边。会自动尝试三种 sourceHandle：指定值、`"true"`、`"false"`。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `source` | string | 是 | 源节点 ID |
| `target` | string | 是 | 目标节点 ID |
| `sourceHandle` | string | 否 | 源 handle，默认 `"source"` |

```yaml
- remove-edge:
    source: "1747500000001"
    target: "1747000003001"

- remove-edge:
    source: "if-else-node"
    target: "downstream-node"
    sourceHandle: "true"
```

---

### 3.2 `add-edge` — 添加边

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `source` | string | 是 | 源节点 ID |
| `target` | string | 是 | 目标节点 ID |
| `handle` | string | 否 | sourceHandle，默认 `"source"` |

**边 ID 自动拼接为** `{source}-{handle}-{target}-target`。

```yaml
- add-edge:
    source: "1780889576194"
    target: "1747000003001"

- add-edge:
    source: "if-else-node"
    target: "answer-node"
    handle: "true"
```

---

### 3.3 `remove-node` — 删除节点

删除节点时会自动清理关联的所有边。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 要删除的节点 ID |

```yaml
- remove-node:
    id: "1782000000002"
```

---

### 3.4 `add-code-node` — 新增 Code 节点

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 节点唯一 ID |
| `title` | string | 是 | 节点标题 |
| `desc` | string | 否 | 节点描述 |
| `code` | string | 是 | 代码内容 |
| `code_language` | string | 否 | `"python3"`（默认）或 `"javascript"` |
| `position` | {x, y} | 否 | 画布坐标 |
| `variables` | array | 否 | 输入变量 |
| `outputs` | Record | 否 | 输出定义 |

```yaml
- add-code-node:
    id: "my-code-001"
    title: "示例代码节点"
    desc: "通过 patch 新增"
    code: |
      def main(input: str) -> dict:
          return {"result": input.upper()}
    code_language: python3
    position: { x: 4200, y: 600 }
    variables:
      - { variable: "input", value_selector: ["upstream-id", "text"], value_type: "string" }
    outputs:
      result: { type: "string" }
```

---

### 3.5 `add-classifier-class` — 给分类器新增分类

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `classifier` | string | 是 | ClassifierNode 的 ID |
| `id` | string | 是 | 新分类的 ID |
| `name` | string | 是 | 新分类名称 |

```yaml
- add-classifier-class:
    classifier: "1780889576194"
    id: "undergrad_school"
    name: "本科学校/专业推荐"
```

---

### 3.6 `set-title` — 修改节点标题

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 节点 ID |
| `value` | string | 是 | 新标题 |

```yaml
- set-title:
    id: "1747000006001"
    value: "【已修改】兴趣分析→推荐专业"
```

---

### 3.7 `set-desc` — 修改节点描述

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 节点 ID |
| `value` | string | 是 | 新描述 |

```yaml
- set-desc:
    id: "1747000006001"
    value: "此描述已被 patch 修改"
```

---

### 3.8 `set-position` — 修改节点位置

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 节点 ID |
| `x` | number | 是 | X 坐标 |
| `y` | number | 是 | Y 坐标 |

```yaml
- set-position:
    id: "1780889576194"
    x: 730
    y: 250
```

---

### 3.9 `set-prompt` — 替换 LLM 提示词文本

按 role 匹配消息，执行字符串替换（`String.replace`）。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 是 | LLM 节点 ID |
| `role` | string | 是 | 匹配的消息 role（`"system"` / `"user"` / `"assistant"`） |
| `replace` | string | 是 | 要替换的文本 |
| `with` | string | 是 | 替换后的文本 |
| `replaceAll` | boolean | 否 | 是否替换全部匹配，默认 `false`（只替换第一个） |

```yaml
- set-prompt:
    id: "1747000021001"
    role: "system"
    replace: "你是一位资深高考志愿填报专家"
    with: "你是四川省高考志愿分析助手"
    replaceAll: true
```

---

### 3.10 `set-answer` — 修改 Answer 节点模板

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 是 | Answer 节点 ID |
| `answer` | string | 是 | 新的 Jinja2 模板 |

```yaml
- set-answer:
    id: "1747000024001"
    answer: "{{#ex-code-001.result#}}"
```

---

### 3.11 `set-code` — 替换代码节点中的文本

按子串匹配执行 `String.replace`。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 是 | Code 节点 ID |
| `replace` | string | 是 | 要替换的子串 |
| `with` | string | 是 | 替换后的文本 |
| `replaceAll` | boolean | 否 | 是否替换全部匹配，默认 `false` |

```yaml
- set-code:
    id: "1747000003001"
    replace: "def main"
    with: "# PATCHED\ndef main"
```

---

### 3.12 `set-start-var` — 修改 Start 节点变量字段

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 是 | Start 节点 ID |
| `variable` | string | 是 | 变量名（匹配 `variable` 字段） |
| `field` | string | 是 | 要修改的字段名（如 `"label"`、`"type"`、`"required"` 等） |
| `value` | string | 是 | 新值 |

```yaml
- set-start-var:
    id: "1747000000001"
    variable: "gaokao_score"
    field: "label"
    value: "高考总分（已修改）"
```

---

### 3.13 `env-set` — 设置环境变量

不存在则新增，存在则覆盖。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | 是 | 变量名 |
| `value` | number | 是 | 变量值 |
| `type` | string | 是 | `"string"` 或 `"number"` |

```yaml
- env-set:
    name: "GAOKAO_BENKE_LINE"
    value: 450
    type: "number"
```

---

### 3.14 `env-remove` — 删除环境变量

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | 是 | 变量名 |

```yaml
- env-remove:
    name: "GAOKAO_MIN_VALID"
```

---

### 3.15 `conv-set` — 设置对话变量

（仅 advanced-chat 模式）不存在则新增，存在则覆盖。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | 是 | 变量名 |
| `value_type` | string | 否 | 变量类型，默认 `"string"` |

```yaml
- conv-set:
    name: "user_interest"
    value_type: "string"
```

---

### 3.16 `update-condition` — 修改 if-else 条件 (v1.0.4+)

修改 if-else 或 question-classifier 节点的条件字段。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 是 | if-else 或 classifier 节点 ID |
| `case_id` | string | 是 | case 的 `case_id`（如 `"true"`、`"false"`） |
| `condition_index` | number | 否 | 条件索引，默认 0 |
| `field` | string | 是 | 字段名：`value`、`comparison_operator`、`varType`、`variable_selector.0`（路径点号分隔） |
| `value` | `string\|number` | 是 | 新值 |

```yaml
# 修改分数阈值从 450 改为 420
- update-condition:
    id: "1747500000001"
    case_id: "true"
    field: "value"
    value: 420

# 修改比较运算符
- update-condition:
    id: "1747500000001"
    case_id: "true"
    field: "comparison_operator"
    value: ">"
```

_`field` 支持点号路径（如 `variable_selector.0`），可修改嵌套数组元素。_

---

### 3.17 `remove-classifier-class` — 删除分类器 class (v1.0.4+)

与 `add-classifier-class` 配对，删除不再需要的分类。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `classifier` | string | 是 | ClassifierNode 的 ID |
| `id` | string | 是 | 要删除的 class ID |

```yaml
- remove-classifier-class:
    classifier: "1780889576194"
    id: "undergrad_school"
```

---

## 4. 典型模式

### 删除旧节点并插入新 Code 节点

```yaml
description: 用 Code 节点替换旧模板节点
steps:
  # 记录上下游
  - remove-edge: { source: "prev", target: "old-template" }
  - remove-edge: { source: "old-template", target: "next" }
  - remove-node:  { id: "old-template" }
  # 插入新节点
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

### 批量修改提示词

```yaml
description: 统一修改多个 LLM 节点的 system prompt
steps:
  - set-prompt: { id: "llm-1", role: "system", replace: "旧指令", with: "新指令 v2" }
  - set-prompt: { id: "llm-2", role: "system", replace: "旧指令", with: "新指令 v2" }
  - set-prompt: { id: "llm-3", role: "system", replace: "旧指令", with: "新指令 v2" }
```

---

## 5. 注意事项

- **步骤顺序执行**：上一步的结果会影响下一步（例如先 `remove-node` 再 `add-edge` 引用已删除的节点会失败，因为 `addEdge` 要求两端节点存在）
- **边 ID 自动生成**：`add-edge` 的边 ID 按 `{source}-{handle}-{target}-target` 拼接，`remove-edge` 也用同样规则匹配
- **`remove-edge` 会尝试 3 次**：分别用指定的 sourceHandle、`true`、`false` 删除，适合 if-else 分支
- **`set-prompt` / `set-code` 默认替换第一个匹配项**：内部使用 `String.replace`，如需全局替换请加 `replaceAll: true`（使用 `String.replaceAll`）
- **`remove-edge` 会尝试 3 次**：分别用指定的 sourceHandle、`true`、`false` 删除，适合 if-else 分支
- **`env-set` 的 value 写数字**：即使 type 为 `"string"`，YAML 中也要写为字符串（加引号）
- **`update-condition` 的 field 支持点号路径**：`comparison_operator`、`variable_selector.0` 等嵌套字段
