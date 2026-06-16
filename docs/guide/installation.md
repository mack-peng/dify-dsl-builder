# Dify DSL Builder — Installation & API Reference

For AI agents and developers. Covers installation, CLI usage, Library API, YAML Patch system, and node types.

---

## 1. AI Agent Workflow Guide

If you are an AI agent running in Claude Code, OpenCode, Cursor, Codex, or similar tools, follow this workflow.

### 1.1 Setup

```bash
mkdir -p agent && cd agent
npm install @orangemust/dify-dsl-builder
```

Read these references to understand DSL structure and patch authoring:

- `node_modules/@orangemust/dify-dsl-builder/docs/guide/patch.md` — all 17 patch operations
- `node_modules/@orangemust/dify-dsl-builder/references/dify-dsl-reference.md` — Dify DSL schema
- `node_modules/@orangemust/dify-dsl-builder/examples/patch-all-steps.yml` — example patch

### 1.2 Workflow

The user provides two files:

1. **DSL file** — an existing Dify app export `.yml`
2. **Requirements document** — a `.md` file describing desired changes

Your process:

```
1. Inspect DSL  →  npx dify-dsl-cli flow <file>    (topology tree)
                →  npx dify-dsl-cli info <file>    (stats)
                →  npx dify-dsl-cli find <file> <keyword>  (locate nodes)
                →  npx dify-dsl-cli node show <file> <id>  (inspect node)
2. Read requirements → analyze each item
3. Create a technical plan → decide per-item approach
4. Choose execution path:
   ├── Simple change (title/desc/remove) → use atomic commands
   └── Complex change (multi-step/structural) → write YAML patch file
5. Confirm plan with user, then execute
```

### 1.3 Simple Changes: Atomic Commands

Use for single, direct operations:

```bash
# Modify node title
npx dify-dsl-cli node set-title workflow.yml "node-id" "New Title"

# Modify node description
npx dify-dsl-cli node set-desc workflow.yml "node-id" "New description"

# Remove a node (auto-cleans edges)
npx dify-dsl-cli remove workflow.yml "node-id"

# Add / remove edges
npx dify-dsl-cli edge add workflow.yml "source-id" "target-id"
npx dify-dsl-cli edge remove workflow.yml "source-id" "target-id"

# Replace text in LLM prompt
npx dify-dsl-cli node set-prompt workflow.yml "llm-id" "system" "old" "new"
```

### 1.4 Complex Changes: YAML Patch Files

When changes span multiple nodes or involve structural edits, write a patch file:

```yaml
description: "Brief description of changes"
steps:
  - set-title: { id: "node-1", value: "New Title" }
  - set-prompt: { id: "llm-1", role: "system", replace: "old", with: "new" }
  - remove-node: { id: "node-old" }
  - add-code-node:
      id: "new-code"
      title: "New Node"
      code: "def main(): return {}"
  - add-edge: { source: "new-code", target: "answer-node" }
  - env-set: { name: "API_KEY", value: "xxx", type: "string" }
  - conv-set: { name: "user_profile", value_type: "string" }
```

Full operation reference: `docs/guide/patch.md` (17 operations).

After writing:
1. Show the patch to the user for confirmation
2. Execute:

```bash
npx dify-dsl-cli apply patch.yml -i input.yml -o output.yml
```

The `apply` command runs `validate()` automatically. Non-zero exit on errors.

### 1.5 Execution Rules

- **Inspect first**: always run `dify-dsl-cli info` before modifying
- **Atomic commands modify in-place**: suggest user import the result into Dify to verify
- **Patch outputs to new file**: use `-o` to preserve the original
- **Patches are incremental**: describe only modifications, never regenerate the entire DSL
- **When unsure, ask**: consult `dify-dsl-reference.md` or the user before guessing

---

## 2. Installation

### Option A: Global install (recommended for CLI)

```bash
npm install -g @orangemust/dify-dsl-builder
dify-dsl-cli info my-workflow.yml
```

### Option B: npx (no install)

```bash
npx dify-dsl-cli info my-workflow.yml
```

### Option C: Clone for development

```bash
git clone git@github.com:mack-peng/dify-dsl-builder.git
cd dify-dsl-builder
npm ci
npm run build          # tsc → dist/
```

### Option D: Library dependency

```bash
npm install @orangemust/dify-dsl-builder
```

```ts
import { DifyDSL, CodeNode } from "@orangemust/dify-dsl-builder";
```

---

## 3. CLI Commands

```
dify-dsl-cli <command> [options]

Commands:
  flow       <file>              Print workflow topology tree
  info       <file>              Print node/edge stats
  roundtrip  <input> [output]    Parse → save, verify round-trip
  validate   <file>              Run Ruby DSL validator
  apply      <patch> -i <in> -o <out>  Apply YAML patch file
  remove     <file> <id>         Remove a node

Atomic commands (modify file in place):
  node set-title   <file> <id> <title>
  node set-desc    <file> <id> <desc>
  node set-prompt  <file> <id> <role> <replace> <with>
  edge add         <file> <src> <tgt> [handle]
  edge remove      <file> <src> <tgt> [handle]
```

---

## 4. Library API

### 4.1 Core Class: `DifyDSL`

```ts
import * as fs from "fs";
import { DifyDSL } from "@orangemust/dify-dsl-builder";

const yamlStr = fs.readFileSync("app.yml", "utf-8");
const dsl = DifyDSL.parse(yamlStr);
```

Internal 7-step pipeline:

| Step | Method | Output |
|------|--------|--------|
| 1 | `js-yaml.load()` | raw JSON |
| 2 | `NodeIndex.rebuild()` | typed NodeIndex |
| 3 | edges → adjacency maps | O(1) connectivity |
| 4 | CRUD methods | get/add/remove/update |
| 5 | Node instance methods | per-node modifications |
| 6 | `toJSON()` | plain JSON object |
| 7 | `yaml.dump(toJSON())` | YAML string |

### 4.2 CRUD

```ts
// Query (all O(1))
const node = dsl.getNode("node-id");
const allLLMs = dsl.findByType("llm");
const prevIds = dsl.getPrevIds("node-id");
const nextIds = dsl.getNextIds("node-id");

// Add
import { CodeNode } from "@orangemust/dify-dsl-builder";
dsl.addNode(new CodeNode("new-id", { title: "My Code", code: "print(1)" }));
dsl.addEdge("source-id", "target-id");

// Remove (auto-cleans related edges)
dsl.removeNode("old-node-id");
dsl.removeEdge("edge-id");

// Update (get → mutate → synced via index)
dsl.updateNode("node-id", (node) => {
  node.setTitle("New Title");
  node.setDesc("New Description");
});
```

### 4.3 Serialization & Validation

```ts
const json = dsl.toJSON();    // plain object
const yaml = dsl.toYAML();    // yaml.dump string
dsl.save("output.yml");       // toYAML() + writeFileSync

const report = dsl.validate();
// { errors: [{ message: "..." }], warnings: [{ message: "..." }] }
```

Validation checks: Start node exists, Answer node exists (advanced-chat), edge node refs, code output types, env/conv variable schema completeness (`id` + `selector` + value-type match), LLM `context`/`vision` required fields.

### 4.4 Properties Reference

| Property | Type | Description |
|----------|------|-------------|
| `dsl.version` | `string` | DSL version |
| `dsl.app` | `AppMeta` | App metadata (name/mode/description/icon) |
| `dsl.mode` | `string` | `workflow` \| `advanced-chat` |
| `dsl.nodeCount` | `number` | Total node count |
| `dsl.edgeCount` | `number` | Total edge count |
| `dsl.dependencies` | `Dependency[]` | Plugin dependencies |
| `dsl.envVariables` | `unknown[]` | Environment variables |
| `dsl.convVariables` | `unknown[]` | Conversation variables (advanced-chat) |
| `dsl.features` | `Record<string, unknown>` | Feature config |
| `dsl.viewport` | `{x, y, zoom}` | Canvas viewport |
| `dsl.index` | `NodeIndex` | Underlying index (byId/byType/edges) |

### 4.5 NodeIndex

| Method | Returns | Complexity |
|--------|---------|------------|
| `index.getNode(id)` | `Node \| undefined` | O(1) |
| `index.getNodesByType(type)` | `Node[]` | O(1) + O(n) |
| `index.getOutEdges(id)` | `EdgeData[]` | O(1) per edge |
| `index.getInEdges(id)` | `EdgeData[]` | O(1) per edge |
| `index.getPrevIds(id)` | `string[]` | O(1) |
| `index.getNextIds(id)` | `string[]` | O(1) |

### 4.6 BaseNode

All node types extend `BaseNode<T>`:

```ts
abstract class BaseNode<T extends BaseNodeData> {
  id: string;
  type: string;          // "custom" | "custom-iteration-start"
  title: string;
  desc: string;
  position: { x: number; y: number };
  width: number;
  height: number;
  zIndex?: number;
  parentId?: string;     // for iteration children
  isInIteration?: boolean;
  iterationId?: string;
  data: T;               // typed data block

  setTitle(v): this;
  setDesc(v): this;
  setPosition(x, y): this;
  setSize(w, h): this;
  setZIndex(z): this;

  toJSON(): Record<string, unknown>;   // subclass implements
  outerJSON(dataBlock): Record<string, unknown>;
  dataJSON(extra?): Record<string, unknown>;
}
```

---

## 5. Node Types

All nodes follow the pattern: `new XxxNode(id, data?)`. After construction, use `dsl.addNode(node)`.

```ts
import {
  StartNode, AnswerNode, LLMNode, CodeNode,
  KnowledgeNode, IfElseNode, TemplateNode, AggregatorNode,
  IterationNode, IterationStartNode, ToolNode, ClassifierNode,
  HTTPNode, DocNode,
} from "@orangemust/dify-dsl-builder";
```

### 5.1 StartNode

```ts
new StartNode("id-001", {
  title: "Start",
  desc: "Collect user info",
  variables: [
    {
      variable: "user_name",            // referenced as {{#node_id.user_name#}}
      label: "Name",
      type: "text-input",               // text-input | paragraph | select | number | url | files | json | ...
      required: true,
      max_length: 100,
      options: [],
      placeholder: "Enter your name",
    },
  ],
});
```

### 5.2 AnswerNode

```ts
new AnswerNode("id-002", {
  title: "Answer",
  desc: "Output recommendation report",
  answer: "{{#llm-node.text#}}",       // Jinja2 template
  variables: [
    { variable: "llm-node.text", value_selector: ["llm-node", "text"], value_type: "string" },
  ],
});
```

### 5.3 LLMNode

```ts
new LLMNode("id-003", {
  title: "Analysis",
  desc: "Generate recommendations",
  model: {
    provider: "langgenius/deepseek/deepseek",
    name: "deepseek-chat",
    mode: "chat",                      // chat | completion
    completion_params: { temperature: 0.3 },
  },
  prompt_template: [
    { role: "system", text: "You are a college advisor.", id: "prompt-01" },
    { role: "user", text: "Recommend based on this info.", id: "prompt-02" },
  ],
  context: { enabled: false, variable_selector: [] },
  vision: { enabled: false },
  memory: {                            // advanced-chat only
    window: { enabled: true, size: 10 },
    query_prompt_template: "{{#sys.query#}}",
  },
});
```

### 5.4 CodeNode

```ts
new CodeNode("id-004", {
  title: "Process Data",
  desc: "Format results",
  code_language: "python3",            // python3 | javascript
  code: `def main(input: str) -> dict:\n    return {"result": input.upper()}`,
  variables: [
    { variable: "input", value_selector: ["upstream-id", "text"], value_type: "string" },
  ],
  outputs: {
    result: { type: "string", children: null },
  },
});
```

### 5.5 KnowledgeNode

```ts
new KnowledgeNode("id-005", {
  title: "Knowledge Search",
  desc: "Search university programs by score range",
  dataset_ids: ["uuid-of-dataset"],
  query_variable_selector: ["upstream-id", "search_query"],
  retrieval_mode: "multiple",          // single | multiple
  multiple_retrieval_config: {
    top_k: 8,
    score_threshold: 0.5,
    reranking_enable: false,
  },
});
```

### 5.6 IfElseNode

```ts
new IfElseNode("id-006", {
  title: "Score Split",
  desc: ">= 450 routes to undergraduate track",
  cases: [
    {
      case_id: "true",
      id: "true",
      logical_operator: "and",
      conditions: [
        {
          id: "cond-1",
          variable_selector: ["start-id", "score"],
          comparison_operator: "≥",
          value: "450",
          varType: "number",
        },
      ],
    },
  ],
});
```

### 5.7 TemplateNode

```ts
new TemplateNode("id-007", {
  title: "Build Query",
  desc: "Construct search query from current item",
  template: "{{ item }}",
  variables: [
    { variable: "item", value_selector: ["iteration-id", "item"], value_type: "string" },
  ],
});
```

### 5.8 AggregatorNode

```ts
new AggregatorNode("id-008", {
  title: "Merge Results",
  desc: "Merge KB search results from multiple branches",
  output_type: "array",
  variables: [                         // Bare nested arrays, NOT objects
    ["node-1", "result"],
    ["node-2", "result"],
  ],
});
```

### 5.9 IterationNode

```ts
const iter = new IterationNode("iter-001", {
  title: "Iterate Specializations",
  desc: "Search knowledge base per specialization",
  iterator_selector: ["code-node", "majors"],
  iterator_input_type: "array[string]",
  output_selector: ["kb-node", "result"],
  output_type: "array[object]",
  start_node_id: "iter-001-start",     // Must match iteration-start node ID
  is_parallel: true,
  parallel_nums: 3,
  error_handle_mode: "terminated",
  width: 650, height: 250,
});

const iterStart = new IterationStartNode("iter-001", { title: "", desc: "" });
iter.startNode = iterStart;

const child = new TemplateNode("inner-tpl", { template: "{{ item }}", ... });
iter.addChild(child);                  // Auto-sets parentId/isInIteration/iterationId

dsl.addNode(iter);                     // Children added to index automatically
```

### 5.10 ToolNode

```ts
new ToolNode("id-009", {
  title: "Web Search",
  desc: "Baidu AI search",
  tool_name: "smart_search",
  tool_label: "Smart Search",
  plugin_id: "qianfan/baidu_ai_search",
  plugin_unique_identifier: "qianfan/baidu_ai_search:0.0.1@...",
  provider_id: "qianfan/baidu_ai_search/baidu_ai_search",
  provider_type: "builtin",
  is_team_authorization: true,
  tool_node_version: "2",
  paramSchemas: [{
    name: "query", type: "string", form: "llm", required: true,
    label: { en_US: "Search query" },
    human_description: { en_US: "Search query keywords or phrases." },
    auto_generate: null, default: null, max: null, min: null,
    options: [], placeholder: null, precision: null, scope: null, template: null,
  }],
  params: { query: "", model: "", temperature: "", top_p: "", resource_type_filter: "" },
  tool_parameters: {
    query: { type: "mixed", value: "{{#upstream-id.query#}}" },
    temperature: { type: "constant", value: 0.8 },
  },
  tool_configurations: {},
});
```

### 5.11 ClassifierNode

```ts
new ClassifierNode("id-010", {
  title: "Intent Classification",
  desc: "Route based on user intent",
  query_variable_selector: ["sys", "query"],
  model: { provider: "langgenius/deepseek/deepseek", name: "deepseek-chat", mode: "chat", completion_params: { temperature: 0 } },
  classes: [
    { id: "school_recommend", name: "School Recommendation", description: "User wants school or major recommendations" },
    { id: "career_prospect", name: "Career Prospects", description: "User asks about employment rates" },
  ],
  instructions: "",
});
```

### 5.12 HTTPNode

```ts
new HTTPNode("id-http", {
  title: "HTTP Request",
  desc: "Call external API",
  method: "GET",                       // GET | POST | PUT | DELETE | PATCH | HEAD
  url: "https://api.example.com/data",
  authorization: { type: "no-auth" },  // no-auth | api-key | custom
  headers: "",
  params: "",
  body: { type: "none", data: "" },    // none | form-data | x-www-form-urlencoded | raw-text | json
  timeout: { connect: 10, read: 30, write: 30 },
});
```

### 5.13 DocNode

```ts
new DocNode("id-doc", {
  title: "Extract Document",
  desc: "Extract document content from upstream node",
  variable_selector: ["upstream-id", "result"],
  is_array_file: false,
});
```

---

## 6. Node Methods (per-Type)

| Node | Methods |
|------|---------|
| `StartNode` | `addVariable(v)`, `removeVariable(n)`, `updateVariable(n, patch)` |
| `AnswerNode` | `setAnswer(tpl)`, `addVariableRef(id, f)`, `removeVariableRef(id)` |
| `LLMNode` | `setModel(p, n)`, `setTemperature(t)`, `setContextEnabled(b)`, `addPromptMessage(m)`, `setMemory(s)`, `clearMemory()` |
| `CodeNode` | `setCode(lang, code)`, `addVariable(v)`, `removeVariable(n)`, `addOutput(name, type)`, `removeOutput(n)` |
| `KnowledgeNode` | `addDataset(id)`, `removeDataset(id)`, `setQuerySelector(id, f)`, `setTopK(n)` |
| `IfElseNode` | `addCase(c)`, `removeCase(id)`, `updateCondition(caseId, idx, patch)` |
| `TemplateNode` | `setTemplate(tpl)`, `addVariable(v)`, `removeVariable(n)` |
| `AggregatorNode` | `addSource(id, f)`, `removeSource(id)`, `setOutputType(t)` |
| `IterationNode` | `addChild(n)`, `removeChild(id)`, `findChild(id)`, `setIterator(id, f)`, `setOutputSelector(id, f)` |
| `ToolNode` | `setPlugin(id, uid)`, `setToolParam(n, v)`, `setToolConfig(k, v)` |
| `ClassifierNode` | `addClass(c)`, `removeClass(id)`, `setModel(p, n)`, `setInstructions(s)` |
| `HTTPNode` | `setMethod(m)`, `setUrl(u)`, `setBody(type, data)` |
| `DocNode` | `setVariableSelector(id, f)` |

---

## 7. Type Definitions

```ts
interface BaseNodeData {
  type: string;
  title: string;
  desc: string;
  selected: boolean;
}

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

## 8. Usage Patterns

### Load & Inspect

```ts
const dsl = DifyDSL.parse(fs.readFileSync("app.yml", "utf-8"));
console.log(dsl.nodeCount, "nodes,", dsl.edgeCount, "edges");
for (const n of dsl.findByType("llm")) {
  console.log(n.id, n.title);
}
```

### Modify & Save

```ts
const dsl = DifyDSL.parse(yamlStr);

dsl.updateNode("llm-001", (node) => {
  node.setTitle("Updated LLM");
  node.setModel("openai", "gpt-4o");
  node.setTemperature(0.5);
});

fs.writeFileSync("output.yml", dsl.toYAML());
```

### Remove & Rewire

```ts
const toRemove = "old-node-id";
const next = dsl.getNextIds(toRemove);

dsl.removeNode(toRemove);              // Auto-cleans edges
dsl.addEdge("upstream-id", next[0]);   // Rewire: upstream → former downstream
```

### Add a Code Node

```ts
const code = new CodeNode("new-code", {
  title: "Transform Data",
  code: `def main(input: str) -> dict:\n    return {"result": input.upper()}`,
  code_language: "python3",
  variables: [{ variable: "input", value_selector: ["upstream", "text"] }],
});
code.addOutput("result", "string");
code.setPosition(1000, 500);

dsl.addNode(code);
dsl.addEdge("upstream", "new-code");
dsl.addEdge("new-code", "downstream");
```

---

## 9. YAML Patch System

Declaratively modify DSL via YAML patch files. See the full guide at `docs/guide/patch.md` (17 operations) and examples at `examples/patch-all-steps.yml`.

### CLI

```bash
npx dify-dsl-cli apply patch.yml -i input.yml -o output.yml
```

Runs `validate()` automatically. Non-zero exit on errors.

### Programmatic

```ts
import { loadPatch, applyPatch } from "@orangemust/dify-dsl-builder";

const { description, steps } = loadPatch("patch.yml");
const dsl = DifyDSL.parse(yamlStr);
applyPatch(dsl, steps);
dsl.save("output.yml");
```

### Quick Reference (17 operations)

| Operation | Purpose | Key Parameters |
|-----------|---------|----------------|
| `remove-edge` | Delete edge | `source`, `target`, `sourceHandle?` |
| `add-edge` | Add edge | `source`, `target`, `handle?` |
| `remove-node` | Delete node (auto-cleans edges) | `id` |
| `add-code-node` | Create Code node | `id`, `title`, `code`, `code_language?`, `position?`, `variables?`, `outputs?` |
| `add-classifier-class` | Add classifier class | `classifier`, `id`, `name` |
| `set-title` | Modify node title | `id`, `value` |
| `set-desc` | Modify node description | `id`, `value` |
| `set-position` | Modify node position | `id`, `x`, `y` |
| `set-prompt` | Replace LLM prompt text | `id`, `role`, `replace`, `with` |
| `set-answer` | Modify Answer node template | `id`, `answer` |
| `set-code` | Replace Code node code | `id`, `replace`, `with` |
| `set-start-var` | Modify Start node variable | `id`, `variable`, `field`, `value` |
| `env-set` | Set environment variable | `name`, `value`, `type` |
| `env-remove` | Remove environment variable | `name` |
| `conv-set` | Set conversation variable | `name`, `value_type?` |
| `update-condition` | Modify if-else condition | `id`, `case_id`, `field`, `value` |
| `remove-classifier-class` | Remove classifier class | `classifier`, `id` |

_`remove-edge` tries 3 `sourceHandle` values: specified, `"true"`, `"false"` — covering if-else branches._
