import { DifyDSL, CodeNode, Edge, AnswerNode, StartNode } from "../src";

async function main() {
  const dsl = DifyDSL.load("../input/高考志愿推荐助手.yml");
  console.log(`Loaded: ${dsl.graph.nodeCount} nodes, ${dsl.graph.edgeCount} edges, mode=${dsl.mode}`);

  // ─── 删除废弃节点 ───
  dsl.graph.remove("1747500000001");  // 分数分流 IF
  dsl.graph.remove("1780889721649");  // 专科分数检查 IF
  dsl.graph.remove("1780889576193");  // 分数异常 LLM
  console.log(`After remove: ${dsl.graph.nodeCount} nodes, ${dsl.graph.edgeCount} edges`);

  // ─── 新增输出选择器 ───
  const selector = new CodeNode("1790000000200", {
    title: "输出选择器",
    desc: "按优先级互斥选择输出内容：错误>分数异常>本科>专科",
    code: [
      "def main(error_msg: str, undergrad_tip: str, undergrad_text: str, zhuan_ke_output: str) -> dict:",
      "    if error_msg and error_msg.strip():",
      '        return {"answer": error_msg}',
      "    parts = []",
      "    if undergrad_tip and undergrad_tip.strip():",
      "        parts.append(undergrad_tip)",
      "    if undergrad_text and undergrad_text.strip():",
      "        parts.append(undergrad_text)",
      "    if parts:",
      '        return {"answer": "\\n".join(parts)}',
      "    if zhuan_ke_output and zhuan_ke_output.strip():",
      '        return {"answer": zhuan_ke_output}',
      '    return {"answer": "抱歉，暂时无法生成推荐结果。请重新输入你的信息试试。"}',
    ].join("\n"),
  });
  selector.data.variables = [
    { variable: "error_msg",       value_selector: ["1790000000100", "error_msg"],     value_type: "string" },
    { variable: "undergrad_tip",   value_selector: ["1780889576207", "undergrad_tip"], value_type: "string" },
    { variable: "undergrad_text",  value_selector: ["1747000021001", "text"],          value_type: "string" },
    { variable: "zhuan_ke_output", value_selector: ["1780889576242", "output"],        value_type: "string" },
  ];
  selector.data.outputs = { answer: { type: "string", children: null } };
  dsl.graph.add(selector);
  selector.setPosition(3700, 600);

  // ─── 重连 Answer ───
  dsl.graph.removeEdge("1747000021001-source-1747000024001-target");
  dsl.graph.removeEdge("1780889576242-source-1747000024001-target");
  dsl.graph.removeEdge("1790000000101-true-1747000024001-target");

  dsl.graph.addEdge(new Edge("1747000021001", "1790000000200"));
  dsl.graph.addEdge(new Edge("1780889576242", "1790000000200"));
  dsl.graph.addEdge(new Edge("1790000000101", "1790000000200", "true"));
  dsl.graph.addEdge(new Edge("1790000000200", "1747000024001"));

  // ─── 重连 IF-false → classifier ───
  // Note: the old edge (1790000000101-false → 1747500000001) was auto-removed when 1747500000001 was deleted
  // Add a new edge from IF-false to classifier
  dsl.graph.addEdge(new Edge("1790000000101", "1780889576194", "false"));

  // ─── Clean up dangling reference in VA 1780889576242 to deleted node 1780889576193 ───
  const va = dsl.graph.findAggregator("1780889576242");
  if (va) {
    va.data.variables = va.data.variables.filter(v => v[0] !== "1780889576193");
  }

  // ─── classifier 加本科路由 ───
  const classifier = dsl.graph.findClassifier("1780889576194");
  if (classifier) {
    dsl.graph.addEdge(new Edge(classifier.id, "1747000003001", "school_recommend"));
    dsl.graph.addEdge(new Edge(classifier.id, "1747000006001", "school_recommend"));
    classifier.setTitle("意图分类器（本科/专科共享）");
    classifier.setPosition(730, 250);
  }

  // ─── Answer 模板 ───
  const answer = dsl.graph.findAnswer("1747000024001");
  if (answer) {
    answer.data.answer = "{{#1790000000200.answer#}}";
    answer.data.variables = [
      { variable: "1790000000200.answer", value_selector: ["1790000000200", "answer"], value_type: "string" },
    ];
  }

  // ─── Prompt 修改 — 本科 LLM ───
  const benLLM = dsl.graph.findLLM("1747000021001");
  if (benLLM) {
    benLLM.data.prompt_template[0].text = benLLM.data.prompt_template[0].text
      .replace("你是一位资深高考志愿填报专家。请根据以下信息为用户提供专业推荐。",
               "你是一位资深高考志愿填报专家，面向四川省本科段考生，请根据以下信息提供专业推荐。重点匹配本科院校及全国985/211高校。")
      .replace("| 学校名称 | 专业名称 | 所属院系 | 2025分数 | 2024分数 | 匹配度 |",
               "| 学校名称 | 专业名称 | 所属院系 | 所属批次 | 2025分数 | 2024分数 | 2023分数 | 近3年趋势 | 匹配度 |");
  }

  // ─── 环境变量 ───
  dsl.setEnv("GAOKAO_BENKE_LINE", 450, "number");
  dsl.setEnv("GAOKAO_MIN_VALID", 150, "number");

  // ─── 验证 ───
  const report = dsl.validate();
  console.log(`\nValidation: ok=${report.ok}`);
  console.log(`  Errors: ${report.errors.length}, Warnings: ${report.warnings.length}`);
  report.errors.forEach(e => console.log(`  ❌ [${e.code}] ${e.message}`));
  report.warnings.forEach(w => console.log(`  ⚠️ [${w.code}] ${w.message}`));

  if (!report.ok) {
    console.error("Validation failed, aborting save");
    process.exit(1);
  }

  // ─── 保存 ───
  dsl.save("../output/高考志愿推荐助手-v2.yml");
  console.log("\nSaved to output/高考志愿推荐助手-v2.yml");
}

main().catch(console.error);
