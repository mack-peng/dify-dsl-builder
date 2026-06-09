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
export declare function createReport(): ValidationReport;
export declare function addError(r: ValidationReport, diag: Diagnostic): void;
export declare function addWarning(r: ValidationReport, diag: Diagnostic): void;
