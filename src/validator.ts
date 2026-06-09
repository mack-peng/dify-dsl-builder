import { Graph } from "./graph";
import { AnyNode, IterChildNode } from "./nodes";
import { LLMNode, CodeNode, IfElseNode, AggregatorNode, IterationNode, StartNode, AnswerNode, KnowledgeNode, TemplateNode } from "./nodes";
import { Edge } from "./edge";
import { addError, addWarning, createReport, ValidationReport } from "./types/validation";

const VALID_CODE_TYPES = new Set([
  "string", "number", "integer", "boolean", "object", "file", "secret",
  "array[string]", "array[number]", "array[object]", "array[boolean]", "array[file]", "array[any]", "none",
]);

export function validate(graph: Graph, mode: "workflow" | "advanced-chat"): ValidationReport {
  const r = createReport();

  const allNodes = new Map<string, AnyNode>();
  for (const n of [...graph.starts(), ...graph.answers(), ...graph.llms(), ...graph.codes(),
    ...graph.knowledges(), ...graph.ifElses(), ...graph.templates(), ...graph.aggregators(),
    ...graph.iterations(), ...graph.tools(), ...graph.classifiers()]) {
    allNodes.set(n.id, n);
    // Also add iteration children
    if (n instanceof IterationNode) {
      n.children.forEach(c => allNodes.set(c.id, c));
      if (n.startNode) allNodes.set(n.startNode.id, n.startNode);
    }
  }
  const ids = new Set(allNodes.keys());

  // 1. Start exists and unique
  const starts = graph.starts();
  if (starts.length === 0) addError(r, { severity: "error", code: "NO_START", message: "Missing Start node" });
  if (starts.length > 1) addWarning(r, { severity: "warning", code: "MULTI_START", message: "Multiple Start nodes" });

  // 2. Answer/End check
  if (mode === "advanced-chat") {
    if (graph.answers().length === 0) addError(r, { severity: "error", code: "NO_ANSWER", message: "advanced-chat mode requires Answer node" });
  }

  // 3-4. Edge validation
  const edgeIds = new Set<string>();
  const edgeSrc = new Set<string>();
  const edgeTgt = new Set<string>();
  for (const e of graph.edges) {
    if (!ids.has(e.source)) addError(r, { severity: "error", code: "EDGE_SOURCE_NOT_FOUND", edgeId: e.id, message: `Edge source '${e.source}' not found` });
    if (!ids.has(e.target)) addError(r, { severity: "error", code: "EDGE_TARGET_NOT_FOUND", edgeId: e.id, message: `Edge target '${e.target}' not found` });
    if (edgeIds.has(e.id)) addError(r, { severity: "error", code: "DUP_EDGE_ID", edgeId: e.id, message: `Duplicate edge ID: ${e.id}` });
    edgeIds.add(e.id);
    edgeSrc.add(e.source);
    edgeTgt.add(e.target);

    // 12. sourceHandle match
    const srcNode = allNodes.get(e.source);
    if (srcNode) {
      const st = srcNode.data.type;
      if (st === "if-else") {
        if (!["true", "false"].includes(e.sourceHandle)) addError(r, { severity: "error", code: "BAD_IF_HANDLE", edgeId: e.id, message: `IF node ${e.source} sourceHandle must be true/false, got '${e.sourceHandle}'` });
      } else if (st !== "question-classifier") {
        if (e.sourceHandle !== "source") addError(r, { severity: "error", code: "BAD_SOURCE_HANDLE", edgeId: e.id, message: `${st} sourceHandle should be 'source', got '${e.sourceHandle}'` });
      }
    }
  }
  edgeIds.clear();

  // 5. Cycle detection (DFS)
  const adj = new Map<string, string[]>();
  for (const e of graph.edges) {
    if (!adj.has(e.source)) adj.set(e.source, []);
    adj.get(e.source)!.push(e.target);
  }
  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = new Map<string, number>();
  let hasCycle = false;
  function dfs(u: string) {
    color.set(u, GRAY);
    for (const v of (adj.get(u) || [])) {
      if (color.get(v) === GRAY) { hasCycle = true; return; }
      if (color.get(v) === WHITE) dfs(v);
    }
    color.set(u, BLACK);
  }
  for (const id of ids) { if (!color.has(id)) dfs(id); }
  if (hasCycle) addError(r, { severity: "error", code: "CYCLE", message: "Graph contains a cycle" });

  // 6. LLM context/vision
  for (const n of [...graph.llms()]) {
    if (!n.data.context) addError(r, { severity: "error", code: "LLM_NO_CONTEXT", nodeId: n.id, message: `LLM ${n.id} missing context` });
    if (!n.data.vision) addError(r, { severity: "error", code: "LLM_NO_VISION", nodeId: n.id, message: `LLM ${n.id} missing vision` });
  }

  // 7. Code outputs
  for (const n of graph.codes()) {
    for (const [name, out] of Object.entries(n.data.outputs)) {
      if (!VALID_CODE_TYPES.has(out.type)) {
        addError(r, { severity: "error", code: "BAD_CODE_OUTPUT", nodeId: n.id, message: `Code ${n.id} output '${name}' type '${out.type}' is invalid` });
      }
    }
  }

  // 8. Tool plugin_unique_identifier
  for (const n of graph.tools()) {
    if (!n.data.plugin_unique_identifier?.includes("@")) {
      addError(r, { severity: "error", code: "TOOL_NO_IDENTIFIER", nodeId: n.id, message: `Tool ${n.id} missing valid plugin_unique_identifier` });
    }
  }

  // 9. IF case_id
  for (const n of graph.ifElses()) {
    for (const c of n.data.cases) {
      if (!["true", "false"].includes(c.case_id)) {
        addError(r, { severity: "error", code: "BAD_CASE_ID", nodeId: n.id, message: `IF ${n.id} case_id '${c.case_id}' invalid` });
      }
    }
  }

  // 10. IF branch edges
  for (const n of graph.ifElses()) {
    const caseIds = new Set(n.data.cases.map(c => c.case_id));
    const edgeHandles = new Set(graph.edgesFrom(n.id).map(e => e.sourceHandle));
    for (const cid of caseIds) {
      if (!edgeHandles.has(cid)) addError(r, { severity: "error", code: "IF_MISSING_BRANCH", nodeId: n.id, message: `IF ${n.id} missing edge for case '${cid}'` });
    }
    if (!edgeHandles.has("false")) addError(r, { severity: "error", code: "IF_MISSING_ELSE", nodeId: n.id, message: `IF ${n.id} missing 'false' edge` });
  }

  // 11. Start no incoming
  for (const n of graph.starts()) {
    if (edgeTgt.has(n.id)) addError(r, { severity: "error", code: "START_HAS_INPUT", nodeId: n.id, message: `Start node ${n.id} should not have incoming edges` });
  }

  // 13. No incoming (non-Start, non-iteration-start)
  for (const [id, n] of allNodes) {
    if (n instanceof StartNode || n.data.type === "iteration-start") continue;
    if (!edgeTgt.has(id)) {
      addWarning(r, { severity: "warning", code: "ORPHAN_NO_INPUT", nodeId: id, message: `Node ${id} (${n.data.type}) has no incoming edges` });
    }
  }

  // 14. No outgoing (non-Answer, non-iteration-internal)
  for (const [id, n] of allNodes) {
    if (n instanceof AnswerNode) continue;
    if ((n as any).isInIteration) continue;
    if (!edgeSrc.has(id)) {
      addWarning(r, { severity: "warning", code: "ORPHAN_NO_OUTPUT", nodeId: id, message: `Node ${id} (${n.data.type}) has no outgoing edges` });
    }
  }

  // 15. value_selector dangling refs
  for (const [id, n] of allNodes) {
    if (n instanceof CodeNode || n instanceof TemplateNode) {
      for (const v of (n.data.variables as { value_selector?: string[] }[]) || []) {
        if (v.value_selector?.[0] && !ids.has(v.value_selector[0]) && !["sys", "env", "conversation"].includes(v.value_selector[0])) {
          addWarning(r, { severity: "warning", code: "DANGLING_REF", nodeId: id, message: `Node ${id} references non-existent node ${v.value_selector[0]}` });
        }
      }
    }
    if (n instanceof LLMNode) {
      const vars = (n as any).variables as { value_selector?: string[] }[] | undefined;
      if (vars) {
        for (const v of vars) {
          if (v.value_selector?.[0] && !ids.has(v.value_selector[0]) && !["sys", "env", "conversation"].includes(v.value_selector[0])) {
            addWarning(r, { severity: "warning", code: "DANGLING_REF", nodeId: id, message: `Node ${id} references non-existent node ${v.value_selector[0]}` });
          }
        }
      }
    }
    if (n instanceof KnowledgeNode) {
      const sel = n.data.query_variable_selector;
      if (sel?.[0] && !ids.has(sel[0]) && !["sys", "env", "conversation"].includes(sel[0])) {
        addWarning(r, { severity: "warning", code: "DANGLING_REF", nodeId: id, message: `KB ${id} references non-existent node ${sel[0]}` });
      }
    }
    if (n instanceof AggregatorNode) {
      for (const v of n.data.variables) {
        if (v[0] && !ids.has(v[0])) {
          addWarning(r, { severity: "warning", code: "DANGLING_REF", nodeId: id, message: `VA ${id} references non-existent node ${v[0]}` });
        }
      }
    }
    if (n instanceof IterationNode) {
      const sel = n.data.iterator_selector;
      if (sel?.[0] && !ids.has(sel[0])) addWarning(r, { severity: "warning", code: "DANGLING_REF", nodeId: id, message: `Iteration ${id} references non-existent node ${sel[0]}` });
    }
  }

  // 16. VA type consistency
  for (const n of graph.aggregators()) {
    const vaType = n.data.output_type;
    for (const [srcId, field] of n.data.variables) {
      const src = allNodes.get(srcId);
      if (src instanceof KnowledgeNode && vaType !== "array") {
        addWarning(r, { severity: "warning", code: "VA_TYPE_MISMATCH", nodeId: n.id, message: `VA ${n.id} output_type=${vaType} but KB source outputs array` });
      }
      if (src instanceof LLMNode && vaType === "array") {
        addWarning(r, { severity: "warning", code: "VA_TYPE_MISMATCH", nodeId: n.id, message: `VA ${n.id} output_type=array but LLM source outputs string` });
      }
    }
  }

  // 17. KB + search in same VA
  for (const n of graph.aggregators()) {
    let hasKB = false, hasSearch = false;
    for (const [srcId] of n.data.variables) {
      const src = allNodes.get(srcId);
      if (src instanceof KnowledgeNode) hasKB = true;
      if (src instanceof CodeNode && (src.data.title?.includes("搜索") || src.data.title?.includes("百度"))) hasSearch = true;
    }
    if (hasKB && hasSearch) addWarning(r, { severity: "warning", code: "KB_SEARCH_MIXED", nodeId: n.id, message: `VA ${n.id} mixes KB results and search results` });
  }

  return r;
}
