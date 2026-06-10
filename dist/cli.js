#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const node_child_process_1 = require("node:child_process");
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const DifyDSL_1 = require("./core/DifyDSL");
const patch_1 = require("./patch");
const USAGE = `
dify-dsl-cli <command> [options]

Commands:
  info       <file>              Print node/edge stats
  flow       <file> [--short]    Print workflow topology (full IDs, --short for truncated)
  find       <file> <text>       Search text across all node content
  diff       <yml1> <yml2>       Semantic diff between two DSL files
  edge list  <file> [node-id]    Tabular edge listing
  path       <file> <from> <to>  Shortest path between two nodes
  roundtrip  <input> [output]    Load YAML → save, verify round-trip
  validate   <file>              Run Ruby DSL validator
  apply      <patch> -i <in> -o <out>  Apply YAML patch file

Inspect commands:
  node show  <file> <id>         Dump full data of a single node
  node list  <file> [type]       Tabular listing, optional type filter

Atomic commands (modify file in place):
  node set-title      <file> <id> <title>
  node set-desc       <file> <id> <desc>
  node set-prompt     <file> <id> <role> <replace> <with>
  node set-code       <file> <id> <replace> <with>
  node set-condition  <file> <id> <case_id> <field> <value>
  edge add            <file> <src> <tgt> [handle]
  edge remove         <file> <src> <tgt> [handle]
  remove              <file> <id>
`;
function fail(msg) {
    console.error(msg);
    process.exit(1);
}
function resolvePath(p) {
    return path.isAbsolute(p) ? p : path.resolve(p);
}
// ── Commands ──
function cmd_roundtrip(args) {
    const input = resolvePath(args[0]);
    const output = args[1] ? resolvePath(args[1]) : input.replace(/\.yml$/, ".roundtrip.yml");
    if (!fs.existsSync(input))
        fail(`File not found: ${input}`);
    const str = fs.readFileSync(input, "utf-8");
    const dsl = DifyDSL_1.DifyDSL.parse(str);
    console.log(`Load: ${dsl.nodeCount} nodes, ${dsl.edgeCount} edges, mode=${dsl.mode}`);
    dsl.save(output);
    console.log(`Save: ${output}`);
    // Validate
    try {
        const script = path.join(__dirname, "..", "..", "dify-builder-agent", "scripts", "validate-dsl.rb");
        const result = (0, node_child_process_1.execSync)(`ruby "${script}" "${output}" 2>&1`, { encoding: "utf-8", timeout: 10000 });
        console.log(result);
    }
    catch (e) {
        console.log(e.stdout || e.stderr || String(e));
    }
}
function cmd_validate(args) {
    const file = resolvePath(args[0]);
    if (!fs.existsSync(file))
        fail(`File not found: ${file}`);
    const script = path.join(__dirname, "..", "..", "dify-builder-agent", "scripts", "validate-dsl.rb");
    try {
        const result = (0, node_child_process_1.execSync)(`ruby "${script}" "${file}" 2>&1`, { encoding: "utf-8", timeout: 10000 });
        console.log(result);
    }
    catch (e) {
        console.log(e.stdout || e.stderr || String(e));
    }
}
function cmd_info(args) {
    const file = resolvePath(args[0]);
    if (!fs.existsSync(file))
        fail(`File not found: ${file}`);
    const str = fs.readFileSync(file, "utf-8");
    const dsl = DifyDSL_1.DifyDSL.parse(str);
    console.log(`File:     ${file}`);
    console.log(`Mode:     ${dsl.mode}`);
    console.log(`Nodes:    ${dsl.nodeCount}`);
    console.log(`Edges:    ${dsl.edgeCount}`);
    const types = new Map();
    for (const n of dsl.index.byId.values()) {
        const t = n.data?.type || "?";
        types.set(t, (types.get(t) || 0) + 1);
    }
    console.log("\nNode types:");
    for (const [t, c] of [...types].sort((a, b) => b[1] - a[1])) {
        console.log(`  ${t.padEnd(24)} ${c}`);
    }
}
const TYPE_LABEL = {
    start: "START", llm: "LLM", code: "CODE", answer: "ANSWER",
    "if-else": "IF", "question-classifier": "CLASS", tool: "TOOL",
    "knowledge-retrieval": "KB", "template-transform": "TMPL",
    "variable-aggregator": "AGGR", iteration: "ITER",
    "http-request": "HTTP", "document-extractor": "DOC",
};
function nodeLabel(n, useShort) {
    const t = TYPE_LABEL[n.data.type] || n.data.type;
    const id = useShort ? n.id.slice(-6) : n.id;
    return `[${t}] ${id} ${n.title || ""}`;
}
function cmd_flow(args) {
    const useShort = args.includes("--short");
    const fileArgs = args.filter(a => a !== "--short");
    const file = resolvePath(fileArgs[0]);
    if (!fs.existsSync(file))
        fail(`File not found: ${file}`);
    const str = fs.readFileSync(file, "utf-8");
    const dsl = DifyDSL_1.DifyDSL.parse(str);
    console.log(`# ${dsl.app.name}`);
    console.log(`Mode: ${dsl.mode} | ${dsl.nodeCount} nodes, ${dsl.edgeCount} edges\n`);
    const roots = [];
    for (const n of dsl.index.byId.values()) {
        if (dsl.getPrevIds(n.id).length === 0 && !n.parentId)
            roots.push(n.id);
    }
    const visited = new Set();
    function getBranches(id) {
        return dsl.index.getOutEdges(id).map(e => ({
            handle: e.sourceHandle,
            target: e.target,
        }));
    }
    function tree(targetIds, prefix, isLast) {
        const ids = Array.isArray(targetIds) ? targetIds : [targetIds];
        for (let i = 0; i < ids.length; i++) {
            const id = ids[i];
            const last = i === ids.length - 1;
            const isLeaf = isLast[isLast.length - 1] && last;
            const connector = isLeaf ? "└─ " : "├─ ";
            const childPrefix = isLeaf ? "   " : "│  ";
            if (visited.has(id)) {
                const n = dsl.getNode(id);
                const refId = useShort ? id.slice(-6) : id;
                console.log(prefix + connector + `↳ [${TYPE_LABEL[n?.data.type || "?"] || "?"}] ${refId} (see above)`);
                continue;
            }
            visited.add(id);
            const n = dsl.getNode(id);
            if (!n) {
                console.log(prefix + connector + `? ${id} (not found)`);
                continue;
            }
            const branches = getBranches(id);
            if (branches.length === 0) {
                console.log(prefix + connector + nodeLabel(n, useShort));
            }
            else if (branches.length === 1) {
                console.log(prefix + connector + nodeLabel(n, useShort));
                tree(branches[0].target, prefix + childPrefix, [...isLast, last]);
            }
            else {
                console.log(prefix + connector + nodeLabel(n, useShort));
                for (let j = 0; j < branches.length; j++) {
                    const b = branches[j];
                    const bLast = j === branches.length - 1;
                    const bConn = bLast ? "└─ " : "├─ ";
                    const bPrefix = bLast ? "   " : "│  ";
                    console.log(prefix + childPrefix + bConn + `▶ ${b.handle}`);
                    tree(b.target, prefix + childPrefix + bPrefix, [...isLast, last]);
                }
            }
        }
    }
    for (const rootId of roots) {
        tree(rootId, "", [true]);
    }
    if (dsl.index.byParent.size > 0) {
        console.log("\n## Iterations");
        for (const [parentId, childIds] of dsl.index.byParent) {
            const parent = dsl.getNode(parentId);
            if (parent?.data.type === "iteration") {
                console.log(`\n${nodeLabel(parent, useShort)}`);
                for (const cid of childIds) {
                    const c = dsl.getNode(cid);
                    console.log(`  - ${nodeLabel(c, useShort)}`);
                }
            }
        }
    }
}
// ── node show ──
function cmdNodeShow(args) {
    const useJson = args.includes("--json");
    const fileArgs = args.filter(a => a !== "--json");
    const file = resolvePath(fileArgs[0]);
    const id = fileArgs[1];
    if (!fs.existsSync(file))
        fail(`File not found: ${file}`);
    if (!id)
        fail("Usage: dify-dsl-cli node show <file> <id> [--json]");
    const str = fs.readFileSync(file, "utf-8");
    const dsl = DifyDSL_1.DifyDSL.parse(str);
    const n = dsl.getNode(id);
    if (!n)
        fail(`Node not found: ${id}`);
    if (useJson) {
        console.log(JSON.stringify(n.toJSON(), null, 2));
        return;
    }
    const data = n.data;
    const type = data.type;
    console.log(`=== ${n.id} ===`);
    console.log(`Type:     ${type}`);
    console.log(`Title:    ${data.title || "(none)"}`);
    console.log(`Desc:     ${data.desc || "(none)"}`);
    console.log(`Position: x=${n.position.x} y=${n.position.y} (${n.width}×${n.height})`);
    if (n.parentId)
        console.log(`Parent:   ${n.parentId}`);
    if (n.isInIteration)
        console.log(`InIter:   ${n.iterationId}`);
    const prevIds = dsl.getPrevIds(id);
    const nextIds = dsl.getNextIds(id);
    if (prevIds.length > 0) {
        console.log(`Upstream: ${prevIds.map(pid => {
            const pn = dsl.getNode(pid);
            return `${pid} [${pn?.data.type || "?"}] ${pn?.title || ""}`;
        }).join(", ")}`);
    }
    if (nextIds.length > 0) {
        console.log(`Downstr:  ${nextIds.map(nid => {
            const nn = dsl.getNode(nid);
            return `${nid} [${nn?.data.type || "?"}] ${nn?.title || ""}`;
        }).join(", ")}`);
    }
    switch (type) {
        case "llm": {
            console.log(`\n-- Model --`);
            console.log(`Provider: ${data.model.provider}`);
            console.log(`Model:    ${data.model.name} | ${data.model.mode}`);
            console.log(`Params:   ${JSON.stringify(data.model.completion_params)}`);
            console.log(`\n-- Prompts --`);
            for (const msg of data.prompt_template || []) {
                const preview = msg.text.length > 500 ? msg.text.slice(0, 500) + "..." : msg.text;
                console.log(`  [${msg.role}] (${msg.text.length} chars)`);
                console.log("  " + preview.replace(/\n/g, "\n  "));
                console.log();
            }
            console.log(`Context:  enabled=${data.context?.enabled || false}`);
            console.log(`Vision:   enabled=${data.vision?.enabled || false}`);
            if (data.memory?.window?.enabled) {
                console.log(`Memory:   window=${data.memory.window.size} enabled`);
            }
            else {
                console.log(`Memory:   disabled`);
            }
            break;
        }
        case "code": {
            console.log(`\n-- Code (${data.code_language}) --`);
            console.log(data.code);
            if (data.variables?.length) {
                console.log(`\n-- Inputs --`);
                for (const v of data.variables) {
                    console.log(`  ${v.variable}: ${(v.value_selector || []).join(".")} (${v.value_type || "?"})`);
                }
            }
            if (data.outputs) {
                console.log(`\n-- Outputs --`);
                for (const [name, out] of Object.entries(data.outputs)) {
                    console.log(`  ${name}: ${out.type}`);
                }
            }
            break;
        }
        case "if-else": {
            console.log(`\n-- Conditions --`);
            for (const cs of data.cases || []) {
                console.log(`  case: ${cs.case_id} (${cs.logical_operator})`);
                for (const c of cs.conditions || []) {
                    const sel = (c.variable_selector || []).join(".");
                    console.log(`    ${sel} ${c.comparison_operator} ${c.value} [${c.varType}]`);
                }
            }
            break;
        }
        case "question-classifier": {
            console.log(`\n-- Query --`);
            console.log(`  selector: ${(data.query_variable_selector || []).join(".")}`);
            console.log(`\n-- Classes (${(data.classes || []).length}) --`);
            for (const c of data.classes || []) {
                console.log(`  ${c.id}: ${c.name}`);
            }
            break;
        }
        case "start": {
            console.log(`\n-- Variables (${(data.variables || []).length}) --`);
            for (const v of data.variables || []) {
                console.log(`  ${v.variable}: ${v.type} required=${v.required} label=${v.label}`);
                if (v.options?.length)
                    console.log(`    options: [${v.options.join(", ")}]`);
                if (v.placeholder)
                    console.log(`    placeholder: ${v.placeholder}`);
            }
            break;
        }
        case "answer": {
            const ans = (data.answer || "").slice(0, 300);
            console.log(`\n-- Template (${data.answer?.length || 0} chars) --`);
            console.log(`  ${ans}${data.answer?.length > 300 ? "..." : ""}`);
            if (data.variables?.length) {
                console.log(`\n-- Variable Refs --`);
                for (const v of data.variables) {
                    console.log(`  ${v.variable}: ${(v.value_selector || []).join(".")}`);
                }
            }
            break;
        }
        case "knowledge-retrieval": {
            console.log(`\n-- Config --`);
            console.log(`  query: ${(data.query_variable_selector || []).join(".")}`);
            console.log(`  mode: ${data.retrieval_mode}`);
            console.log(`  datasets: ${data.dataset_ids?.join(", ") || "none"}`);
            if (data.multiple_retrieval_config) {
                const mc = data.multiple_retrieval_config;
                console.log(`  top_k=${mc.top_k} score_threshold=${mc.score_threshold} reranking=${mc.reranking_enable}`);
            }
            break;
        }
        case "tool": {
            console.log(`\n-- Plugin --`);
            console.log(`  name: ${data.tool_name} v${data.tool_node_version}`);
            console.log(`  plugin: ${data.plugin_id} | ${data.provider_type}`);
            if (data.tool_parameters) {
                console.log(`\n-- Parameters --`);
                for (const [k, v] of Object.entries(data.tool_parameters)) {
                    console.log(`  ${k}: [${v.type}] ${typeof v.value === "string" ? v.value.slice(0, 80) : v.value}`);
                }
            }
            break;
        }
        case "iteration": {
            console.log(`\n-- Config --`);
            console.log(`  iterator: ${(data.iterator_selector || []).join(".")} → ${data.iterator_input_type}`);
            console.log(`  output:   ${(data.output_selector || []).join(".")} → ${data.output_type}`);
            console.log(`  start_id: ${data.start_node_id} | parallel=${data.is_parallel} nums=${data.parallel_nums}`);
            const children = dsl.index.getChildren(id);
            if (children.length > 0) {
                console.log(`\n-- Children (${children.length}) --`);
                for (const c of children) {
                    console.log(`  ${c.id} [${c.data.type}] ${c.title || ""}`);
                }
            }
            break;
        }
        case "template-transform": {
            console.log(`\n-- Template --`);
            console.log(`  ${data.template}`);
            if (data.variables?.length) {
                console.log(`\n-- Inputs --`);
                for (const v of data.variables) {
                    console.log(`  ${v.variable}: ${(v.value_selector || []).join(".")}`);
                }
            }
            break;
        }
        case "variable-aggregator": {
            console.log(`\n-- Config --`);
            console.log(`  output_type: ${data.output_type}`);
            console.log(`\n-- Sources (${(data.variables || []).length}) --`);
            for (const v of data.variables || []) {
                if (Array.isArray(v)) {
                    console.log(`  [${v[0]}, ${v[1]}]`);
                }
                else {
                    console.log(`  ${JSON.stringify(v)}`);
                }
            }
            break;
        }
        case "http-request": {
            console.log(`\n-- Request --`);
            console.log(`  method: ${data.method}`);
            console.log(`  url: ${data.url}`);
            console.log(`  auth: ${data.authorization?.type || "none"}`);
            console.log(`  body: ${data.body?.type || "none"}`);
            if (data.body?.type !== "none")
                console.log(`  body data: ${data.body?.data?.slice(0, 200) || ""}`);
            break;
        }
        case "document-extractor": {
            console.log(`\n-- Config --`);
            console.log(`  selector: ${(data.variable_selector || []).join(".")}`);
            console.log(`  array_file: ${data.is_array_file || false}`);
            break;
        }
    }
    const edges = dsl.getNodeEdges(id);
    if (edges.length > 0) {
        console.log(`\n-- Edges (${edges.length}) --`);
        for (const e of edges) {
            const dir = e.source === id ? "→" : "←";
            const otherId = e.source === id ? e.target : e.source;
            const other = dsl.getNode(otherId);
            console.log(`  ${dir} ${otherId} [${other?.data.type || "?"}] ${other?.title || ""}`);
        }
    }
}
// ── node list ──
function cmdNodeList(args) {
    const file = resolvePath(args[0]);
    const filterType = args[1];
    if (!fs.existsSync(file))
        fail(`File not found: ${file}`);
    const str = fs.readFileSync(file, "utf-8");
    const dsl = DifyDSL_1.DifyDSL.parse(str);
    const nodes = filterType
        ? dsl.findByType(filterType)
        : [...dsl.index.byId.values()];
    if (nodes.length === 0) {
        console.log("No nodes found.");
        return;
    }
    console.log(`${"ID".padEnd(16)} ${"Type".padEnd(23)} ${"Title".padEnd(22)} Up Dn`);
    console.log("-".repeat(72));
    for (const n of nodes) {
        const prev = dsl.getPrevIds(n.id).length;
        const next = dsl.getNextIds(n.id).length;
        const title = (n.title || "").slice(0, 20);
        console.log(`${n.id.padEnd(16)} ${n.data.type.padEnd(23)} ${title.padEnd(22)} ${String(prev).padStart(2)} ${String(next).padStart(2)}`);
    }
    console.log(`\n${nodes.length} nodes${filterType ? ` (filtered: ${filterType})` : ""}`);
}
// ── find ──
function cmdFind(args) {
    const file = resolvePath(args[0]);
    const query = args.slice(1).join(" ");
    if (!fs.existsSync(file))
        fail(`File not found: ${file}`);
    if (!query)
        fail("Usage: dify-dsl-cli find <file> <text>");
    const str = fs.readFileSync(file, "utf-8");
    const dsl = DifyDSL_1.DifyDSL.parse(str);
    const matches = [];
    for (const n of dsl.index.byId.values()) {
        const d = n.data;
        function check(field, text) {
            if (!text)
                return;
            const idx = text.toLowerCase().indexOf(query.toLowerCase());
            if (idx < 0)
                return;
            const start = Math.max(0, idx - 20);
            const end = Math.min(text.length, idx + query.length + 30);
            matches.push({
                id: n.id, type: n.data.type, title: n.title || "",
                field,
                preview: (start > 0 ? "…" : "") + text.slice(start, end).replace(/\n/g, "↵") + (end < text.length ? "…" : ""),
            });
        }
        check("title", d.title);
        check("desc", d.desc);
        if (d.type === "llm") {
            for (const msg of d.prompt_template || []) {
                check(`prompt[${msg.role}]`, msg.text);
            }
        }
        if (d.type === "code")
            check("code", d.code);
        if (d.type === "answer")
            check("answer", d.answer);
        if (d.type === "template-transform")
            check("template", d.template);
        if (d.type === "start") {
            for (const v of d.variables || []) {
                if (v.label)
                    check("variable.label", v.label);
                if (v.placeholder)
                    check("variable.placeholder", v.placeholder);
            }
        }
    }
    if (matches.length === 0) {
        console.log(`No matches for "${query}"`);
        return;
    }
    console.log(`"${query}" — ${matches.length} matches:\n`);
    for (const m of matches) {
        console.log(`${m.id} [${m.type}] ${m.title}`);
        console.log(`  ${m.field}: ${m.preview}`);
        console.log();
    }
}
function cmd_apply(patchFile, input, output) {
    if (!fs.existsSync(input))
        fail(`File not found: ${input}`);
    if (!fs.existsSync(patchFile))
        fail(`Patch file not found: ${patchFile}`);
    const str = fs.readFileSync(input, "utf-8");
    const dsl = DifyDSL_1.DifyDSL.parse(str);
    const { description, steps } = (0, patch_1.loadPatch)(patchFile);
    if (description)
        console.log(`Patch: ${description}`);
    console.log(`Load:  ${dsl.nodeCount} nodes, ${dsl.edgeCount} edges`);
    (0, patch_1.applyPatch)(dsl, steps);
    console.log(`After: ${dsl.nodeCount} nodes, ${dsl.edgeCount} edges`);
    const report = dsl.validate();
    if (report.errors.length > 0) {
        console.error("Validation failed:");
        report.errors.forEach(e => console.error(`  ❌ ${e.message}`));
        report.warnings.forEach(w => console.warn(`  ⚠️ ${w.message}`));
        process.exit(1);
    }
    console.log("✅ Validation passed");
    dsl.save(output);
    console.log(`Save: ${output}`);
}
// ── Atomic commands ──
function atomicNode(args, fileIdx, action) {
    const file = resolvePath(args[fileIdx]);
    if (!fs.existsSync(file))
        fail(`File not found: ${file}`);
    const str = fs.readFileSync(file, "utf-8");
    const dsl = DifyDSL_1.DifyDSL.parse(str);
    action(dsl);
    dsl.save(file);
    console.log(`Saved: ${file}`);
}
function atomNodeSetTitle(args) {
    atomicNode(args, 0, (dsl) => {
        const n = dsl.getNode(args[1]);
        if (n)
            n.setTitle(args[2]);
        else
            fail(`Node not found: ${args[1]}`);
    });
}
function atomNodeSetDesc(args) {
    atomicNode(args, 0, (dsl) => {
        const n = dsl.getNode(args[1]);
        if (n)
            n.setDesc(args[2]);
        else
            fail(`Node not found: ${args[1]}`);
    });
}
function atomNodeSetPrompt(args) {
    atomicNode(args, 0, (dsl) => {
        const llm = dsl.findLLM(args[1]);
        if (!llm)
            fail(`LLM not found: ${args[1]}`);
        const role = args[2];
        const search = args[3];
        const replace = args[4];
        let found = false;
        for (const msg of llm.data.prompt_template) {
            if (msg.role === role) {
                msg.text = msg.text.replace(search, replace);
                found = true;
            }
        }
        if (!found)
            fail(`No prompt with role '${role}'`);
    });
}
function atomEdgeAdd(args) {
    atomicNode(args, 0, (dsl) => {
        dsl.addEdge(args[1], args[2], args[3] || "source");
    });
}
function atomEdgeRemove(args) {
    atomicNode(args, 0, (dsl) => {
        const id = args[3]
            ? `${args[1]}-${args[3]}-${args[2]}-target`
            : `${args[1]}-source-${args[2]}-target`;
        const before = dsl.edgeCount;
        dsl.removeEdge(id);
        if (dsl.edgeCount === before)
            fail(`Edge not found: ${id}`);
    });
}
function atomRemove(args) {
    atomicNode(args, 0, (dsl) => {
        const n = dsl.getNode(args[1]);
        if (!n)
            fail(`Node not found: ${args[1]}`);
        dsl.removeNode(args[1]);
    });
}
function atomNodeSetCondition(args) {
    atomicNode(args, 0, (dsl) => {
        const n = dsl.getNode(args[1]);
        if (!n)
            fail(`Node not found: ${args[1]}`);
        const caseId = args[2];
        const field = args[3];
        const value = args[4];
        const cases = n.data.cases;
        if (!cases)
            fail(`Node ${args[1]} has no cases`);
        const cs = cases.find((c) => c.case_id === caseId);
        if (!cs)
            fail(`Case '${caseId}' not found`);
        const cond = cs.conditions?.[0];
        if (!cond)
            fail(`No condition in case '${caseId}'`);
        const fields = field.split(".");
        if (fields.length === 1) {
            cond[field] = value;
        }
        else {
            let obj = cond;
            for (let i = 0; i < fields.length - 1; i++)
                obj = obj[fields[i]];
            if (obj)
                obj[fields[fields.length - 1]] = value;
        }
    });
}
function atomNodeSetCode(args) {
    atomicNode(args, 0, (dsl) => {
        const ids = args[1].split(",");
        for (const id of ids) {
            const c = dsl.findCode(id.trim());
            if (!c)
                fail(`Code node not found: ${id.trim()}`);
            c.data.code = c.data.code.replace(args[2], args[3]);
        }
    });
}
// ── diff ──
function cmdDiff(args) {
    const fileA = resolvePath(args[0]);
    const fileB = resolvePath(args[1]);
    if (!fs.existsSync(fileA))
        fail(`File not found: ${fileA}`);
    if (!fs.existsSync(fileB))
        fail(`File not found: ${fileB}`);
    const strA = fs.readFileSync(fileA, "utf-8");
    const strB = fs.readFileSync(fileB, "utf-8");
    const a = DifyDSL_1.DifyDSL.parse(strA);
    const b = DifyDSL_1.DifyDSL.parse(strB);
    console.log(`A: ${a.nodeCount}n ${a.edgeCount}e  B: ${b.nodeCount}n ${b.edgeCount}e\n`);
    // Node diff
    const aIds = new Set([...a.index.byId.keys()]);
    const bIds = new Set([...b.index.byId.keys()]);
    const added = [...bIds].filter(id => !aIds.has(id));
    const removed = [...aIds].filter(id => !bIds.has(id));
    const shared = [...aIds].filter(id => bIds.has(id));
    if (added.length) {
        console.log(`+ Added ${added.length} nodes:`);
        for (const id of added) {
            const n = b.getNode(id);
            console.log(`  ${id} [${n?.data.type}] ${n?.title || ""}`);
        }
        console.log();
    }
    if (removed.length) {
        console.log(`- Removed ${removed.length} nodes:`);
        for (const id of removed) {
            const n = a.getNode(id);
            console.log(`  ${id} [${n?.data.type}] ${n?.title || ""}`);
        }
        console.log();
    }
    // Edge diff
    const aEdgeKeys = new Set([...a.index.edges.keys()]);
    const bEdgeKeys = new Set([...b.index.edges.keys()]);
    const edgesAdded = [...bEdgeKeys].filter(k => !aEdgeKeys.has(k));
    const edgesRemoved = [...aEdgeKeys].filter(k => !bEdgeKeys.has(k));
    if (edgesAdded.length || edgesRemoved.length) {
        console.log(`Edges: +${edgesAdded.length} -${edgesRemoved.length}`);
    }
    // Field changes in shared nodes
    const changed = [];
    for (const id of shared) {
        const na = a.getNode(id);
        const nb = b.getNode(id);
        const da = na.data;
        const db = nb.data;
        if (na.title !== nb.title)
            changed.push(`  ${id} title: "${na.title}" → "${nb.title}"`);
        if (na.desc !== nb.desc)
            changed.push(`  ${id} desc updated`);
        if (da.type === "llm") {
            const aTexts = (da.prompt_template || []).map((m) => m.text);
            const bTexts = (db.prompt_template || []).map((m) => m.text);
            for (let i = 0; i < Math.max(aTexts.length, bTexts.length); i++) {
                if (aTexts[i] !== bTexts[i]) {
                    changed.push(`  ${id} prompt[${i}] changed (${aTexts[i]?.length || 0} → ${bTexts[i]?.length || 0} chars)`);
                }
            }
        }
        if (da.type === "code" && da.code !== db.code) {
            const aLen = da.code?.length || 0;
            const bLen = db.code?.length || 0;
            changed.push(`  ${id} code changed (${aLen} → ${bLen} chars)`);
        }
        if (da.type === "if-else") {
            const aVals = (da.cases || []).flatMap((c) => (c.conditions || []).map((cc) => `${cc.variable_selector?.join(".")} ${cc.comparison_operator} ${cc.value}`));
            const bVals = (db.cases || []).flatMap((c) => (c.conditions || []).map((cc) => `${cc.variable_selector?.join(".")} ${cc.comparison_operator} ${cc.value}`));
            if (JSON.stringify(aVals) !== JSON.stringify(bVals)) {
                changed.push(`  ${id} conditions changed`);
            }
        }
        if (da.type === "answer" && da.answer !== db.answer) {
            changed.push(`  ${id} answer changed (${da.answer?.length || 0} → ${db.answer?.length || 0} chars)`);
        }
    }
    // Env/conv var changes
    if (JSON.stringify(a.envVariables) !== JSON.stringify(b.envVariables)) {
        changed.push(`  env_variables changed (${a.envVariables.length} → ${b.envVariables.length})`);
    }
    if (JSON.stringify(a.convVariables) !== JSON.stringify(b.convVariables)) {
        changed.push(`  conv_variables changed (${a.convVariables.length} → ${b.convVariables.length})`);
    }
    if (changed.length) {
        console.log(`${changed.length} field changes:`);
        for (const c of changed)
            console.log(c);
    }
    else if (!added.length && !removed.length) {
        console.log("No changes detected.");
    }
}
// ── edge list ──
function cmdEdgeList(args) {
    const file = resolvePath(args[0]);
    const filterId = args[1];
    if (!fs.existsSync(file))
        fail(`File not found: ${file}`);
    const str = fs.readFileSync(file, "utf-8");
    const dsl = DifyDSL_1.DifyDSL.parse(str);
    const edges = filterId ? dsl.getNodeEdges(filterId) : [...dsl.index.edges.values()];
    if (edges.length === 0) {
        console.log("No edges.");
        return;
    }
    console.log(`${"Source".padEnd(16)} ${"Handle".padEnd(20)} → ${"Target".padEnd(16)} Handle`);
    console.log("-".repeat(70));
    for (const e of edges) {
        const src = dsl.getNode(e.source);
        const tgt = dsl.getNode(e.target);
        console.log(`${e.source.padEnd(16)} ${e.sourceHandle.padEnd(20)} → ${e.target.padEnd(16)} ${e.targetHandle}`);
    }
    console.log(`\n${edges.length} edges${filterId ? ` (filtered: ${filterId})` : ""}`);
}
// ── path ──
function cmdPath(args) {
    const file = resolvePath(args[0]);
    const from = args[1];
    const to = args[2];
    if (!fs.existsSync(file))
        fail(`File not found: ${file}`);
    if (!from || !to)
        fail("Usage: dify-dsl-cli path <file> <from-id> <to-id>");
    const str = fs.readFileSync(file, "utf-8");
    const dsl = DifyDSL_1.DifyDSL.parse(str);
    // BFS
    const visited = new Set();
    const parent = new Map();
    const queue = [from];
    visited.add(from);
    while (queue.length > 0) {
        const cur = queue.shift();
        if (cur === to)
            break;
        for (const e of dsl.index.getOutEdges(cur)) {
            if (!visited.has(e.target)) {
                visited.add(e.target);
                parent.set(e.target, cur);
                queue.push(e.target);
            }
        }
    }
    if (!parent.has(to) && from !== to) {
        console.log(`No path found from ${from} to ${to}`);
        return;
    }
    // Reconstruct path
    const path = [to];
    let cur = to;
    while (cur !== from) {
        cur = parent.get(cur);
        path.unshift(cur);
    }
    console.log(`Path (${path.length - 1} hops):\n`);
    for (let i = 0; i < path.length; i++) {
        const n = dsl.getNode(path[i]);
        const type = n?.data.type || "?";
        const connector = i < path.length - 1 ? " → " : "";
        if (i > 0) {
            const edges = dsl.index.getOutEdges(path[i - 1]);
            const edge = edges.find(e => e.target === path[i]);
            if (edge && edge.sourceHandle !== "source") {
                process.stdout.write(`  ─▶${edge.sourceHandle}▶ `);
            }
            else {
                process.stdout.write("  → ");
            }
        }
        console.log(`${nodeLabel(n, false)}${connector}`);
    }
}
// ── Main ──
async function main() {
    const cmd = process.argv[2];
    if (!cmd || cmd === "-h" || cmd === "--help") {
        console.log(USAGE.trim());
        process.exit(0);
    }
    const args = process.argv.slice(3);
    switch (cmd) {
        case "roundtrip":
            if (args.length < 1)
                fail("Usage: dify-dsl-cli roundtrip <input> [output]");
            cmd_roundtrip(args);
            break;
        case "validate":
            if (args.length < 1)
                fail("Usage: dify-dsl-cli validate <file>");
            cmd_validate(args);
            break;
        case "info":
            if (args.length < 1)
                fail("Usage: dify-dsl-cli info <file>");
            cmd_info(args);
            break;
        case "flow":
            if (args.length < 1)
                fail("Usage: dify-dsl-cli flow <file> [--short]");
            cmd_flow(args);
            break;
        case "find":
            if (args.length < 2)
                fail("Usage: dify-dsl-cli find <file> <text>");
            cmdFind(args);
            break;
        case "diff":
            if (args.length < 2)
                fail("Usage: dify-dsl-cli diff <yml1> <yml2>");
            cmdDiff(args);
            break;
        case "path":
            if (args.length < 3)
                fail("Usage: dify-dsl-cli path <file> <from-id> <to-id>");
            cmdPath(args);
            break;
        case "apply":
            if (args.length < 1)
                fail("Usage: dify-dsl-cli apply <patch.yml> -i <input> -o <output>");
            {
                const patchFile = resolvePath(args[0]);
                let input = "", output = "";
                for (let i = 1; i < args.length; i++) {
                    if (args[i] === "-i")
                        input = resolvePath(args[++i]);
                    else if (args[i] === "-o")
                        output = resolvePath(args[++i]);
                }
                if (!input || !output)
                    fail("Usage: dify-dsl-cli apply <patch.yml> -i <input> -o <output>");
                cmd_apply(patchFile, input, output);
            }
            break;
        case "node":
            if (args.length < 1)
                fail("Usage: dify-dsl-cli node <subcommand> ...");
            if (args[0] === "show") {
                if (args.length < 2)
                    fail("Usage: dify-dsl-cli node show <file> <id> [--json]");
                cmdNodeShow(args.slice(1));
            }
            else if (args[0] === "list") {
                if (args.length < 2)
                    fail("Usage: dify-dsl-cli node list <file> [type]");
                cmdNodeList(args.slice(1));
            }
            else if (args[0] === "set-title") {
                if (args.length < 3)
                    fail("Usage: dify-dsl-cli node set-title <file> <id> <title>");
                atomNodeSetTitle(args.slice(1));
            }
            else if (args[0] === "set-desc") {
                if (args.length < 3)
                    fail("Usage: dify-dsl-cli node set-desc <file> <id> <desc>");
                atomNodeSetDesc(args.slice(1));
            }
            else if (args[0] === "set-prompt") {
                if (args.length < 5)
                    fail("Usage: dify-dsl-cli node set-prompt <file> <id> <role> <replace> <with>");
                atomNodeSetPrompt(args.slice(1));
            }
            else if (args[0] === "set-code") {
                if (args.length < 4)
                    fail("Usage: dify-dsl-cli node set-code <file> <id> <replace> <with>");
                atomNodeSetCode(args.slice(1));
            }
            else if (args[0] === "set-condition") {
                if (args.length < 5)
                    fail("Usage: dify-dsl-cli node set-condition <file> <id> <case_id> <field> <value>");
                atomNodeSetCondition(args.slice(1));
            }
            else {
                fail(`Unknown node subcommand: ${args[0]}`);
            }
            break;
        case "edge":
            if (args.length < 1)
                fail("Usage: dify-dsl-cli edge <list|add|remove> ...");
            if (args[0] === "list") {
                if (args.length < 2)
                    fail("Usage: dify-dsl-cli edge list <file> [node-id]");
                cmdEdgeList(args.slice(1));
            }
            else if (args[0] === "add") {
                if (args.length < 3)
                    fail("Usage: dify-dsl-cli edge add <file> <source> <target> [handle]");
                atomEdgeAdd(args.slice(1));
            }
            else if (args[0] === "remove") {
                if (args.length < 3)
                    fail("Usage: dify-dsl-cli edge remove <file> <source> <target> [handle]");
                atomEdgeRemove(args.slice(1));
            }
            else {
                fail(`Unknown edge subcommand: ${args[0]}`);
            }
            break;
        case "remove":
            if (args.length < 2)
                fail("Usage: dify-dsl-cli remove <file> <id>");
            atomRemove(args);
            break;
        default:
            fail(`Unknown command: ${cmd}\nUse --help for usage.`);
    }
}
main().catch(console.error);
