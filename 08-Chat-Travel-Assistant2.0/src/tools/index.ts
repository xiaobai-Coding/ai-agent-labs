import { ToolRegistry, WorkflowContext, WorkflowStep } from "../workflow/types";
import { weatherTool } from "../../../tools/weather";
import { travelAdviceTool } from "../../../tools/travelAdviceTool";
import { trafficTimeTool } from "../../../tools/trafficTimeTool";
import { packingListTool } from "../../../tools/packingListTool";

/**
 * 从步骤结果中获取天气信息
 */
function getWeatherFromStepResults(
  ctx: WorkflowContext,
  step: WorkflowStep
): { temp: number; weather: string } | null {
  // 查找依赖的天气步骤结果
  const deps = step.depends_on || [];
  for (const depId of deps) {
    const depResult = ctx.stepResults[depId];
    if (depResult && depResult.temperature !== undefined && depResult.weather) {
      return {
        temp: depResult.temperature,
        weather: depResult.weather
      };
    }
  }
  return null;
}

/**
 * weatherTool 适配器
 * 从 context.params 中获取 destination 和 date
 */
const weatherToolAdapter = async (
  ctx: WorkflowContext,
  step: WorkflowStep
) => {
  const city = ctx.params?.destination?.trim();
  const date = ctx.params?.date?.trim() || "今天";

  if (!city) {
    throw new Error("workflow params 缺少 destination，无法调用 weatherTool");
  }

  return weatherTool({ city, date });
};

/**
 * trafficTimeTool 适配器
 * 需要 destination 和 weather（从依赖步骤获取）
 */
const trafficTimeToolAdapter = async (
  ctx: WorkflowContext,
  step: WorkflowStep
) => {
  const { destination } = ctx.params;
  if (!destination) {
    throw new Error("trafficTimeTool 需要 destination 参数");
  }

  // 尝试从依赖步骤获取天气信息
  const weatherInfo = getWeatherFromStepResults(ctx, step);
  const weather = weatherInfo?.weather || "晴天"; // 默认值

  return trafficTimeTool({ destination, weather });
};

/**
 * travelAdviceTool 适配器
 * 需要 temp 和 weather（从依赖步骤获取）
 */
const travelAdviceToolAdapter = async (
  ctx: WorkflowContext,
  step: WorkflowStep
) => {
  const weatherInfo = getWeatherFromStepResults(ctx, step);
  if (!weatherInfo) {
    throw new Error("travelAdviceTool 需要从依赖步骤获取天气信息");
  }
  return travelAdviceTool({
    temp: weatherInfo.temp,
    weather: weatherInfo.weather
  });
};

/**
 * packingListTool 适配器
 * 需要 transportMode, temp, weather
 */
const packingListToolAdapter = async (
  ctx: WorkflowContext,
  step: WorkflowStep
) => {
  const { transportation_preference } = ctx.params;
  if (!transportation_preference) {
    throw new Error("packingListTool 需要 transportation_preference 参数");
  }

  // 验证交通方式
  const validModes = ["自驾", "高铁", "飞机", "火车"];
  const transportMode = validModes.includes(transportation_preference)
    ? (transportation_preference as "自驾" | "高铁" | "飞机" | "火车")
    : "高铁"; // 默认值

  const weatherInfo = getWeatherFromStepResults(ctx, step);
  if (!weatherInfo) {
    throw new Error("packingListTool 需要从依赖步骤获取天气信息");
  }

  return packingListTool({
    transportMode,
    temp: weatherInfo.temp,
    weather: weatherInfo.weather
  });
};

/**
 * 工具注册表
 */
export const tools: ToolRegistry = {
  weatherTool: weatherToolAdapter,
  trafficTimeTool: trafficTimeToolAdapter,
  travelAdviceTool: travelAdviceToolAdapter,
  packingListTool: packingListToolAdapter
};

