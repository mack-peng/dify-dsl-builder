import { YAMLWriter } from "./serializer";

export class Edge {
  id: string;
  source: string;
  sourceHandle: string;
  target: string;
  targetHandle: string;
  zIndex: number;
  isInIteration: boolean;
  isInLoop: boolean;

  // sourceType / targetType are inferred at save time, not stored

  constructor(
    source: string,
    target: string,
    sourceHandle: string = "source",
    targetHandle: string = "target",
    opts?: { zIndex?: number; isInIteration?: boolean; isInLoop?: boolean }
  ) {
    this.source = source;
    this.target = target;
    this.sourceHandle = sourceHandle;
    this.targetHandle = targetHandle;
    this.id = `${source}-${sourceHandle}-${target}-${targetHandle}`;
    this.zIndex = opts?.zIndex ?? 0;
    this.isInIteration = opts?.isInIteration ?? false;
    this.isInLoop = opts?.isInLoop ?? false;
  }

  redirect(newTarget: string): void {
    this.target = newTarget;
    this.id = `${this.source}-${this.sourceHandle}-${newTarget}-${this.targetHandle}`;
  }

  toYAML(w: YAMLWriter, sourceType: string, targetType: string): void {
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

  static fromYAML(raw: Record<string, unknown>): Edge {
    const e = new Edge(
      raw.source as string,
      raw.target as string,
      raw.sourceHandle as string,
      raw.targetHandle as string
    );
    e.id = raw.id as string;
    if (typeof raw.zIndex === "number") e.zIndex = raw.zIndex;
    const data = raw.data as Record<string, unknown> | undefined;
    if (data) {
      if (typeof data.isInIteration === "boolean") e.isInIteration = data.isInIteration;
      if (typeof data.isInLoop === "boolean") e.isInLoop = data.isInLoop;
    }
    return e;
  }
}
