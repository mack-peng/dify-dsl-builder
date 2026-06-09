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
  iterationId?: string;

  // sourceType / targetType are inferred at save time, not stored

  constructor(
    source: string,
    target: string,
    sourceHandle: string = "source",
    targetHandle: string = "target",
    opts?: { zIndex?: number; isInIteration?: boolean; isInLoop?: boolean; iterationId?: string }
  ) {
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

  redirect(newTarget: string): void {
    this.target = newTarget;
    this.id = `${this.source}-${this.sourceHandle}-${newTarget}-${this.targetHandle}`;
  }

  toYAML(w: YAMLWriter, sourceType: string, targetType: string): void {
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
      } else {
        w.keyVal("sourceHandle", this.sourceHandle);
      }
      w.keySingleQuoted("target", this.target);
      w.keyVal("targetHandle", this.targetHandle);
      w.keyVal("type", "custom");
      w.keyVal("zIndex", this.zIndex);
    });
  }

  static fromYAML(raw: Record<string, unknown>): Edge {
    const data = raw.data as Record<string, unknown> | undefined;
    const e = new Edge(
      raw.source as string,
      raw.target as string,
      raw.sourceHandle as string,
      raw.targetHandle as string,
      {
        zIndex: raw.zIndex as number,
        isInIteration: data?.isInIteration as boolean,
        isInLoop: data?.isInLoop as boolean,
        iterationId: data?.iteration_id as string,
      }
    );
    e.id = raw.id as string;
    return e;
  }
}
