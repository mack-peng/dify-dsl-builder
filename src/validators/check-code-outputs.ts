import { addError, ValidationReport } from "../types/validation";
import { BaseNode } from "../nodes/base";

const VALID_TYPES = new Set([
  "string", "number", "integer", "float", "boolean", "object", "file", "secret",
  "array[string]", "array[number]", "array[integer]", "array[float]", "array[object]",
  "array[boolean]", "array[file]", "array[any]", "none", "group",
]);

export function checkCodeOutputs(report: ValidationReport, codeNodes: BaseNode<any>[]): void {
  for (const n of codeNodes) {
    const outputs = (n as any).data.outputs || {};
    for (const [name, out] of Object.entries(outputs as Record<string, any>)) {
      if (!VALID_TYPES.has(out.type)) {
        addError(report, {
          severity: "error", code: "code-output-type", nodeId: n.id,
          message: `Code ${n.id} output '${name}' type '${out.type}' is invalid`,
        });
      }
    }
  }
}
