import { XY, BaseNodeData } from "../types/common";
import { YAMLWriter } from "../serializer";

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
  data: T;

  constructor(id: string, outerType: string, data: T, opts?: { width?: number; height?: number }) {
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

  protected writeOuter(w: YAMLWriter): void {
    if (this.type === "custom-iteration-start") {
      w.keyVal("draggable", false);
      w.keyVal("selectable", false);
    }
    w.keyVal("height", this.height);
    w.keySingleQuoted("id", this.id);
    w.key("position");
    w.indent(() => {
      w.keyVal("x", this.position.x);
      w.keyVal("y", this.position.y);
    });
    w.key("positionAbsolute");
    w.indent(() => {
      w.keyVal("x", this.positionAbsolute.x);
      w.keyVal("y", this.positionAbsolute.y);
    });
    w.keyVal("selected", this.selected);
    w.keyVal("sourcePosition", this.sourcePosition);
    w.keyVal("targetPosition", this.targetPosition);
    w.keyVal("type", this.type);
    w.keyVal("width", this.width);
  }

  protected writeDataHead(w: YAMLWriter): void {
    w.key("data");
    w.indent(() => {
      w.keyVal("type", this.data.type);
      w.keyQuoted("title", this.data.title);
      w.keyQuoted("desc", this.data.desc);
      w.keyVal("selected", this.data.selected);
    });
  }

  abstract toYAML(w: YAMLWriter): void;
  static fromYAML(raw: Record<string, unknown>): BaseNode<any> {
    throw new Error("fromYAML not implemented");
  }
}
