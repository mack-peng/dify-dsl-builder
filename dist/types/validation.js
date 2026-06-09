"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReport = createReport;
exports.addError = addError;
exports.addWarning = addWarning;
function createReport() {
    return { ok: true, errors: [], warnings: [] };
}
function addError(r, diag) {
    r.errors.push(diag);
    r.ok = false;
}
function addWarning(r, diag) {
    r.warnings.push(diag);
}
