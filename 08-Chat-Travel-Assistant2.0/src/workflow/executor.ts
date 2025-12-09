import {
  WorkflowPlan,
  WorkflowContext,
  ToolRegistry,
  WorkflowStep,
  ExecutorHooks
} from "./types";

function depsSatisfied(step: WorkflowStep, steps: WorkflowStep[]) {
  const deps = step.depends_on ?? [];
  return deps.length === 0 || deps.every(id => steps.find(s => s.id === id)?.status === "done");
}

export async function runWorkflow(
  plan: WorkflowPlan,
  tools: ToolRegistry,
  hooks: ExecutorHooks = {}
) {
  const { onStepStart, onStepSuccess, onStepError, onStepErrorRecovery } = hooks;
  const steps = plan.steps.map(s => ({ ...s }));
  const context: WorkflowContext = {
    params: plan.params,
    stepResults: {}
  };

  while (true) {
    const pending = steps.filter(s => s.status === "pending");
    if (!pending.length) break;
    const step = pending.find(s => depsSatisfied(s, steps));
    if (!step) throw new Error("存在无法执行的 pending 步骤（依赖未满足）");

    step.status = "running";
    onStepStart?.(step);

    if (!step.tool) {
      step.status = "done";
      onStepSuccess?.(step, null);
      continue;
    }

    const fn = tools[step.tool];
    if (!fn) throw new Error(`未找到工具实现: ${step.tool}`);

    try {
      const result = await fn(context, step);
      step.status = "done";
      step.output = result;
      context.stepResults[step.id] = result;
      onStepSuccess?.(step, result);
    } catch (e: any) {
      step.status = "error";
      step.error = e.message;
      onStepError?.(step, e);

      // 尝试错误恢复
      if (onStepErrorRecovery) {
        try {
          const recoveredParams = await onStepErrorRecovery(step, e, context);
          if (recoveredParams) {
            // 更新 context.params
            context.params = recoveredParams;
            // 重置步骤状态，准备重试
            step.status = "pending";
            step.error = undefined;
            // 继续循环，重新尝试执行该步骤
            continue;
          }
        } catch (recoveryError: any) {
          console.error("[Workflow] 错误恢复失败:", recoveryError);
          // 恢复失败，继续抛出原始错误
        }
      }

      // 如果没有恢复机制或恢复失败，抛出错误
      throw e;
    }
  }

  return { plan: { ...plan, steps }, context };
}

