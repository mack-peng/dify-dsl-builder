#!/usr/bin/env node
import { parseArgs } from "node:util";
import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { DifyDSL } from "./core/DifyDSL";
import { loadPatch, applyPatch } from "./patch";

const USAGE = `
dify-dsl-cli <command> [options]

Commands:
  roundtrip <input> [output]     Load YAML → save, verify round-trip
  validate   <file>              Run Ruby DSL validator
  info       <file>              Print node/edge stats
  apply      <patch> -i <in> -o <out>  Apply YAML patch file

Atomic commands:
  node set-title   <file> <id> <title>
  node set-desc    <file> <id> <desc>
  node set-prompt  <file> <id> <role> <replace> <with>
  edge add         <file> <src> <tgt> [handle]
  edge remove      <file> <src> <tgt> [handle]
  remove           <file> <id>
`;

function fail(msg: string): never {
  console.error(msg);
  process.exit(1);
}

function resolvePath(p: string): string {
  return path.isAbsolute(p) ? p : path.resolve(p);
}

// ── Commands ──

function cmd_roundtrip(args: string[]) {
  const input = resolvePath(args[0]);
  const output = args[1] ? resolvePath(args[1]) : input.replace(/\.yml$/, ".roundtrip.yml");
  if (!fs.existsSync(input)) fail(`File not found: ${input}`);

  const str = fs.readFileSync(input, "utf-8");
  const dsl = DifyDSL.parse(str);
  console.log(`Load: ${dsl.nodeCount} nodes, ${dsl.edgeCount} edges, mode=${dsl.mode}`);
  dsl.save(output);
  console.log(`Save: ${output}`);

  // Validate
  try {
    const script = path.join(__dirname, "..", "..", "dify-builder-agent", "scripts", "validate-dsl.rb");
    const result = execSync(`ruby "${script}" "${output}" 2>&1`, { encoding: "utf-8", timeout: 10000 });
    console.log(result);
  } catch (e: any) {
    console.log(e.stdout || e.stderr || String(e));
  }
}

function cmd_validate(args: string[]) {
  const file = resolvePath(args[0]);
  if (!fs.existsSync(file)) fail(`File not found: ${file}`);
  const script = path.join(__dirname, "..", "..", "dify-builder-agent", "scripts", "validate-dsl.rb");
  try {
    const result = execSync(`ruby "${script}" "${file}" 2>&1`, { encoding: "utf-8", timeout: 10000 });
    console.log(result);
  } catch (e: any) {
    console.log(e.stdout || e.stderr || String(e));
  }
}

function cmd_info(args: string[]) {
  const file = resolvePath(args[0]);
  if (!fs.existsSync(file)) fail(`File not found: ${file}`);
  const str = fs.readFileSync(file, "utf-8");
  const dsl = DifyDSL.parse(str);
  console.log(`File:     ${file}`);
  console.log(`Mode:     ${dsl.mode}`);
  console.log(`Nodes:    ${dsl.nodeCount}`);
  console.log(`Edges:    ${dsl.edgeCount}`);

  const types = new Map<string, number>();
  for (const n of dsl.index.byId.values()) {
    const t = n.data?.type || "?";
    types.set(t, (types.get(t) || 0) + 1);
  }
  console.log("\nNode types:");
  for (const [t, c] of [...types].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${t.padEnd(24)} ${c}`);
  }
}

function cmd_apply(patchFile: string, input: string, output: string) {
  if (!fs.existsSync(input)) fail(`File not found: ${input}`);
  if (!fs.existsSync(patchFile)) fail(`Patch file not found: ${patchFile}`);

  const str = fs.readFileSync(input, "utf-8");
  const dsl = DifyDSL.parse(str);
  const { description, steps } = loadPatch(patchFile);
  if (description) console.log(`Patch: ${description}`);
  console.log(`Load:  ${dsl.nodeCount} nodes, ${dsl.edgeCount} edges`);

  applyPatch(dsl, steps);

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

function atomicNode(args: string[], fileIdx: number, action: (dsl: DifyDSL) => void) {
  const file = resolvePath(args[fileIdx]);
  if (!fs.existsSync(file)) fail(`File not found: ${file}`);
  const str = fs.readFileSync(file, "utf-8");
  const dsl = DifyDSL.parse(str);
  action(dsl);
  dsl.save(file);
  console.log(`Saved: ${file}`);
}

function atomNodeSetTitle(args: string[]) {
  atomicNode(args, 0, (dsl) => {
    const n = dsl.getNode(args[1]);
    if (n) n.setTitle(args[2]);
    else fail(`Node not found: ${args[1]}`);
  });
}

function atomNodeSetDesc(args: string[]) {
  atomicNode(args, 0, (dsl) => {
    const n = dsl.getNode(args[1]);
    if (n) n.setDesc(args[2]);
    else fail(`Node not found: ${args[1]}`);
  });
}

function atomNodeSetPrompt(args: string[]) {
  atomicNode(args, 0, (dsl) => {
    const llm = dsl.findLLM(args[1]);
    if (!llm) fail(`LLM not found: ${args[1]}`);
    const role = args[2];
    const search = args[3];
    const replace = args[4];
    let found = false;
    for (const msg of (llm.data as any).prompt_template) {
      if (msg.role === role) {
        msg.text = msg.text.replace(search, replace);
        found = true;
      }
    }
    if (!found) fail(`No prompt with role '${role}'`);
  });
}

function atomEdgeAdd(args: string[]) {
  atomicNode(args, 0, (dsl) => {
    dsl.addEdge(args[1], args[2], args[3] || "source");
  });
}

function atomEdgeRemove(args: string[]) {
  atomicNode(args, 0, (dsl) => {
    const id = args[3]
      ? `${args[1]}-${args[3]}-${args[2]}-target`
      : `${args[1]}-source-${args[2]}-target`;
    const before = dsl.edgeCount;
    dsl.removeEdge(id);
    if (dsl.edgeCount === before) fail(`Edge not found: ${id}`);
  });
}

function atomRemove(args: string[]) {
  atomicNode(args, 0, (dsl) => {
    const n = dsl.getNode(args[1]);
    if (!n) fail(`Node not found: ${args[1]}`);
    dsl.removeNode(args[1]);
  });
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
      if (args.length < 1) fail("Usage: dify-dsl-cli roundtrip <input> [output]");
      cmd_roundtrip(args);
      break;
    case "validate":
      if (args.length < 1) fail("Usage: dify-dsl-cli validate <file>");
      cmd_validate(args);
      break;
    case "info":
      if (args.length < 1) fail("Usage: dify-dsl-cli info <file>");
      cmd_info(args);
      break;
    case "apply":
      if (args.length < 1) fail("Usage: dify-dsl-cli apply <patch.yml> -i <input> -o <output>");
      // Parse -i and -o flags from args
      {
        const patchFile = resolvePath(args[0]);
        let input = "", output = "";
        for (let i = 1; i < args.length; i++) {
          if (args[i] === "-i") input = resolvePath(args[++i]);
          else if (args[i] === "-o") output = resolvePath(args[++i]);
        }
        if (!input || !output) fail("Usage: dify-dsl-cli apply <patch.yml> -i <input> -o <output>");
        cmd_apply(patchFile, input, output);
      }
      break;
    case "node":
      if (args.length < 1) fail("Usage: dify-dsl-cli node <subcommand> ...");
      if (args[0] === "set-title") {
        if (args.length < 3) fail("Usage: dify-dsl-cli node set-title <file> <id> <title>");
        atomNodeSetTitle(args.slice(1));
      } else if (args[0] === "set-desc") {
        if (args.length < 3) fail("Usage: dify-dsl-cli node set-desc <file> <id> <desc>");
        atomNodeSetDesc(args.slice(1));
      } else if (args[0] === "set-prompt") {
        if (args.length < 5) fail("Usage: dify-dsl-cli node set-prompt <file> <id> <role> <replace> <with>");
        atomNodeSetPrompt(args.slice(1));
      } else {
        fail(`Unknown node subcommand: ${args[0]}`);
      }
      break;
    case "edge":
      if (args.length < 1) fail("Usage: dify-dsl-cli edge <add|remove> ...");
      if (args[0] === "add") {
        if (args.length < 3) fail("Usage: dify-dsl-cli edge add <file> <source> <target> [handle]");
        atomEdgeAdd(args.slice(1));
      } else if (args[0] === "remove") {
        if (args.length < 3) fail("Usage: dify-dsl-cli edge remove <file> <source> <target> [handle]");
        atomEdgeRemove(args.slice(1));
      } else {
        fail(`Unknown edge subcommand: ${args[0]}`);
      }
      break;
    case "remove":
      if (args.length < 2) fail("Usage: dify-dsl-cli remove <file> <id>");
      atomRemove(args);
      break;
    default:
      fail(`Unknown command: ${cmd}\nUse --help for usage.`);
  }
}

main().catch(console.error);
