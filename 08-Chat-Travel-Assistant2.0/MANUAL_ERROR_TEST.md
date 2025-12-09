# 手动触发错误恢复机制测试指南

## 问题说明

由于模型会自动填充默认值（如 `destination: "重庆"`），正常流程下很难触发错误恢复机制。本指南提供几种手动触发错误的方法。

---

## 方法 1：浏览器控制台直接测试（推荐）

### 步骤 1：打开开发者工具
按 `F12` 打开浏览器开发者工具，切换到 `Console` 标签。

### 步骤 2：发送一个正常的请求
在聊天界面输入：
```
帮我查询明天的天气情况
```

### 步骤 3：等待 WorkflowPlan 生成
等待模型返回 WorkflowPlan，然后在控制台执行以下代码：

```javascript
// 获取当前的工作流计划（需要从代码中获取，或者手动构造）
// 方法：在 aiService.ts 的 executeTravelWorkflow 函数中添加断点
// 或者直接修改 params 为空

// 在控制台执行（需要先获取到 plan 对象）
// 注意：这需要在代码中添加一些调试代码
```

---

## 方法 2：修改代码添加测试模式（最简单）

### 步骤 1：修改 `weatherToolAdapter` 添加测试模式

在 `src/tools/index.ts` 中修改：

```typescript
const weatherToolAdapter = async (
  ctx: WorkflowContext,
  step: WorkflowStep
) => {
  const city = ctx.params?.destination?.trim();
  const date = ctx.params?.date?.trim() || "今天";

  // 🔥 测试模式：如果 destination 是特定值，强制抛出错误
  if (city === "TEST_ERROR" || city === "") {
    throw new Error("workflow params 缺少 destination，无法调用 weatherTool");
  }

  if (!city) {
    throw new Error("workflow params 缺少 destination，无法调用 weatherTool");
  }

  return weatherTool({ city, date });
};
```

### 步骤 2：修改 SYSTEM_PROMPT 添加测试指令

在 `src/components/ChatComponent.vue` 的 `SYSTEM_PROMPT` 中添加：

```typescript
【测试模式说明】
如果用户明确要求测试错误恢复，可以将 destination 设置为空字符串 "" 或 "TEST_ERROR"
```

### 步骤 3：测试

输入：
```
测试错误恢复：帮我查询天气，但不要设置目的地
```

或者让模型返回 `destination: ""` 的 WorkflowPlan。

---

## 方法 3：在 executeTravelWorkflow 中强制修改 params（最直接）

### 修改 `src/services/aiService.ts`

在 `executeTravelWorkflow` 函数开始处添加：

```typescript
async function executeTravelWorkflow(
  plan: WorkflowPlan,
  userMessages: any[],
  onPartialResponse: (partialResponse: string) => void,
  showDebugReasoning: boolean,
  hooks?: AIExecutionHooks
): Promise<AIResponse> {
  console.log("[Workflow] 开始执行工作流:", plan);

  // 🔥 测试模式：强制清空 destination 以触发错误恢复
  // 取消下面的注释来测试错误恢复机制
  // plan.params.destination = "";

  hooks?.onPlanningUpdate?.({
    stage: "tool",
    status: "running",
    detail: `开始执行工作流，共 ${plan.steps.length} 个步骤`
  });
  // ... 其余代码
}
```

### 测试步骤

1. 取消注释 `plan.params.destination = "";`
2. 发送任何请求（如"帮我查询明天的天气"）
3. 观察错误恢复机制是否触发
4. 测试完成后，重新注释掉这行代码

---

## 方法 4：使用 URL 参数控制测试模式（最优雅）

### 步骤 1：添加测试模式检测

在 `src/services/aiService.ts` 中添加：

```typescript
// 检测 URL 参数
const urlParams = new URLSearchParams(window.location.search);
const testErrorRecovery = urlParams.get('testErrorRecovery') === 'true';

async function executeTravelWorkflow(
  plan: WorkflowPlan,
  userMessages: any[],
  onPartialResponse: (partialResponse: string) => void,
  showDebugReasoning: boolean,
  hooks?: AIExecutionHooks
): Promise<AIResponse> {
  console.log("[Workflow] 开始执行工作流:", plan);

  // 🔥 测试模式：通过 URL 参数控制
  if (testErrorRecovery) {
    console.warn("[测试模式] 强制清空 destination 以测试错误恢复");
    plan.params.destination = "";
  }

  // ... 其余代码
}
```

### 步骤 2：测试

在浏览器地址栏添加参数：
```
http://localhost:5173/?testErrorRecovery=true
```

然后发送任何请求，错误恢复机制会自动触发。

---

## 方法 5：创建专门的测试工具函数（最专业）

### 创建 `src/utils/testErrorRecovery.ts`

```typescript
/**
 * 测试错误恢复机制的工具函数
 * 在浏览器控制台调用：window.testErrorRecovery()
 */
export function setupErrorRecoveryTest() {
  (window as any).testErrorRecovery = function(plan: any) {
    if (!plan || !plan.params) {
      console.error("无效的 WorkflowPlan");
      return;
    }

    // 保存原始值
    const originalDestination = plan.params.destination;
    
    // 清空 destination 以触发错误
    plan.params.destination = "";
    console.log("[测试] 已清空 destination，准备触发错误恢复");
    console.log("[测试] 原始值:", originalDestination);
    
    return {
      original: originalDestination,
      reset: () => {
        plan.params.destination = originalDestination;
        console.log("[测试] 已恢复原始值");
      }
    };
  };

  console.log("✅ 错误恢复测试工具已加载");
  console.log("使用方法：window.testErrorRecovery(plan)");
}
```

### 在 `main.ts` 中引入（仅开发环境）

```typescript
if (import.meta.env.DEV) {
  import('./utils/testErrorRecovery').then(module => {
    module.setupErrorRecoveryTest();
  });
}
```

### 使用方法

1. 发送一个正常请求
2. 在控制台执行：
   ```javascript
   // 需要先获取到 plan 对象（可以通过断点或日志）
   window.testErrorRecovery(plan);
   ```

---

## 推荐方案

**最简单**：使用方法 3（在代码中临时添加 `plan.params.destination = "";`）

**最优雅**：使用方法 4（URL 参数控制）

**最专业**：使用方法 5（专门的测试工具函数）

---

## 验证错误恢复是否生效

无论使用哪种方法，验证步骤相同：

### 1. 控制台日志
应该看到：
```
[Workflow] 尝试错误恢复，步骤: 1, ...
[Workflow] 获取到修正后的参数: { destination: "...", ... }
参数已修正，正在重试步骤 1...
```

### 2. UI 显示
- 规划面板：显示错误恢复状态
- 工具执行日志：显示重试成功

### 3. 网络请求
在 Network 面板中应该看到：
- 错误恢复请求（调用模型修正参数）
- 工具重试请求

---

## 注意事项

1. **测试完成后记得恢复代码**：如果使用方法 3，测试完成后要注释掉测试代码
2. **不要在生产环境启用测试模式**：确保测试代码不会影响生产环境
3. **观察模型响应**：确保模型能够正确理解错误并返回修正后的参数

---

## 快速测试脚本

将以下代码保存为书签，点击即可触发测试：

```javascript
javascript:(function(){
  const url = new URL(window.location.href);
  url.searchParams.set('testErrorRecovery', 'true');
  window.location.href = url.toString();
})();
```

使用方法：
1. 创建书签，URL 填入上面的代码
2. 在聊天页面点击书签
3. 发送任何请求
4. 观察错误恢复机制

