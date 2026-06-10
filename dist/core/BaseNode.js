"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseNode = void 0;
/**
 * New-style BaseNode — no YAMLWriter dependency.
 * Each subclass implements toJSON() to restore DSL-compatible JSON.
 */
class BaseNode {
    id;
    /** Outer node type: "custom" | "custom-iteration-start" */
    type;
    position;
    positionAbsolute;
    width;
    height;
    selected;
    sourcePosition;
    targetPosition;
    zIndex;
    data;
    // Iteration support (set when node lives inside an iteration)
    parentId;
    isInIteration;
    iterationId;
    constructor(id, outerType, data, opts) {
        this.id = id;
        this.type = outerType;
        this.position = { x: 0, y: 0 };
        this.positionAbsolute = { x: 0, y: 0 };
        this.width = opts?.width ?? 242;
        this.height = opts?.height ?? 90;
        this.zIndex = opts?.zIndex;
        this.selected = false;
        this.sourcePosition = "right";
        this.targetPosition = "left";
        this.data = data;
        this.parentId = opts?.parentId;
    }
    get title() { return this.data.title; }
    get desc() { return this.data.desc; }
    setTitle(v) { this.data.title = v; return this; }
    setDesc(v) { this.data.desc = v; return this; }
    setPosition(x, y) {
        this.position = { x, y };
        this.positionAbsolute = { x, y };
        return this;
    }
    setSize(w, h) {
        this.width = w;
        this.height = h;
        return this;
    }
    setZIndex(z) {
        this.zIndex = z;
        return this;
    }
    /** Build JSON for the `data` block (shared boilerplate). Subclasses extend it. */
    dataToJSON(extra) {
        const base = {
            desc: this.data.desc,
            selected: this.data.selected,
            title: this.data.title,
            type: this.data.type,
        };
        if (this.isInIteration) {
            base.isInIteration = true;
            base.iteration_id = this.iterationId;
        }
        if (extra)
            Object.assign(base, extra);
        return base;
    }
    /** Build the outer node JSON shared by all subclasses */
    outerToJSON(dataObj) {
        const out = {
            id: this.id,
            type: this.type,
            position: { x: this.position.x, y: this.position.y },
            positionAbsolute: { x: this.positionAbsolute.x, y: this.positionAbsolute.y },
            width: this.width,
            height: this.height,
            selected: this.selected,
            sourcePosition: this.sourcePosition,
            targetPosition: this.targetPosition,
            data: dataObj,
        };
        if (this.zIndex !== undefined)
            out.zIndex = this.zIndex;
        if (this.parentId)
            out.parentId = this.parentId;
        if (this.type === "custom-iteration-start") {
            out.draggable = false;
            out.selectable = false;
        }
        return out;
    }
}
exports.BaseNode = BaseNode;
