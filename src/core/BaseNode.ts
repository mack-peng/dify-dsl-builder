import { NodeData, XY } from "./types";

/**
 * New-style BaseNode — no YAMLWriter dependency.
 * Each subclass implements toJSON() to restore DSL-compatible JSON.
 */
export abstract class BaseNode<T extends NodeData> {
  id: string;
  /** Outer node type: "custom" | "custom-iteration-start" */
  type: string;
  position: XY;
  positionAbsolute: XY;
  width: number;
  height: number;
  selected: boolean;
  sourcePosition: "right";
  targetPosition: "left";
  zIndex?: number;
  data: T;

  // Iteration support (set when node lives inside an iteration)
  parentId?: string;
  isInIteration?: boolean;
  iterationId?: string;

  constructor(id: string, outerType: string, data: T, opts?: {
    width?: number;
    height?: number;
    zIndex?: number;
    parentId?: string;
  }) {
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

  get title(): string { return this.data.title; }
  get desc(): string { return this.data.desc; }

  setTitle(v: string): this { this.data.title = v; return this; }
  setDesc(v: string): this { this.data.desc = v; return this; }

  setPosition(x: number, y: number): this {
    this.position = { x, y };
    this.positionAbsolute = { x, y };
    return this;
  }

  setSize(w: number, h: number): this {
    this.width = w;
    this.height = h;
    return this;
  }

  setZIndex(z: number): this {
    this.zIndex = z;
    return this;
  }

  /** Produce the outer-level JSON for this node (including `data` block) */
  abstract toJSON(): Record<string, unknown>;

  /** Build JSON for the `data` block (shared boilerplate). Subclasses extend it. */
  protected dataToJSON(extra?: Record<string, unknown>): Record<string, unknown> {
    const base: Record<string, unknown> = {
      desc: this.data.desc,
      selected: this.data.selected,
      title: this.data.title,
      type: this.data.type,
    };
    if (this.isInIteration) {
      base.isInIteration = true;
      base.iteration_id = this.iterationId;
    }
    if (extra) Object.assign(base, extra);
    return base;
  }

  /** Build the outer node JSON shared by all subclasses */
  protected outerToJSON(dataObj: Record<string, unknown>): Record<string, unknown> {
    const out: Record<string, unknown> = {
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
    if (this.zIndex !== undefined) out.zIndex = this.zIndex;
    if (this.parentId) out.parentId = this.parentId;
    if (this.type === "custom-iteration-start") {
      out.draggable = false;
      out.selectable = false;
    }
    return out;
  }
}
