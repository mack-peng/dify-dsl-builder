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
            w.indent(() => {
                this.data.variables.forEach(v => {
                    w.listItem(() => {
                        w.keyQuoted("label", v.label);
                        if (v.max_length)
                            w.keyVal("max_length", v.max_length);
                        w.key("options");
                        w.indent(() => v.options.forEach(o => w.raw(`- ${o}`)));
                        w.keyQuoted("placeholder", v.placeholder ?? "");
                        w.keyVal("required", v.required);
                        w.keyVal("type", v.type);
                        w.keyVal("variable", v.variable);
                    });
                });
            });
            this.writeOuter(w);
        });
    }
    static fromYAML(raw) {
        const node = new StartNode(raw.id);
        node.setPosition(raw.position.x, raw.position.y);
        const d = raw.data;
        node.data.title = d.title;
        node.data.desc = d.desc;
        node.data.variables = d.variables ?? [];
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
            w.indent(() => {
                this.data.variables.forEach(v => {
                    w.listItem(() => {
                        w.keyVal("variable", v.variable);
                        w.key("value_selector");
                        w.indent(() => {
                            w.keySingleQuoted("-", v.value_selector[0]);
                            w.raw(`- ${v.value_selector[1]}`);
                        });
                        if (v.value_type)
                            w.keyVal("value_type", v.value_type);
                    });
                });
            });
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
            w.indent(() => {
                w.keyVal("enabled", this.data.context.enabled);
                w.key("variable_selector");
                w.indent(() => this.data.context.variable_selector.forEach(s => w.raw(`- ${s}`)));
            });
            // memory
            if (this.data.memory) {
                w.key("memory");
                w.indent(() => {
                    w.keyQuoted("query_prompt_template", this.data.memory.query_prompt_template);
                    if (this.data.memory.role_prefix) {
                        w.key("role_prefix");
                        w.indent(() => {
                            w.keyQuoted("assistant", this.data.memory.role_prefix.assistant);
                            w.keyQuoted("user", this.data.memory.role_prefix.user);
                        });
                    }
                    w.key("window");
                    w.indent(() => {
                        w.keyVal("enabled", this.data.memory.window.enabled);
                        w.keyVal("size", this.data.memory.window.size);
                    });
                });
            }
            // model
            w.key("model");
            w.indent(() => {
                w.key("completion_params");
                w.indent(() => {
                    Object.entries(this.data.model.completion_params).forEach(([k, v]) => {
                        if (typeof v === "string")
                            w.keyQuoted(k, v);
                        else
                            w.keyVal(k, v);
                    });
                });
                w.keyVal("mode", this.data.model.mode);
                w.keyQuoted("name", this.data.model.name);
                w.keyQuoted("provider", this.data.model.provider);
            });
            // prompt_template
            w.key("prompt_template");
            w.indent(() => {
                this.data.prompt_template.forEach(p => {
                    w.listItem(() => {
                        if (p.id)
                            w.keyVal("id", p.id);
                        w.keyVal("role", p.role);
                        w.blockScalar("text", p.text);
                    });
                });
            });
            // vision
            w.key("vision");
            w.indent(() => w.keyVal("enabled", this.data.vision.enabled));
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
