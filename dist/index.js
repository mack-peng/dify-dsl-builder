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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Features = exports.Graph = exports.DifyDSL = void 0;
const fs = __importStar(require("fs"));
const serializer_1 = require("./serializer");
const deserializer_1 = require("./deserializer");
const validator_1 = require("./validator");
class DifyDSL {
    version;
    kind;
    app;
    dependencies;
    graph;
    features;
    envVariables;
    convVariables;
    constructor(version, app, dependencies, graph, features, envVariables, convVariables) {
        this.version = version;
        this.kind = "app";
        this.app = app;
        this.dependencies = dependencies;
        this.graph = graph;
        this.features = features;
        this.envVariables = envVariables;
        this.convVariables = convVariables;
    }
    get mode() {
        return this.app.mode;
    }
    static load(filePath) {
        const raw = (0, deserializer_1.loadFromFile)(filePath);
        return new DifyDSL(raw.version, raw.app, raw.dependencies, raw.graph, raw.features, raw.envVariables, raw.convVariables);
    }
    save(filePath) {
        const w = new serializer_1.YAMLWriter();
        this.toYAML(w);
        fs.writeFileSync(filePath, w.toString(), "utf-8");
    }
    // === Env / Conv variables ===
    setEnv(name, value, type) {
        const existing = this.envVariables.find(e => e.name === name);
        if (existing) {
            existing.value = value;
            existing.value_type = type;
        }
        else {
            this.envVariables.push({ name, value, value_type: type, description: "" });
        }
        return this;
    }
    removeEnv(name) {
        this.envVariables = this.envVariables.filter(e => e.name !== name);
        return this;
    }
    setConv(name, type) {
        if (this.mode !== "advanced-chat") {
            throw new Error("conversation_variables only supported in advanced-chat mode");
        }
        const existing = this.convVariables.find(c => c.name === name);
        if (existing) {
            existing.value_type = type;
        }
        else {
            this.convVariables.push({ name, value_type: type, description: "" });
        }
        return this;
    }
    removeConv(name) {
        this.convVariables = this.convVariables.filter(c => c.name !== name);
        return this;
    }
    // === Validation ===
    validate() {
        return (0, validator_1.validate)(this.graph, this.mode);
    }
    // === Serialization ===
    toYAML(w) {
        // --- header ---
        w.raw("---");
        w.key("app");
        w.indent(() => {
            w.keyQuoted("description", this.app.description);
            w.keyQuoted("icon", this.app.icon);
            w.keyQuoted("icon_background", this.app.icon_background);
            w.keyVal("mode", this.app.mode);
            w.keyQuoted("name", this.app.name);
            w.keyVal("use_icon_as_answer_icon", this.app.use_icon_as_answer_icon);
        });
        // dependencies
        w.key("dependencies");
        this.dependencies.forEach(d => {
            w.listItem(() => {
                w.key("current_identifier");
            });
            w.indent(() => {
                w.keyVal("type", "marketplace");
                w.key("value");
                w.indent(() => {
                    w.keyQuoted("marketplace_plugin_unique_identifier", d.value.marketplace_plugin_unique_identifier);
                    w.key("version");
                });
            });
        });
        w.keyVal("kind", "app");
        w.keyVal("version", this.version);
        // workflow
        w.key("workflow");
        w.indent(() => {
            // conversation_variables
            if (this.convVariables.length === 0) {
                w.raw("conversation_variables: []");
            }
            else {
                w.key("conversation_variables");
                this.convVariables.forEach(c => {
                    w.listItem(() => {
                        if (c.description)
                            w.keyQuoted("description", c.description);
                        w.keyVal("name", c.name);
                        w.keyVal("value_type", c.value_type ?? "string");
                    });
                });
            }
            // environment_variables
            if (this.envVariables.length === 0) {
                w.raw("environment_variables: []");
            }
            else {
                w.key("environment_variables");
                this.envVariables.forEach(e => {
                    w.listItem(() => {
                        if (e.description)
                            w.keyQuoted("description", e.description);
                        w.keyVal("name", e.name);
                        w.keyVal("value", e.value);
                        w.keyVal("value_type", e.value_type ?? "number");
                    });
                });
            }
            // features
            this.features.toYAML(w);
            // graph
            this.graph.toYAML(w);
            // rag_pipeline_variables
            w.raw("rag_pipeline_variables: []");
        });
    }
}
exports.DifyDSL = DifyDSL;
// Re-export for convenience
__exportStar(require("./nodes"), exports);
__exportStar(require("./edge"), exports);
var graph_1 = require("./graph");
Object.defineProperty(exports, "Graph", { enumerable: true, get: function () { return graph_1.Graph; } });
var features_1 = require("./features");
Object.defineProperty(exports, "Features", { enumerable: true, get: function () { return features_1.Features; } });
