"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeNode = void 0;
const base_1 = require("./base");
class CodeNode extends base_1.BaseNode {
    constructor(id, data) {
        super(id, "custom", {
            type: "code", title: data?.title ?? "", desc: data?.desc ?? "", selected: false,
            code_language: data?.code_language ?? "python3", code: data?.code ?? "",
            variables: data?.variables ?? [], outputs: data?.outputs ?? {},
        }, { height: data?.code ? Math.max(90, data.code.split("\n").length * 20) : 90 });
    }
    toJSON() {
        const outputs = {};
        for (const [name, out] of Object.entries(this.data.outputs)) {
            outputs[name] = { children: null, type: out.type };
        }
        return this.outerJSON(this.dataJSON({
            code: this.data.code,
            code_language: this.data.code_language,
            outputs,
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
    setCode(lang, code) {
        this.data.code_language = lang;
        this.data.code = code;
        return this;
    }
    addVariable(v) {
        this.data.variables.push(v);
        return this;
    }
    removeVariable(name) {
        this.data.variables = this.data.variables.filter(x => x.variable !== name);
        return this;
    }
    addOutput(name, type) {
        this.data.outputs[name] = { type, children: null };
        return this;
    }
    removeOutput(name) {
        delete this.data.outputs[name];
        return this;
    }
    get code() { return this.data.code; }
    get codeLanguage() { return this.data.code_language; }
    get inputVariables() { return this.data.variables; }
    get outputDefs() { return this.data.outputs; }
    static fromYAML(raw) {
        const d = raw.data;
        const node = new CodeNode(raw.id, {
            title: d.title, desc: d.desc,
            code_language: d.code_language,
            code: d.code,
            variables: d.variables,
            outputs: d.outputs,
        });
        node.setPosition(raw.position.x, raw.position.y);
        node.width = raw.width;
        node.height = raw.height;
        if (raw.zIndex !== undefined)
            node.zIndex = raw.zIndex;
        return node;
    }
}
exports.CodeNode = CodeNode;
