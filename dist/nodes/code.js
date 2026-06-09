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
    toYAML(w) {
        w.listItem(() => {
            this.writeDataHead(w);
            w.blockScalar("code", this.data.code);
            w.keyVal("code_language", this.data.code_language);
            // outputs
            w.key("outputs");
            w.incIndent();
            Object.entries(this.data.outputs).forEach(([name, out]) => {
                w.key(name);
                w.incIndent();
                w.key("children");
                w.keyVal("type", out.type);
                w.decIndent();
            });
            w.decIndent();
            // variables
            w.key("variables");
            w.incIndent();
            this.data.variables.forEach(v => {
                w.listItem(() => {
                    w.key("value_selector");
                    w.incIndent();
                    w.raw(`- '${v.value_selector[0]}'`);
                    w.raw(`- ${v.value_selector[1]}`);
                    w.decIndent();
                    if (v.value_type)
                        w.keyVal("value_type", v.value_type);
                    w.keyVal("variable", v.variable);
                });
            });
            w.decIndent();
            this.closeData(w);
            this.writeOuter(w);
        });
    }
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
        return node;
    }
}
exports.CodeNode = CodeNode;
