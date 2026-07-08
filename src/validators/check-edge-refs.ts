import { addError, ValidationReport } from "../types/validation";
import { EdgeData } from "../core/types";

export function checkEdgeRefs(report: ValidationReport, edges: EdgeData[], nodeIds: Set<string>): void {
  for (const e of edges) {
    if (!nodeIds.has(e.source)) {
      addError(report, {
        severity: "error", code: "edge-source-not-found", edgeId: e.id,
        message: `Edge source '${e.source}' not found`,
      });
    }
    if (!nodeIds.has(e.target)) {
      addError(report, {
        severity: "error", code: "edge-target-not-found", edgeId: e.id,
        message: `Edge target '${e.target}' not found`,
      });
    }
  }
}
