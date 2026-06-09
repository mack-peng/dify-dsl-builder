import { Graph } from "./graph";
import { Features } from "./features";
import { ValidationReport } from "./types/validation";
import { Dependency, AppMeta } from "./types/common";
export declare class DifyDSL {
    version: string;
    kind: "app";
    app: AppMeta;
    dependencies: Dependency[];
    graph: Graph;
    features: Features;
    envVariables: {
        name: string;
        value?: unknown;
        value_type?: string;
        description?: string;
    }[];
    convVariables: {
        name: string;
        value_type?: string;
        description?: string;
    }[];
    private constructor();
    get mode(): "workflow" | "advanced-chat";
    static load(filePath: string): DifyDSL;
    save(filePath: string): void;
    setEnv(name: string, value: unknown, type: "number" | "string"): this;
    removeEnv(name: string): this;
    setConv(name: string, type: "number" | "string"): this;
    removeConv(name: string): this;
    validate(): ValidationReport;
    private toYAML;
}
export * from "./nodes";
export * from "./edge";
export { Graph } from "./graph";
export { Features } from "./features";
