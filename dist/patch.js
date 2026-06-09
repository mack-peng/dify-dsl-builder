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
exports.loadPatch = loadPatch;
exports.applyPatch = applyPatch;
const yaml = __importStar(require("js-yaml"));
const fs = __importStar(require("fs"));
const edge_1 = require("./edge");
const code_1 = require("./nodes/code");
// ── Step appliers ──
function getKey(s) {
    return Object.keys(s)[0];
}
function applyStep(dsl, raw) {
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
            dsl.graph.addEdge(new edge_1.Edge(val.source, val.target, val.handle || "source"));
            break;
        }
        case "add-code-node": {
            const node = new code_1.CodeNode(val.id, {
                title: val.title,
                desc: val.desc || "",
                code: val.code,
                code_language: val.code_language || "python3",
                variables: val.variables || [],
            });
            if (val.outputs) {
                node.data.outputs = val.outputs;
            }
            dsl.graph.add(node);
            if (val.position)
                node.setPosition(val.position.x, val.position.y);
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
            if (n)
                n.setTitle(val.value);
            break;
        }
        case "set-desc": {
            const n = dsl.graph.find(val.id);
            if (n)
                n.setDesc(val.value);
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
            if (n)
                n.setPosition(val.x, val.y);
            break;
        }
        case "set-answer": {
            const a = dsl.graph.findAnswer(val.id);
            if (a)
                a.data.answer = val.answer;
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
            if (c)
                c.data.code = c.data.code.replace(val.replace, val.with);
            break;
        }
        case "set-start-var": {
            const s = dsl.graph.findStart(val.id);
            if (s) {
                for (const v of s.data.variables) {
                    if (v.variable === val.variable) {
                        v[val.field] = val.value;
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
function loadPatch(filePath) {
    const raw = yaml.load(fs.readFileSync(filePath, "utf-8"));
    return {
        description: raw.description,
        steps: raw.steps,
    };
}
function applyPatch(dsl, steps) {
    for (const step of steps) {
        applyStep(dsl, step);
    }
}
