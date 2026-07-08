import { addError, ValidationReport } from "../types/validation";
import { BaseNode } from "../nodes/base";

export function checkIfElseVars(report: ValidationReport, ifElseNodes: BaseNode<any>[]): void {
  for (const n of ifElseNodes) {
    for (const cs of (n as any).data.cases || []) {
      for (const c of cs.conditions || []) {
        const sel = c.variable_selector || [];
        if (sel[0] === "env" || sel[0] === "conversation") {
          addError(report, {
            severity: "error",
            code: `if-else-${sel[0]}-ref`,
            nodeId: n.id,
            message: `if-else ${n.id}: condition variable_selector ["${sel.join('", "')}"] references ${sel[0]} variable — Dify does not support env/conversation in if-else conditions. Insert a Code node to bridge.`,
          });
        }
      }
    }
  }
}
