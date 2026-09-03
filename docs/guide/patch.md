# YAML Patch File Guide

Declaratively modify Dify DSL via YAML patch files, without writing TypeScript code.

---

## 1. Basic Structure

```yaml
description: Patch description (optional)
steps:
  - <operation>: { <parameters> }
  - <operation>: { <parameters> }
```

- `description` — Optional, describes the purpose of this patch
- `steps` — Required, array of operation steps, **executed in order**

---

## 2. Application Methods

### CLI

```bash
npx dify-dsl-cli apply <patch.yml> -i <input.yml> -o <output.yml>
```

`apply` automatically calls `dsl.validate()` after the patch is applied. Exits with non-zero code on validation failure.

### Programmatic

```ts
import { loadPatch, applyPatch } from "@orangemust/dify-dsl-builder";

const { description, steps } = loadPatch("my-patch.yml");
const dsl = DifyDSL.parse(yamlStr);
applyPatch(dsl, steps);
dsl.save("output.yml");
```

---

## 3. All Operation Types (18 types)

### 3.1 `remove-edge` — Delete Edge

Deletes an edge by matching source / target. Automatically tries three sourceHandle values: the specified value, `"true"`, `"false"`.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `source` | string | Yes | Source node ID |
| `target` | string | Yes | Target node ID |
| `sourceHandle` | string | No | Source handle, defaults to `"source"` |

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

### 3.2 `add-edge` — Add Edge

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `source` | string | Yes | Source node ID |
| `target` | string | Yes | Target node ID |
| `handle` | string | No | sourceHandle, defaults to `"source"` |

**Edge ID is auto-generated as** `{source}-{handle}-{target}-target`.

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

### 3.3 `remove-node` — Delete Node

Deleting a node automatically cleans up all associated edges.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | ID of the node to delete |

```yaml
- remove-node:
    id: "1782000000002"
```

---

### 3.4 `add-code-node` — Add Code Node

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Unique node ID |
| `title` | string | Yes | Node title |
| `desc` | string | No | Node description |
| `code` | string | Yes | Code content |
| `code_language` | string | No | `"python3"` (default) or `"javascript"` |
| `position` | {x, y} | No | Canvas coordinates |
| `variables` | array | No | Input variables |
| `outputs` | Record | No | Output definitions |

```yaml
- add-code-node:
    id: "my-code-001"
    title: "Example Code Node"
    desc: "Added via patch"
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

### 3.5 `add-llm-node` — Add LLM Node

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Unique node ID |
| `title` | string | Yes | Node title |
| `desc` | string | No | Node description |
| `model` | object | Yes | Model config: `provider`, `name`, `mode` (`"chat"`/`"completion"`), `completion_params` (optional) |
| `prompt_template` | array | Yes | Prompt message list, each with `role` (`"system"`/`"user"`/`"assistant"`), `text`, optional `id` |
| `context` | object | No | Knowledge base context, `{ enabled: boolean, variable_selector: string[] }`, defaults to `{ enabled: false, variable_selector: [] }` |
| `vision` | object | No | Vision input, `{ enabled: boolean }`, defaults to `{ enabled: false }` |
| `memory` | object | No | Conversation memory (advanced-chat mode only), contains `window`, `query_prompt_template`, optional `role_prefix` |
| `prompt_config` | object | No | Jinja2 variable config, `{ jinja2_variables: unknown[] }` |
| `position` | {x, y} | No | Canvas coordinates |

```yaml
- add-llm-node:
    id: "my-llm-001"
    title: "Example LLM Node"
    desc: "LLM node added via patch"
    model:
      provider: "openai"
      name: "gpt-4o-mini"
      mode: "chat"
      completion_params:
        temperature: 0.7
    prompt_template:
      - role: "system"
        text: "You are a helpful assistant."
      - role: "user"
        text: "{{#sys.query#}}"
    context:
      enabled: false
      variable_selector: []
    vision:
      enabled: false
    position: { x: 1000, y: 500 }
```

---

### 3.6 `add-classifier-class` — Add Classifier Class

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `classifier` | string | Yes | ClassifierNode ID |
| `id` | string | Yes | New class ID |
| `name` | string | Yes | New class name |

```yaml
- add-classifier-class:
    classifier: "1780889576194"
    id: "undergrad_school"
    name: "Undergraduate School/Major Recommendation"
```

---

### 3.7 `set-title` — Modify Node Title

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Node ID |
| `value` | string | Yes | New title |

```yaml
- set-title:
    id: "1747000006001"
    value: "[Modified] Interest Analysis → Major Recommendation"
```

---

### 3.8 `set-desc` — Modify Node Description

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Node ID |
| `value` | string | Yes | New description |

```yaml
- set-desc:
    id: "1747000006001"
    value: "This description has been modified by patch"
```

---

### 3.9 `set-position` — Modify Node Position

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Node ID |
| `x` | number | Yes | X coordinate |
| `y` | number | Yes | Y coordinate |

```yaml
- set-position:
    id: "1780889576194"
    x: 730
    y: 250
```

---

### 3.10 `set-prompt` — Replace LLM Prompt Text

Matches messages by role, performs string replacement (`String.replace`).

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | LLM node ID |
| `role` | string | Yes | Message role to match (`"system"` / `"user"` / `"assistant"`) |
| `replace` | string | Yes | Text to replace |
| `with` | string | Yes | Replacement text |
| `replaceAll` | boolean | No | Replace all matches, defaults to `false` (replaces first only) |

```yaml
- set-prompt:
    id: "1747000021001"
    role: "system"
    replace: "You are a senior college admissions expert"
    with: "You are a Sichuan province college admissions assistant"
    replaceAll: true
```

---

### 3.11 `set-answer` — Modify Answer Node Template

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Answer node ID |
| `answer` | string | Yes | New Jinja2 template |

```yaml
- set-answer:
    id: "1747000024001"
    answer: "{{#ex-code-001.result#}}"
```

---

### 3.12 `set-code` — Replace Text in Code Node

Performs `String.replace` by substring matching.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Code node ID |
| `replace` | string | Yes | Substring to replace |
| `with` | string | Yes | Replacement text |
| `replaceAll` | boolean | No | Replace all matches, defaults to `false` |

```yaml
- set-code:
    id: "1747000003001"
    replace: "def main"
    with: "# PATCHED\ndef main"
```

---

### 3.13 `set-start-var` — Modify Start Node Variable Field

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Start node ID |
| `variable` | string | Yes | Variable name (matches `variable` field) |
| `field` | string | Yes | Field to modify (e.g. `"label"`, `"type"`, `"required"`) |
| `value` | string | Yes | New value |

```yaml
- set-start-var:
    id: "1747000000001"
    variable: "gaokao_score"
    field: "label"
    value: "Total Score (Modified)"
```

---

### 3.14 `env-set` — Set Environment Variable

Creates if not exists, overwrites if exists.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | Yes | Variable name |
| `value` | number | Yes | Variable value |
| `type` | string | Yes | `"string"` or `"number"` |

```yaml
- env-set:
    name: "PASSING_SCORE_LINE"
    value: 450
    type: "number"
```

---

### 3.15 `env-remove` — Remove Environment Variable

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | Yes | Variable name |

```yaml
- env-remove:
    name: "MIN_VALID_SCORE"
```

---

### 3.16 `conv-set` — Set Conversation Variable

(advanced-chat mode only) Creates if not exists, overwrites if exists.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | Yes | Variable name |
| `value_type` | string | No | Variable type, defaults to `"string"` |

```yaml
- conv-set:
    name: "user_interest"
    value_type: "string"
```

---

### 3.17 `update-condition` — Modify IF/ELSE Condition (v1.0.4+)

Modifies condition fields of if-else or question-classifier nodes.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | if-else or classifier node ID |
| `case_id` | string | Yes | Case's `case_id` (e.g. `"true"`, `"false"`) |
| `condition_index` | number | No | Condition index, defaults to 0 |
| `field` | string | Yes | Field name: `value`, `comparison_operator`, `varType`, `variable_selector.0` (dot-separated path) |
| `value` | `string\|number` | Yes | New value |

```yaml
# Change score threshold from 450 to 420
- update-condition:
    id: "1747500000001"
    case_id: "true"
    field: "value"
    value: 420

# Change comparison operator
- update-condition:
    id: "1747500000001"
    case_id: "true"
    field: "comparison_operator"
    value: ">"
```

_`field` supports dot-separated paths (e.g. `variable_selector.0`) for modifying nested array elements._

---

### 3.18 `remove-classifier-class` — Remove Classifier Class (v1.0.4+)

Pairs with `add-classifier-class` to remove classes no longer needed.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `classifier` | string | Yes | ClassifierNode ID |
| `id` | string | Yes | Class ID to remove |

```yaml
- remove-classifier-class:
    classifier: "1780889576194"
    id: "undergrad_school"
```

---

## 4. Common Patterns

### Delete Old Node and Insert New Code Node

```yaml
description: Replace old template node with a Code node
steps:
  # Record upstream/downstream
  - remove-edge: { source: "prev", target: "old-template" }
  - remove-edge: { source: "old-template", target: "next" }
  - remove-node:  { id: "old-template" }
  # Insert new node
  - add-code-node:
      id: "new-code"
      title: "Replacement Node"
      code: |
        def main(input: str) -> dict:
            return {"result": input}
      position: { x: 2000, y: 500 }
  - add-edge: { source: "prev", target: "new-code" }
  - add-edge: { source: "new-code", target: "next" }
```

### Batch Modify Prompts

```yaml
description: Update system prompts across multiple LLM nodes
steps:
  - set-prompt: { id: "llm-1", role: "system", replace: "Old instruction", with: "New instruction v2" }
  - set-prompt: { id: "llm-2", role: "system", replace: "Old instruction", with: "New instruction v2" }
  - set-prompt: { id: "llm-3", role: "system", replace: "Old instruction", with: "New instruction v2" }
```

---

## 5. Notes

- **Steps execute in order**: the result of a previous step affects the next (e.g. `remove-node` then `add-edge` referencing the deleted node will fail because `addEdge` requires both endpoints to exist)
- **Edge IDs are auto-generated**: `add-edge` generates IDs as `{source}-{handle}-{target}-target`; `remove-edge` uses the same convention for matching
- **`remove-edge` tries 3 times**: attempts deletion with the specified sourceHandle, then `"true"`, then `"false"` — suitable for if-else branches
- **`set-prompt` / `set-code` default to replacing the first match**: internally uses `String.replace`; add `replaceAll: true` for global replacement (uses `String.replaceAll`)
- **`env-set` value should be a number**: even when type is `"string"`, write the value as a string in YAML (add quotes)
- **`update-condition` field supports dot-separated paths**: for nested fields like `comparison_operator`, `variable_selector.0`

---

## 6. Completion Apps (Patch Not Supported)

The YAML patch system targets **workflow / advanced-chat apps with a graph** (all operations are node/edge/environment variable based). **Completion apps (no workflow, top-level `model_config`) cannot use `apply`** — `loadPatch`/`applyPatch` will fail because no nodes can be found.

For completion apps, use the `completion` subcommands or `DifyDSL` completion methods instead (see `docs/guide/installation.md` §1.2.1, §4.3.1):

```bash
# Replacement for set-prompt
npx dify-dsl-cli completion set-prompt app.yml @prompt.txt
npx dify-dsl-cli completion replace app.yml "old text" "new text"

# Replacement for env-set / conv-set (completion uses model.completion_params)
npx dify-dsl-cli completion set-param app.yml temperature 0.6
npx dify-dsl-cli completion set-max-tokens app.yml 2048

# Input variables
npx dify-dsl-cli completion add-input app.yml user_input "User Input" true
npx dify-dsl-cli completion remove-input app.yml old_var
```

To determine app type: `npx dify-dsl-cli info <file>` — `Mode: completion` means no graph (completion app).
