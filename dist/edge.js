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
    iterationId;
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
        this.iterationId = opts?.iterationId;
    }
    redirect(newTarget) {
        this.target = newTarget;
        this.id = `${this.source}-${this.sourceHandle}-${newTarget}-${this.targetHandle}`;
    }
    toYAML(w, sourceType, targetType) {
        w.listItem(() => {
            w.key("data");
            w.incIndent();
            w.keyVal("isInIteration", this.isInIteration);
            w.keyVal("isInLoop", this.isInLoop);
            if (this.iterationId) {
                w.keySingleQuoted("iteration_id", this.iterationId);
            }
            w.keyVal("sourceType", sourceType);
            w.keyVal("targetType", targetType);
            w.decIndent();
            w.keyVal("id", this.id);
            w.keySingleQuoted("source", this.source);
            if (this.sourceHandle === "true" || this.sourceHandle === "false") {
                w.keySingleQuoted("sourceHandle", this.sourceHandle);
            }
            else {
                w.keyVal("sourceHandle", this.sourceHandle);
            }
            w.keySingleQuoted("target", this.target);
            w.keyVal("targetHandle", this.targetHandle);
            w.keyVal("type", "custom");
            w.keyVal("zIndex", this.zIndex);
        });
    }
    static fromYAML(raw) {
        const data = raw.data;
        const e = new Edge(raw.source, raw.target, raw.sourceHandle, raw.targetHandle, {
            zIndex: raw.zIndex,
            isInIteration: data?.isInIteration,
            isInLoop: data?.isInLoop,
            iterationId: data?.iteration_id,
        });
        e.id = raw.id;
        return e;
    }
}
exports.Edge = Edge;
