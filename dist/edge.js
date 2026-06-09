"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Edge = void 0;
class Edge {
    id;
    source;
    sourceHandle;
    target;
    targetHandle;
    zIndex;
    isInIteration;
    isInLoop;
    // sourceType / targetType are inferred at save time, not stored
    constructor(source, target, sourceHandle = "source", targetHandle = "target", opts) {
        this.source = source;
        this.target = target;
        this.sourceHandle = sourceHandle;
        this.targetHandle = targetHandle;
        this.id = `${source}-${sourceHandle}-${target}-${targetHandle}`;
        this.zIndex = opts?.zIndex ?? 0;
        this.isInIteration = opts?.isInIteration ?? false;
        this.isInLoop = opts?.isInLoop ?? false;
    }
    redirect(newTarget) {
        this.target = newTarget;
        this.id = `${this.source}-${this.sourceHandle}-${newTarget}-${this.targetHandle}`;
    }
    toYAML(w, sourceType, targetType) {
        w.raw(`- id: ${this.id}`);
        w.indent(() => {
            w.keyVal("type", "custom");
            w.keySingleQuoted("source", this.source);
            w.keySingleQuoted("sourceHandle", this.sourceHandle);
            w.keySingleQuoted("target", this.target);
            w.keyVal("targetHandle", this.targetHandle);
            w.keyVal("zIndex", this.zIndex);
            w.key("data");
            w.indent(() => {
                w.keyVal("sourceType", sourceType);
                w.keyVal("targetType", targetType);
                w.keyVal("isInIteration", this.isInIteration);
                w.keyVal("isInLoop", this.isInLoop);
            });
        });
    }
    static fromYAML(raw) {
        const e = new Edge(raw.source, raw.target, raw.sourceHandle, raw.targetHandle);
        e.id = raw.id;
        if (typeof raw.zIndex === "number")
            e.zIndex = raw.zIndex;
        const data = raw.data;
        if (data) {
            if (typeof data.isInIteration === "boolean")
                e.isInIteration = data.isInIteration;
            if (typeof data.isInLoop === "boolean")
                e.isInLoop = data.isInLoop;
        }
        return e;
    }
}
exports.Edge = Edge;
