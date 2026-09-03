# Examples

## YAML Patch Examples

`patch-all-steps.yml` — demonstrates all 18 patch system operations, can be applied directly to a DSL file using the `apply` command:

```bash
npx dify-dsl-cli apply examples/patch-all-steps.yml -i input/college-advisor.yml -o output/patched.yml
```

> The patch system only works with workflow / advanced-chat apps that have a graph.

## Completion App Examples

Completion apps (no graph, top-level `model_config`) use the `completion` subcommands:

```bash
# View config
npx dify-dsl-cli completion show app.yml

# Replace entire pre_prompt (@file reads from file)
npx dify-dsl-cli completion set-prompt app.yml @prompt.txt

# Parameters and input variables
npx dify-dsl-cli completion set-max-tokens app.yml 2048
npx dify-dsl-cli completion set-temperature app.yml 0.6
npx dify-dsl-cli completion add-input app.yml user_input "User Input" true
```

## TypeScript API Examples

`basic-usage.ts` — demonstrates the core library API:

```bash
npx tsx examples/basic-usage.ts
```
