# Examples

## YAML Patch 示例

`patch-all-steps.yml` — 演示 patch 系统全部 17 种操作步骤，可直接用 `apply` 命令应用到 DSL 文件：

```bash
npx dify-dsl-cli apply examples/patch-all-steps.yml -i input/高考志愿推荐助手.yml -o output/patched.yml
```

## TypeScript API 示例

`basic-usage.ts` — 演示库的核心 API：

```bash
npx tsx examples/basic-usage.ts
```
