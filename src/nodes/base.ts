import { XY, BaseNodeData } from "../types/common";

export abstract class BaseNode<T extends BaseNodeData> {
  id: string;
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

  parentId?: string;
  isInIteration?: boolean;
  iterationId?: string;

  constructor(id: string, outerType: string, data: T, opts?: { width?: number; height?: number; zIndex?: number }) {
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
  }

  get title(): string { return this.data.title; }
  get desc(): string { return this.data.desc; }

  setTitle(title: string): this {
    this.data.title = title;
    return this;
  }

  setDesc(desc: string): this {
    this.data.desc = desc;
    return this;
  }

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

  clearZIndex(): this {
    this.zIndex = undefined;
    return this;
  }

  /** Build the outer JSON shell shared by all nodes. Subclasses call this from toJSON(). */
  protected outerJSON(dataBlock: Record<string, unknown>): Record<string, unknown> {
    const out: Record<string, unknown> = {
      id: this.id, type: this.type,
      position: { x: this.position.x, y: this.position.y },
      positionAbsolute: { x: this.positionAbsolute.x, y: this.positionAbsolute.y },
      width: this.width, height: this.height,
      selected: this.selected,
      sourcePosition: this.sourcePosition,
      targetPosition: this.targetPosition,
      data: dataBlock,
    };
    if (this.zIndex !== undefined) out.zIndex = this.zIndex;
    if (this.parentId) out.parentId = this.parentId;
    if (this.type === "custom-iteration-start") {
      out.draggable = false;
      out.selectable = false;
    }
    return out;
  }

  /** Build the data block stub shared by all nodes. Subclasses extend this. */
  protected dataJSON(extra?: Record<string, unknown>): Record<string, unknown> {
    const base: Record<string, unknown> = {
      desc: this.desc,
      selected: this.selected,
      title: this.title,
      type: this.data.type,
    };
    if (this.isInIteration) {
      base.isInIteration = true;
      base.iteration_id = this.iterationId;
    }
    if (extra) Object.assign(base, extra);
    return base;
  }

  /** Serialize this node to a plain JSON object (DSL-compatible). */
  toJSON(): Record<string, unknown> {
    // Default fallback — subclasses should override.
    return this.outerJSON(this.dataJSON());
  }

  static fromYAML(raw: Record<string, unknown>): BaseNode<any> {
    throw new Error("fromYAML not implemented");
  }

  /** Apply common position/size/zIndex from raw YAML to a created node — avoid duplicate 4-line tail in every fromYAML */
  protected static applyCommon(node: BaseNode<any>, raw: Record<string, unknown>): void {
    node.setPosition((raw.position as XY).x, (raw.position as XY).y);
    node.width = raw.width as number;
    node.height = raw.height as number;
    if (raw.zIndex !== undefined) node.zIndex = raw.zIndex as number;
  }
}
