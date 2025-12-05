import { FunctionDefinition } from "./types";

/**
 * 交通时间估算工具参数类型
 */
export interface TrafficTimeParams {
  /** 目的地城市名称 */
  destination: string;
  /** 目的地天气描述（用于生成出行建议，如“晴天”“小雨”“暴雪”） */
  weather: string;
}

/**
 * 交通时间估算工具返回类型
 */
export interface TrafficTimeResult {
  /** 目的地城市 */
  destination: string;
  /** 目的地天气描述 */
  weather: string;
  /** 估算里程（公里） */
  distance: number;
  /** 交通方式 */
  transportMode: "自驾" | "高铁" | "飞机" | "火车";
  /** 预计交通时间（分钟） */
  estimatedTime: number;
  /** 交通时间格式化显示（如 "2小时30分钟"） */
  timeDisplay: string;
  /** 路况说明 */
  trafficCondition: string;
  /** 建议出发时间 */
  suggestedDeparture?: string;
  /** 备注信息 */
  notes?: string;
  /** 基于天气和目的地的出行建议 */
  travelAdvice?: string;
}

/**
 * 城市距离映射表（mock 数据，以北京为起点）
 * 实际应用中应该从真实的地图 API 获取
 */
const cityDistanceMap: Record<string, { distance: number; transportMode: "自驾" | "高铁" | "飞机" | "火车" }> = {
  北京: { distance: 0, transportMode: "自驾" },
  上海: { distance: 1213, transportMode: "高铁" },
  广州: { distance: 2129, transportMode: "飞机" },
  深圳: { distance: 2200, transportMode: "飞机" },
  杭州: { distance: 1260, transportMode: "高铁" },
  成都: { distance: 1873, transportMode: "飞机" },
  重庆: { distance: 1786, transportMode: "高铁" },
  西安: { distance: 1080, transportMode: "高铁" },
  南京: { distance: 1023, transportMode: "高铁" },
  武汉: { distance: 1152, transportMode: "高铁" },
  天津: { distance: 120, transportMode: "自驾" },
  苏州: { distance: 1100, transportMode: "高铁" },
  长沙: { distance: 1445, transportMode: "高铁" },
  郑州: { distance: 695, transportMode: "高铁" },
  济南: { distance: 410, transportMode: "高铁" },
  青岛: { distance: 670, transportMode: "高铁" },
  大连: { distance: 840, transportMode: "飞机" },
  厦门: { distance: 1880, transportMode: "飞机" },
  昆明: { distance: 2600, transportMode: "飞机" },
  哈尔滨: { distance: 1240, transportMode: "飞机" },
};

/**
 * 根据交通方式和里程计算预计时间（分钟）
 */
const calculateEstimatedTime = (
  distance: number,
  transportMode: "自驾" | "高铁" | "飞机" | "火车"
): number => {
  // 不同交通方式的平均速度（公里/小时）
  const speedMap: Record<string, number> = {
    自驾: 80, // 考虑路况，平均速度约 80 km/h
    高铁: 300, // 高铁平均速度约 300 km/h
    飞机: 800, // 飞机平均速度约 800 km/h（含候机时间）
    火车: 120, // 普通火车平均速度约 120 km/h
  };

  const speed = speedMap[transportMode] || 80;
  const hours = distance / speed;
  
  // 添加额外的固定时间（如候机、候车、安检等）
  const additionalTime = transportMode === "飞机" ? 120 : transportMode === "高铁" ? 30 : 10;
  
  return Math.round(hours * 60 + additionalTime);
};

/**
 * 格式化时间显示（分钟转小时分钟）
 */
const formatTimeDisplay = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}分钟`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours}小时`;
  }
  return `${hours}小时${mins}分钟`;
};

/**
 * 生成路况说明
 */
const generateTrafficCondition = (
  distance: number,
  transportMode: "自驾" | "高铁" | "飞机" | "火车"
): string => {
  if (transportMode === "自驾") {
    if (distance < 200) {
      return "路况良好，建议避开早晚高峰";
    } else if (distance < 500) {
      return "部分路段可能拥堵，建议提前规划路线";
    } else {
      return "长途驾驶，注意休息，建议分段行驶";
    }
  } else if (transportMode === "高铁") {
    return "高铁班次较多，建议提前购票";
  } else if (transportMode === "飞机") {
    return "建议提前2小时到达机场，注意航班延误情况";
  } else {
    return "普通火车，建议提前购票，注意车次时间";
  }
};

/**
 * 生成建议出发时间
 */
const generateSuggestedDeparture = (
  transportMode: "自驾" | "高铁" | "飞机" | "火车"
): string => {
  if (transportMode === "自驾") {
    return "建议早上7-8点出发，避开早高峰";
  } else if (transportMode === "高铁") {
    return "建议选择上午或下午班次，避开早晚高峰";
  } else if (transportMode === "飞机") {
    return "建议选择上午或中午航班，延误率较低";
  } else {
    return "建议提前查询车次时刻表，合理安排时间";
  }
};

/**
 * 基于天气与距离生成出行建议
 */
const generateWeatherAdvice = (
  weather: string,
  transportMode: "自驾" | "高铁" | "飞机" | "火车",
  distance: number
): string => {
  const normalized = weather || "";

  // 强天气优先提示
  if (normalized.includes("暴雪")) {
    return "暴雪天气，请关注封路/停运信息，必要时改签或延后行程。";
  }
  if (normalized.includes("暴雨") || normalized.includes("台风")) {
    return "强降雨/台风，务必预留更多机动时间，提前关注航班/车次变更。";
  }

  if (normalized.includes("大雪")) {
    return transportMode === "自驾"
      ? "大雪路滑，自驾需备防滑链，降低车速，拉大车距。"
      : "大雪天气可能导致延误，建议提前查询车次/航班状态。";
  }

  if (normalized.includes("大雨")) {
    return transportMode === "自驾"
      ? "大雨路段视线差，注意开启雾灯和雨刮，预留更长行车时间。"
      : "大雨可能造成延误，请提前到站/机场办理值机或验票。";
  }

  if (normalized.includes("小雨") || normalized.includes("阵雨")) {
    return "有降雨，建议携带雨具，出门预留 20-30 分钟机动时间。";
  }

  if (normalized.includes("雾")) {
    return transportMode === "飞机"
      ? "大雾可能影响航班，请随时关注起降动态。"
      : "有雾，出发前确认能见度，注意安全。";
  }

  if (normalized.includes("高温") || normalized.includes("炎热")) {
    return "高温天气，补水防暑，避免长时间暴晒。";
  }

  if (normalized.includes("寒潮") || normalized.includes("低温")) {
    return "低温出行，注意保暖，提前检查交通是否受影响。";
  }

  // 默认提示
  return distance > 800
    ? "长途出行，建议提前查阅班次并预留中转/安检时间。"
    : "行程较短，正常出行即可，注意实时路况即可。";
};

/**
 * 交通时间估算工具（mock 实现）
 * 
 * 根据目的地城市名称，生成估算的里程和交通时间数据
 * 
 * @param params - 工具参数，包含目的地城市名称
 * @returns 交通时间估算结果，包括里程、交通方式、预计时间等
 * 
 * @example
 * ```typescript
 * const result = trafficTimeTool({ destination: "上海" });
 * // 返回：
 * // {
 * //   destination: "上海",
 * //   distance: 1213,
 * //   transportMode: "高铁",
 * //   estimatedTime: 273,
 * //   timeDisplay: "4小时33分钟",
 * //   trafficCondition: "高铁班次较多，建议提前购票",
 * //   suggestedDeparture: "建议选择上午或下午班次，避开早晚高峰"
 * // }
 * ```
 */
export const trafficTimeTool = (params: TrafficTimeParams): TrafficTimeResult => {
  if (
    !params.destination ||
    typeof params.destination !== "string"
  ) {
    throw new Error("destination 参数必须是非空字符串");
  }
  if (!params.weather || typeof params.weather !== "string") {
    throw new Error("weather 参数必须是非空字符串");
  }

  const destination = params.destination.trim();
  const weather = params.weather.trim();
  
  // 查找城市距离信息
  let cityInfo = cityDistanceMap[destination];
  
  // 如果城市不在映射表中，生成随机数据
  if (!cityInfo) {
    // 根据城市名称的哈希值生成相对稳定的距离（避免每次查询结果不同）
    const hash = destination.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const baseDistance = (hash % 2000) + 200; // 200-2200 公里
    
    // 根据距离选择合适的交通方式
    let transportMode: "自驾" | "高铁" | "飞机" | "火车";
    if (baseDistance < 300) {
      transportMode = "自驾";
    } else if (baseDistance < 800) {
      transportMode = "高铁";
    } else if (baseDistance < 1500) {
      transportMode = "高铁";
    } else {
      transportMode = "飞机";
    }
    
    cityInfo = { distance: baseDistance, transportMode };
  }

  const { distance, transportMode } = cityInfo;
  const estimatedTime = calculateEstimatedTime(distance, transportMode);
  const timeDisplay = formatTimeDisplay(estimatedTime);
  const trafficCondition = generateTrafficCondition(distance, transportMode);
  const suggestedDeparture = generateSuggestedDeparture(transportMode);
  const travelAdvice = generateWeatherAdvice(weather, transportMode, distance);

  // 生成备注信息
  let notes: string | undefined;
  if (distance > 1500) {
    notes = "长途旅行，建议提前做好行程规划，注意休息";
  } else if (transportMode === "飞机") {
    notes = "请提前关注航班动态，建议购买延误险";
  }

  return {
    destination,
    weather,
    distance,
    transportMode,
    estimatedTime,
    timeDisplay,
    trafficCondition,
    suggestedDeparture,
    notes,
    travelAdvice,
  };
};

/**
 * 交通时间估算工具的 Function Calling 描述
 */
export const trafficTimeFunction: FunctionDefinition = {
  name: "trafficTimeTool",
  description:
    "根据目的地城市名称和天气描述，估算从当前位置（默认北京）到目的地的里程、交通时间、交通方式，并给出路况、出发时间和基于天气的出行建议（mock 数据）。",
  parameters: {
    type: "object",
    properties: {
      destination: {
        type: "string",
        description: "目的地城市名称，例如：'上海'、'广州'、'深圳'、'杭州'等"
      },
      weather: {
        type: "string",
        description: "目的地天气描述，如 '晴天'、'小雨'、'暴雪'、'台风' 等"
      }
    },
    required: ["destination", "weather"]
  }
};

