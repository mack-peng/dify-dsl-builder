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
exports.load = load;
exports.loadFromFile = loadFromFile;
const yaml = __importStar(require("js-yaml"));
const fs = __importStar(require("fs"));
const graph_1 = require("./graph");
const features_1 = require("./features");
const nodes_1 = require("./nodes");
const edge_1 = require("./edge");
function load(yamlStr) {
    const raw = yaml.load(yamlStr);
    const graph = new graph_1.Graph();
    // Gather all raw nodes indexed by id
    const rawNodeMap = new Map();
    for (const rn of raw.workflow.graph.nodes) {
        rawNodeMap.set(rn.id, rn);
    }
    // Pass 1: build top-level nodes (skip iteration-start and iteration children)
    const iterStartNodes = [];
    for (const rn of raw.workflow.graph.nodes) {
        const dtype = rn.data?.type;
        if (dtype === "iteration-start") {
            iterStartNodes.push(rn);
            continue;
        }
        // Skip iteration children (have parentId) — they're added in Pass 2
        if (rn.parentId)
            continue;
        const Ctor = nodes_1.NODE_TYPE_MAP[dtype];
        if (!Ctor) {
            console.warn(`Unknown node type: ${dtype} (id=${rn.id}), skipping`);
            continue;
        }
        const node = Ctor.fromYAML(rn);
        graph.add(node);
    }
    // Pass 2: wire up iteration children
    // Connect iteration-start nodes to their parent IterationNode
    for (const rn of iterStartNodes) {
        const parentId = rn.parentId;
        const iterNode = graph.findIteration(parentId);
        if (iterNode) {
            const startNode = nodes_1.IterationStartNode.fromYAML(rn);
            iterNode.startNode = startNode;
        }
    }
    // Find any remaining nodes inside iterations (parentId set but not iteration-start)
    for (const rn of raw.workflow.graph.nodes) {
        const parentId = rn.parentId;
        const dtype = rn.data?.type;
        if (!parentId || dtype === "iteration-start")
            continue;
        const iterNode = graph.findIteration(parentId);
        if (iterNode) {
            const Ctor = nodes_1.NODE_TYPE_MAP[dtype];
            if (Ctor) {
                const childNode = Ctor.fromYAML(rn);
                iterNode.addChild(childNode, {});
            }
        }
    }
    // Post-process: set zIndex on all nodes (including iteration children)
    for (const rn of raw.workflow.graph.nodes) {
        if (rn.zIndex !== undefined) {
            const node = graph.find(rn.id);
            if (node)
                node.setZIndex(rn.zIndex);
        }
    }
    // Pass 3: build edges
    for (const re of raw.workflow.graph.edges) {
        const edge = edge_1.Edge.fromYAML(re);
        graph.addEdge(edge);
    }
    // Viewport
    if (raw.workflow.graph.viewport) {
        graph.setViewport(raw.workflow.graph.viewport);
    }
    // Features
    const features = features_1.Features.fromYAML(raw.workflow.features);
    return {
        version: raw.version,
        kind: raw.kind,
        app: raw.app,
        dependencies: raw.dependencies,
        graph,
        features,
        envVariables: raw.workflow.environment_variables ?? [],
        convVariables: raw.workflow.conversation_variables ?? [],
        ragVariables: raw.workflow.rag_pipeline_variables ?? [],
    };
}
function loadFromFile(filePath) {
    const yamlStr = fs.readFileSync(filePath, "utf-8");
    return load(yamlStr);
}
