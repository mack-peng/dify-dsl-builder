# AGENTS.md

## Build & check

```
npm run build      # tsc → dist/
npm run typecheck  # tsc --noEmit (no build output)
```

No linter, formatter, tests, or CI.

## Running the CLI

```
npm run run src/cli.ts <command> ...   # tsx, no build required
```

After `npm run build`, the CLI is available as `dify-dsl-cli` (`package.json#bin`).

## Web debug page

```
npm run web:dev     # webpack dev server at http://localhost:8300
npm run web:build   # production bundle → dist-web/
```

`tsconfig.web.json` extends `tsconfig.json` with `module: "ESNext"`, `moduleResolution: "bundler"`, `jsx: "react-jsx"`, and `lib: ["DOM"]`.

The dev server hardcodes `/api/load` to read `input/高考志愿推荐助手.yml` and `/api/save` to write `output/web-output.yml`. Both paths are relative to the project root, not configurable.

## Architecture

Reads/manipulates/writes **Dify DSL YAML** (`app.yml` exported from Dify Studio).

### 7-step pipeline

```
① parse(yamlStr)   → raw JSON (js-yaml.load)
② index()          → NodeIndex (typed nodes + edges)
③ (implicit)       → edges provide connectivity
④ CRUD             → getNode / addNode / removeNode / updateNode
⑤ Node.methods()   → instance modifications
⑥ toJSON()         → Dify DSL JSON plain object
⑦ toYAML()         → yaml.dump(json, {...})
```

### Core files

- **`core/DifyDSL.ts`** — main class: `DifyDSL.parse()`, CRUD, `toJSON()`, `toYAML()`
- **`core/NodeIndex.ts`** — O(1) index: `Map<id, Node>`, `Map<type, Set<id>>`, edge adjacency maps
- **`core/types.ts`** — shared types: `DifyDSLJSON`, `EdgeData`, `Viewport`
- **`nodes/base.ts`** — `BaseNode<T>` with `outerJSON()` / `dataJSON()` helpers
- **`nodes/`** — each node type has `toJSON()` + typed modification methods + `static fromYAML()`
- **`patch.ts`** — YAML patch file loader and applier

### Key design decisions

- **No `previous`/`next` on nodes** — connectivity is in `NodeIndex.outEdges` / `inEdges`, queried via `dsl.getPrevIds(id)` / `dsl.getNextIds(id)`. Deleting a node auto-removes related edges.
- **`toJSON()` not `toYAML()`** — each node produces a plain JSON object; final YAML is `yaml.dump(toJSON())`, no hand-written string builder.
- **Two-pass node building** in `DifyDSL.parse()`: pass 1 builds top-level nodes, pass 2 wires iteration-start + children (`parentId` nodes) to their parent `IterationNode`. Iteration children are tracked in `NodeIndex.byParent`.
- **Edge IDs** follow convention: `{source}-{sourceHandle}-{target}-target`

### O(1) lookups

| Method | Complexity |
|--------|-----------|
| `dsl.getNode(id)` | O(1) — `Map.get` |
| `dsl.findByType(type)` | O(1) to find set + O(n) to iterate |
| `dsl.getPrevIds(id)` / `dsl.getNextIds(id)` | O(1) — edge adjacency maps |
| `dsl.getNodeEdges(id)` | O(1) per edge list |

- **Two different type files**: `src/types/common.ts` (internal node data types — `BaseNodeData`, `NodeVariable`, etc.) and `src/core/types.ts` (DSL-level JSON shape types — `DifyDSLJSON`, `EdgeData`, etc.). Don't confuse them.

## CLI behaviors

- `roundtrip` / `validate` shell out to Ruby to run `scripts/validate-dsl.rb` from the current package. Errors are caught and printed, not fatal. Requires Ruby runtime.
- `apply` runs `dsl.validate()` after patching, exits non-zero on validation errors. Returns `ValidationReport` with structured `Diagnostic[]` arrays (`severity`, `code`, `nodeId?`, `edgeId?`, `message`). Validate checks: Start/Answer node existence, edge node refs, code output types, env/conv variable schema completeness (`id`+`selector`+value-type match), LLM `context`/`vision` required fields, if-else env/conv variable references.
- Atomic commands (`node set-title`, `edge add`, etc.) modify the file in place

## Input/output conventions

- `input/` and `output/` are gitignored — throwaway fixtures
- `patches/` is also gitignored — reusable patch files live in `examples/`

## Completion app support

`DifyDSL` 同时支持 **workflow/advanced-chat**（有 `graph`）与 **completion**（顶层 `model_config`，无 workflow）两类 DSL：

- `parse()` 检测 `model_config && !workflow` → 走 completion 分支，`completionConfig` 持有原始 model_config，索引为空
- `toJSON()` 对 completion 原样输出 `model_config`（无 `workflow` 字段）
- `isCompletion` getter 区分模式；completion 专属方法：`getPrePrompt` / `setPrePrompt` / `replacePrePrompt` / `getCompletionModel` / `setCompletionParam` / `getInputForm` / `addInputVariable` / `removeInputVariable` / `setInputLabel`
- `validate()` 对 completion 走 `checkCompletionConfig`（校验 pre_prompt / model / user_input_form），不跑图校验
- CLI 提供 `completion show|set-prompt|replace|set-param|remove-param|set-model|set-max-tokens|set-temperature|add-input|remove-input|set-label` 子命令；`info`/`find`/`diff`/`roundtrip`/`validate` 自动兼容两种模式
- `scripts/validate-dsl.rb` 对 completion 跳过所有图检查，改为校验 model_config

新增 completion 能力时注意：`CompletionInputFormItem["text-input"]` 是嵌套结构（variable/label 在 text-input 内部），`getInputVariable` 返回内层条目。

## References

- `references/dify-dsl-reference.md` — Dify v0.6.0+ schema: all node types, edge rules, variable shapes, pitfalls
- `references/baidu-search-demo.yml` — Baidu AI Search plugin tool node format
