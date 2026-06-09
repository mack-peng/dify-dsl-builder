import * as fs from "fs";
import { Graph } from "./graph";
import { Features } from "./features";
import { YAMLWriter } from "./serializer";
import { loadFromFile } from "./deserializer";
import { validate } from "./validator";
import { ValidationReport } from "./types/validation";
import { Dependency, AppMeta } from "./types/common";

export class DifyDSL {
  version: string;
  kind: "app";
  app: AppMeta;
  dependencies: Dependency[];
  graph: Graph;
  features: Features;
  envVariables: { name: string; value?: unknown; value_type?: string; description?: string }[];
  convVariables: { name: string; value_type?: string; description?: string }[];

  private constructor(
    version: string,
    app: AppMeta,
    dependencies: Dependency[],
    graph: Graph,
    features: Features,
    envVariables: { name: string; value?: unknown; value_type?: string; description?: string }[],
    convVariables: { name: string; value_type?: string; description?: string }[],
  ) {
    this.version = version;
    this.kind = "app";
    this.app = app;
    this.dependencies = dependencies;
    this.graph = graph;
    this.features = features;
    this.envVariables = envVariables;
    this.convVariables = convVariables;
  }

  get mode(): "workflow" | "advanced-chat" {
    return this.app.mode;
  }

  static load(filePath: string): DifyDSL {
    const raw = loadFromFile(filePath);
    return new DifyDSL(
      raw.version, raw.app, raw.dependencies,
      raw.graph, raw.features,
      raw.envVariables, raw.convVariables,
    );
  }

  save(filePath: string): void {
    const w = new YAMLWriter();
    this.toYAML(w);
    fs.writeFileSync(filePath, w.toString(), "utf-8");
  }

  // === Env / Conv variables ===
  setEnv(name: string, value: unknown, type: "number" | "string"): this {
    const existing = this.envVariables.find(e => e.name === name);
    if (existing) {
      existing.value = value;
      existing.value_type = type;
    } else {
      this.envVariables.push({ name, value, value_type: type, description: "" });
    }
    return this;
  }

  removeEnv(name: string): this {
    this.envVariables = this.envVariables.filter(e => e.name !== name);
    return this;
  }

  setConv(name: string, type: "number" | "string"): this {
    if (this.mode !== "advanced-chat") {
      throw new Error("conversation_variables only supported in advanced-chat mode");
    }
    const existing = this.convVariables.find(c => c.name === name);
    if (existing) {
      existing.value_type = type;
    } else {
      this.convVariables.push({ name, value_type: type, description: "" });
    }
    return this;
  }

  removeConv(name: string): this {
    this.convVariables = this.convVariables.filter(c => c.name !== name);
    return this;
  }

  // === Validation ===
  validate(): ValidationReport {
    return validate(this.graph, this.mode);
  }

  // === Serialization ===
  private toYAML(w: YAMLWriter): void {
    // --- header ---
    w.key("app");
    w.indent(() => {
      w.keyQuoted("description", this.app.description);
      w.keyQuoted("icon", this.app.icon);
      w.keySingleQuoted("icon_background", this.app.icon_background);
      w.keyVal("mode", this.app.mode);
      w.keyQuoted("name", this.app.name);
      w.keyVal("use_icon_as_answer_icon", this.app.use_icon_as_answer_icon);
    });

    // dependencies
    w.key("dependencies");
    this.dependencies.forEach(d => {
      w.listItem(() => {
        w.keyVal("current_identifier", null);
        w.keyVal("type", "marketplace");
        w.key("value");
        w.incIndent();
        w.keyQuoted("marketplace_plugin_unique_identifier", d.value.marketplace_plugin_unique_identifier);
        w.keyVal("version", null);
        w.decIndent();
      });
    });

    w.keyVal("kind", "app");
    w.keyVal("version", this.version);

    // workflow
    w.key("workflow");
    w.indent(() => {
      // conversation_variables
      if (this.convVariables.length === 0) {
        w.raw("conversation_variables: []");
      } else {
        w.key("conversation_variables");
        this.convVariables.forEach(c => {
          w.listItem(() => {
            if (c.description) w.keyQuoted("description", c.description);
            w.keyVal("name", c.name);
            w.keyVal("value_type", c.value_type ?? "string");
          });
        });
      }

      // environment_variables
      if (this.envVariables.length === 0) {
        w.raw("environment_variables: []");
      } else {
        w.key("environment_variables");
        this.envVariables.forEach(e => {
          w.listItem(() => {
            if (e.description) w.keyQuoted("description", e.description);
            w.keyVal("name", e.name);
            w.keyVal("value", e.value as number);
            w.keyVal("value_type", e.value_type ?? "number");
          });
        });
      }

      // features
      this.features.toYAML(w);

      // graph
      this.graph.toYAML(w);

      // rag_pipeline_variables
      w.raw("rag_pipeline_variables: []");
    });
  }
}

// Re-export for convenience
export * from "./nodes";
export * from "./edge";
export { Graph } from "./graph";
export { Features } from "./features";
