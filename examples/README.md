# Examples

## YAML Patch 示例

`patch-all-steps.yml` — 演示 patch 系统全部 18 种操作步骤，可直接用 `apply` 命令应用到 DSL 文件：

```bash
npx dify-dsl-cli apply examples/patch-all-steps.yml -i input/高考志愿推荐助手.yml -o output/patched.yml
```

> patch 系统仅适用于有 graph 的 workflow / advanced-chat 应用。

## Completion 应用示例

completion 应用（无 graph，顶层 `model_config`）用 `completion` 子命令：

```bash
# 查看
npx dify-dsl-cli completion show app.yml

# 整体替换 pre_prompt（@file 从文件读）
npx dify-dsl-cli completion set-prompt app.yml @prompt.txt

# 参数与输入变量
npx dify-dsl-cli completion set-max-tokens app.yml 2048
npx dify-dsl-cli completion set-temperature app.yml 0.6
npx dify-dsl-cli completion add-input app.yml user_input "用户输入" true
```

## TypeScript API 示例

`basic-usage.ts` — 演示库的核心 API：

```bash
npx tsx examples/basic-usage.ts
```
