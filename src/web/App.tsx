import React, { useState, useCallback, useRef } from "react";
import { DifyDSL } from "../core/DifyDSL";
import type { EdgeData } from "../core/types";

const App: React.FC = () => {
  const [dsl, setDsl] = useState<DifyDSL | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [yamlInput, setYamlInput] = useState("");
  const [yamlOutput, setYamlOutput] = useState("");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<"detail" | "yaml" | "json" | "console">("console");
  const [expandTypes, setExpandTypes] = useState<Set<string>>(new Set(["start", "llm", "code"]));
  const fileInputRef = useRef<HTMLInputElement>(null);

  const appendLog = useCallback((msg: string) => {
    setLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  }, []);

  // ─── File I/O ───

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

  const handleParseFromText = () => {
    if (!yamlInput.trim()) { appendLog("No YAML to parse"); return; }
    try {
      const instance = DifyDSL.parse(yamlInput);
      setDsl(instance);
      setSelectedNodeId(null);
      appendLog(`Parsed: ${instance.nodeCount} nodes, ${instance.edgeCount} edges`);
      // Count by type
      const types = new Map<string, number>();
      for (const n of instance.index.byId.values()) {
        const t = n.data.type;
        types.set(t, (types.get(t) || 0) + 1);
      }
      for (const [t, c] of [...types].sort((a, b) => b[1] - a[1])) {
        appendLog(`  ${t}: ${c}`);
      }
    } catch (e: any) {
      appendLog(`Parse error: ${e.message}`);
    }
  };

  const handleToYAML = () => {
    if (!dsl) { appendLog("No DSL — parse first"); return; }
    try {
      setYamlOutput(dsl.toYAML());
      setSelectedTab("yaml");
      appendLog("YAML generated");
    } catch (e: any) { appendLog(`Error: ${e.message}`); }
  };

  const handleToJSON = () => {
    if (!dsl) { appendLog("No DSL — parse first"); return; }
    try {
      setYamlOutput(JSON.stringify(dsl.toJSON(), null, 2));
      setSelectedTab("json");
      appendLog("JSON generated");
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

  const handleValidate = () => {
    if (!dsl) { appendLog("No DSL — parse first"); return; }
    const r = dsl.validate();
    appendLog(`Errors: ${r.errors.length}, Warnings: ${r.warnings.length}`);
    r.errors.forEach(e => appendLog(`  ERROR: ${e.message}`));
    r.warnings.forEach(w => appendLog(`  WARN: ${w.message}`));
  };

  // ─── Selection ───

  const selectedNode = selectedNodeId ? dsl?.getNode(selectedNodeId) : null;
  const selectedPrev = selectedNodeId ? dsl?.getPrevIds(selectedNodeId) ?? [] : [];
  const selectedNext = selectedNodeId ? dsl?.getNextIds(selectedNodeId) ?? [] : [];
  const selectedEdges = selectedNodeId ? dsl?.getNodeEdges(selectedNodeId) ?? [] : [];

  const handleSelectNode = (id: string) => {
    setSelectedNodeId(id);
    setSelectedTab("detail");
  };

  const handleDeleteNode = () => {
    if (!dsl || !selectedNodeId) return;
    dsl.removeNode(selectedNodeId);
    setSelectedNodeId(null);
    appendLog(`Deleted node, now ${dsl.nodeCount} nodes, ${dsl.edgeCount} edges`);
  };

  const toggleType = (t: string) => {
    setExpandTypes(prev => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t); else next.add(t);
      return next;
    });
  };

  // ─── Node groupings ───

  const typeCounts = new Map<string, { count: number; nodes: { id: string; title: string }[] }>();
  if (dsl) {
    for (const n of dsl.index.byId.values()) {
      if (!typeCounts.has(n.data.type)) typeCounts.set(n.data.type, { count: 0, nodes: [] });
      const entry = typeCounts.get(n.data.type)!;
      entry.count++;
      entry.nodes.push({ id: n.id, title: n.title });
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", fontFamily: "monospace", fontSize: 13 }}>
      {/* ─── Toolbar ─── */}
      <div style={{ display: "flex", gap: 6, padding: "8px 12px", background: "#f5f5f5", borderBottom: "1px solid #ddd", alignItems: "center", flexWrap: "wrap" }}>
        <button onClick={handleLoad} style={btn}>Load YAML</button>
        <button onClick={handleParseFromText} style={btn}>Parse</button>
        <span style={{ color: "#999" }}>|</span>
        <button onClick={handleToJSON} disabled={!dsl} style={btn}>→ JSON</button>
        <button onClick={handleToYAML} disabled={!dsl} style={btn}>→ YAML</button>
        <button onClick={handleValidate} disabled={!dsl} style={btn}>Validate</button>
        <button onClick={handleSave} style={btn}>Save</button>
        <span style={{ color: "#999" }}>|</span>
        <button onClick={() => setSelectedTab("console")} style={btn}>Console</button>
        {dsl && <span style={{ color: "#666", marginLeft: 8 }}>{dsl.nodeCount}n / {dsl.edgeCount}e</span>}
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* ─── Left: Node tree ─── */}
        <div style={{ width: 280, borderRight: "1px solid #ddd", overflow: "auto", background: "#fafafa" }}>
          <div style={{ padding: "8px 10px", fontWeight: "bold", borderBottom: "1px solid #ddd", background: "#fff" }}>Nodes</div>
          {!dsl && <div style={{ padding: 12, color: "#999" }}>Parse a file first.</div>}
          {dsl && (
            <div style={{ padding: "4px 0" }}>
              {[...typeCounts].map(([type, entry]) => (
                <div key={type}>
                  <div
                    onClick={() => toggleType(type)}
                    style={{ padding: "4px 10px", cursor: "pointer", display: "flex", justifyContent: "space-between", background: expandTypes.has(type) ? "#e8e8e8" : "transparent", fontWeight: 500 }}
                  >
                    <span>{expandTypes.has(type) ? "▼" : "▶"} {type}</span>
                    <span style={{ color: "#888" }}>{entry.count}</span>
                  </div>
                  {expandTypes.has(type) && entry.nodes.map(n => (
                    <div
                      key={n.id}
                      onClick={() => handleSelectNode(n.id)}
                      style={{
                        padding: "2px 10px 2px 28px",
                        cursor: "pointer",
                        background: selectedNodeId === n.id ? "#007acc" : "transparent",
                        color: selectedNodeId === n.id ? "#fff" : "#333",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      title={n.id}
                    >
                      {n.id.slice(-6)} — {n.title || "(no title)"}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── Right: tabs ─── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {selectedTab === "detail" && selectedNode && (
            <div style={{ flex: 1, overflow: "auto", padding: 12 }}>
              {/* Node header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h3 style={{ margin: 0 }}>{selectedNode.data.type} — {selectedNode.title}</h3>
                <button onClick={handleDeleteNode} style={{ ...btn, background: "#c00" }}>Delete</button>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 12 }}>
                <tbody>
                  <tr><td style={tdL}>ID</td><td style={tdR}>{selectedNode.id}</td></tr>
                  <tr><td style={tdL}>Title</td><td style={tdR}>{selectedNode.title}</td></tr>
                  <tr><td style={tdL}>Desc</td><td style={tdR}>{selectedNode.desc || "(empty)"}</td></tr>
                  <tr><td style={tdL}>Position</td><td style={tdR}>x={selectedNode.position.x}, y={selectedNode.position.y}</td></tr>
                  <tr><td style={tdL}>Size</td><td style={tdR}>{selectedNode.width}×{selectedNode.height}</td></tr>
                  <tr><td style={tdL}>zIndex</td><td style={tdR}>{selectedNode.zIndex ?? "(default)"}</td></tr>
                  {selectedNode.parentId && <tr><td style={tdL}>Parent</td><td style={tdR}>{selectedNode.parentId}</td></tr>}
                  {selectedNode.isInIteration && <tr><td style={tdL}>Iteration</td><td style={tdR}>{selectedNode.iterationId}</td></tr>}
                </tbody>
              </table>

              {/* Connectivity */}
              <h4 style={{ margin: "12px 0 6px" }}>Edges ({selectedEdges.length})</h4>
              {selectedPrev.length > 0 && (
                <div style={{ marginBottom: 6 }}>
                  <strong>Incoming:</strong>
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    {selectedEdges.filter(e => e.target === selectedNode.id).map(e => (
                      <li key={e.id}>{e.source} ({e.sourceHandle} → {e.targetHandle})</li>
                    ))}
                  </ul>
                </div>
              )}
              {selectedNext.length > 0 && (
                <div>
                  <strong>Outgoing:</strong>
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    {selectedEdges.filter(e => e.source === selectedNode.id).map(e => (
                      <li key={e.id}>{e.target} ({e.sourceHandle} → {e.targetHandle})</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Raw JSON */}
              <h4 style={{ margin: "12px 0 6px" }}>Raw JSON</h4>
              <pre style={{ background: "#1e1e1e", color: "#0f0", padding: 8, borderRadius: 4, overflow: "auto", fontSize: 11, maxHeight: 300 }}>
                {JSON.stringify(selectedNode.toJSON(), null, 2)}
              </pre>
            </div>
          )}

          {(selectedTab === "yaml" || selectedTab === "json") && (
            <textarea
              style={{ flex: 1, border: "none", padding: 12, fontFamily: "monospace", fontSize: 12, resize: "none" }}
              value={yamlOutput}
              readOnly
              placeholder={selectedTab === "yaml" ? "YAML output..." : "JSON output..."}
            />
          )}

          {selectedTab === "console" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              {/* Input YAML */}
              <textarea
                style={{ flex: 1, border: "none", borderBottom: "1px solid #ddd", padding: 12, fontFamily: "monospace", fontSize: 12, resize: "none" }}
                value={yamlInput}
                onChange={e => setYamlInput(e.target.value)}
                placeholder="Paste YAML here or click Load YAML..."
              />
              {/* Console */}
              <div style={{ height: 180, background: "#1e1e1e", color: "#0f0", padding: 8, overflow: "auto", fontSize: 12, whiteSpace: "pre-wrap" }}>
                {log.length === 0 ? "Ready. Load → Parse → explore." : log.join("\n")}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const btn: React.CSSProperties = {
  padding: "4px 10px", fontSize: 12, cursor: "pointer",
  background: "#007acc", color: "#fff", border: "none", borderRadius: 3,
};

const tdL: React.CSSProperties = {
  padding: "2px 8px", fontWeight: "bold", border: "1px solid #ddd", width: 100, verticalAlign: "top",
};

const tdR: React.CSSProperties = {
  padding: "2px 8px", border: "1px solid #ddd", wordBreak: "break-all",
};

export default App;
