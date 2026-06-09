import { XY, BaseNodeData } from "../types/common";
import { YAMLWriter } from "../serializer";
export declare abstract class BaseNode<T extends BaseNodeData> {
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
    constructor(id: string, outerType: string, data: T, opts?: {
        width?: number;
        height?: number;
    });
    get title(): string;
    get desc(): string;
    setTitle(title: string): this;
    setDesc(desc: string): this;
    setPosition(x: number, y: number): this;
    setSize(w: number, h: number): this;
    protected writeOuter(w: YAMLWriter): void;
    protected writeDataHead(w: YAMLWriter): void;
    abstract toYAML(w: YAMLWriter): void;
    static fromYAML(raw: Record<string, unknown>): BaseNode<any>;
}
