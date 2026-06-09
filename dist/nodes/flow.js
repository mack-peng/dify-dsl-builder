"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IterationStartNode = exports.IterationNode = exports.AggregatorNode = exports.TemplateNode = exports.IfElseNode = exports.KnowledgeNode = void 0;
const base_1 = require("./base");
const code_1 = require("./code");
class KnowledgeNode extends base_1.BaseNode {
    constructor(id, data) {
        super(id, "custom", {
            type: "knowledge-retrieval", title: data?.title ?? "", desc: data?.desc ?? "", selected: false,
            dataset_ids: data?.dataset_ids ?? [],
            query_variable_selector: data?.query_variable_selector ?? ["", ""],
            retrieval_mode: data?.retrieval_mode ?? "multiple",
            multiple_retrieval_config: data?.multiple_retrieval_config,
            single_retrieval_config: data?.single_retrieval_config,
        });
    }
    toYAML(w) {
        w.listItem(() => {
            this.writeDataHead(w);
            w.key("dataset_ids");
            w.incIndent();
            this.data.dataset_ids.forEach(ds => w.raw(`- ${ds}`));
            w.decIndent();
            if (this.data.retrieval_mode === "multiple" && this.data.multiple_retrieval_config) {
                w.key("multiple_retrieval_config");
                w.incIndent();
                w.keyVal("reranking_enable", this.data.multiple_retrieval_config.reranking_enable);
                w.key("score_threshold");
                w.keyVal("top_k", this.data.multiple_retrieval_config.top_k);
                w.decIndent();
            }
            w.key("query_variable_selector");
            w.incIndent();
            w.raw(`- '${this.data.query_variable_selector[0]}'`);
            w.raw(`- ${this.data.query_variable_selector[1]}`);
            w.decIndent();
            w.keyVal("retrieval_mode", this.data.retrieval_mode);
            this.closeData(w);
            this.writeOuter(w);
        });
    }
    static fromYAML(raw) {
        const d = raw.data;
        const node = new KnowledgeNode(raw.id, {
            title: d.title, desc: d.desc,
            dataset_ids: d.dataset_ids,
            query_variable_selector: d.query_variable_selector,
            retrieval_mode: d.retrieval_mode,
            multiple_retrieval_config: d.multiple_retrieval_config,
        });
        node.setPosition(raw.position.x, raw.position.y);
        node.width = raw.width;
        node.height = raw.height;
        return node;
    }
}
exports.KnowledgeNode = KnowledgeNode;
class IfElseNode extends base_1.BaseNode {
    constructor(id, data) {
        super(id, "custom", {
            type: "if-else", title: data?.title ?? "", desc: data?.desc ?? "", selected: false,
            cases: data?.cases ?? [],
        }, { height: 152 });
    }
    toYAML(w) {
        w.listItem(() => {
            this.writeDataHead(w);
            w.key("cases");
            w.incIndent();
            this.data.cases.forEach(c => {
                w.listItem(() => {
                    w.keyVal("case_id", `'${c.case_id}'`);
                    w.key("conditions");
                    w.incIndent();
                    c.conditions.forEach(cond => {
                        w.listItem(() => {
                            w.keyQuoted("comparison_operator", cond.comparison_operator);
                            if (cond.id)
                                w.keyVal("id", cond.id);
                            w.keySingleQuoted("value", cond.value ?? "");
                            w.keyVal("varType", cond.varType ?? "string");
                            w.key("variable_selector");
                            w.incIndent();
                            w.raw(`- '${cond.variable_selector[0]}'`);
                            w.raw(`- ${cond.variable_selector[1]}`);
                            w.decIndent();
                        });
                    });
                    w.decIndent();
                    w.keyVal("id", `'${c.id}'`);
                    w.keyVal("logical_operator", c.logical_operator);
                });
            });
            w.decIndent();
            this.closeData(w);
            this.writeOuter(w);
        });
    }
    static fromYAML(raw) {
        const d = raw.data;
        const node = new IfElseNode(raw.id, {
            title: d.title, desc: d.desc,
            cases: d.cases,
        });
        node.setPosition(raw.position.x, raw.position.y);
        node.width = raw.width;
        node.height = raw.height;
        return node;
    }
}
exports.IfElseNode = IfElseNode;
class TemplateNode extends base_1.BaseNode {
    constructor(id, data) {
        super(id, "custom", {
            type: "template-transform", title: data?.title ?? "", desc: data?.desc ?? "", selected: false,
            template: data?.template ?? "", variables: data?.variables ?? [],
        });
    }
    toYAML(w) {
        w.listItem(() => {
            this.writeDataHead(w);
            w.keyQuoted("template", this.data.template);
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
        const node = new TemplateNode(raw.id, {
            title: d.title, desc: d.desc,
            template: d.template,
            variables: d.variables,
        });
        node.setPosition(raw.position.x, raw.position.y);
        node.width = raw.width;
        node.height = raw.height;
        return node;
    }
}
exports.TemplateNode = TemplateNode;
class AggregatorNode extends base_1.BaseNode {
    constructor(id, data) {
        super(id, "custom", {
            type: "variable-aggregator", title: data?.title ?? "", desc: data?.desc ?? "", selected: false,
            output_type: data?.output_type ?? "array", variables: data?.variables ?? [],
        });
    }
    toYAML(w) {
        w.listItem(() => {
            this.writeDataHead(w);
            w.keyVal("output_type", this.data.output_type);
            w.key("variables");
            w.incIndent();
            this.data.variables.forEach(v => {
                w.listItem(() => {
                    w.raw(`- '${v[0]}'`);
                    w.raw(`- ${v[1]}`);
                });
            });
            w.decIndent();
            this.closeData(w);
            this.writeOuter(w);
        });
    }
    static fromYAML(raw) {
        const d = raw.data;
        const node = new AggregatorNode(raw.id, {
            title: d.title, desc: d.desc,
            output_type: d.output_type,
            variables: d.variables,
        });
        node.setPosition(raw.position.x, raw.position.y);
        node.width = raw.width;
        node.height = raw.height;
        return node;
    }
}
exports.AggregatorNode = AggregatorNode;
class IterationNode extends base_1.BaseNode {
    children = [];
    startNode = null;
    constructor(id, data) {
        super(id, "custom", {
            type: "iteration", title: data?.title ?? "", desc: data?.desc ?? "", selected: false,
            iterator_selector: data?.iterator_selector ?? ["", ""],
            iterator_input_type: data?.iterator_input_type ?? "array[string]",
            output_selector: data?.output_selector ?? ["", ""],
            output_type: data?.output_type ?? "array[object]",
            start_node_id: data?.start_node_id ?? "",
            is_parallel: data?.is_parallel ?? true,
            parallel_nums: data?.parallel_nums ?? 3,
            error_handle_mode: data?.error_handle_mode ?? "terminated",
            width: data?.width ?? 650,
            height: data?.height ?? 250,
        }, { width: data?.width ?? 650, height: data?.height ?? 250 });
    }
    findChildCode(id) {
        return this.children.find(c => c.id === id && c instanceof code_1.CodeNode);
    }
    findChildKB(id) {
        return this.children.find(c => c.id === id && c instanceof KnowledgeNode);
    }
    findChildTemplate(id) {
        return this.children.find(c => c.id === id && c instanceof TemplateNode);
    }
    findChild(id) {
        return this.children.find(c => c.id === id);
    }
    addChild(node, _opts) {
        Object.assign(node, {
            parentId: this.id,
            isInIteration: true,
            iterationId: this.id,
        });
        const child = node;
        this.children.push(child);
        return child;
    }
    toYAML(w) {
        w.listItem(() => {
            this.writeDataHead(w);
            w.keyQuoted("error_handle_mode", this.data.error_handle_mode);
            w.keyVal("height", this.data.height);
            w.keyVal("is_parallel", this.data.is_parallel);
            w.keyVal("iterator_input_type", this.data.iterator_input_type);
            w.key("iterator_selector");
            w.incIndent();
            w.raw(`- '${this.data.iterator_selector[0]}'`);
            w.raw(`- ${this.data.iterator_selector[1]}`);
            w.decIndent();
            w.key("output_selector");
            w.incIndent();
            w.raw(`- '${this.data.output_selector[0]}'`);
            w.raw(`- ${this.data.output_selector[1]}`);
            w.decIndent();
            w.keyVal("output_type", this.data.output_type);
            w.keyVal("parallel_nums", this.data.parallel_nums);
            w.keySingleQuoted("start_node_id", this.data.start_node_id);
            w.keyVal("width", this.data.width);
            this.closeData(w);
            this.writeOuter(w);
        });
        // Write child nodes
        if (this.startNode)
            this.startNode.toYAML(w);
        this.children.forEach(c => {
            c.toYAML(w);
        });
    }
    static fromYAML(raw) {
        const d = raw.data;
        const node = new IterationNode(raw.id, {
            title: d.title, desc: d.desc,
            iterator_selector: d.iterator_selector,
            iterator_input_type: d.iterator_input_type,
            output_selector: d.output_selector,
            output_type: d.output_type,
            start_node_id: d.start_node_id,
            is_parallel: d.is_parallel,
            parallel_nums: d.parallel_nums,
            error_handle_mode: d.error_handle_mode,
            width: d.width, height: d.height,
        });
        node.setPosition(raw.position.x, raw.position.y);
        node.width = raw.width;
        node.height = raw.height;
        return node;
    }
}
exports.IterationNode = IterationNode;
class IterationStartNode extends base_1.BaseNode {
    parentId;
    constructor(parentIterId, data) {
        const id = data?.title ? parentIterId + "-start" : parentIterId + "-start";
        super(id, "custom-iteration-start", {
            type: "iteration-start", title: data?.title ?? "", desc: data?.desc ?? "", selected: false,
            isInIteration: true, iteration_id: parentIterId,
            height: data?.height ?? 64, width: data?.width ?? 44,
        }, { width: data?.width ?? 44, height: 48 });
        this.parentId = parentIterId;
        this.data.isInIteration = true;
        this.data.iteration_id = parentIterId;
    }
    toYAML(w) {
        w.listItem(() => {
            w.keyVal("draggable", false);
            w.keyVal("height", this.height);
            w.keySingleQuoted("id", this.id);
            w.keySingleQuoted("parentId", this.parentId);
            w.key("position");
            w.incIndent();
            w.keyVal("x", this.position.x);
            w.keyVal("y", this.position.y);
            w.decIndent();
            w.key("positionAbsolute");
            w.incIndent();
            w.keyVal("x", this.positionAbsolute.x);
            w.keyVal("y", this.positionAbsolute.y);
            w.decIndent();
            w.keyVal("selectable", false);
            w.keyVal("sourcePosition", this.sourcePosition);
            w.keyVal("targetPosition", this.targetPosition);
            w.keyVal("type", this.type);
            w.keyVal("width", this.width);
            w.key("data");
            w.incIndent();
            w.keyQuoted("desc", this.data.desc);
            w.keyVal("height", this.data.height ?? this.height);
            w.keyVal("isInIteration", true);
            w.keySingleQuoted("iteration_id", this.parentId);
            w.keyVal("selected", false);
            w.keyQuoted("title", this.data.title);
            w.keyVal("type", "iteration-start");
            w.keyVal("width", this.data.width ?? this.width);
            w.decIndent();
        });
    }
    static fromYAML(raw) {
        const d = raw.data;
        const node = new IterationStartNode(raw.parentId, {
            title: d.title, desc: d.desc,
            iteration_id: d.iteration_id,
            height: d.height, width: d.width,
        });
        node.id = raw.id;
        node.setPosition(raw.position.x, raw.position.y);
        node.width = raw.width;
        node.height = raw.height;
        return node;
    }
}
exports.IterationStartNode = IterationStartNode;
