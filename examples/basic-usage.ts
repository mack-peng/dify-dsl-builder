/**
 * Dify DSL Builder — basic API usage example
 *
 * Run:  npx tsx examples/basic-usage.ts
 */
import * as fs from "fs";
import { DifyDSL, CodeNode } from "../src/index";

function main() {
  // ═══ 1. Parse YAML ═══
  const yamlStr = fs.readFileSync("input/高考志愿推荐助手.yml", "utf-8");
  const dsl = DifyDSL.parse(yamlStr);
  console.log(`Parsed: ${dsl.nodeCount} nodes, ${dsl.edgeCount} edges`);
  console.log(`Mode: ${dsl.mode}`);

  // ═══ 2. O(1) lookups ═══
  const start = dsl.getNode("1747000000001")!;
  console.log(`\nStart node: "${start.title}" (${start.id})`);

  const allLLMs = dsl.findByType("llm");
  console.log(`LLM nodes: ${allLLMs.length}`);

  const allCodes = dsl.findByType("code");
  console.log(`Code nodes: ${allCodes.length}`);

  // ═══ 3. Connectivity ═══
  const id = "1747000006001"; // an LLM node
  console.log(`\nConnectivity for node ${id}:`);
  console.log(`  Prev (upstream):   ${dsl.getPrevIds(id).join(", ")}`);
  console.log(`  Next (downstream): ${dsl.getNextIds(id).join(", ")}`);

  // ═══ 4. Node modification ═══
  dsl.updateNode("1747000006001", (node) => {
    node.setTitle("【已修改】兴趣分析→推荐专业");
    node.setDesc("修改后的描述");
  });

  const modified = dsl.getNode("1747000006001")!;
  console.log(`\nModified node title: "${modified.title}"`);

  // ═══ 5. Add a new Code node ═══
  const newCode = new CodeNode("example-new-node", {
    title: "示例代码节点",
    desc: "通过 API 新增的代码节点",
    code: `def main(input: str) -> dict:\n    return {"result": input.upper()}`,
    code_language: "python3",
    variables: [
      { variable: "input", value_selector: ["1747000000001", "gaokao_score"] },
    ],
  });
  newCode.addOutput("result", "string");
  newCode.setPosition(500, 500);

  dsl.addNode(newCode);
  console.log(`\nAdded new code node: ${newCode.id}`);

  // Edge: connect start → new code → downstream
  dsl.addEdge("1747000000001", newCode.id);
  dsl.addEdge(newCode.id, "1747000006001");
  console.log(`Edges after add: ${dsl.edgeCount}`);

  // ═══ 6. Remove a node (auto-cleans edges) ═══
  const toRemove = "1782000000002"; // a formatting code node
  console.log(`\nRemoving node ${toRemove}...`);
  console.log(`  Before: ${dsl.nodeCount} nodes, ${dsl.edgeCount} edges`);
  dsl.removeNode(toRemove);
  console.log(`  After:  ${dsl.nodeCount} nodes, ${dsl.edgeCount} edges`);

  // ═══ 7. Validate ═══
  const report = dsl.validate();
  console.log(`\nValidation: ${report.errors.length} errors, ${report.warnings.length} warnings`);
  report.errors.forEach((e) => console.log(`  ERROR: ${e.message}`));
  report.warnings.forEach((w) => console.log(`  WARN: ${w.message}`));

  // ═══ 8. Serialize ═══
  const json = dsl.toJSON();
  console.log(`\nJSON output: ${json.workflow.graph.nodes.length} nodes, ${json.workflow.graph.edges.length} edges`);

  const yaml = dsl.toYAML();
  fs.writeFileSync("output/example-output.yml", yaml, "utf-8");
  console.log(`YAML saved to output/example-output.yml (${yaml.length} chars)`);
}

main();
