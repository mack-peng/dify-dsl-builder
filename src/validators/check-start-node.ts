import { addError, addWarning, ValidationReport } from "../types/validation";
import { BaseNode } from "../nodes/base";

export function checkStartNode(report: ValidationReport, nodes: BaseNode<any>[]): void {
  if (nodes.length === 0) {
    addError(report, { severity: "error", code: "missing-start", message: "Missing Start node" });
  }
  if (nodes.length > 1) {
    addWarning(report, { severity: "warning", code: "multiple-starts", message: "Multiple Start nodes" });
  }
}
