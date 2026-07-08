import { addError, ValidationReport } from "../types/validation";

export function checkEnvVars(report: ValidationReport, envVars: unknown[]): void {
  for (const ev of envVars as any[]) {
    if (!ev.id) {
      addError(report, {
        severity: "error", code: "env-missing-id",
        message: `Env variable '${ev.name}' missing 'id'`,
      });
    }
    if (!ev.selector || !ev.selector.length) {
      addError(report, {
        severity: "error", code: "env-missing-selector",
        message: `Env variable '${ev.name}' missing 'selector'`,
      });
    }
  }
}
