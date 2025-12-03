import { FunctionDefinition } from './types';

// 天气查询工具参数类型
export interface WeatherToolParams {
  date: string;
  city: string;
}

// 天气查询工具返回类型
export interface WeatherToolResult {
  city: string;
  date: string;
  temperature: number;
  weather: string;
  icon: string;
  humidity: number;
  windSpeed: string;
  windDirection: string;
  airQuality: string;
  suggestion: string;
  updateTime: string;
}

// 天气查询工具（mock版）
export const weatherTool = (params: WeatherToolParams): WeatherToolResult => {
  if (!params.date || !params.city) {
    throw new Error("必须提供日期和城市参数");
  }
  
  // 天气类型数组
  const weatherTypes = [
    { type: '晴天', icon: '☀️', minTemp: 10, maxTemp: 30 },
    { type: '多云', icon: '⛅', minTemp: 5, maxTemp: 25 },
    { type: '阴天', icon: '☁️', minTemp: 0, maxTemp: 20 },
    { type: '小雨', icon: '🌧️', minTemp: 5, maxTemp: 18 },
    { type: '中雨', icon: '🌧️', minTemp: 3, maxTemp: 15 },
    { type: '大雨', icon: '⛈️', minTemp: 0, maxTemp: 12 },
    { type: '雷阵雨', icon: '⚡', minTemp: 5, maxTemp: 20 },
    { type: '雪', icon: '❄️', minTemp: -10, maxTemp: 5 },
    { type: '雾', icon: '🌫️', minTemp: -5, maxTemp: 15 },
    { type: '沙尘暴', icon: '🌪️', minTemp: 0, maxTemp: 25 }
  ];

  // 获取随机的天气类型
  const randomWeather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
  
  // 生成随机温度（在天气类型的温度范围内）
  const temperature = Math.floor(Math.random() * (randomWeather.maxTemp - randomWeather.minTemp + 1)) + randomWeather.minTemp;
  
  // 根据天气类型和温度生成建议
  let suggestion = '';
  if (temperature < 0) {
    suggestion = '天气非常寒冷，请穿厚羽绒服，注意防寒保暖';
  } else if (temperature < 10) {
    suggestion = '天气寒冷，建议穿厚外套，注意保暖';
  } else if (temperature < 20) {
    suggestion = '天气凉爽，建议穿外套或薄毛衣';
  } else {
    suggestion = '天气温暖，适合穿短袖或薄外套';
  }

  // 如果是雨天，添加雨具建议
  if (randomWeather.type.includes('雨')) {
    suggestion += '，记得带伞';
  } else if (randomWeather.type === '雪') {
    suggestion += '，注意防滑';
  } else if (randomWeather.type === '晴天') {
    suggestion += '，注意防晒';
  }

  return {
    city: params.city,
    date: params.date,
    temperature: temperature,
    weather: randomWeather.type,
    icon: randomWeather.icon,
    humidity: Math.floor(Math.random() * 50) + 30, // 30-80% 湿度
    windSpeed: (Math.random() * 10).toFixed(1), // 0-10 m/s
    windDirection: ['北', '东北', '东', '东南', '南', '西南', '西', '西北'][Math.floor(Math.random() * 8)],
    airQuality: ['优', '良', '轻度污染', '中度污染', '重度污染'][Math.floor(Math.random() * 5)],
    suggestion: suggestion,
    updateTime: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
  };
};

// 天气查询工具的描述
export const weatherToolFunction: FunctionDefinition = {
  name: "weatherTool",
  description: "获取指定城市在指定日期的详细天气信息，包括温度、天气状况、湿度、风速风向、空气质量等，并提供穿衣和生活建议。数据为随机生成，用于演示目的。",
  parameters: {
    type: "object",
    properties: {
      date: {
        type: "string",
        description: "查询日期，格式为 'YYYY-MM-DD' 或相对描述如 '今天'、'明天'、'后天'"
      },
      city: {
        type: "string",
        description: "要查询的城市名称，例如：'北京'、'上海'、'广州'、'深圳'等"
      }
    },
    required: ["date", "city"]
  }
};

