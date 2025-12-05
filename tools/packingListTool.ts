import { FunctionDefinition } from "./types";

/**
 * 物品清单工具参数类型
 */
export interface PackingListParams {
  /** 交通方式 */
  transportMode: "自驾" | "高铁" | "飞机" | "火车";
  /** 温度（摄氏度） */
  temp: number;
  /** 天气描述，如 "晴天"、"小雨"、"多云" 等 */
  weather: string;
}

/**
 * 物品清单工具返回类型
 */
export interface PackingListResult {
  /** 交通方式 */
  transportMode: "自驾" | "高铁" | "飞机" | "火车";
  /** 温度 */
  temp: number;
  /** 天气描述 */
  weather: string;
  /** 物品清单分类 */
  categories: {
    /** 必需品（证件、钱包等） */
    essentials: string[];
    /** 衣物类 */
    clothing: string[];
    /** 电子设备 */
    electronics: string[];
    /** 个人护理 */
    personalCare: string[];
    /** 天气相关物品 */
    weatherItems: string[];
    /** 交通方式特定物品 */
    transportSpecific: string[];
  };
  /** 完整清单（扁平化） */
  fullList: string[];
  /** 清单摘要说明 */
  summary: string;
}

/**
 * 根据交通方式生成基础必需品
 */
const getEssentialsByTransport = (
  transportMode: "自驾" | "高铁" | "飞机" | "火车"
): string[] => {
  const baseEssentials = ["身份证", "手机", "充电器", "钱包", "钥匙"];

  switch (transportMode) {
    case "飞机":
      return [
        ...baseEssentials,
        "护照（如需要）",
        "登机牌/电子登机牌",
        "行李标签",
        "旅行保险单（如购买）",
      ];
    case "高铁":
    case "火车":
      return [
        ...baseEssentials,
        "车票/电子车票",
        "学生证/优惠证件（如适用）",
      ];
    case "自驾":
      return [
        ...baseEssentials,
        "驾驶证",
        "行驶证",
        "车辆保险单",
        "车辆年检标志",
      ];
    default:
      return baseEssentials;
  }
};

/**
 * 根据交通方式生成特定物品
 */
const getTransportSpecificItems = (
  transportMode: "自驾" | "高铁" | "飞机" | "火车"
): string[] => {
  switch (transportMode) {
    case "飞机":
      return [
        "U型枕",
        "眼罩",
        "耳塞",
        "一次性拖鞋",
        "湿纸巾",
        "小包装零食",
      ];
    case "高铁":
    case "火车":
      return [
        "U型枕",
        "充电宝",
        "小零食",
        "水杯",
        "湿纸巾",
        "一次性拖鞋（长途）",
      ];
    case "自驾":
      return [
        "车载充电器",
        "导航设备/手机支架",
        "行车记录仪（如未安装）",
        "应急工具包",
        "备用轮胎检查",
        "车载灭火器",
        "反光背心",
        "三角警示牌",
      ];
    default:
      return [];
  }
};

/**
 * 根据温度生成衣物建议
 */
const getClothingByTemp = (temp: number): string[] => {
  if (temp <= 0) {
    return [
      "羽绒服",
      "保暖内衣",
      "厚毛衣",
      "保暖裤",
      "厚袜子",
      "保暖手套",
      "帽子",
      "围巾",
      "雪地靴",
    ];
  } else if (temp <= 10) {
    return [
      "厚外套",
      "毛衣",
      "长裤",
      "厚袜子",
      "手套",
      "帽子",
      "围巾",
      "保暖鞋",
    ];
  } else if (temp <= 20) {
    return [
      "薄外套",
      "长袖T恤",
      "长裤",
      "薄袜子",
      "运动鞋",
      "薄围巾（可选）",
    ];
  } else if (temp <= 28) {
    return [
      "短袖T恤",
      "薄长袖（备用）",
      "长裤/短裤",
      "薄外套（早晚）",
      "运动鞋",
      "凉鞋（可选）",
    ];
  } else {
    return [
      "短袖T恤",
      "短裤",
      "凉鞋/拖鞋",
      "太阳帽",
      "太阳镜",
      "防晒衣",
      "薄外套（空调房）",
    ];
  }
};

/**
 * 根据天气生成天气相关物品
 */
const getWeatherItems = (weather: string, temp: number): string[] => {
  const items: string[] = [];

  // 根据天气类型添加物品
  if (weather.includes("雨")) {
    items.push("雨伞", "雨衣", "防水鞋套", "防水包");
    if (weather.includes("大雨") || weather.includes("暴雨")) {
      items.push("备用衣物", "防水外套");
    }
  }

  if (weather.includes("雪")) {
    items.push("防滑鞋套", "保暖手套", "帽子", "围巾");
  }

  if (weather.includes("晴")) {
    if (temp > 20) {
      items.push("太阳镜", "防晒霜", "遮阳帽", "防晒衣");
    }
  }

  if (weather.includes("雾")) {
    items.push("口罩", "湿纸巾");
  }

  if (weather.includes("风")) {
    items.push("防风外套", "帽子");
  }

  // 根据温度补充
  if (temp > 25) {
    items.push("小风扇", "湿纸巾", "补水喷雾");
  }

  if (temp < 10) {
    items.push("暖宝宝", "保温杯", "热饮");
  }

  return [...new Set(items)]; // 去重
};

/**
 * 生成电子设备清单
 */
const getElectronics = (
  transportMode: "自驾" | "高铁" | "飞机" | "火车"
): string[] => {
  const base = ["手机", "充电器", "充电宝", "耳机"];

  if (transportMode === "自驾") {
    return [
      ...base,
      "车载充电器",
      "行车记录仪",
      "导航设备",
      "蓝牙耳机（开车用）",
    ];
  }

  if (transportMode === "飞机") {
    return [
      ...base,
      "平板电脑/电子书（可选）",
      "降噪耳机",
      "转换插头（国际航班）",
    ];
  }

  return [...base, "平板电脑/电子书（可选）"];
};

/**
 * 生成个人护理物品清单
 */
const getPersonalCare = (
  transportMode: "自驾" | "高铁" | "飞机" | "火车",
  duration: "short" | "medium" | "long" = "medium"
): string[] => {
  const base = ["牙刷", "牙膏", "毛巾", "纸巾", "湿纸巾"];

  if (transportMode === "飞机" || duration === "long") {
    return [
      ...base,
      "洗面奶",
      "护肤品",
      "剃须刀（如需要）",
      "梳子",
      "润唇膏",
      "护手霜",
    ];
  }

  return base;
};

/**
 * 生成清单摘要说明
 */
const generateSummary = (
  transportMode: "自驾" | "高铁" | "飞机" | "火车",
  temp: number,
  weather: string,
  itemCount: number
): string => {
  const transportTips: Record<string, string> = {
    飞机: "注意液体物品限制，建议提前了解航空公司的行李规定",
    高铁: "行李相对宽松，但注意不要携带违禁品",
    火车: "行李限制较少，但注意贵重物品安全",
    自驾: "可以携带更多物品，但注意车辆载重和空间",
  };

  const tempTips =
    temp <= 0
      ? "天气寒冷，重点准备保暖物品"
      : temp <= 10
      ? "天气较冷，注意保暖"
      : temp <= 20
      ? "天气凉爽，准备薄外套"
      : temp <= 28
      ? "天气舒适，轻便出行"
      : "天气炎热，注意防晒和补水";

  return `根据${transportMode}出行、${temp}°C、${weather}的天气情况，共整理了 ${itemCount} 件物品。${tempTips}。${transportTips[transportMode]}。`;
};

/**
 * 物品清单工具（mock 实现）
 * 
 * 根据交通方式和天气参数，生成详细的携带物品清单
 * 
 * @param params - 工具参数，包含交通方式、温度和天气描述
 * @returns 物品清单结果，包括分类清单和完整清单
 * 
 * @example
 * ```typescript
 * const result = packingListTool({
 *   transportMode: "高铁",
 *   temp: 15,
 *   weather: "小雨"
 * });
 * // 返回分类的物品清单，包括必需品、衣物、电子设备等
 * ```
 */
export const packingListTool = (
  params: PackingListParams
): PackingListResult => {
  const { transportMode, temp, weather } = params;

  if (
    !["自驾", "高铁", "飞机", "火车"].includes(transportMode)
  ) {
    throw new Error(
      'transportMode 参数必须是 "自驾"、"高铁"、"飞机" 或 "火车"'
    );
  }

  if (typeof temp !== "number" || Number.isNaN(temp)) {
    throw new Error("temp 参数必须是数字");
  }

  if (!weather || typeof weather !== "string") {
    throw new Error("weather 参数必须是非空字符串");
  }

  // 生成各类物品清单
  const essentials = getEssentialsByTransport(transportMode);
  const clothing = getClothingByTemp(temp);
  const electronics = getElectronics(transportMode);
  const personalCare = getPersonalCare(transportMode);
  const weatherItems = getWeatherItems(weather, temp);
  const transportSpecific = getTransportSpecificItems(transportMode);

  // 合并完整清单（去重）
  const fullList = [
    ...essentials,
    ...clothing,
    ...electronics,
    ...personalCare,
    ...weatherItems,
    ...transportSpecific,
  ].filter((item, index, self) => self.indexOf(item) === index); // 去重

  // 生成摘要
  const summary = generateSummary(
    transportMode,
    temp,
    weather,
    fullList.length
  );

  return {
    transportMode,
    temp,
    weather,
    categories: {
      essentials,
      clothing,
      electronics,
      personalCare,
      weatherItems,
      transportSpecific,
    },
    fullList,
    summary,
  };
};

/**
 * 物品清单工具的 Function Calling 描述
 */
export const packingListFunction: FunctionDefinition = {
  name: "packingListTool",
  description:
    "根据交通方式，目的地温度和天气描述，生成详细的携带物品清单。清单包括必需品、衣物、电子设备、个人护理、天气相关物品和交通方式特定物品等分类，帮助用户准备出行物品。",
  parameters: {
    type: "object",
    properties: {
      transportMode: {
        type: "string",
        enum: ["自驾", "高铁", "飞机", "火车"],
        description: "出行交通方式"
      },
      temp: {
        type: "number",
        description: "目的地温度，单位摄氏度"
      },
      weather: {
        type: "string",
        description: "目的地天气描述，如'晴天'、'小雨'、'多云'、'雪'等"
      }
    },
    required: ["transportMode", "temp", "weather"]
  }
};

