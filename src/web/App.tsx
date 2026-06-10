import React, { useState, useCallback } from "react";
import { DifyDSL } from "../core/DifyDSL";

const App: React.FC = () => {
  const [dsl, setDsl] = useState<DifyDSL | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [yamlInput, setYamlInput] = useState("");
  const [yamlOutput, setYamlOutput] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [nodeInfo, setNodeInfo] = useState("");

  const appendLog = useCallback((msg: string) => {
    setLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  }, []);

  const handleLoad = async () => {
    try {
      const resp = await fetch("/api/load");
      const data = await resp.json();
      if (data.error) throw new Error(data.error);
      setYamlInput(data.yaml);
      appendLog(`Loaded YAML (${data.yaml.length} chars)`);
    } catch (e: any) {
      appendLog(`Error: ${e.message}`);
    }
  };

  const handleParse = () => {
    if (!yamlInput.trim()) { appendLog("No YAML to parse"); return; }
    try {
      const instance = DifyDSL.parse(yamlInput);
      setDsl(instance);
      appendLog(`Parsed: ${instance.index.byId.size} nodes, ${instance.index.edges.size} edges`);
      appendLog(`  Mode: ${instance.app.mode}, Iterations: ${instance.findByType("iteration").length}`);
      appendLog(`  Types: ${["start","llm","code","tool","knowledge-retrieval","if-else","answer","iteration"].map(t => t+"="+instance.findByType(t).length).join(", ")}`);
    } catch (e: any) {
      appendLog(`Parse error: ${e.message}`);
      console.error(e);
    }
  };

  const handleToJSON = () => {
    if (!dsl) { appendLog("No DSL loaded — parse first"); return; }
    try {
      const json = dsl.toJSON();
      appendLog(`JSON: ${json.workflow.graph.nodes.length} nodes, ${json.workflow.graph.edges.length} edges`);
      setNodeInfo(JSON.stringify(json, null, 2));
    } catch (e: any) { appendLog(`Error: ${e.message}`); }
  };

  const handleToYAML = () => {
    if (!dsl) { appendLog("No DSL loaded — parse first"); return; }
    try {
      const y = dsl.toYAML();
      setYamlOutput(y);
      appendLog(`YAML generated (${y.length} chars)`);
    } catch (e: any) { appendLog(`Error: ${e.message}`); }
  };

  const handleValidate = () => {
    if (!dsl) { appendLog("No DSL loaded — parse first"); return; }
    try {
      const report = dsl.validate();
      appendLog(`Validation: ${report.errors.length} errors, ${report.warnings.length} warnings`);
      report.errors.forEach((e: any) => appendLog(`  ERROR: ${e.message}`));
      report.warnings.forEach((w: any) => appendLog(`  WARN: ${w.message}`));
    } catch (e: any) { appendLog(`Error: ${e.message}`); }
  };

  const handleSave = async () => {
    try {
      const body = yamlOutput || (dsl ? dsl.toYAML() : yamlInput);
      const resp = await fetch("/api/save", { method: "POST", body });
      const data = await resp.json();
      appendLog(`Saved to ${data.path}`);
    } catch (e: any) { appendLog(`Error: ${e.message}`); }
  };

  const handleLookup = () => {
    if (!dsl || !selectedId.trim()) return;
    const node = dsl.getNode(selectedId.trim());
    if (!node) { appendLog(`Node not found: ${selectedId}`); return; }
    appendLog(`Node: ${node.id} type=${node.data.type} title="${node.title}"`);
    const prev = dsl.getPrevIds(node.id);
    const next = dsl.getNextIds(node.id);
    if (prev.length) appendLog(`  prev: ${prev.join(", ")}`);
    if (next.length) appendLog(`  next: ${next.join(", ")}`);
    setNodeInfo(JSON.stringify(node.toJSON(), null, 2));
  };

  const handleDelete = () => {
    if (!dsl || !selectedId.trim()) return;
    const node = dsl.getNode(selectedId.trim());
    if (!node) { appendLog(`Node not found: ${selectedId}`); return; }
    const prev = dsl.getPrevIds(node.id);
    const next = dsl.getNextIds(node.id);
    dsl.removeNode(node.id);
    appendLog(`Deleted: ${node.id} (${node.data.type} "${node.title}")`);
    appendLog(`  Had ${prev.length} incoming, ${next.length} outgoing edges — auto-removed`);
  };

  return (
    <div style={{ padding: 20, fontFamily: "monospace" }}>
      <h1>Dify DSL Builder — Debug</h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <button onClick={handleLoad} style={btnStyle}>Load YAML</button>
        <button onClick={handleParse} style={btnStyle}>Parse</button>
        <button onClick={handleToJSON} style={btnStyle}>→ JSON</button>
        <button onClick={handleToYAML} style={btnStyle}>→ YAML</button>
        <button onClick={handleValidate} style={btnStyle}>Validate</button>
        <button onClick={handleSave} style={btnStyle}>Save</button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
          placeholder="Node ID to lookup/delete..."
          style={{ flex: 1, padding: "4px 8px", fontFamily: "monospace" }}
        />
        <button onClick={handleLookup} style={btnStyle}>Get Node</button>
        <button onClick={handleDelete} style={{ ...btnStyle, background: "#c00" }}>Delete</button>
      </div>

      <div style={{ display: "flex", gap: 16 }}>
        <div style={{ flex: 1 }}>
          <h3>Input YAML</h3>
          <textarea style={textAreaStyle} value={yamlInput} onChange={e => setYamlInput(e.target.value)} placeholder="Load or paste YAML..." />
        </div>
        <div style={{ flex: 1 }}>
          <h3>Output / Node JSON</h3>
          <textarea style={textAreaStyle} value={yamlOutput || nodeInfo} readOnly placeholder="Output / node detail..." />
        </div>
      </div>

      <h3>Console</h3>
      <div style={consoleStyle}>
        {log.length === 0 ? "Ready. Load → Parse → explore." : log.join("\n")}
      </div>
    </div>
  );
};

const btnStyle: React.CSSProperties = {
  padding: "6px 14px", fontSize: 13, cursor: "pointer",
  background: "#007acc", color: "#fff", border: "none", borderRadius: 4,
};

const textAreaStyle: React.CSSProperties = {
  width: "100%", height: 400, fontFamily: "monospace", fontSize: 12,
  padding: 8, border: "1px solid #ccc", borderRadius: 4,
};

const consoleStyle: React.CSSProperties = {
  background: "#1e1e1e", color: "#0f0", padding: 12, borderRadius: 4,
  minHeight: 200, maxHeight: 300, overflow: "auto", whiteSpace: "pre-wrap", fontSize: 13,
};

export default App;
