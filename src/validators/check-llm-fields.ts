import { addError, ValidationReport } from "../types/validation";
import { BaseNode } from "../nodes/base";

export function checkLLMFields(report: ValidationReport, llmNodes: BaseNode<any>[]): void {
  for (const n of llmNodes) {
    if (!(n as any).data.context) {
      addError(report, {
        severity: "error", code: "llm-missing-context", nodeId: n.id,
        message: `LLM ${n.id} missing 'context' field`,
      });
    }
    if (!(n as any).data.vision) {
      addError(report, {
        severity: "error", code: "llm-missing-vision", nodeId: n.id,
        message: `LLM ${n.id} missing 'vision' field`,
      });
    }
  }
}
