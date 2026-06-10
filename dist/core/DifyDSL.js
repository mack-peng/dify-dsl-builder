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
exports.DifyDSL = void 0;
const fs = __importStar(require("fs"));
const yaml = __importStar(require("js-yaml"));
const index_1 = require("../nodes/index");
const NodeIndex_1 = require("./NodeIndex");
/**
 * 7-step pipeline:
 * ① parse(yamlStr)   → raw JSON
 * ② index()          → NodeIndex (typed nodes + edges)
 * ③ (implicit: edges provide connectivity)
 * ④ CRUD             → getNode / addNode / removeNode / updateNode
 * ⑤ Node.methods()   → instance modifications
 * ⑥ toJSON()         → Dify DSL JSON plain object
 * ⑦ toYAML()         → yaml.dump() + replace
 */
class DifyDSL {
    version;
    kind = "app";
    app;
    dependencies;
    envVariables;
    convVariables;
    ragVariables;
    features;
    viewport;
    index;
    constructor(version, app, deps, envVars, convVars, ragVars, features, viewport, index) {
        this.version = version;
        this.app = app;
        this.dependencies = deps;
        this.envVariables = envVars;
        this.convVariables = convVars;
        this.ragVariables = ragVars;
        this.features = features;
        this.viewport = viewport;
        this.index = index;
    }
    // ─────── ① parse ───────
    /**
     * Parse YAML string and build the internal index.
     * Steps ① + ② combined.
     */
    static parse(yamlStr) {
        const raw = yaml.load(yamlStr);
        const workflow = raw.workflow;
        // Build typed nodes from raw
        const nodes = buildNodes(workflow.graph.nodes);
        const edges = buildEdges(workflow.graph.edges);
        const index = new NodeIndex_1.NodeIndex();
        index.rebuild(nodes, edges);
        return new DifyDSL(raw.version, raw.app, raw.dependencies ?? [], workflow.environment_variables ?? [], workflow.conversation_variables ?? [], workflow.rag_pipeline_variables ?? [], workflow.features ?? {}, workflow.graph.viewport ?? { x: 0, y: 0, zoom: 0.7 }, index);
    }
    // ─────── ③ connectivity (implicit: index provides it) ───────
    // ─────── ④ CRUD ───────
    getNode(id) {
        return this.index.getNode(id);
    }
    findByType(type) {
        return this.index.getNodesByType(type);
    }
    addNode(node) {
        this.index.addNode(node);
    }
    removeNode(id) {
        this.index.removeNode(id);
    }
    /**
     * Get → mutate → sync back.
     * The callback receives the node instance and can call its methods directly.
     * After mutation, the index is already updated (no extra sync needed).
     */
    updateNode(id, fn) {
        const node = this.index.getNode(id);
        if (!node)
            throw new Error(`Node not found: ${id}`);
        fn(node);
    }
    /** Get predecessor node IDs (upstream) */
    getPrevIds(id) {
        return this.index.getPrevIds(id);
    }
    /** Get successor node IDs (downstream) */
    getNextIds(id) {
        return this.index.getNextIds(id);
    }
    /** Get all edges related to a node (incoming + outgoing) */
    getNodeEdges(id) {
        return [...this.index.getInEdges(id), ...this.index.getOutEdges(id)];
    }
    /** Convenience type-checked finders (for patch system compat) */
    findStart(id) {
        const n = this.index.getNode(id);
        return n?.data.type === "start" ? n : undefined;
    }
    findLLM(id) {
        const n = this.index.getNode(id);
        return n?.data.type === "llm" ? n : undefined;
    }
    findCode(id) {
        const n = this.index.getNode(id);
        return n?.data.type === "code" ? n : undefined;
    }
    findKnowledge(id) {
        const n = this.index.getNode(id);
        return n?.data.type === "knowledge-retrieval" ? n : undefined;
    }
    findAnswer(id) {
        const n = this.index.getNode(id);
        return n?.data.type === "answer" ? n : undefined;
    }
    findClassifier(id) {
        const n = this.index.getNode(id);
        return n?.data.type === "question-classifier" ? n : undefined;
    }
    /** Add an edge by source/target IDs */
    addEdge(source, target, sourceHandle = "source") {
        const src = this.index.getNode(source);
        const tgt = this.index.getNode(target);
        if (!src || !tgt)
            throw new Error(`addEdge: node not found: ${source} or ${target}`);
        const eid = `${source}-${sourceHandle}-${target}-target`;
        this.index.addEdge({
            id: eid, source, sourceHandle, target,
            targetHandle: "target", type: "custom", zIndex: 0,
            data: {
                sourceType: src.data.type,
                targetType: tgt.data.type,
                isInIteration: false, isInLoop: false,
            },
        });
    }
    /** Remove an edge by id */
    removeEdge(edgeId) { this.index.removeEdge(edgeId); }
    /** Number of nodes */
    get nodeCount() { return this.index.byId.size; }
    /** Number of edges */
    get edgeCount() { return this.index.edges.size; }
    /** Mode string */
    get mode() { return this.app.mode; }
    /** Save to file */
    save(filePath) {
        fs.writeFileSync(filePath, this.toYAML(), "utf-8");
    }
    // ─── Environment / conversation variables (for patch compat) ───
    setEnv(name, value, type) {
        const existing = this.envVariables.find((e) => e.name === name);
        if (existing) {
            existing.value = value;
            existing.value_type = type;
        }
        else {
            this.envVariables.push({
                id: crypto.randomUUID(),
                name,
                value,
                value_type: type,
                description: "",
                selector: ["env", name],
            });
        }
    }
    removeEnv(name) {
        this.envVariables = this.envVariables.filter((e) => e.name !== name);
    }
    setConv(name, type = "string") {
        const existing = this.convVariables.find((c) => c.name === name);
        if (existing) {
            existing.value_type = type;
        }
        else {
            this.convVariables.push({
                id: crypto.randomUUID(),
                name,
                value_type: type,
                description: "",
                selector: ["conversation", name],
                value: type === "number" ? 0 : "",
            });
        }
    }
    // ─────── ⑥ toJSON ───────
    toJSON() {
        const nodeJSONs = [];
        const edgeJSONs = [];
        // Collect all nodes (including iteration children)
        const visited = new Set();
        for (const n of this.index.byId.values()) {
            if (visited.has(n.id))
                continue;
            visited.add(n.id);
            nodeJSONs.push(n.toJSON());
        }
        for (const e of this.index.edges.values()) {
            edgeJSONs.push({
                id: e.id,
                source: e.source,
                sourceHandle: e.sourceHandle,
                target: e.target,
                targetHandle: e.targetHandle,
                type: e.type,
                zIndex: e.zIndex,
                data: e.data,
            });
        }
        return {
            version: this.version,
            kind: "app",
            app: { ...this.app },
            dependencies: [...this.dependencies],
            workflow: {
                conversation_variables: [...this.convVariables],
                environment_variables: [...this.envVariables],
                features: { ...this.features },
                graph: {
                    nodes: nodeJSONs,
                    edges: edgeJSONs,
                    viewport: { ...this.viewport },
                },
                rag_pipeline_variables: [...this.ragVariables],
            },
        };
    }
    // ─────── Validation ───────
    validate() {
        const errors = [];
        const warnings = [];
        // 1. Start node exists
        const starts = this.findByType("start");
        if (starts.length === 0)
            errors.push({ message: "Missing Start node" });
        if (starts.length > 1)
            warnings.push({ message: "Multiple Start nodes" });
        // 2. Answer/End check
        if (this.app.mode === "advanced-chat" && this.findByType("answer").length === 0) {
            errors.push({ message: "advanced-chat mode requires Answer node" });
        }
        // 3. Edge node refs
        for (const e of this.index.edges.values()) {
            if (!this.index.byId.has(e.source))
                errors.push({ message: `Edge source '${e.source}' not found` });
            if (!this.index.byId.has(e.target))
                errors.push({ message: `Edge target '${e.target}' not found` });
        }
        // 4. Code output types
        const validTypes = new Set([
            "string", "number", "integer", "float", "boolean", "object", "file", "secret",
            "array[string]", "array[number]", "array[integer]", "array[float]", "array[object]",
            "array[boolean]", "array[file]", "array[any]", "none", "group",
        ]);
        for (const n of this.findByType("code")) {
            const outputs = n.data.outputs || {};
            for (const [name, out] of Object.entries(outputs)) {
                if (!validTypes.has(out.type)) {
                    errors.push({ message: `Code ${n.id} output '${name}' type '${out.type}' is invalid` });
                }
            }
        }
        // 5. Environment variables must have id + selector
        for (const ev of this.envVariables) {
            if (!ev.id)
                errors.push({ message: `Env variable '${ev.name}' missing 'id'` });
            if (!ev.selector || !ev.selector.length)
                errors.push({ message: `Env variable '${ev.name}' missing 'selector'` });
        }
        // 6. Conversation variables must have id + selector + value matches type
        for (const cv of this.convVariables) {
            if (!cv.id)
                errors.push({ message: `Conv variable '${cv.name}' missing 'id'` });
            if (!cv.selector || !cv.selector.length)
                errors.push({ message: `Conv variable '${cv.name}' missing 'selector'` });
            if (cv.value_type === "number" && typeof cv.value !== "number") {
                errors.push({ message: `Conv variable '${cv.name}' value_type=number but value is ${typeof cv.value}` });
            }
        }
        // 7. LLM nodes must have context + vision fields
        for (const n of this.findByType("llm")) {
            if (!n.data.context)
                errors.push({ message: `LLM ${n.id} missing 'context' field` });
            if (!n.data.vision)
                errors.push({ message: `LLM ${n.id} missing 'vision' field` });
        }
        // 8. if-else conditions must not reference env/conversation variables
        for (const n of this.findByType("if-else")) {
            for (const cs of n.data.cases || []) {
                for (const c of cs.conditions || []) {
                    const sel = c.variable_selector || [];
                    if (sel[0] === "env" || sel[0] === "conversation") {
                        errors.push({
                            message: `if-else ${n.id}: condition variable_selector ["${sel.join('", "')}"] references ${sel[0]} variable — Dify does not support env/conversation in if-else conditions. Insert a Code node to bridge.`,
                        });
                    }
                }
            }
        }
        return { errors, warnings };
    }
    /**
     * Validate a condition's variable_selector before allowing modification.
     * Returns an error message string if invalid, or null if OK.
     */
    static validateConditionVar(id, variableSelector) {
        if (!variableSelector || variableSelector.length < 2)
            return null;
        if (variableSelector[0] === "env" || variableSelector[0] === "conversation") {
            return `if-else ${id}: variable_selector ["${variableSelector.join('", "')}"] references ${variableSelector[0]} variable — Dify does not support env/conversation in if-else conditions. Insert a Code node before the if-else to read the variable and expose it as a node output, then reference that node in the condition.`;
        }
        return null;
    }
    // ─────── ⑦ toYAML ───────
    toYAML() {
        const json = this.toJSON();
        let y = yaml.dump(json, {
            lineWidth: -1,
            noRefs: true,
            quotingType: "'",
            forceQuotes: false,
        });
        return y;
    }
}
exports.DifyDSL = DifyDSL;
// ─────── Internal helpers ───────
function buildNodes(rawNodes) {
    const nodes = [];
    const pendingStart = [];
    // Pass 1: build top-level nodes (skip iteration-start and parentId nodes)
    for (const rn of rawNodes) {
        const dtype = rn.data?.type;
        if (dtype === "iteration-start") {
            pendingStart.push(rn);
            continue;
        }
        if (rn.parentId) {
            pendingStart.push(rn);
            continue;
        }
        const Ctor = index_1.NODE_TYPE_MAP[dtype];
        if (!Ctor) {
            console.warn(`Unknown node type: ${dtype} (id=${rn.id}), skipping`);
            continue;
        }
        const node = Ctor.fromYAML(rn);
        nodes.push(node);
    }
    // Build id→node map for O(1) parent lookup in pass 2
    const nodeById = new Map(nodes.map(n => [n.id, n]));
    // Pass 2: wire iteration-start + children to their parent
    for (const rn of pendingStart) {
        const parentId = rn.parentId;
        const parent = nodeById.get(parentId);
        if (!parent)
            continue;
        const dtype = rn.data?.type;
        if (dtype === "iteration-start") {
            const startNode = index_1.IterationStartNode.fromYAML(rn);
            parent.startNode = startNode;
            nodes.push(startNode); // also track in index
        }
        else {
            const Ctor = index_1.NODE_TYPE_MAP[dtype];
            if (Ctor) {
                const child = Ctor.fromYAML(rn);
                if (parent.addChild) {
                    parent.addChild(child);
                }
                nodes.push(child); // also track in index
            }
        }
    }
    return nodes;
}
function buildEdges(rawEdges) {
    return rawEdges.map((re) => {
        const d = re.data || {};
        return {
            id: re.id,
            source: re.source,
            sourceHandle: re.sourceHandle,
            target: re.target,
            targetHandle: re.targetHandle,
            type: re.type,
            zIndex: re.zIndex ?? 0,
            data: {
                sourceType: d.sourceType,
                targetType: d.targetType,
                isInIteration: d.isInIteration ?? false,
                isInLoop: d.isInLoop ?? false,
                iteration_id: d.iteration_id,
            },
        };
    });
}
