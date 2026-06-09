"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocNode = exports.HTTPNode = exports.ClassifierNode = exports.ToolNode = void 0;
const base_1 = require("./base");
class ToolNode extends base_1.BaseNode {
    constructor(id, data) {
        super(id, "custom", {
            type: "tool", title: data?.title ?? "", desc: data?.desc ?? "", selected: false,
            is_team_authorization: data?.is_team_authorization ?? true,
            paramSchemas: data?.paramSchemas ?? [],
            params: data?.params ?? {},
            plugin_id: data?.plugin_id ?? "",
            plugin_unique_identifier: data?.plugin_unique_identifier ?? "",
            provider_icon: data?.provider_icon ?? "",
            provider_id: data?.provider_id ?? "",
            provider_name: data?.provider_name ?? "",
            provider_type: data?.provider_type ?? "builtin",
            tool_configurations: data?.tool_configurations ?? {},
            tool_description: data?.tool_description ?? "",
            tool_label: data?.tool_label ?? "",
            tool_name: data?.tool_name ?? "",
            tool_node_version: data?.tool_node_version ?? "2",
            tool_parameters: data?.tool_parameters ?? {},
        });
    }
    toYAML(w) {
        w.listItem(() => {
            this.writeDataHead(w);
            w.keyVal("is_team_authorization", this.data.is_team_authorization);
            // paramSchemas
            w.key("paramSchemas");
            w.incIndent();
            this.data.paramSchemas.forEach(ps => {
                w.listItem(() => {
                    w.key("auto_generate");
                    w.key("default");
                    w.keyVal("form", ps.form);
                    w.key("human_description");
                    w.incIndent();
                    Object.entries(ps.human_description).forEach(([k, v]) => w.keyQuoted(k, v));
                    w.decIndent();
                    w.key("label");
                    w.incIndent();
                    Object.entries(ps.label).forEach(([k, v]) => w.keyQuoted(k, v));
                    w.decIndent();
                    w.keyQuoted("llm_description", ps.llm_description);
                    w.key("max");
                    w.key("min");
                    w.keyVal("name", ps.name);
                    w.raw("options: []");
                    w.key("placeholder");
                    w.key("precision");
                    w.keyVal("required", ps.required);
                    w.key("scope");
                    w.key("template");
                    w.keyVal("type", ps.type);
                });
            });
            w.decIndent();
            // params
            w.key("params");
            w.incIndent();
            Object.entries(this.data.params).forEach(([k, v]) => w.keyQuoted(k, v));
            w.decIndent();
            w.keyQuoted("plugin_id", this.data.plugin_id);
            w.keyQuoted("plugin_unique_identifier", this.data.plugin_unique_identifier);
            w.keyQuoted("provider_icon", this.data.provider_icon);
            w.keyQuoted("provider_id", this.data.provider_id);
            w.keyQuoted("provider_name", this.data.provider_name);
            w.keyVal("provider_type", this.data.provider_type);
            w.raw("tool_configurations: {}");
            w.keyQuoted("tool_description", this.data.tool_description);
            w.keyQuoted("tool_label", this.data.tool_label);
            w.keyQuoted("tool_name", this.data.tool_name);
            w.keyQuoted("tool_node_version", this.data.tool_node_version);
            w.key("tool_parameters");
            w.incIndent();
            Object.entries(this.data.tool_parameters).forEach(([k, v]) => {
                w.key(k);
                w.incIndent();
                w.keyVal("type", v.type);
                if (v.type === "mixed")
                    w.keyQuoted("value", typeof v.value === "string" ? v.value : String(v.value ?? ""));
                else
                    w.keySingleQuoted("value", typeof v.value === "string" ? v.value : String(v.value ?? ""));
                w.decIndent();
            });
            w.decIndent();
            this.closeData(w);
            this.writeOuter(w);
        });
    }
    static fromYAML(raw) {
        const d = raw.data;
        const node = new ToolNode(raw.id, {
            title: d.title, desc: d.desc,
            paramSchemas: d.paramSchemas,
            params: d.params,
            plugin_id: d.plugin_id,
            plugin_unique_identifier: d.plugin_unique_identifier,
            provider_icon: d.provider_icon,
            provider_id: d.provider_id,
            provider_name: d.provider_name,
            provider_type: d.provider_type,
            tool_name: d.tool_name,
            tool_label: d.tool_label,
            tool_description: d.tool_description,
            tool_node_version: d.tool_node_version,
            tool_parameters: d.tool_parameters,
        });
        node.setPosition(raw.position.x, raw.position.y);
        node.width = raw.width;
        node.height = raw.height;
        return node;
    }
}
exports.ToolNode = ToolNode;
class ClassifierNode extends base_1.BaseNode {
    constructor(id, data) {
        super(id, "custom", {
            type: "question-classifier", title: data?.title ?? "", desc: data?.desc ?? "", selected: false,
            query_variable_selector: data?.query_variable_selector ?? ["sys", "query"],
            model: data?.model ?? { provider: "", name: "", mode: "chat", completion_params: {} },
            classes: data?.classes ?? [],
            instructions: data?.instructions,
        }, { height: 200 + (data?.classes?.length ?? 0) * 30 });
    }
    toYAML(w) {
        w.listItem(() => {
            this.writeDataHead(w);
            w.key("classes");
            w.incIndent();
            this.data.classes.forEach(c => {
                w.listItem(() => {
                    w.keyQuoted("description", c.description);
                    w.keyVal("id", c.id);
                    w.keyQuoted("name", c.name);
                });
            });
            w.decIndent();
            if (this.data.instructions !== undefined)
                w.keyQuoted("instructions", this.data.instructions);
            w.key("model");
            w.incIndent();
            w.key("completion_params");
            w.incIndent();
            Object.entries(this.data.model.completion_params).forEach(([k, v]) => {
                if (typeof v === "string")
                    w.keyQuoted(k, v);
                else
                    w.keyVal(k, v);
            });
            w.decIndent();
            w.keyVal("mode", this.data.model.mode);
            w.keyQuoted("name", this.data.model.name);
            w.keyQuoted("provider", this.data.model.provider);
            w.decIndent();
            w.key("query_variable_selector");
            w.incIndent();
            w.raw(`- ${this.data.query_variable_selector[0]}`);
            w.raw(`- ${this.data.query_variable_selector[1]}`);
            w.decIndent();
            w.key("vision");
            w.incIndent();
            w.keyVal("enabled", false);
            w.decIndent();
            this.closeData(w);
            this.writeOuter(w);
        });
    }
    static fromYAML(raw) {
        const d = raw.data;
        const node = new ClassifierNode(raw.id, {
            title: d.title, desc: d.desc,
            query_variable_selector: d.query_variable_selector,
            model: d.model,
            classes: d.classes,
            instructions: d.instructions,
        });
        node.setPosition(raw.position.x, raw.position.y);
        node.width = raw.width;
        node.height = raw.height;
        return node;
    }
}
exports.ClassifierNode = ClassifierNode;
class HTTPNode extends base_1.BaseNode {
    constructor(id, data) {
        super(id, "custom", {
            type: "http-request", title: data?.title ?? "", desc: data?.desc ?? "", selected: false,
            method: data?.method ?? "GET", url: data?.url ?? "",
            authorization: data?.authorization ?? { type: "no-auth" },
            headers: data?.headers ?? "", params: data?.params ?? "",
            body: data?.body ?? { type: "none", data: "" },
            timeout: data?.timeout ?? { connect: 10, read: 30, write: 30 },
        });
    }
    toYAML(w) {
        w.listItem(() => {
            this.writeDataHead(w);
            this.closeData(w);
            this.writeOuter(w);
        });
    }
    static fromYAML(raw) {
        const d = raw.data;
        return new HTTPNode(raw.id, { title: d.title, desc: d.desc });
    }
}
exports.HTTPNode = HTTPNode;
class DocNode extends base_1.BaseNode {
    constructor(id, data) {
        super(id, "custom", {
            type: "document-extractor", title: data?.title ?? "", desc: data?.desc ?? "", selected: false,
            variable_selector: data?.variable_selector ?? ["", ""],
            is_array_file: data?.is_array_file,
        });
    }
    toYAML(w) {
        w.listItem(() => {
            this.writeDataHead(w);
            this.closeData(w);
            this.writeOuter(w);
        });
    }
    static fromYAML(raw) {
        const d = raw.data;
        return new DocNode(raw.id, { title: d.title, desc: d.desc });
    }
}
exports.DocNode = DocNode;
