import { Graph } from "./graph";
import { Features } from "./features";
import { Dependency, AppMeta } from "./types/common";
export declare function load(yamlStr: string): {
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
    ragVariables: unknown[];
};
export declare function loadFromFile(filePath: string): {
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
    ragVariables: unknown[];
};
