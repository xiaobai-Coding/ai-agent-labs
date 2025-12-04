<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed, watch } from 'vue';
import type { Message, FunctionCall, ToolResponse } from '../types/chat';
import {
  getAIResponse,
  shouldAskFollowUp,
  getFollowUpSuggestion,
  config,
  type AIResponse,
  type AIExecutionHooks,
  type PlanningUpdatePayload,
  type ToolEventPayload,
  type PlanningStage,
  type PlanningStatus
} from '../services/aiService';
import { tips } from "../utils/tips";

// 使用环境变量中的应用标题
const appTitle = config.appTitle || 'AI 聊天助手';

// 调试配置
const debug = config.debug || true;

// 聊天消息列表
const messages = ref<Message[]>([]);
// 用户输入内容
const userInput = ref('');
// 底部输入框 DOM 引用，用于在模型回复结束后重新聚焦
const inputRef = ref<HTMLTextAreaElement | null>(null);
// 是否正在生成AI回复
const isTyping = ref(false);
// 临时存储AI正在输入的内容
const tempAIResponse = ref('');
// 会话ID，用于生成唯一消息ID
const sessionId = Date.now().toString();
// 消息计数器
let messageCounter = 0;
// 错误状态
const hasError = ref(false);
// 错误消息（仅内部使用，不显示给用户）
let currentError: Error | null = null;
// 是否显示滚动到底部按钮
const showScrollToBottomButton = ref(false);

// 控制是否显示推理内容（默认关闭）
const showReasoning = ref(false);
// 控制简洁模式（默认关闭，显示面板）
const simpleMode = ref(false);

// 计算是否显示创意模式标签
const showCreativeModeTag = computed(() => {
  const temperature = config?.temperature || 0.8;
  return temperature > 0.7;
});

type ToolLogStatus = ToolEventPayload["type"];

const planningPanelOpen = ref(false);
const toolPanelOpen = ref(false);
const planningItems = ref<{ id: string; text: string; isTyping: boolean }[]>([]);
const toolLogs = ref<{
  id: string;
  toolName: string;
  status: ToolLogStatus;
  args?: any;
  result?: any;
  error?: string;
  startTime?: number;
  duration?: number;
}[]>([]);

// 规划步骤列表容器引用
const planningListRef = ref<HTMLElement | null>(null);
// 工具日志列表容器引用
const toolLogListRef = ref<HTMLElement | null>(null);

const formatPayloadSnippet = (payload: any) => {
  if (payload === undefined || payload === null) return "";
  try {
    const text =
      typeof payload === "string" ? payload : JSON.stringify(payload);
    return text.length > 80 ? `${text.slice(0, 80)}...` : text;
  } catch {
    return String(payload);
  }
};

// 格式化耗时显示
const formatDuration = (ms: number): string => {
  if (ms < 1000) {
    return `${ms}ms`;
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(2)}s`;
  } else {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(2);
    return `${minutes}m ${seconds}s`;
  }
};

const stageLabelMap: Record<PlanningStage, string> = {
  intent: "解析需求",
  tool: "工具链路",
  answer: "生成答复"
};

const stageIconMap: Record<PlanningStage, string> = {
  intent: "🧠",
  tool: "💡",
  answer: "📝"
};

const stageStatusLabel: Record<PlanningStatus, string> = {
  pending: "待开始",
  running: "工作中…",
  completed: "完成",
  error: "异常"
};

const toolIconMap: Record<ToolLogStatus, string> = {
  start: "⚙️",
  success: "✅",
  error: "⚠️"
};

const resetExecutionPanels = () => {
  planningItems.value = [];
  toolLogs.value = [];
  // 默认折叠，不抢夺聊天区域焦点
  planningPanelOpen.value = false;
  toolPanelOpen.value = false;
};

// 滚动到规划步骤列表底部
const scrollPlanningListToBottom = () => {
  nextTick(() => {
    if (planningListRef.value) {
      planningListRef.value.scrollTo({
        top: planningListRef.value.scrollHeight,
        behavior: 'smooth'
      });
    }
  });
};

// 滚动到工具日志列表底部
const scrollToolLogListToBottom = () => {
  nextTick(() => {
    if (toolLogListRef.value) {
      toolLogListRef.value.scrollTo({
        top: toolLogListRef.value.scrollHeight,
        behavior: 'smooth'
      });
    }
  });
};

// 打字机效果函数
const typeText = async (
  text: string,
  onChar: (char: string) => void,
  speed: number = 30
): Promise<void> => {
  const chars = text.split("");
  for (const char of chars) {
    onChar(char);
    // 每几个字符滚动一次，保持流畅
    if (chars.indexOf(char) % 3 === 0) {
      scrollPlanningListToBottom();
    }
    await new Promise((resolve) => setTimeout(resolve, speed + Math.random() * 20));
  }
  // 打字完成后确保滚动到底部
  scrollPlanningListToBottom();
};

const updatePlanningStep = async (payload: PlanningUpdatePayload) => {
  if (payload.status === "pending") return;

  const icon = stageIconMap[payload.stage];
  const stage = stageLabelMap[payload.stage];
  const status = stageStatusLabel[payload.status];
  const detail = payload.detail ? `：${payload.detail}` : "";
  const fullText = `${icon} ${stage} · ${status}${detail}`;

  // 创建新的规划项，标记为正在输入
  const itemId = `${Date.now()}-${Math.random().toString(16).slice(2, 6)}`;
  const newItem = {
    id: itemId,
    text: "",
    isTyping: true
  };

  planningItems.value = [...planningItems.value, newItem];

  // 有更新时自动展开一下，让用户知道有进展
  if (!planningPanelOpen.value && planningItems.value.length > 0) {
    planningPanelOpen.value = true;
  }

  // 等待面板展开动画完成后再滚动
  await nextTick();
  setTimeout(() => {
    scrollPlanningListToBottom();
  }, 100);

  // 使用打字机效果逐字添加文本
  await typeText(fullText, (char) => {
    const item = planningItems.value.find(item => item.id === itemId);
    if (item) {
      item.text += char;
    }
  }, 25);

  // 打字完成后，标记为完成
  const finalItem = planningItems.value.find(item => item.id === itemId);
  if (finalItem) {
    finalItem.isTyping = false;
  }

  // 确保最终滚动到底部
  scrollPlanningListToBottom();
};

// 将 todoPlannerTool 的执行结果映射到「任务规划步骤」面板中
const renderTodoPlannerResult = async (result: any) => {
  if (!result || !Array.isArray(result.steps) || result.steps.length === 0) {
    return;
  }

  const steps = result.steps as { id: number; title: string; detail?: string; status: string }[];

  // 先插入一个总览说明
  const summaryId = `${Date.now()}-${Math.random().toString(16).slice(2, 6)}`;
  const summaryItem = {
    id: summaryId,
    text: "",
    isTyping: true
  };
  planningItems.value = [...planningItems.value, summaryItem];

  if (!planningPanelOpen.value && planningItems.value.length > 0) {
    planningPanelOpen.value = true;
  }

  await nextTick();
  const summaryText = `📌 已为你拆解出 ${steps.length} 个可执行子任务：`;
  await typeText(summaryText, (char) => {
    const item = planningItems.value.find((it) => it.id === summaryId);
    if (item) {
      item.text += char;
    }
  }, 25);

  const finalSummary = planningItems.value.find((it) => it.id === summaryId);
  if (finalSummary) {
    finalSummary.isTyping = false;
  }

  // 逐条展示子任务
  for (const step of steps) {
    const itemId = `${Date.now()}-${Math.random().toString(16).slice(2, 6)}`;
    const newItem = {
      id: itemId,
      text: "",
      isTyping: true
    };
    planningItems.value = [...planningItems.value, newItem];

    await nextTick();
    const lineText = `🔹 (${step.id}) ${step.title}`;
    await typeText(lineText, (char) => {
      const item = planningItems.value.find((it) => it.id === itemId);
      if (item) {
        item.text += char;
      }
    }, 22);

    const finalItem = planningItems.value.find((it) => it.id === itemId);
    if (finalItem) {
      finalItem.isTyping = false;
    }
  }

  // 最后再滚动一下，确保用户看到全部规划结果
  scrollPlanningListToBottom();
};

const pushToolLogEntry = (event: ToolEventPayload) => {
  const now = Date.now();
  const logEntry: typeof toolLogs.value[0] = {
    id: `${now}-${Math.random().toString(16).slice(2, 6)}`,
    toolName: event.toolName,
    status: event.type,
    args: event.args,
    result: event.result,
    error: event.error
  };

  // 如果是 start 事件，记录开始时间并添加到列表开头
  if (event.type === "start") {
    logEntry.startTime = now;
    toolLogs.value = [logEntry, ...toolLogs.value].slice(0, 10);
  } else {
    // 找到对应的 start 记录并更新（查找最近的、同名的、状态为 start 的记录）
    const index = toolLogs.value.findIndex(log =>
      log.toolName === event.toolName && log.status === "start"
    );
    if (index !== -1) {
      const startLog = toolLogs.value[index];
      const duration = startLog.startTime ? now - startLog.startTime : undefined;
      toolLogs.value[index] = {
        ...startLog,
        ...logEntry,
        startTime: startLog.startTime,
        duration
      };
    } else {
      // 如果找不到对应的 start 记录，直接添加
      toolLogs.value = [logEntry, ...toolLogs.value].slice(0, 10);
    }
  }

  // 有工具调用时自动展开一下
  if (!toolPanelOpen.value && toolLogs.value.length > 0) {
    toolPanelOpen.value = true;
  }

  // 滚动到工具日志列表底部
  scrollToolLogListToBottom();
};

const startPlanningFlow = async () => {
  resetExecutionPanels();
  const itemId = `${Date.now()}-${Math.random().toString(16).slice(2, 6)}`;
  const newItem = {
    id: itemId,
    text: "",
    isTyping: true
  };
  planningItems.value.push(newItem);

  // 等待面板展开后再滚动
  await nextTick();
  setTimeout(() => {
    scrollPlanningListToBottom();
  }, 100);

  // 使用打字机效果显示初始提示
  await typeText("🧠 工作中…", (char) => {
    const item = planningItems.value.find(item => item.id === itemId);
    if (item) {
      item.text += char;
    }
  }, 30);

  // 打字完成后，标记为完成
  const finalItem = planningItems.value.find(item => item.id === itemId);
  if (finalItem) {
    finalItem.isTyping = false;
  }

  // 确保最终滚动到底部
  scrollPlanningListToBottom();
};

const IDENTITY_RESPONSE =
  "您好，我是由default模型提供支持，作为Cursor IDE的核心功能之一，可协助完成各类开发任务，只要是编程相关的问题，都可以问我！你现在有什么想做的吗？";

const identityPatterns = [
  /什么模型/,
  /哪个模型/,
  /你是什么模型/,
  /你是谁/,
  /model/i,
  /是谁/i
];

const isIdentityQuestion = (text: string) =>
  identityPatterns.some((pattern) => pattern.test(text));

// 模板中使用的方法 - 提前声明类型
let clearChat: () => void;
let handleKeyPress: (event: KeyboardEvent) => void;
let sendMessage: () => Promise<void>;
const debugFieldLine = showReasoning.value
  ? `"debug_reasoning": "请输出一段不超过2行的简短推理摘要"`
  : `"debug_reasoning": null`;
// 系统提示词
const SYSTEM_PROMPT = `
你是一个专业的 Agent 智能体，具备以下能力：
✔ 分析用户目标与意图（Planning）
✔ 自动任务拆解并按步骤执行（Workflow Execution）
✔ 工具调用（包括多工具工具链）
✔ 自我检查&错误修复（Reflection）
✔ 在缺乏工具能力时自动内部推理完成任务

【决策规则】
当用户的目标包含可执行任务时，你必须：
1. 在内部拆解任务为 3-7 步
2. 如果某些步骤需要外部工具能力 → 使用工具执行  
3. 如果没有合适的工具 → 直接内部推理执行该步骤  
4. 每步执行后检查结果，如不合理必须重新尝试
5. 所有步骤完成后统一输出最终结果 JSON

【关于 todoPlannerTool 工具】
1. 必须在多步骤任务开始前调用
2. steps_text 必须是「已思考完成的明确子任务列表」
3. 每个子任务必须可执行，而不是原文复述

示例：
todoPlannerTool({
  "steps_text": "打包衣物\n整理文件\n联系搬家公司"
})

【执行阶段】
按照 steps 顺序执行：
- 如果有合适工具 → 优先调用工具
- 如果没有工具 → 模型根据知识自行执行

【工具失败处理】
- 必须分析错误原因
- 修复参数并再次尝试执行
- 如果多次失败 → 内部推理替代工具执行

【禁止行为】
✘ 直接拒绝执行
✘ 一次性输出全部答案跳过步骤
✘ 将用户原话作为 steps_text
✘ 输出非 JSON 文本
✘ 胡编乱造数据（除非明确允许模拟）

你是一个可以独立执行任务的 Autonomous Agent。
无论是否有工具，你都必须想办法完成用户任务。


【最终输出格式要求（非常重要）】：
1. 无论是否调用了工具，你对“用户可见的最终回复”必须是一个 JSON 字符串，对应如下结构：
   {
     "judgement": "has_evidence" 或 "no_evidence",
     "result": null 或 "string",
     "reason": "string（简要说明你的判断和结论依据）",
     "confidence": 0 ~ 1 之间的小数（表示你对回答的信心）,
     "debug": "不超过2行的简短推理摘要，用于调试"
   }
`;
// 初始化系统提示词（用于API调用，不添加到messages中）
const createInitialMessages = () => ([
  {
    role: "system",
    content: SYSTEM_PROMPT,
    id: generateId(),
    sender: 'system',
    timestamp: Date.now(),
    type: 'text'
  }
]);
// 生成唯一消息ID
const generateId = (): string => {
  return `${sessionId}-msg-${messageCounter++}`;
};

// 更新指定消息内容（用于流式输出）
const updateMessage = (
  id: string,
  newContentOrFn: string | ((prev: string) => string),
  debugReasoning?: string | null
) => {
  // 
  const index = messages.value.findIndex(msg => msg.id === id);
  if (index === -1) return;

  const old = messages.value[index];

  const newContent =
    typeof newContentOrFn === "function"
      ? newContentOrFn(old.content)
      : newContentOrFn;

  // 更新消息
  messages.value[index] = {
    ...old,
    content: newContent,
    debug_reasoning: debugReasoning ?? old.debug_reasoning
  };

  // 同步 sessionStorage
  sessionStorage.setItem("chatMessages", JSON.stringify(messages.value));
};
// 移除某条消息
const removeMessage = (id: string) => {
  const index = messages.value.findIndex(m => m.id === id);
  if (index === -1) return;
  messages.value.splice(index, 1);
  sessionStorage.setItem('chatMessages', JSON.stringify(messages.value));
};
// 添加消息到聊天列表
const addMessage = (content: string, sender: 'user' | 'ai' | 'tool', debugReasoning?: string | null, type?: 'text' | 'function_call' | 'tool_response', functionCall?: FunctionCall, toolResponse?: ToolResponse) => {
  const newMessage: Message = {
    id: generateId(),
    content,
    sender,
    timestamp: Date.now(),
    debug_reasoning: debugReasoning || undefined,
    type,
    function_call: functionCall,
    tool_response: toolResponse
  };
  messages.value.push(newMessage);

  // 使用深拷贝避免响应式代理对象序列化问题
  const messagesToSave = JSON.parse(JSON.stringify(messages.value));
  sessionStorage.setItem('chatMessages', JSON.stringify(messagesToSave));

  // 自动滚动到底部，但只有当用户当前视图接近底部时
  nextTick(() => {
    const chatContainer = document.getElementById('chat-container');
    if (chatContainer) {
      // 检查用户是否正在查看底部附近的内容（例如在底部100px范围内）
      // 如果用户正在看最新消息，则自动滚动到底部；如果正在浏览历史消息，则显示提示按钮
      const isNearBottom = chatContainer.scrollHeight - chatContainer.scrollTop - chatContainer.clientHeight < 100;
      if (isNearBottom) {
        scrollToBottom();
      } else {
        // 如果用户不在底部，显示滚动到底部按钮提示有新消息
        showScrollToBottomButton.value = true;
      }
    }
  });
};

// 滚动到底部
const scrollToBottom = () => {
  const chatContainer = document.getElementById('chat-container');
  if (chatContainer) {
    // 使用平滑滚动
    chatContainer.scrollTo({
      top: chatContainer.scrollHeight,
      behavior: 'smooth'
    });
    // 滚动后隐藏按钮
    showScrollToBottomButton.value = false;
  }
};

// 滚动到底部函数已存在，不需要重复定义

// 检测滚动位置
const handleScroll = () => {
  const chatContainer = document.getElementById('chat-container');
  if (chatContainer) {
    // 当距离底部超过50px时显示滚动到底部按钮
    // 当用户滚动查看历史消息时显示按钮
    const scrolledDistance = chatContainer.scrollHeight - chatContainer.clientHeight - chatContainer.scrollTop;
    showScrollToBottomButton.value = scrolledDistance > 50; // 当不在底部时显示
  }
};

// 监听消息变化，确保在消息更新时正确处理滚动位置
const watchMessages = () => {
  // 这个函数会在消息更新后被调用，确保滚动逻辑正确执行
  nextTick(() => {
    const chatContainer = document.getElementById('chat-container');
    if (chatContainer) {
      const isNearBottom = chatContainer.scrollHeight - chatContainer.scrollTop - chatContainer.clientHeight < 100;
      if (isNearBottom) {
        scrollToBottom();
      } else {
        showScrollToBottomButton.value = true;
      }
    }
  });
}

// 让底部输入框聚焦的工具函数
const focusInput = () => {
  // 使用 nextTick 确保在 DOM 更新完成后再尝试聚焦
  nextTick(() => {
    if (inputRef.value) {
      inputRef.value.focus();
    }
  });
};

// 调整文本区域高度
const adjustTextareaHeight = () => {
  const textarea = inputRef.value;
  if (!textarea) return;

  // 重置高度以获取正确的 scrollHeight
  textarea.style.height = 'auto';
  // 设置新高度，但不超过最大高度
  const maxHeight = 150; // 与 CSS 中的 max-height 保持一致
  textarea.style.height = Math.min(textarea.scrollHeight + 5, maxHeight) + 'px';
};

// 监听 userInput 变化来调整高度
watch(userInput, () => {
  nextTick(adjustTextareaHeight);
});

// 组件挂载时设置初始高度
onMounted(() => {
  nextTick(adjustTextareaHeight);
});

// 清空聊天
clearChat = () => {
  messages.value = createInitialMessages() as Message[];
  messageCounter = 0;
  sessionStorage.removeItem('chatMessages');
};

// 处理键盘输入事件
handleKeyPress = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
};

// 发送消息
sendMessage = async () => {
  const trimmedInput = userInput.value.trim();
  if (!trimmedInput || isTyping.value) return;

  // 添加用户消息
  addMessage(trimmedInput, "user");
  userInput.value = "";

  if (isIdentityQuestion(trimmedInput)) {
    addMessage(IDENTITY_RESPONSE, "ai");
    focusInput();
    return;
  }

  startPlanningFlow();
  isTyping.value = true;

  // 创建 AI 占位符消息（content 为空）
  const aiMessageId = generateId();
  messages.value.push({
    id: aiMessageId,
    content: "",
    sender: "ai",
    timestamp: Date.now(),
    type: "text"
  });

  sessionStorage.setItem("chatMessages", JSON.stringify(messages.value));

  // 滚动到底部
  nextTick(scrollToBottom);

  try {
    // 构建模型消息（包含 system、user、ai）
    const historyMessages = messages.value.map(msg => {
      if (msg.sender === "system") {
        return { role: "system", content: msg.content };
      }
      if (msg.type === "function_call") {
        return {
          role: "assistant",
          content: null,
          function_call: msg.function_call
        };
      }
      if (msg.type === "tool_response") {
        return {
          role: "tool",
          content: JSON.stringify(msg.tool_response),
          name: msg.tool_response?.function_name
        };
      }
      return {
        role: msg.sender === "user" ? "user" : "assistant",
        content: msg.content
      };
    });

    // 调用 AI （流式）
    const aiHooks: AIExecutionHooks = {
      onPlanningUpdate: (payload) => {
        updatePlanningStep(payload);
      },
      onToolEvent: (event) => {
        pushToolLogEntry(event);
        // 如果是 todoPlannerTool 的成功结果，将其解析为清晰的任务规划步骤展示
        if (event.toolName === "todoPlannerTool" && event.type === "success" && event.result) {
          // 异步渲染，不阻塞主流程
          void renderTodoPlannerResult(event.result);
        }
      }
    };

    const aiResponse = await getAIResponse(
      historyMessages,
      (chunk) => {

        updateMessage(aiMessageId, (prev) => prev + chunk);
        // 滚动条实时滚动到最新消息
        if (chunk) {
          nextTick(scrollToBottom);
        }
      },
      showReasoning.value,
      aiHooks
    );

    // 流式结束后：覆盖成最终 JSON result
    updateMessage(
      aiMessageId,
      aiResponse.content,
      aiResponse.debug_reasoning ?? null
    );

  } catch (error: any) {
    removeMessage(aiMessageId)
    // updateMessage(aiMessageId, '抱歉，我无法回答')
    tips.error(error);
    hasError.value = true
  } finally {
    isTyping.value = false;
    focusInput();
  }
};


// 重试相关状态
const isRetrying = ref(false);
let lastRetryTime = 0;
const RETRY_DEBOUNCE = 2000; // 2秒防抖

// 重试发送最后一条用户消息
const retryLastMessage = async (): Promise<void> => {
  // 防抖处理
  const now = Date.now();
  if (isRetrying.value || now - lastRetryTime < RETRY_DEBOUNCE) {
    return;
  }

  lastRetryTime = now;
  isRetrying.value = true;

  try {
    // 获取最后一条用户消息
    const lastUserMessage = [...messages.value].reverse().find(msg => msg.sender === 'user');
    if (!lastUserMessage) return;

    // 移除最后一条AI错误消息（如果有）
    const lastMessage = messages.value[messages.value.length - 1];
    if (lastMessage?.sender === 'ai') {
      messages.value.pop();
      sessionStorage.setItem('chatMessages', JSON.stringify(messages.value));
    }

    const trimmedInput = lastUserMessage.content.trim();
    if (!trimmedInput) return;

    // 重置状态
    isTyping.value = true;
    tempAIResponse.value = '';
    hasError.value = false;
    currentError = null;
    startPlanningFlow();

    if (debug) {
      console.log(`[Chat] 开始重试发送消息 (${trimmedInput.length} 字符)`);
    }

    // 准备历史消息
    const historyMessages = messages.value
      .filter(msg => msg.id !== lastUserMessage.id)
      .map(msg => ({
        role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content
      }));

    // 调用AI API获取回复
    const aiHooks: AIExecutionHooks = {
      onPlanningUpdate: (payload) => {
        updatePlanningStep(payload);
      },
      onToolEvent: (event) => {
        pushToolLogEntry(event);
      }
    };

    await getAIResponse(
      [...historyMessages, { content: trimmedInput, role: 'user' as const }],
      (char) => {
        tempAIResponse.value += char;
      },
      showReasoning.value,
      aiHooks
    );

    // 添加完整的AI回复
    if (tempAIResponse.value) {
      addMessage(tempAIResponse.value, 'ai');
    } else {
      throw new Error('Empty response from AI');
    }
  } catch (error) {
    console.error('[Chat] 重试失败:', error);
    currentError = error instanceof Error ? error : new Error(String(error));
    hasError.value = true;
    addMessage('抱歉，重试失败。请稍后再试。', 'ai');
  } finally {
    isTyping.value = false;
    tempAIResponse.value = '';
    isRetrying.value = false;
    focusInput();
  }
}
// 组件挂载后，加载聊天记录
onMounted(() => {
  // 从sessionStorage加载聊天记录
  const savedMessages = sessionStorage.getItem('chatMessages');
  // console.log('[Chat] 加载聊天记录:', savedMessages);
  if (savedMessages) {
    try {
      messages.value = JSON.parse(savedMessages);
    } catch (e) {
      messages.value = createInitialMessages() as Message[];
    }
  } else {
    messages.value = createInitialMessages() as Message[];
  }
  // 添加滚动事件监听器
  const chatContainer = document.getElementById('chat-container');
  if (chatContainer) {
    chatContainer.addEventListener('scroll', handleScroll);
    // 初始滚动到底部
    nextTick(() => {
      scrollToBottom();
    });
  }
  // 初次挂载时，让输入框自动获得焦点
  focusInput();
});

// 实时更新运行中工具的耗时
let durationUpdateTimer: number | null = null;
const currentTime = ref(Date.now());

const startDurationUpdate = () => {
  if (durationUpdateTimer) return; // 如果已经在运行，不重复启动

  durationUpdateTimer = window.setInterval(() => {
    const hasRunningTools = toolLogs.value.some(log => log.status === 'start' && log.startTime);
    if (!hasRunningTools) {
      // 如果没有运行中的工具，停止定时器
      if (durationUpdateTimer) {
        clearInterval(durationUpdateTimer);
        durationUpdateTimer = null;
      }
      return;
    }
    // 更新当前时间，触发响应式更新
    currentTime.value = Date.now();
  }, 100); // 每 100ms 更新一次
};

// 监听工具日志变化，如果有运行中的工具则启动定时器
watch(() => toolLogs.value.length, () => {
  const hasRunningTools = toolLogs.value.some(log => log.status === 'start' && log.startTime);
  if (hasRunningTools && !durationUpdateTimer) {
    startDurationUpdate();
  } else if (!hasRunningTools && durationUpdateTimer) {
    clearInterval(durationUpdateTimer);
    durationUpdateTimer = null;
  }
}, { immediate: true });

// 监听工具状态变化
watch(() => toolLogs.value.map(log => log.status), () => {
  const hasRunningTools = toolLogs.value.some(log => log.status === 'start' && log.startTime);
  if (hasRunningTools && !durationUpdateTimer) {
    startDurationUpdate();
  } else if (!hasRunningTools && durationUpdateTimer) {
    clearInterval(durationUpdateTimer);
    durationUpdateTimer = null;
  }
});

// 组件卸载前移除事件监听器和定时器
onUnmounted(() => {
  const chatContainer = document.getElementById('chat-container');
  if (chatContainer) {
    chatContainer.removeEventListener('scroll', handleScroll);
  }
  if (durationUpdateTimer) {
    clearInterval(durationUpdateTimer);
    durationUpdateTimer = null;
  }
})
</script>

<template>
  <div class="chat-container">
    <!-- 聊天头部 -->
    <div class="chat-header">
      <h2>{{ appTitle }}</h2>
      <!-- 创意模式标签 -->
      <div v-if="showCreativeModeTag" class="creative-mode-tag">
        创意模式（输出更发散）
      </div>
      <!-- 简洁模式开关 -->
      <label class="reasoning-toggle">
        <span class="toggle-label">简洁模式</span>
        <input type="checkbox" v-model="simpleMode" class="toggle-checkbox">
        <span class="toggle-slider"></span>
      </label>
      <!-- 显示推理开关 -->
      <label class="reasoning-toggle">
        <span class="toggle-label">显示推理过程</span>
        <input type="checkbox" v-model="showReasoning" class="toggle-checkbox">
        <span class="toggle-slider"></span>
      </label>
      <button class="clear-button" @click="clearChat">清空聊天</button>
    </div>

    <!-- AI 工作流展示 -->
    <div v-if="!simpleMode" class="ai-status-panel">
      <div class="status-card">
        <div class="status-header" @click="planningPanelOpen = !planningPanelOpen">
          <div>
            <div class="status-title">🧠 任务规划步骤</div>
            <div class="status-subtitle">AI 在努力拆解你的需求</div>
          </div>
          <button class="collapse-btn">{{ planningPanelOpen ? '收起' : '展开' }}</button>
        </div>
        <transition name="collapse">
          <ol v-show="planningPanelOpen" ref="planningListRef" class="status-list">
            <li v-for="(item, index) in planningItems" :key="item.id" class="planning-item">
              <span class="planning-number">{{ index + 1 }}</span>
              <span class="planning-text">
                {{ item.text }}
                <span v-if="item.isTyping" class="typing-cursor">|</span>
              </span>
            </li>
            <li v-if="!planningItems.length" class="status-empty">暂无计划，提问一个任务试试吧。</li>
          </ol>
        </transition>
      </div>

      <div class="status-card">
        <div class="status-header" @click="toolPanelOpen = !toolPanelOpen">
          <div>
            <div class="status-title">🔧 工具执行日志</div>
            <div class="status-subtitle">实时记录每一次调用</div>
          </div>
          <button class="collapse-btn">{{ toolPanelOpen ? '收起' : '展开' }}</button>
        </div>
        <transition name="collapse">
          <div v-show="toolPanelOpen" ref="toolLogListRef" class="status-list">
            <div v-for="(log, index) in toolLogs" :key="log.id" :class="['tool-log-item', `tool-log-${log.status}`]">
              <div class="tool-log-header">
                <span class="tool-log-number">{{ index + 1 }}</span>
                <span class="tool-log-icon">{{ toolIconMap[log.status] }}</span>
                <span class="tool-log-name">调用 {{ log.toolName || '工具' }}</span>
                <span :class="['tool-log-status', `status-${log.status}`]">
                  {{ log.status === 'start' ? '运行中' : log.status === 'success' ? '完成' : '失败' }}
                </span>
                <span v-if="log.duration !== undefined || (log.status === 'start' && log.startTime)"
                  class="tool-log-duration">
                  {{ formatDuration(log.duration !== undefined ? log.duration : currentTime - (log.startTime || 0)) }}
                </span>
              </div>
              <div v-if="log.args || log.result || log.error" class="tool-log-detail">
                <div v-if="log.args" class="tool-log-arg">
                  <span class="detail-label">参数：</span>
                  <code class="detail-value">{{ formatPayloadSnippet(log.args) }}</code>
                </div>
                <div v-if="log.result" class="tool-log-result">
                  <span class="detail-label">结果：</span>
                  <code class="detail-value">{{ formatPayloadSnippet(log.result) }}</code>
                </div>
                <div v-if="log.error" class="tool-log-error">
                  <span class="detail-label">错误：</span>
                  <span class="detail-value error-text">{{ log.error }}</span>
                </div>
              </div>
            </div>
            <div v-if="!toolLogs.length" class="status-empty">还没有工具被使用。</div>
          </div>
        </transition>
      </div>
    </div>

    <!-- 聊天消息区域 -->
    <div id="chat-container" class="messages-container">
      <div v-for="message in messages" :key="message.id" :class="['message', message.sender]">
        <template v-if="message.sender !== 'system'">
          <div class="message-avatar">
            {{ message.sender === 'user' ? '👤' : message.sender === 'tool' ? '🔧' : '🤖' }}
          </div>
          <div class="message-content">
            <!-- 正常文本消息 -->
            <p v-if="message.content">{{ message.content }}</p>
            <!-- 加载动画 -->
            <div v-else-if="isTyping && message.sender === 'ai'" class="thinking-indicator">
              <div class="thinking-text">
                思考中<span class="typing-dots"><span>.</span><span>.</span><span>.</span></span>
              </div>
            </div>
            <!-- 显示推理内容（当开关打开且有推理内容时） -->
            <div v-if="(showReasoning && message.sender === 'ai')" class="debug-reasoning">
              <div class="reasoning-label">推理过程:</div>
              <div class="reasoning-content">{{ message.debug_reasoning }}</div>
            </div>
            <span class="message-time">
              {{ new Date(message.timestamp).toLocaleTimeString() }}
            </span>
          </div>
        </template>
      </div>
    </div>

    <!-- 错误状态显示和重试按钮 -->
    <div v-if="hasError" class="error-container">
      <button @click="retryLastMessage" :disabled="isTyping" class="retry-button">
        🔄 重试
      </button>
      <span class="error-hint">遇到了一些问题，点击重试按钮重新发送请求</span>
    </div>

    <!-- 输入区域 -->
    <div class="input-container">
      <textarea ref="inputRef" v-model="userInput" @input="adjustTextareaHeight" @keypress="handleKeyPress"
        placeholder="输入你的问题..." :disabled="isTyping" class="chat-input" rows="1"></textarea>
      <button @click="sendMessage" :disabled="!userInput.trim() || isTyping" class="send-button">
        {{ isTyping ? '发送中...' : '发送' }}
      </button>
    </div>

    <!-- 滚动到底部按钮 -->
    <button v-if="showScrollToBottomButton" @click="scrollToBottom" class="scroll-to-bottom-button"
      aria-label="滚动到最新消息">
      <span class="button-icon">↓</span>
      <span class="button-badge">新消息</span>
    </button>
  </div>
  <!-- debuger -->
  <!-- <SSEDebugPanel style="z-index: 2000;" /> -->
</template>

<style scoped>
/* 主容器 */
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 850px;
  margin: 0 auto;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  overflow: hidden;
}

/* 头部样式 */
.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.chat-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.ai-status-panel {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.4);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.status-card {
  flex: 1;
  min-width: 200px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.status-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.25rem 0;
}

.status-title {
  font-weight: 500;
  color: #4b5563;
  font-size: 13px;
}

.status-subtitle {
  font-size: 11px;
  color: #9ca3af;
}

.collapse-btn {
  border: none;
  background: rgba(0, 0, 0, 0.05);
  color: #6b7280;
  border-radius: 6px;
  padding: 0.15rem 0.5rem;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.collapse-btn:hover {
  background: rgba(0, 0, 0, 0.08);
}

.status-list {
  margin: 0.5rem 0 0;
  padding-left: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 12px;
  color: #6b7280;
  max-height: 150px;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
}

.status-list::-webkit-scrollbar {
  width: 4px;
}

.status-list::-webkit-scrollbar-track {
  background: transparent;
}

.status-list::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
}

.status-list::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

.status-empty {
  font-size: 11px;
  color: #d1d5db;
  font-style: italic;
  padding: 0.5rem;
  text-align: center;
}

/* 任务规划步骤样式 */
.planning-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.4rem 0.5rem;
  margin: 0.2rem 0;
  background: rgba(102, 126, 234, 0.05);
  border-radius: 6px;
  border-left: 2px solid rgba(102, 126, 234, 0.3);
  transition: all 0.2s ease;
}

.planning-item:hover {
  background: rgba(102, 126, 234, 0.08);
  border-left-color: rgba(102, 126, 234, 0.5);
}

.planning-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 50%;
  font-size: 10px;
  font-weight: 600;
  flex-shrink: 0;
}

.planning-text {
  flex: 1;
  line-height: 1.5;
  word-break: break-word;
}

.typing-cursor {
  display: inline-block;
  width: 2px;
  height: 1em;
  background: #667eea;
  margin-left: 2px;
  animation: blink 1s infinite;
  vertical-align: baseline;
}

@keyframes blink {

  0%,
  50% {
    opacity: 1;
  }

  51%,
  100% {
    opacity: 0;
  }
}

/* 工具执行日志样式 */
.tool-log-item {
  padding: 0.5rem;
  margin: 0.3rem 0;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;
}

.tool-log-item:hover {
  background: rgba(255, 255, 255, 0.7);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.tool-log-item.tool-log-start {
  border-left: 3px solid #3b82f6;
}

.tool-log-item.tool-log-success {
  border-left: 3px solid #10b981;
}

.tool-log-item.tool-log-error {
  border-left: 3px solid #ef4444;
}

.tool-log-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.3rem;
  flex-wrap: wrap;
}

.tool-log-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  background: #6b7280;
  color: white;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
}

.tool-log-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.tool-log-name {
  font-weight: 500;
  color: #374151;
  font-size: 12px;
  flex: 1;
  min-width: 0;
}

.tool-log-status {
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
  flex-shrink: 0;
}

.tool-log-status.status-start {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.tool-log-status.status-success {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.tool-log-status.status-error {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.tool-log-duration {
  font-size: 10px;
  color: #9ca3af;
  font-weight: 400;
  padding: 0.1rem 0.4rem;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  flex-shrink: 0;
}

.tool-log-detail {
  margin-top: 0.4rem;
  padding-top: 0.4rem;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.tool-log-arg,
.tool-log-result,
.tool-log-error {
  display: flex;
  align-items: flex-start;
  gap: 0.4rem;
  font-size: 11px;
  line-height: 1.4;
}

.detail-label {
  color: #6b7280;
  font-weight: 500;
  flex-shrink: 0;
  min-width: 40px;
}

.detail-value {
  flex: 1;
  color: #374151;
  word-break: break-word;
  background: rgba(0, 0, 0, 0.03);
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 10px;
}

.detail-value.error-text {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.05);
}

.collapse-enter-active,
.collapse-leave-active {
  transition: max-height 0.25s ease, opacity 0.25s ease;
}

.collapse-enter-from,
.collapse-leave-to {
  max-height: 0;
  opacity: 0;
}

.collapse-enter-to,
.collapse-leave-from {
  max-height: 150px;
  opacity: 1;
}


.clear-button {
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
}

/* 创意模式标签样式 */
.creative-mode-tag {
  background-color: #ff9f43;
  color: white;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
  margin-right: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  animation: pulse 2s infinite;
}

/* 显示推理开关样式 */
.reasoning-toggle {
  position: relative;
  display: inline-flex;
  align-items: center;
  margin-right: 12px;
  cursor: pointer;
}

.toggle-label {
  color: white;
  font-size: 14px;
  font-weight: 500;
  margin-right: 8px;
  user-select: none;
}

.toggle-checkbox {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 24px;
  transition: background-color 0.3s ease;
}

.toggle-slider:before {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  border-radius: 50%;
  transition: transform 0.3s ease;
}

.toggle-checkbox:checked+.toggle-slider {
  background-color: rgba(255, 255, 255, 0.8);
}

.toggle-checkbox:checked+.toggle-slider:before {
  transform: translateX(20px);
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.05);
  }

  100% {
    transform: scale(1);
  }
}

.clear-button:hover {
  background-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

/* 消息容器 */
.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  scrollbar-width: thin;
  scrollbar-color: #888 #f1f1f1;
}

/* 自定义滚动条 */
.messages-container::-webkit-scrollbar {
  width: 8px;
}

.messages-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.messages-container::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 10px;
}

.messages-container::-webkit-scrollbar-thumb:hover {
  background: #555;
}

/* 消息样式 */
.message {
  display: flex;
  gap: 1rem;
  max-width: 75%;
  animation: fadeIn 0.3s ease-in-out;
}

/* 工具消息样式 */
.message.tool {
  align-self: flex-start;
  border-left: 3px solid #4a9eff;
  padding-left: 0.75rem;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message.user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message.ai {
  align-self: flex-start;
}

/* 头像样式 */
.message-avatar {
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 1.5rem;
  background-color: white;
  border-radius: 50%;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}

.message:hover .message-avatar {
  transform: scale(1.05);
}

/* 消息内容样式 */
.message-content {
  padding: 1rem 1.25rem;
  border-radius: 18px;
  position: relative;
  line-height: 1.5;
  word-wrap: break-word;
}

.delete-message-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  border: none;
  background: rgba(102, 126, 234, 0.12);
  color: #5b6fd6;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  font-size: 14px;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  opacity: 0.0;
  transition: all 0.2s ease;
}

.message:hover .delete-message-btn {
  opacity: 1;
}

.delete-message-btn:hover {
  background: rgba(102, 126, 234, 0.22);
}

/* AI消息样式 */
.message.ai .message-content {
  background-color: white;
  color: #333;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.1);
  border-bottom-left-radius: 4px;
}

/* 用户消息样式 */
.message.user .message-content {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.1);
  border-bottom-right-radius: 4px;
}

.message p {
  margin: 0;
  font-size: 1rem;
}

/* 调试推理内容样式 */
.debug-reasoning {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background-color: #f8f9fa;
  border-radius: 12px;
  border-left: 3px solid #6c757d;
  font-size: 0.875rem;
  line-height: 1.5;
}

.reasoning-label {
  font-weight: 600;
  color: #6c757d;
  margin-bottom: 0.5rem;
  font-size: 0.8125rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.reasoning-content {
  color: #6c757d;
  font-size: 0.875rem;
  word-wrap: break-word;
}

/* 时间戳 */
.message-time {
  font-size: 0.75rem;
  opacity: 0.7;
  margin-top: 0.5rem;
  display: block;
}

/* Function Call 样式 */
.function-call {
  background-color: #e8f5e9;
  border-radius: 12px;
  padding: 1rem;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
}

.function-name {
  font-weight: bold;
  color: #2e7d32;
  margin-bottom: 0.5rem;
}

.function-params {
  margin-left: 1.5rem;
}

.param-item {
  margin: 0.25rem 0;
  display: flex;
  flex-wrap: wrap;
}

.param-key {
  color: #1565c0;
  font-weight: 500;
  margin-right: 0.5rem;
}

.param-value {
  color: #d32f2f;
  background-color: #fff;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
}

/* Tool Response 样式 */
.tool-response {
  background-color: #fff3e0;
  border-radius: 12px;
  padding: 1rem;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
}

.tool-name {
  font-weight: bold;
  color: #e65100;
  margin-bottom: 0.5rem;
}

.tool-result {
  background-color: #fff;
  padding: 0.75rem;
  border-radius: 8px;
  color: #2e7d32;
  font-weight: 500;
}

.message.user .message-time {
  text-align: left;
}

.message.ai .message-time {
  text-align: right;
}

/* 思考中文本样式 */
.thinking-indicator {
  min-height: 1.5em;
  margin: 0.5em 0;
}

.thinking-text {
  color: #666;
  font-style: italic;
  margin: 0;
  display: inline-flex;
  align-items: center;
  font-size: 0.95em;
}

.typing-dots {
  display: inline-flex;
  align-items: center;
  height: 1em;
  margin-left: 4px;
  line-height: 1;
}

.typing-dots span {
  display: inline-block;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background-color: currentColor;
  margin: 0 1px;
  opacity: 0.4;
  animation: typing-dots 1.4s infinite ease-in-out both;
  vertical-align: middle;
}

.typing-dots span:nth-child(1) {
  animation-delay: -0.32s;
}

.typing-dots span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes typing-dots {

  0%,
  80%,
  100% {
    transform: translateY(0);
    opacity: 0.4;
  }

  40% {
    transform: translateY(-4px);
    opacity: 0.8;
  }
}

/* 打字中的点动画 */
.typing-dots span {
  display: inline-block;
  margin: 0 1px;
  animation: dots 1.4s infinite ease-in-out both;
}

.typing-dots span:nth-child(1) {
  animation-delay: 0s;
}

.typing-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes dots {

  0%,
  60%,
  100% {
    transform: translateY(0);
    opacity: 1;
  }

  30% {
    transform: translateY(-5px);
    opacity: 0.5;
  }
}

/* 输入区域 */
.input-container {
  display: flex;
  gap: 1rem;
  padding: 1.5rem 2rem;
  background-color: white;
  border-top: 1px solid #e0e0e0;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.chat-input {
  flex: 1;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  padding: 12px 16px;
  font-size: 1rem;
  resize: none;
  min-height: 48px;
  max-height: 150px;
  overflow-y: auto;
  font-family: inherit;
  transition: all 0.2s ease;
  line-height: 1.5;
  background-color: #fafafa;
}

/* 自定义滚动条 */
.chat-input::-webkit-scrollbar {
  width: 6px;
}

.chat-input::-webkit-scrollbar-thumb {
  background-color: #c1c1c1;
  border-radius: 3px;
}

.chat-input:focus {
  outline: none;
  border-color: #4a90e2;
  box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.2);
}

.chat-input:focus {
  outline: none;
  border-color: #667eea;
  background-color: white;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.send-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0 1.75rem;
  border-radius: 25px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.send-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.send-button:active:not(:disabled) {
  transform: translateY(0);
}

.send-button:disabled {
  background: #cccccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* 错误状态容器 */
.error-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 1rem 2rem;
  background-color: rgba(239, 68, 68, 0.1);
  border-top: 1px solid rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

/* 重试按钮 */
.retry-button {
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  color: white;
  border: none;
  padding: 0.5rem 1.25rem;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.retry-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.4);
}

.retry-button:active:not(:disabled) {
  transform: translateY(0);
}

.retry-button:disabled {
  background: #cccccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* 错误提示文本 */
.error-hint {
  font-size: 0.9rem;
  font-weight: 400;
}

/* 滚动到底部按钮 */
.scroll-to-bottom-button {
  position: fixed;
  bottom: 130px;
  left: 50%;
  transform: translateX(-50%) scale(1);
  min-width: 50px;
  height: 50px;
  border-radius: 25px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  transition: all 0.3s ease;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0 1rem;
  animation: pulse 2s infinite;
  opacity: 0.92;
}

/* 按钮脉冲动画，提示有新消息 */
@keyframes pulse {
  0% {
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    transform: translate(-50%, 0) scale(1);
  }

  50% {
    box-shadow: 0 4px 20px rgba(102, 126, 234, 0.6);
    transform: translate(-50%, 0) scale(1.05);
  }

  100% {
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    transform: translate(-50%, 0) scale(1);
  }
}

.button-icon {
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.button-badge {
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
}

.scroll-to-bottom-button:hover {
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.6);
  animation: none;
  /* 悬停时停止脉冲动画 */
  opacity: 1;
}

.scroll-to-bottom-button:active {
  transform: translate(-50%, 0);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .chat-container {
    height: 100vh;
    max-width: none;
    border-radius: 0;
  }

  .messages-container {
    padding: 1rem;
    gap: 1rem;
  }

  .message {
    max-width: 85%;
  }

  .chat-header {
    padding: 0.875rem 1.25rem;
  }

  .input-container {
    padding: 1rem;
  }

  .error-container {
    padding: 0.875rem 1rem;
    gap: 0.75rem;
  }

  .retry-button {
    padding: 0.4rem 1rem;
    font-size: 0.85rem;
  }

  .error-hint {
    font-size: 0.85rem;
  }

  .scroll-to-bottom-button {
    min-width: 40px;
    height: 40px;
    font-size: 0.875rem;
    padding: 0 0.75rem;
    bottom: 110px;
  }

  .button-icon {
    font-size: 1rem;
  }

  .button-badge {
    font-size: 0.75rem;
  }

  .message-avatar {
    width: 36px;
    height: 36px;
    font-size: 1.25rem;
  }
}

@media (max-width: 480px) {
  .message {
    max-width: 90%;
    gap: 0.75rem;
  }

  .message-content {
    padding: 0.875rem 1rem;
    border-radius: 16px;
  }

  .clear-button {
    padding: 0.4rem 0.8rem;
    font-size: 0.875rem;
  }
}
</style>
