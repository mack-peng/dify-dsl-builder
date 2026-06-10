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
npm run web:dev     # webpack dev server at http://localhost:3000
npm run web:build   # production bundle → dist-web/
```

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
- **`serializer.ts` / `YAMLWriter` / `graph.ts` / `deserializer.ts` / `edge.ts` / `features.ts` / `validator.ts`** — all deleted in the refactor.

### O(1) lookups

| Method | Complexity |
|--------|-----------|
| `dsl.getNode(id)` | O(1) — `Map.get` |
| `dsl.findByType(type)` | O(1) to find set + O(n) to iterate |
| `dsl.getPrevIds(id)` / `dsl.getNextIds(id)` | O(1) — edge adjacency maps |
| `dsl.getNodeEdges(id)` | O(1) per edge list |

## CLI behaviors

- `roundtrip` / `validate` try to shell out to `dify-builder-agent/scripts/validate-dsl.rb` (external sibling repo). Errors are caught and printed, not fatal
- `apply` runs `dsl.validate()` after patching, exits non-zero on validation errors
- Atomic commands (`node set-title`, `edge add`, etc.) modify the file in place

## Input/output conventions

- `input/` and `output/` are gitignored — throwaway fixtures
- `patches/` is tracked — reusable patch files

## References

- `references/dify-dsl-reference.md` — Dify v0.6.0+ schema: all node types, edge rules, variable shapes, pitfalls
- `references/baidu-search-demo.yml` — Baidu AI Search plugin tool node format
