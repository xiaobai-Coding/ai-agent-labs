<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed, watch } from 'vue';
import type { Message, FunctionCall, ToolResponse } from '../types/chat';
import { getAIResponse, shouldAskFollowUp, getFollowUpSuggestion, config, type AIResponse } from '../services/aiService';
import SSEDebugPanel from './SSEDebugPanel.vue';
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

// 计算是否显示创意模式标签
const showCreativeModeTag = computed(() => {
  // 从配置中获取temperature值（如果存在），否则使用默认值0.8
  const temperature = config?.temperature || 0.8;
  return temperature > 0.7;
});

// 模板中使用的方法 - 提前声明类型
let clearChat: () => void;
let handleKeyPress: (event: KeyboardEvent) => void;
let sendMessage: () => Promise<void>;
const debugFieldLine = showReasoning.value
  ? `"debug_reasoning": "请输出一段不超过2行的简短推理摘要"`
  : `"debug_reasoning": null`;
// 系统提示词
const SYSTEM_PROMPT = `
你是一个天气预报专家，拥有丰富的天气知识，能解答天气相关问题，并根据问题生成天气事件的摘要，用生动的语言解释。
【重要】工具调用规则
当用户询问穿衣、天气、气温、温度、冷不冷、热不热等问题时：
你必须调用 weatherTool。
weatherTool 返回伪造天气数据：
{
  temperature: number,
  description: string,
  suggestion: string
}
规则：
- 第一次模型调用 → 触发 weatherTool
- 工具返回伪造天气后 → 模型根据天气给出穿衣建议
- 最终必须输出自然语言（不用 JSON）
- 禁止胡编乱造天气（伪数据只来自 tool）
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
    const aiResponse = await getAIResponse(
      historyMessages,
      (chunk) => {
        
        updateMessage(aiMessageId, (prev) => prev + chunk);
        // 滚动条实时滚动到最新消息
        if(chunk){
          nextTick(scrollToBottom);
        }
      },
      showReasoning.value
    );

    // 流式结束后：覆盖成最终 JSON result
    updateMessage(
      aiMessageId,
      aiResponse.content,
      aiResponse.debug_reasoning ?? null
    );

  } catch (error:any) {
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
    await getAIResponse(
      [...historyMessages, { content: trimmedInput, role: 'user' as const }],
      (char) => {
        tempAIResponse.value += char;
      }
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

// 组件卸载前移除事件监听器
onUnmounted(() => {
  const chatContainer = document.getElementById('chat-container');
  if (chatContainer) {
    chatContainer.removeEventListener('scroll', handleScroll);
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
      <!-- 显示推理开关 -->
      <label class="reasoning-toggle">
        <span class="toggle-label">显示推理过程</span>
        <input type="checkbox" v-model="showReasoning" class="toggle-checkbox">
        <span class="toggle-slider"></span>
      </label>
      <button class="clear-button" @click="clearChat">清空聊天</button>
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
      <textarea 
        ref="inputRef" 
        v-model="userInput" 
        @input="adjustTextareaHeight"
        @keypress="handleKeyPress" 
        placeholder="输入你的问题..."
        :disabled="isTyping" 
        class="chat-input"
        rows="1"
      ></textarea>
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
