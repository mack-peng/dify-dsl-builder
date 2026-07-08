import { addError, ValidationReport } from "../types/validation";

export function checkConvVars(report: ValidationReport, convVars: unknown[]): void {
  for (const cv of convVars as any[]) {
    if (!cv.id) {
      addError(report, {
        severity: "error", code: "conv-missing-id",
        message: `Conv variable '${cv.name}' missing 'id'`,
      });
    }
    if (!cv.selector || !cv.selector.length) {
      addError(report, {
        severity: "error", code: "conv-missing-selector",
        message: `Conv variable '${cv.name}' missing 'selector'`,
      });
    }
    if (cv.value_type === "number" && typeof cv.value !== "number") {
      addError(report, {
        severity: "error", code: "conv-value-type-mismatch",
        message: `Conv variable '${cv.name}' value_type=number but value is ${typeof cv.value}`,
      });
    }
  }
}
