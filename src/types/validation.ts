export interface Diagnostic {
  severity: "error" | "warning";
  code: string;
  nodeId?: string;
  edgeId?: string;
  message: string;
}

export interface ValidationReport {
  ok: boolean;
  errors: Diagnostic[];
  warnings: Diagnostic[];
}

export function createReport(): ValidationReport {
  return { ok: true, errors: [], warnings: [] };
}

export function addError(r: ValidationReport, diag: Diagnostic): void {
  r.errors.push(diag);
  r.ok = false;
}

export function addWarning(r: ValidationReport, diag: Diagnostic): void {
  r.warnings.push(diag);
}
