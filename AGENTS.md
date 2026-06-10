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
npx tsx examples/gaokao_v3.ts          # run an example directly
```

After `npm run build`, the CLI is available as `dify-dsl-cli` (`package.json#bin`).

## Architecture

Reads/manipulates/writes **Dify DSL YAML** (`app.yml` exported from Dify Studio).

- **Entry point**: `DifyDSL` in `src/index.ts` — `load(file)` / `save(file)`
- **Graph**: `src/graph.ts` — `Map<id, AnyNode>` + `Edge[]`. `find()` searches top-level first, then recurses into `IterationNode.children`
- **Nodes**: `src/nodes/` — each has `toYAML()` / `static fromYAML()`. `NODE_TYPE_MAP` in `src/nodes/index.ts` maps type strings → constructors
- **YAML serializer**: Custom `YAMLWriter` (`src/serializer.ts`). Writing does NOT use js-yaml — builds a string line-by-line. js-yaml is for reading only (`src/deserializer.ts`)
- **Patch system**: `src/patch.ts` loads a YAML patch file (`steps:` array) and applies it declaratively — `apply` CLI command + `patches/` directory
- **Validator**: `src/validator.ts` — structural checks (cycles, orphans, handles, refs). Called via `dsl.validate()` or CLI `apply`

## Deserialization (3-pass)

1. Build top-level nodes (skip `iteration-start` and nodes with `parentId`)
2. Wire iteration-start nodes → parent `IterationNode`, attach remaining children
3. Build edges

Iteration children serialize inline with their parent's `toYAML()`.

## CLI behaviors

- `roundtrip` / `validate` try to shell out to `dify-builder-agent/scripts/validate-dsl.rb` (external sibling repo). Errors are caught and printed, not fatal
- `apply` runs `dsl.validate()` after patching, exits non-zero on validation errors
- Atomic commands (`node set-title`, `edge add`, etc.) modify the file in place

## Input/output conventions

- `input/` and `output/` are gitignored — throwaway fixtures
- `patches/` is tracked — reusable patch files

## Serializer pitfalls

### `w.key()` vs `w.keyVal()`

- `w.keyVal(k, v)` — key + value (use for `null` too)
- `w.key(k)` then `w.incIndent()` — key opens a nested block

**Never** use `w.key(k)` without a following `w.incIndent()` — drops the value.

### Value type coercion

| Method | Output |
|--------|--------|
| `w.keyVal(k, v)` | bare YAML (numbers stay numbers) |
| `w.keyQuoted(k, v)` | double-quoted, auto-escapes `\n` `"` |
| `w.keySingleQuoted(k, s)` | single-quoted |
| `w.blockScalar(k, s)` | `\|`/`\|-` for multiline |

Common mistake: converting a number to string then quoting it.

```ts
// BROKEN — `0.8` becomes `value: '0.8'` (string)
w.keySingleQuoted("value", String(v.value));
// CORRECT
if (typeof v.value === "number") w.keyVal("value", v.value);
else w.keySingleQuoted("value", String(v.value));
```

For nullable fields with mixed types, use the `writeParamValue` helper (`tools.ts:7`).

### Verifying roundtrip correctness

```
1. DifyDSL.load(in).save(out)   — no errors
2. ruby scripts/validate-dsl.rb out   — "全部通过"
3. yaml.load(in) ≈ yaml.load(out)   — deep-compare types (number ≠ string)
```

## Validating output

```
ruby scripts/validate-dsl.rb output/xxx.yml
```

Full structural validation: node types, edge rules, cycles, variable references, VA consistency, mode checks.

## References

- `references/dify-dsl-reference.md` — Dify v0.6.0+ schema: all node types, edge rules, variable shapes, pitfalls
- `references/baidu-search-demo.yml` — Baidu AI Search plugin tool node format
