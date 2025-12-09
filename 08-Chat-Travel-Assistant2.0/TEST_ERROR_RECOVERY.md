# 🧪 错误恢复机制测试指南

## 快速开始（最简单方法）

### 方法 1：URL 参数测试（推荐 ⭐）

1. **在浏览器地址栏添加参数**：
   ```
   http://localhost:5173/?testErrorRecovery=true
   ```

2. **发送任何请求**，例如：
   ```
   帮我查询明天的天气情况
   ```

3. **观察结果**：
   - 打开浏览器开发者工具（F12）
   - 查看 Console，应该看到：
     ```
     [测试模式] 🔥 强制清空 destination 以测试错误恢复机制
     [Workflow] 尝试错误恢复，步骤: 1, ...
     [Workflow] 获取到修正后的参数: { destination: "...", ... }
     ```
   - 查看"任务规划步骤"面板，应该看到错误恢复状态
   - 查看"工具执行日志"面板，应该看到重试成功

### 方法 2：环境变量测试

1. **在 `.env.local` 文件中添加**：
   ```env
   VITE_TEST_ERROR_RECOVERY=true
   ```

2. **重启开发服务器**

3. **发送任何请求进行测试**

---

## 验证错误恢复是否生效

### ✅ 成功标志

1. **控制台日志**（必须看到）：
   ```
   [测试模式] 🔥 强制清空 destination 以测试错误恢复机制
   [测试模式] 原始 destination: 重庆
   [Workflow] 尝试错误恢复，步骤: 1, 查询明天重庆的天气情况
   [Workflow] 获取到修正后的参数: { destination: "重庆", date: "2025-04-09", ... }
   参数已修正，正在重试步骤 1...
   ```

2. **UI 显示**：
   - **任务规划步骤面板**：
     - `步骤 1 执行失败，正在尝试修复参数...`
     - `参数已修正，正在重试步骤 1...`
   
   - **工具执行日志面板**：
     - 第一次：`❌ 错误: workflow params 缺少 destination，无法调用 weatherTool`
     - 第二次：`✅ 成功: ...`（重试后成功）

3. **网络请求**（Network 面板）：
   - 错误恢复请求（调用模型修正参数）
   - 工具重试请求

4. **最终结果**：
   - 工作流成功完成
   - 生成最终答案

---

## 测试用例

### 测试 1：基本错误恢复
```
1. 访问：http://localhost:5173/?testErrorRecovery=true
2. 输入：帮我查询明天的天气情况
3. 验证：destination 参数被自动修正，步骤重试成功
```

### 测试 2：多个参数缺失
```
1. 修改代码，同时清空多个参数：
   plan.params.destination = "";
   plan.params.date = "";
2. 发送请求
3. 验证：所有参数被一次性修正
```

### 测试 3：依赖步骤错误
```
1. 修改代码，清空 destination
2. 发送包含多个步骤的请求（如：查询天气+穿衣建议）
3. 验证：依赖关系被正确处理
```

---

## 关闭测试模式

### 方法 1：移除 URL 参数
```
http://localhost:5173/
```

### 方法 2：移除环境变量
从 `.env.local` 中删除：
```env
VITE_TEST_ERROR_RECOVERY=true
```
然后重启开发服务器。

---

## 常见问题

### Q: 为什么没有触发错误恢复？
A: 检查以下几点：
1. ✅ URL 参数是否正确：`?testErrorRecovery=true`
2. ✅ 控制台是否显示 `[测试模式]` 日志
3. ✅ 工具适配器是否真的抛出了错误

### Q: 错误恢复后仍然失败？
A: 可能原因：
1. 模型返回的参数格式不正确
2. 参数验证失败（检查控制台的警告日志）
3. 依赖关系问题未解决

### Q: 如何测试其他工具的错误恢复？
A: 可以修改代码，清空不同的参数：
```typescript
// 测试 trafficTimeTool
plan.params.destination = "";

// 测试 packingListTool
plan.params.transportation_preference = "";

// 测试 travelAdviceTool（需要先让 weatherTool 失败）
plan.params.destination = "";
```

---

## 调试技巧

### 1. 查看完整日志
在控制台输入：
```javascript
// 查看所有工作流相关日志
console.log('[Workflow]')
console.log('[测试模式]')
```

### 2. 检查参数修正
在错误恢复回调中添加断点：
```typescript
// 在 aiService.ts 的 onStepErrorRecovery 回调中
console.log("修正后的参数:", correctedParams);
```

### 3. 验证参数格式
检查模型返回的参数是否符合类型定义：
```typescript
{
  destination: string,  // 必须
  date: string,         // 必须
  stay_days: number,    // 必须
  transportation_preference: string  // 必须
}
```

---

## 注意事项

1. ⚠️ **不要在生产环境启用测试模式**
2. ⚠️ **测试完成后记得关闭测试模式**
3. ⚠️ **观察模型响应质量**：如果模型返回的格式不正确，恢复会失败

---

## 快速测试清单

- [ ] 访问 `?testErrorRecovery=true`
- [ ] 发送测试请求
- [ ] 查看控制台日志（应该有 `[测试模式]` 和 `[Workflow]` 日志）
- [ ] 查看规划面板（应该显示错误恢复状态）
- [ ] 查看工具执行日志（应该显示重试成功）
- [ ] 验证最终结果（工作流成功完成）
- [ ] 关闭测试模式

---

## 如果测试失败

1. **检查控制台错误**：查看是否有 JavaScript 错误
2. **检查网络请求**：确认错误恢复请求是否发送成功
3. **检查模型响应**：确认模型返回的参数格式是否正确
4. **检查参数验证**：确认修正后的参数是否符合类型定义

如果仍然无法解决问题，请提供：
- 控制台完整日志
- 网络请求详情
- 具体的错误信息

