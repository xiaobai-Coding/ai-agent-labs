// 统一导出所有工具和类型

// 类型导出
export * from './types';

// 工具导出
export * from './calculator';
export * from './unitConverter';
export * from './weather';
export * from './travelAdviceTool';
export * from './todoPlannerTool';
export * from './trafficTimeTool';
export * from './packingListTool';

// 工具函数映射（用于 aiService.ts 中的 availableFunctions）
import { calculator } from './calculator';
import { unitConverter } from './unitConverter';
import { weatherTool } from './weather';
import { travelAdviceTool } from './travelAdviceTool';
import { todoPlannerTool } from './todoPlannerTool';
import { trafficTimeTool } from './trafficTimeTool';
import { packingListTool } from './packingListTool';

export const availableFunctions: Record<string, (params: any) => any> = {
  calculator,
  unitConverter,
  weatherTool,
  travelAdviceTool,
  todoPlannerTool,
  trafficTimeTool,
  packingListTool
};

