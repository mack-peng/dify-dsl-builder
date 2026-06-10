# Examples

## YAML Patch 示例

`patch-all-steps.yml` — 演示 patch 系统全部 15 种操作步骤，可直接用 `apply` 命令应用到 DSL 文件：

```bash
npx tsx src/cli.ts apply examples/patch-all-steps.yml -i input/高考志愿推荐助手.yml -o output/patched.yml
```

## TypeScript API 示例

`basic-usage.ts` — 演示库的核心 API：

```bash
npx tsx examples/basic-usage.ts
```

## 旧版示例（仅供参考）

- `gaokao_v2.ts` — 旧版 API 的本科/专科路由修改（已弃用）
- `gaokao_v3.ts` — 旧版 API 的完整改造（已弃用）
- `roundtrip.ts` — 旧版 roundtrip 测试（已弃用）
