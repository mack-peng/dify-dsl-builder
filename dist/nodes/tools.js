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
    toJSON() {
        const toolParams = {};
        for (const [k, v] of Object.entries(this.data.tool_parameters)) {
            toolParams[k] = { type: v.type, value: v.value };
        }
        return this.outerJSON(this.dataJSON({
            is_team_authorization: this.data.is_team_authorization,
            paramSchemas: this.data.paramSchemas.map(ps => ({
                auto_generate: ps.auto_generate,
                default: ps.default,
                form: ps.form,
                human_description: { ...ps.human_description },
                label: { ...ps.label },
                llm_description: ps.llm_description,
                max: ps.max,
                min: ps.min,
                name: ps.name,
                options: [],
                placeholder: ps.placeholder,
                precision: ps.precision,
                required: ps.required,
                scope: ps.scope,
                template: ps.template,
                type: ps.type,
            })),
            params: { ...this.data.params },
            plugin_id: this.data.plugin_id,
            plugin_unique_identifier: this.data.plugin_unique_identifier,
            provider_icon: this.data.provider_icon,
            provider_id: this.data.provider_id,
            provider_name: this.data.provider_name,
            provider_type: this.data.provider_type,
            tool_configurations: { ...this.data.tool_configurations },
            tool_description: this.data.tool_description,
            tool_label: this.data.tool_label,
            tool_name: this.data.tool_name,
            tool_node_version: this.data.tool_node_version,
            tool_parameters: toolParams,
        }));
    }
    // ─── Methods ───
    setPlugin(pluginId, uniqueId) {
        this.data.plugin_id = pluginId;
        this.data.plugin_unique_identifier = uniqueId;
        return this;
    }
    setToolParam(name, value) {
        this.data.tool_parameters[name] = value;
        return this;
    }
    setToolConfig(key, value) {
        this.data.tool_configurations[key] = value;
        return this;
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
        if (raw.zIndex !== undefined)
            node.zIndex = raw.zIndex;
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
    toJSON() {
        const extra = {
            classes: this.data.classes.map(c => ({
                description: c.description,
                id: c.id,
                name: c.name,
            })),
            model: {
                provider: this.data.model.provider,
                name: this.data.model.name,
                mode: this.data.model.mode,
                completion_params: { ...this.data.model.completion_params },
            },
            query_variable_selector: [this.data.query_variable_selector[0], this.data.query_variable_selector[1]],
            vision: { enabled: false },
        };
        if (this.data.instructions !== undefined)
            extra.instructions = this.data.instructions;
        return this.outerJSON(this.dataJSON(extra));
    }
    // ─── Methods ───
    addClass(cls) { this.data.classes.push(cls); return this; }
    removeClass(id) {
        this.data.classes = this.data.classes.filter(c => c.id !== id);
        return this;
    }
    setModel(provider, name) {
        this.data.model.provider = provider;
        this.data.model.name = name;
        return this;
    }
    setInstructions(instructions) {
        this.data.instructions = instructions;
        return this;
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
        if (raw.zIndex !== undefined)
            node.zIndex = raw.zIndex;
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
    toJSON() {
        return this.outerJSON(this.dataJSON({
            method: this.data.method, url: this.data.url,
            authorization: { ...this.data.authorization },
            headers: this.data.headers, params: this.data.params,
            body: { ...this.data.body },
            timeout: { ...this.data.timeout },
        }));
    }
    static fromYAML(raw) {
        const d = raw.data;
        return new HTTPNode(raw.id, {
            title: d.title, desc: d.desc,
            method: d.method,
            url: d.url,
            authorization: d.authorization,
            headers: d.headers,
            params: d.params,
            body: d.body,
            timeout: d.timeout,
        });
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
    toJSON() {
        return this.outerJSON(this.dataJSON({
            variable_selector: [...this.data.variable_selector],
            is_array_file: this.data.is_array_file,
        }));
    }
    static fromYAML(raw) {
        const d = raw.data;
        return new DocNode(raw.id, {
            title: d.title, desc: d.desc,
            variable_selector: d.variable_selector,
            is_array_file: d.is_array_file,
        });
    }
}
exports.DocNode = DocNode;
