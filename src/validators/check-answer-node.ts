import { addError, ValidationReport } from "../types/validation";
import { BaseNode } from "../nodes/base";

export function checkAnswerNode(report: ValidationReport, answers: BaseNode<any>[], mode: string): void {
  if (mode === "advanced-chat" && answers.length === 0) {
    addError(report, {
      severity: "error",
      code: "missing-answer",
      message: "advanced-chat mode requires Answer node",
    });
  }
}
