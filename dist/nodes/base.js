"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseNode = void 0;
class BaseNode {
    id;
    type;
    position;
    positionAbsolute;
    width;
    height;
    selected;
    sourcePosition;
    targetPosition;
    data;
    constructor(id, outerType, data, opts) {
        this.id = id;
        this.type = outerType;
        this.position = { x: 0, y: 0 };
        this.positionAbsolute = { x: 0, y: 0 };
        this.width = opts?.width ?? 242;
        this.height = opts?.height ?? 90;
        this.selected = false;
        this.sourcePosition = "right";
        this.targetPosition = "left";
        this.data = data;
    }
    get title() { return this.data.title; }
    get desc() { return this.data.desc; }
    setTitle(title) {
        this.data.title = title;
        return this;
    }
    setDesc(desc) {
        this.data.desc = desc;
        return this;
    }
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
    writeOuter(w) {
        if (this.type === "custom-iteration-start") {
            w.keyVal("draggable", false);
            w.keyVal("selectable", false);
        }
        w.keyVal("height", this.height);
        w.keySingleQuoted("id", this.id);
        if (this.parentId) {
            w.keySingleQuoted("parentId", this.parentId);
        }
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
        w.keyVal("selected", this.selected);
        w.keyVal("sourcePosition", this.sourcePosition);
        w.keyVal("targetPosition", this.targetPosition);
        w.keyVal("type", this.type);
        w.keyVal("width", this.width);
    }
    writeDataHead(w) {
        w.key("data");
        w.incIndent();
        w.keyQuoted("desc", this.data.desc);
        w.keyVal("selected", this.data.selected);
        w.keyQuoted("title", this.data.title);
        w.keyVal("type", this.data.type);
    }
    closeData(w) {
        if (this.isInIteration) {
            w.keyVal("isInIteration", true);
            w.keySingleQuoted("iteration_id", this.iterationId);
        }
        w.decIndent();
    }
    static fromYAML(raw) {
        throw new Error("fromYAML not implemented");
    }
}
exports.BaseNode = BaseNode;
