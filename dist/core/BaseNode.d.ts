import { NodeData, XY } from "./types";
/**
 * New-style BaseNode — no YAMLWriter dependency.
 * Each subclass implements toJSON() to restore DSL-compatible JSON.
 */
export declare abstract class BaseNode<T extends NodeData> {
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
    parentId?: string;
    isInIteration?: boolean;
    iterationId?: string;
    constructor(id: string, outerType: string, data: T, opts?: {
        width?: number;
        height?: number;
        zIndex?: number;
        parentId?: string;
    });
    get title(): string;
    get desc(): string;
    setTitle(v: string): this;
    setDesc(v: string): this;
    setPosition(x: number, y: number): this;
    setSize(w: number, h: number): this;
    setZIndex(z: number): this;
    /** Produce the outer-level JSON for this node (including `data` block) */
    abstract toJSON(): Record<string, unknown>;
    /** Build JSON for the `data` block (shared boilerplate). Subclasses extend it. */
    protected dataToJSON(extra?: Record<string, unknown>): Record<string, unknown>;
    /** Build the outer node JSON shared by all subclasses */
    protected outerToJSON(dataObj: Record<string, unknown>): Record<string, unknown>;
}
