"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IterationStartNode = exports.IterationNode = exports.AggregatorNode = exports.TemplateNode = exports.IfElseNode = exports.KnowledgeNode = void 0;
const base_1 = require("./base");
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
    toJSON() {
        const extra = {
            dataset_ids: [...this.data.dataset_ids],
            query_variable_selector: [this.data.query_variable_selector[0], this.data.query_variable_selector[1]],
            retrieval_mode: this.data.retrieval_mode,
        };
        if (this.data.retrieval_mode === "multiple" && this.data.multiple_retrieval_config) {
            extra.multiple_retrieval_config = {
                reranking_enable: this.data.multiple_retrieval_config.reranking_enable,
                score_threshold: this.data.multiple_retrieval_config.score_threshold,
                top_k: this.data.multiple_retrieval_config.top_k,
            };
        }
        return this.outerJSON(this.dataJSON(extra));
    }
    // ─── Methods ───
    addDataset(id) { this.data.dataset_ids.push(id); return this; }
    removeDataset(id) {
        this.data.dataset_ids = this.data.dataset_ids.filter(d => d !== id);
        return this;
    }
    setQuerySelector(nodeId, field) {
        this.data.query_variable_selector = [nodeId, field];
        return this;
    }
    setTopK(n) {
        if (!this.data.multiple_retrieval_config) {
            this.data.multiple_retrieval_config = { top_k: n, score_threshold: null, reranking_enable: false };
        }
        else {
            this.data.multiple_retrieval_config.top_k = n;
        }
        return this;
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
        if (raw.zIndex !== undefined)
            node.zIndex = raw.zIndex;
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
    toJSON() {
        return this.outerJSON(this.dataJSON({
            cases: this.data.cases.map(c => ({
                case_id: c.case_id,
                id: c.id,
                logical_operator: c.logical_operator,
                conditions: c.conditions.map(cond => {
                    const obj = {
                        comparison_operator: cond.comparison_operator,
                        variable_selector: [cond.variable_selector[0], cond.variable_selector[1]],
                        value: cond.value,
                        varType: cond.varType ?? "string",
                    };
                    if (cond.id)
                        obj.id = cond.id;
                    return obj;
                }),
            })),
        }));
    }
    // ─── Methods ───
    addCase(c) { this.data.cases.push(c); return this; }
    removeCase(id) {
        this.data.cases = this.data.cases.filter(c => c.id !== id);
        return this;
    }
    updateCondition(caseId, condIdx, patch) {
        const c = this.data.cases.find(x => x.id === caseId);
        if (c && c.conditions[condIdx])
            Object.assign(c.conditions[condIdx], patch);
        return this;
    }
    get cases() { return this.data.cases; }
    static fromYAML(raw) {
        const d = raw.data;
        const node = new IfElseNode(raw.id, {
            title: d.title, desc: d.desc,
            cases: d.cases,
        });
        node.setPosition(raw.position.x, raw.position.y);
        node.width = raw.width;
        node.height = raw.height;
        if (raw.zIndex !== undefined)
            node.zIndex = raw.zIndex;
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
    toJSON() {
        return this.outerJSON(this.dataJSON({
            template: this.data.template,
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
    setTemplate(tpl) { this.data.template = tpl; return this; }
    addVariable(v) { this.data.variables.push(v); return this; }
    removeVariable(name) {
        this.data.variables = this.data.variables.filter(x => x.variable !== name);
        return this;
    }
    get template() { return this.data.template; }
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
        if (raw.zIndex !== undefined)
            node.zIndex = raw.zIndex;
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
    toJSON() {
        return this.outerJSON(this.dataJSON({
            output_type: this.data.output_type,
            variables: this.data.variables.map(v => [v[0], v[1]]),
        }));
    }
    // ─── Methods ───
    addSource(nodeId, field) {
        this.data.variables.push([nodeId, field]);
        return this;
    }
    removeSource(nodeId) {
        this.data.variables = this.data.variables.filter(v => v[0] !== nodeId);
        return this;
    }
    setOutputType(t) { this.data.output_type = t; return this; }
    get sources() { return this.data.variables; }
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
        if (raw.zIndex !== undefined)
            node.zIndex = raw.zIndex;
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
    addChild(node) {
        Object.assign(node, {
            parentId: this.id,
            isInIteration: true,
            iterationId: this.id,
        });
        const child = node;
        this.children.push(child);
        return child;
    }
    removeChild(id) {
        this.children = this.children.filter(c => c.id !== id);
    }
    findChild(id) {
        return this.children.find(c => c.id === id);
    }
    setIterator(nodeId, field) {
        this.data.iterator_selector = [nodeId, field];
        return this;
    }
    setOutputSelector(nodeId, field) {
        this.data.output_selector = [nodeId, field];
        return this;
    }
    toJSON() {
        return this.outerJSON(this.dataJSON({
            error_handle_mode: this.data.error_handle_mode,
            height: this.data.height,
            is_parallel: this.data.is_parallel,
            iterator_input_type: this.data.iterator_input_type,
            iterator_selector: [this.data.iterator_selector[0], this.data.iterator_selector[1]],
            output_selector: [this.data.output_selector[0], this.data.output_selector[1]],
            output_type: this.data.output_type,
            parallel_nums: this.data.parallel_nums,
            start_node_id: this.data.start_node_id,
            width: this.data.width,
        }));
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
        if (raw.zIndex !== undefined)
            node.zIndex = raw.zIndex;
        return node;
    }
}
exports.IterationNode = IterationNode;
class IterationStartNode extends base_1.BaseNode {
    parentId;
    constructor(parentIterId, data) {
        const id = parentIterId + "-start";
        super(id, "custom-iteration-start", {
            type: "iteration-start", title: data?.title ?? "", desc: data?.desc ?? "", selected: false,
            isInIteration: true, iteration_id: parentIterId,
            height: data?.height ?? 64, width: data?.width ?? 44,
        }, { width: data?.width ?? 44, height: 48 });
        this.parentId = parentIterId;
        this.data.isInIteration = true;
        this.data.iteration_id = parentIterId;
    }
    toJSON() {
        return {
            id: this.id,
            type: this.type,
            parentId: this.parentId,
            position: { x: this.position.x, y: this.position.y },
            positionAbsolute: { x: this.positionAbsolute.x, y: this.positionAbsolute.y },
            width: this.width,
            height: this.height,
            selected: this.selected,
            sourcePosition: this.sourcePosition,
            targetPosition: this.targetPosition,
            draggable: false,
            selectable: false,
            data: {
                desc: this.data.desc,
                height: this.data.height ?? this.height,
                isInIteration: true,
                iteration_id: this.parentId,
                selected: false,
                title: this.data.title,
                type: "iteration-start",
                width: this.data.width ?? this.width,
            },
        };
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
