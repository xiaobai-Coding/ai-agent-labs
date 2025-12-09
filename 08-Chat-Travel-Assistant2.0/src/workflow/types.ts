export type StepStatus = "pending" | "running" | "done" | "error";
export type StepCategory = "weather" | "traffic" | "travel" | "packing" | "final";
export type ToolName =
  | "weatherTool"
  | "trafficTimeTool"
  | "travelAdviceTool"
  | "packingListTool";

export interface WorkflowStep {
  id: number;
  action: string;
  category: StepCategory;
  tool: ToolName | null;
  depends_on?: number[];
  status: StepStatus;
  error?: string;
  output?: any;
}

export interface WorkflowParams {
  destination: string;
  date: string;
  stay_days: number;
  transportation_preference: string;
}

export interface WorkflowPlan {
  phase: "planning";
  params: WorkflowParams;
  steps: WorkflowStep[];
}

export interface WorkflowContext {
  params: WorkflowParams;
  stepResults: Record<number, any>;
}

export type ToolFn = (
  ctx: WorkflowContext,
  step: WorkflowStep
) => Promise<any> | any;

export type ToolRegistry = Record<ToolName, ToolFn>;

export interface ExecutorHooks {
  onStepStart?: (step: WorkflowStep) => void;
  onStepSuccess?: (step: WorkflowStep, result: any) => void;
  onStepError?: (step: WorkflowStep, error: Error) => void;
  onStepErrorRecovery?: (
    step: WorkflowStep,
    error: Error,
    context: WorkflowContext
  ) => Promise<WorkflowParams | null>; // 返回修正后的 params，如果返回 null 则跳过恢复
}

