import { addError, addWarning, ValidationReport } from "../types/validation";
import { CompletionAppConfig, AppMeta } from "../core/types";

/**
 * completion 应用校验：顶层是 model_config（无 workflow/graph）。
 * 检查 pre_prompt、model 配置、user_input_form 结构是否完整。
 */
export function checkCompletionConfig(
  report: ValidationReport,
  cfg: CompletionAppConfig,
  app: AppMeta,
): void {
  if (app.mode !== "completion") {
    addError(report, {
      severity: "error",
      code: "completion-mode-mismatch",
      message: `app.mode is '${app.mode}' but file has model_config (no workflow) — expected 'completion'`,
    });
  }

  // ── pre_prompt ──
  if (!cfg.pre_prompt || typeof cfg.pre_prompt !== "string") {
    addError(report, {
      severity: "error",
      code: "completion-missing-pre-prompt",
      message: "completion app missing non-empty 'model_config.pre_prompt'",
    });
  }

  // ── model ──
  const model = cfg.model;
  if (!model) {
    addError(report, {
      severity: "error",
      code: "completion-missing-model",
      message: "completion app missing 'model_config.model'",
    });
    return;
  }

  if (!model.provider) {
    addError(report, {
      severity: "error",
      code: "completion-model-provider",
      message: "completion app model missing 'provider'",
    });
  }
  if (!model.name) {
    addError(report, {
      severity: "error",
      code: "completion-model-name",
      message: "completion app model missing 'name'",
    });
  }
  if (model.mode !== "chat" && model.mode !== "completion") {
    addError(report, {
      severity: "error",
      code: "completion-model-mode",
      message: `completion app model.mode '${model.mode}' invalid, expected chat/completion`,
    });
  }
  if (!model.completion_params || typeof model.completion_params !== "object") {
    addError(report, {
      severity: "error",
      code: "completion-model-params",
      message: "completion app model missing 'completion_params'",
    });
  }

  // ── user_input_form ──
  const form = cfg.user_input_form ?? [];
  for (const [i, item] of form.entries()) {
    const entry = item["text-input"] as { variable?: string; label?: string } | undefined;
    if (!entry || typeof entry !== "object") {
      addWarning(report, {
        severity: "warning",
        code: "completion-input-format",
        message: `user_input_form[${i}] is not a 'text-input' entry (skipped)`,
      });
      continue;
    }
    if (!entry.variable) {
      addError(report, {
        severity: "error",
        code: "completion-input-variable",
        message: `user_input_form[${i}] missing 'variable'`,
      });
    }
    if (!entry.label) {
      addWarning(report, {
        severity: "warning",
        code: "completion-input-label",
        message: `user_input_form[${i}] variable '${entry.variable}' missing 'label'`,
      });
    }
  }
}
