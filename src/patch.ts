import * as yaml from "js-yaml";
import * as fs from "fs";
import { DifyDSL } from "./core/DifyDSL";
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
  "set-prompt": { id: string; role: string; replace: string; with: string; replaceAll?: boolean };
}
interface SetCodeStep {
  "set-code": { id: string; replace: string; with: string; replaceAll?: boolean };
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
interface SetStartVarStep {
  "set-start-var": { id: string; variable: string; field: string; value: string };
}
interface UpdateConditionStep {
  "update-condition": {
    id: string; case_id: string;
    condition_index?: number;
    field: string; value: string | number;
  };
}
interface RemoveClassifierClassStep {
  "remove-classifier-class": { classifier: string; id: string };
}

type PatchStep =
  | RemoveEdgeStep | RemoveNodeStep | AddEdgeStep | AddCodeNodeStep
  | AddClassifierClassStep | SetTitleStep | SetDescStep | SetPromptStep
  | SetCodeStep | SetPositionStep | SetAnswerTemplateStep | SetEnvStep
  | RemoveEnvStep | SetConvStep | SetStartVarStep
  | UpdateConditionStep | RemoveClassifierClassStep;

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
      dsl.removeEdge(id);
      dsl.removeEdge(`${val.source}-true-${val.target}-target`);
      dsl.removeEdge(`${val.source}-false-${val.target}-target`);
      break;
    }
    case "remove-node": {
      dsl.removeNode(val.id);
      break;
    }
    case "add-edge": {
      dsl.addEdge(val.source, val.target, val.handle || "source");
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
      dsl.addNode(node);
      if (val.position) node.setPosition(val.position.x, val.position.y);
      break;
    }
    case "add-classifier-class": {
      const cls = dsl.findClassifier(val.classifier);
      if (cls) {
        (cls.data as any).classes?.push({ id: val.id, name: val.name, description: "" });
      }
      break;
    }
    case "set-title": {
      const n = dsl.getNode(val.id);
      if (n) n.setTitle(val.value);
      break;
    }
    case "set-desc": {
      const n = dsl.getNode(val.id);
      if (n) n.setDesc(val.value);
      break;
    }
    case "set-prompt": {
      const llm = dsl.findLLM(val.id);
      if (llm) {
        for (const msg of (llm.data as any).prompt_template) {
          if (msg.role === val.role) {
            msg.text = val.replaceAll
              ? (msg.text as string).replaceAll(val.replace, val.with)
              : (msg.text as string).replace(val.replace, val.with);
          }
        }
      }
      break;
    }
    case "set-position": {
      const n = dsl.getNode(val.id);
      if (n) n.setPosition(val.x, val.y);
      break;
    }
    case "set-answer": {
      const a = dsl.findAnswer(val.id);
      if (a) (a.data as any).answer = val.answer;
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
      const c = dsl.findCode(val.id);
      if (c) {
        (c.data as any).code = val.replaceAll
          ? (c.data as any).code.replaceAll(val.replace, val.with)
          : (c.data as any).code.replace(val.replace, val.with);
      }
      break;
    }
    case "set-start-var": {
      const s = dsl.findStart(val.id);
      if (s) {
        for (const v of (s.data as any).variables) {
          if (v.variable === val.variable) {
            v[val.field] = val.value;
          }
        }
      }
      break;
    }
    case "update-condition": {
      const n = dsl.getNode(val.id);
      if (!n) break;
      const cases = (n.data as any).cases;
      if (!cases) break;
      const caseIdx = cases.findIndex((c: any) => c.case_id === val.case_id);
      if (caseIdx < 0) break;
      const condIdx = val.condition_index ?? 0;
      const cond = cases[caseIdx].conditions?.[condIdx];
      if (!cond) break;
      // Support dotted paths like "variable_selector.0"
      const fields = val.field.split(".");
      if (fields.length === 1) {
        cond[val.field] = val.value;
      } else {
        let obj = cond;
        for (let i = 0; i < fields.length - 1; i++) {
          obj = obj[fields[i]];
          if (!obj) break;
        }
        if (obj) obj[fields[fields.length - 1]] = val.value;
      }
      break;
    }
    case "remove-classifier-class": {
      const cls = dsl.findClassifier(val.classifier);
      if (cls) {
        const classes = (cls.data as any).classes as any[];
        if (classes) {
          const idx = classes.findIndex((c: any) => c.id === val.id);
          if (idx >= 0) classes.splice(idx, 1);
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
