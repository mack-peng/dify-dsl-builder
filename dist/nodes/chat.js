"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMNode = exports.AnswerNode = exports.StartNode = void 0;
const base_1 = require("./base");
class StartNode extends base_1.BaseNode {
    constructor(id, data) {
        super(id, "custom", {
            type: "start", title: data?.title ?? "", desc: data?.desc ?? "",
            selected: false, variables: data?.variables ?? [],
        });
    }
    toYAML(w) {
        w.listItem(() => {
            this.writeDataHead(w);
            w.key("variables");
            w.incIndent();
            this.data.variables.forEach(v => {
                w.listItem(() => {
                    w.keyQuoted("label", v.label);
                    if (v.max_length)
                        w.keyVal("max_length", v.max_length);
                    if (v.options.length === 0) {
                        w.raw("options: []");
                    }
                    else {
                        w.key("options");
                        w.incIndent();
                        v.options.forEach(o => w.raw(`- ${o}`));
                        w.decIndent();
                    }
                    w.keyQuoted("placeholder", v.placeholder ?? "");
                    w.keyVal("required", v.required);
                    w.keyVal("type", v.type);
                    w.keyVal("variable", v.variable);
                });
            });
            w.decIndent();
            this.closeData(w);
            this.writeOuter(w);
        });
    }
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
        return node;
    }
}
exports.StartNode = StartNode;
class AnswerNode extends base_1.BaseNode {
    constructor(id, data) {
        super(id, "custom", {
            type: "answer", title: data?.title ?? "", desc: data?.desc ?? "",
            selected: false, answer: data?.answer ?? "", variables: data?.variables ?? [],
        });
    }
    toYAML(w) {
        w.listItem(() => {
            this.writeDataHead(w);
            w.keyQuoted("answer", this.data.answer);
            w.key("variables");
            w.incIndent();
            this.data.variables.forEach(v => {
                w.listItem(() => {
                    w.keyVal("variable", v.variable);
                    w.key("value_selector");
                    w.incIndent();
                    w.raw(`- '${v.value_selector[0]}'`);
                    w.raw(`- ${v.value_selector[1]}`);
                    w.decIndent();
                    if (v.value_type)
                        w.keyVal("value_type", v.value_type);
                });
            });
            w.decIndent();
            this.closeData(w);
            this.writeOuter(w);
        });
    }
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
        return node;
    }
}
exports.AnswerNode = AnswerNode;
class LLMNode extends base_1.BaseNode {
    constructor(id, data) {
        super(id, "custom", {
            type: "llm", title: data?.title ?? "", desc: data?.desc ?? "", selected: false,
            model: data?.model ?? { provider: "", name: "", mode: "chat", completion_params: {} },
            prompt_template: data?.prompt_template ?? [],
            context: data?.context ?? { enabled: false, variable_selector: [] },
            vision: data?.vision ?? { enabled: false },
            memory: data?.memory,
        });
    }
    toYAML(w) {
        w.listItem(() => {
            this.writeDataHead(w);
            // context
            w.key("context");
            w.incIndent();
            w.keyVal("enabled", this.data.context.enabled);
            if (this.data.context.variable_selector.length === 0) {
                w.raw("variable_selector: []");
            }
            else {
                w.key("variable_selector");
                w.incIndent();
                this.data.context.variable_selector.forEach((s, i) => {
                    if (i === 0)
                        w.raw(`- '${s}'`);
                    else
                        w.raw(`- ${s}`);
                });
                w.decIndent();
            }
            w.decIndent();
            // memory
            if (this.data.memory) {
                w.key("memory");
                w.incIndent();
                w.keyQuoted("query_prompt_template", this.data.memory.query_prompt_template);
                if (this.data.memory.role_prefix) {
                    w.key("role_prefix");
                    w.incIndent();
                    w.keyQuoted("assistant", this.data.memory.role_prefix.assistant);
                    w.keyQuoted("user", this.data.memory.role_prefix.user);
                    w.decIndent();
                }
                w.key("window");
                w.incIndent();
                w.keyVal("enabled", this.data.memory.window.enabled);
                w.keyVal("size", this.data.memory.window.size);
                w.decIndent();
                w.decIndent();
            }
            // model
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
            // prompt_template
            w.key("prompt_template");
            w.incIndent();
            this.data.prompt_template.forEach(p => {
                w.listItem(() => {
                    if (p.id)
                        w.keyVal("id", p.id);
                    w.keyVal("role", p.role);
                    w.blockScalar("text", p.text);
                });
            });
            w.decIndent();
            // vision
            w.key("vision");
            w.incIndent();
            w.keyVal("enabled", this.data.vision.enabled);
            w.decIndent();
            this.closeData(w);
            this.writeOuter(w);
        });
    }
    static fromYAML(raw) {
        const d = raw.data;
        const node = new LLMNode(raw.id, {
            title: d.title, desc: d.desc,
            model: d.model,
            prompt_template: d.prompt_template,
            context: d.context,
            vision: d.vision,
            memory: d.memory,
        });
        node.setPosition(raw.position.x, raw.position.y);
        node.width = raw.width;
        node.height = raw.height;
        return node;
    }
}
exports.LLMNode = LLMNode;
