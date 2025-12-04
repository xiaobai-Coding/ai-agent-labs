import { FunctionDefinition } from "./types";

export interface TodoStep {
    id: number;
    title: string;      // 子任务标题：打包衣服
    detail?: string;    // 可选：更详细说明
    status: "pending" | "done";
  }
  
  export interface TodoPlannerParams {
    // 模型已经在内部想好每个子任务，
    // 再把这些任务用 换行 / 逗号 / 顿号 分隔后传进来
    steps_text: string;
  }
  
  export const todoPlannerTool = (
    params: TodoPlannerParams
  ): { steps: TodoStep[] } => {
    const { steps_text } = params;
  
    if (!steps_text || typeof steps_text !== "string") {
      throw new Error("steps_text must be a non-empty string");
    }
  
    // 支持：
    // 1. 换行分割
    // 2. 逗号 / 顿号 / 分号
    // 3. 去掉前面常见的序号（1. 2） - ① - • 等
    const rawItems = steps_text
      .split(/[\n\r]+|[,，、；;]+/)
      .map((item) =>
        item
          .replace(/^\s*[\d\-•·①②③④⑤⑥⑦⑧⑨⑩\.]+/, "") // 去掉前缀序号
          .trim()
      )
      .filter(Boolean);
  
    if (rawItems.length === 0) {
      throw new Error("无法从 steps_text 中提取可执行任务");
    }
  
    const steps: TodoStep[] = rawItems.map((title, index) => ({
      id: index + 1,
      title,
      status: "pending"
    }));
  
    return { steps };
  };

  export const todoPlannerFunction: FunctionDefinition = {
    name: "todoPlannerTool",
    description:
      "将你已经规划好的多条子任务（文本列表）转换为标准的待办步骤列表。你需要先在思考中完成任务拆解，再把每条子任务用换行或逗号分隔后作为 steps_text 传入。",
    parameters: {
      type: "object",
      properties: {
        steps_text: {
          type: "string",
          description:
            "你已经拆解好的子任务列表，例如：'打包衣物\\n整理重要文件\\n联系搬家公司确认时间'"
        }
      },
      required: ["steps_text"]
    }
  };