import { XY, BaseNodeData } from "../types/common";
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
    zIndex?: number;
    data: T;
    parentId?: string;
    isInIteration?: boolean;
    iterationId?: string;
    constructor(id: string, outerType: string, data: T, opts?: {
        width?: number;
        height?: number;
        zIndex?: number;
    });
    get title(): string;
    get desc(): string;
    setTitle(title: string): this;
    setDesc(desc: string): this;
    setPosition(x: number, y: number): this;
    setSize(w: number, h: number): this;
    setZIndex(z: number): this;
    clearZIndex(): this;
    /** Build the outer JSON shell shared by all nodes. Subclasses call this from toJSON(). */
    protected outerJSON(dataBlock: Record<string, unknown>): Record<string, unknown>;
    /** Build the data block stub shared by all nodes. Subclasses extend this. */
    protected dataJSON(extra?: Record<string, unknown>): Record<string, unknown>;
    /** Serialize this node to a plain JSON object (DSL-compatible). */
    toJSON(): Record<string, unknown>;
    static fromYAML(raw: Record<string, unknown>): BaseNode<any>;
}
