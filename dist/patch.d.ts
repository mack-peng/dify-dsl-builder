import { DifyDSL } from "./core/DifyDSL";
export declare function loadPatch(filePath: string): {
    steps: Record<string, any>[];
    description?: string;
};
export declare function applyPatch(dsl: DifyDSL, steps: Record<string, any>[]): void;
