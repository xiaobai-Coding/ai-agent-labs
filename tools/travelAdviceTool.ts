import { FunctionDefinition } from "./types";

export interface TravelAdviceParams {
  temp: number; // 当前或预报温度（摄氏度）
  weather: string; // 天气描述，如 "晴天"、"小雨"
}

export interface TravelAdviceResult {
  summary: string;
  clothing: string[];
  checklist: string[];
}

// mock 的天气场景 -> 对应的提示模板
const weatherTipsMap: Record<
  string,
  { summary: string; clothing: string[]; checklist: string[] }
> = {
  晴天: {
    summary: "天气晴朗，适合进行户外观光和拍照。",
    clothing: ["轻便透气的衣物", "太阳镜", "便携防晒伞"],
    checklist: ["防晒霜", "补水饮品"]
  },
  多云: {
    summary: "多云天气，体感舒适，可以安排轻松行程。",
    clothing: ["薄外套", "舒适球鞋"],
    checklist: ["随身水杯", "相机"]
  },
  小雨: {
    summary: "有小雨，建议选择室内行程或备好雨具。",
    clothing: ["防水外套", "防滑鞋"],
    checklist: ["折叠雨伞", "防水包套"]
  },
  大雨: {
    summary: "降雨较大，尽量减少户外活动。",
    clothing: ["连帽雨衣", "防水短靴"],
    checklist: ["一次性雨衣", "备用衣物"]
  },
  雪: {
    summary: "有降雪，注意保暖和路面湿滑。",
    clothing: ["加厚外套", "保暖手套", "帽子"],
    checklist: ["防滑鞋套", "热饮保温杯"]
  }
};

// 根据温度补充一句穿衣提示
const tempAdvice = (temp: number): string => {
  if (temp <= 0) return "温度极低，需穿着羽绒服并注意手脚保暖。";
  if (temp <= 10) return "天气偏冷，出行时请加穿毛衣和厚外套。";
  if (temp <= 20) return "气温凉爽，建议分层穿着，方便增减衣物。";
  if (temp <= 28) return "气温舒适，可穿轻薄长袖或短袖。";
  return "天气炎热，做好防晒并注意补水。";
};

// 主工具：根据温度 + 天气场景拼装建议
export const travelAdviceTool = (
  params: TravelAdviceParams
): TravelAdviceResult => {
  const { temp, weather } = params;

  if (typeof temp !== "number" || Number.isNaN(temp)) {
    throw new Error("temp 参数必须是数字");
  }
  if (!weather || typeof weather !== "string") {
    throw new Error("weather 参数必须是非空字符串");
  }

  // 允许 weather 字段包含更多描述（如“小雨转晴”）
  const normalizedWeather = Object.keys(weatherTipsMap).find((key) =>
    weather.includes(key)
  );

  const baseAdvice =
    (normalizedWeather && weatherTipsMap[normalizedWeather]) ||
    weatherTipsMap["晴天"];

  return {
    summary: `${baseAdvice.summary} ${tempAdvice(temp)}`,
    clothing: baseAdvice.clothing,
    checklist: baseAdvice.checklist
  };
};

// Function Calling 描述
export const travelAdviceFunction: FunctionDefinition = {
  name: "travelAdviceTool",
  description:
    "根据温度（摄氏度）和天气描述，生成旅行出行建议（衣着、注意事项）。",
  parameters: {
    type: "object",
    properties: {
      temp: {
        type: "number",
        description: "当前或预计温度，单位摄氏度"
      },
      weather: {
        type: "string",
        description: "天气描述，如“晴天”“小雨”“多云”等"
      }
    },
    required: ["temp", "weather"]
  }
};

