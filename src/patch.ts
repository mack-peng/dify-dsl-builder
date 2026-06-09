import * as yaml from "js-yaml";
import * as fs from "fs";
import { DifyDSL } from "./index";
import { Edge } from "./edge";
import { CodeNode } from "./nodes/code";

// ── Patch step types ──

interface RemoveEdgeStep {
  "remove-edge": { source: string; target: string };
}
interface RemoveNodeStep {
  "remove-node": { id: string };
}
interface AddEdgeStep {
  "add-edge": { source: string; target: string; handle?: string };
}
interface AddCodeNodeStep {
  "add-code-node": {
    id: string; title: string; desc?: string;
    code: string; code_language?: "python3" | "javascript";
    position?: { x: number; y: number };
    variables?: { variable: string; value_selector: [string, string]; value_type?: string }[];
    outputs?: Record<string, { type: string }>;
  };
}
interface AddClassifierClassStep {
  "add-classifier-class": { classifier: string; id: string; name: string };
}
interface SetTitleStep {
  "set-title": { id: string; value: string };
}
interface SetDescStep {
  "set-desc": { id: string; value: string };
}
interface SetPromptStep {
  "set-prompt": { id: string; role: string; replace: string; with: string };
}
interface SetPositionStep {
  "set-position": { id: string; x: number; y: number };
}
interface SetAnswerTemplateStep {
  "set-answer": { id: string; answer: string };
}
interface SetEnvStep {
  "env-set": { name: string; value: number; type: "string" | "number" };
}
interface RemoveEnvStep {
  "env-remove": { name: string };
}
interface SetConvStep {
  "conv-set": { name: string; value_type?: string };
}
interface SetCodeStep {
  "set-code": { id: string; replace: string; with: string };
}
interface SetStartVarStep {
  "set-start-var": { id: string; variable: string; field: string; value: string };
}

type PatchStep =
  | RemoveEdgeStep | RemoveNodeStep | AddEdgeStep | AddCodeNodeStep
  | AddClassifierClassStep | SetTitleStep | SetDescStep | SetPromptStep
  | SetPositionStep | SetAnswerTemplateStep | SetEnvStep | RemoveEnvStep
  | SetConvStep | SetCodeStep | SetStartVarStep;

// ── Step appliers ──

function getKey(s: Record<string, any>): string {
  return Object.keys(s)[0];
}

function applyStep(dsl: DifyDSL, raw: Record<string, any>): void {
  const key = getKey(raw);
  const val = raw[key];

  switch (key) {
    case "remove-edge": {
      const id = `${val.source}-${val.sourceHandle || "source"}-${val.target}-target`;
      dsl.graph.removeEdge(id);
      // Also try with true/false handle
      dsl.graph.removeEdge(`${val.source}-true-${val.target}-target`);
      dsl.graph.removeEdge(`${val.source}-false-${val.target}-target`);
      break;
    }
    case "remove-node": {
      dsl.graph.remove(val.id);
      break;
    }
    case "add-edge": {
      dsl.graph.addEdge(new Edge(val.source, val.target, val.handle || "source"));
      break;
    }
    case "add-code-node": {
      const node = new CodeNode(val.id, {
        title: val.title,
        desc: val.desc || "",
        code: val.code,
        code_language: val.code_language || "python3",
        variables: val.variables || [],
      });
      if (val.outputs) {
        node.data.outputs = val.outputs as any;
      }
      dsl.graph.add(node);
      if (val.position) node.setPosition(val.position.x, val.position.y);
      break;
    }
    case "add-classifier-class": {
      const cls = dsl.graph.findClassifier(val.classifier);
      if (cls) {
        cls.data.classes?.push({ id: val.id, name: val.name, description: "" });
      }
      break;
    }
    case "set-title": {
      const n = dsl.graph.find(val.id);
      if (n) (n as any).setTitle(val.value);
      break;
    }
    case "set-desc": {
      const n = dsl.graph.find(val.id);
      if (n) (n as any).setDesc(val.value);
      break;
    }
    case "set-prompt": {
      const llm = dsl.graph.findLLM(val.id);
      if (llm) {
        for (const msg of llm.data.prompt_template) {
          if (msg.role === val.role) {
            msg.text = msg.text.replace(val.replace, val.with);
          }
        }
      }
      break;
    }
    case "set-position": {
      const n = dsl.graph.find(val.id);
      if (n) (n as any).setPosition(val.x, val.y);
      break;
    }
    case "set-answer": {
      const a = dsl.graph.findAnswer(val.id);
      if (a) a.data.answer = val.answer;
      break;
    }
    case "env-set": {
      dsl.setEnv(val.name, val.value, val.type);
      break;
    }
    case "env-remove": {
      dsl.removeEnv(val.name);
      break;
    }
    case "conv-set": {
      dsl.setConv(val.name, val.value_type || "string");
      break;
    }
    case "set-code": {
      const c = dsl.graph.findCode(val.id);
      if (c) c.data.code = c.data.code.replace(val.replace, val.with);
      break;
    }
    case "set-start-var": {
      const s = dsl.graph.findStart(val.id);
      if (s) {
        for (const v of s.data.variables) {
          if (v.variable === val.variable) {
            (v as any)[val.field] = val.value;
          }
        }
      }
      break;
    }
    default:
      console.warn(`Unknown patch step: ${key}`);
  }
}

// ── Public API ──

export function loadPatch(filePath: string): { steps: Record<string, any>[]; description?: string } {
  const raw = yaml.load(fs.readFileSync(filePath, "utf-8")) as Record<string, any>;
  return {
    description: raw.description as string,
    steps: raw.steps as Record<string, any>[],
  };
}

export function applyPatch(dsl: DifyDSL, steps: Record<string, any>[]): void {
  for (const step of steps) {
    applyStep(dsl, step);
  }
}
