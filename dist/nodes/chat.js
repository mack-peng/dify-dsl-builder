"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMNode = exports.AnswerNode = exports.StartNode = void 0;
const base_1 = require("./base");
// ─── StartNode ───
class StartNode extends base_1.BaseNode {
    constructor(id, data) {
        super(id, "custom", {
            type: "start", title: data?.title ?? "", desc: data?.desc ?? "",
            selected: false, variables: data?.variables ?? [],
        });
    }
    toJSON() {
        return this.outerJSON(this.dataJSON({
            variables: this.data.variables.map(v => ({
                label: v.label,
                ...(v.max_length != null ? { max_length: v.max_length } : {}),
                options: v.options.length > 0 ? v.options : [],
                placeholder: v.placeholder ?? "",
                required: v.required,
                type: v.type,
                variable: v.variable,
            })),
        }));
    }
    // ─── Methods ───
    addVariable(v) {
        this.data.variables.push(v);
        return this;
    }
    removeVariable(name) {
        this.data.variables = this.data.variables.filter(v => v.variable !== name);
        return this;
    }
    updateVariable(name, patch) {
        const v = this.data.variables.find(x => x.variable === name);
        if (v)
            Object.assign(v, patch);
        return this;
    }
    get variables() { return this.data.variables; }
    static fromYAML(raw) {
        const node = new StartNode(raw.id);
        node.setPosition(raw.position.x, raw.position.y);
        const d = raw.data;
        node.data.title = d.title;
        node.data.desc = d.desc;
        node.data.variables = (d.variables ?? []).map(v => ({
            ...v,
            options: v.options ?? [],
        }));
        node.width = raw.width;
        node.height = raw.height;
        if (raw.zIndex !== undefined)
            node.zIndex = raw.zIndex;
        return node;
    }
}
exports.StartNode = StartNode;
// ─── AnswerNode ───
class AnswerNode extends base_1.BaseNode {
    constructor(id, data) {
        super(id, "custom", {
            type: "answer", title: data?.title ?? "", desc: data?.desc ?? "",
            selected: false, answer: data?.answer ?? "", variables: data?.variables ?? [],
        });
    }
    toJSON() {
        return this.outerJSON(this.dataJSON({
            answer: this.data.answer,
            variables: this.data.variables.map(v => {
                const obj = {
                    variable: v.variable,
                    value_selector: [v.value_selector[0], v.value_selector[1]],
                };
                if (v.value_type)
                    obj.value_type = v.value_type;
                return obj;
            }),
        }));
    }
    // ─── Methods ───
    setAnswer(tpl) { this.data.answer = tpl; return this; }
    get answer() { return this.data.answer; }
    addVariableRef(nodeId, field, valueType) {
        const dotName = `${nodeId}.${field}`;
        this.data.variables.push({ variable: dotName, value_selector: [nodeId, field], value_type: valueType });
        return this;
    }
    removeVariableRef(nodeId) {
        this.data.variables = this.data.variables.filter(v => !v.variable.startsWith(nodeId));
        return this;
    }
    get answerVariables() { return this.data.variables; }
    static fromYAML(raw) {
        const d = raw.data;
        const node = new AnswerNode(raw.id, {
            title: d.title, desc: d.desc,
            answer: d.answer,
        });
        node.setPosition(raw.position.x, raw.position.y);
        node.data.variables = d.variables ?? [];
        node.width = raw.width;
        node.height = raw.height;
        if (raw.zIndex !== undefined)
            node.zIndex = raw.zIndex;
        return node;
    }
}
exports.AnswerNode = AnswerNode;
// ─── LLMNode ───
class LLMNode extends base_1.BaseNode {
    constructor(id, data) {
        super(id, "custom", {
            type: "llm", title: data?.title ?? "", desc: data?.desc ?? "", selected: false,
            model: data?.model ?? { provider: "", name: "", mode: "chat", completion_params: {} },
            prompt_template: data?.prompt_template ?? [],
            context: data?.context ?? { enabled: false, variable_selector: [] },
            vision: data?.vision ?? { enabled: false },
            memory: data?.memory,
            prompt_config: data?.prompt_config,
        });
    }
    toJSON() {
        const extra = {
            context: {
                enabled: this.data.context.enabled,
                variable_selector: [...this.data.context.variable_selector],
            },
            model: {
                provider: this.data.model.provider,
                name: this.data.model.name,
                mode: this.data.model.mode,
                completion_params: { ...this.data.model.completion_params },
            },
            prompt_template: this.data.prompt_template.map(p => {
                const obj = { role: p.role, text: p.text };
                if (p.id)
                    obj.id = p.id;
                return obj;
            }),
            vision: { enabled: this.data.vision.enabled },
        };
        if (this.data.memory) {
            extra.memory = {
                query_prompt_template: this.data.memory.query_prompt_template,
                window: { enabled: this.data.memory.window.enabled, size: this.data.memory.window.size },
                ...(this.data.memory.role_prefix ? {
                    role_prefix: {
                        assistant: this.data.memory.role_prefix.assistant,
                        user: this.data.memory.role_prefix.user,
                    },
                } : {}),
            };
        }
        if (this.data.prompt_config) {
            extra.prompt_config = {
                jinja2_variables: [...this.data.prompt_config.jinja2_variables],
            };
        }
        return this.outerJSON(this.dataJSON(extra));
    }
    // ─── Methods ───
    setModel(provider, name) {
        this.data.model.provider = provider;
        this.data.model.name = name;
        return this;
    }
    setTemperature(t) {
        this.data.model.completion_params.temperature = t;
        return this;
    }
    setContextEnabled(enabled) {
        this.data.context.enabled = enabled;
        return this;
    }
    setContextSelector(nodeId, field) {
        this.data.context.variable_selector = [nodeId, field];
        return this;
    }
    addPromptMessage(msg) {
        this.data.prompt_template.push(msg);
        return this;
    }
    setMemory(windowSize) {
        this.data.memory = {
            window: { enabled: true, size: windowSize },
            query_prompt_template: "{{#sys.query#}}",
        };
        return this;
    }
    clearMemory() {
        this.data.memory = undefined;
        return this;
    }
    get promptMessages() { return this.data.prompt_template; }
    get modelConfig() { return this.data.model; }
    get hasMemory() { return !!this.data.memory; }
    static fromYAML(raw) {
        const d = raw.data;
        const node = new LLMNode(raw.id, {
            title: d.title, desc: d.desc,
            model: d.model,
            prompt_template: d.prompt_template,
            context: d.context,
            vision: d.vision,
            memory: d.memory,
            prompt_config: d.prompt_config,
        });
        node.setPosition(raw.position.x, raw.position.y);
        node.width = raw.width;
        node.height = raw.height;
        if (raw.zIndex !== undefined)
            node.zIndex = raw.zIndex;
        return node;
    }
}
exports.LLMNode = LLMNode;
