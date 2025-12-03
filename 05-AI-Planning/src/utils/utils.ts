// 工具函数集合

// 定义计算器工具函数
export const calculator = (params: { num1: number; num2: number; operation: string }): number => {
  const { num1, num2, operation } = params;

  switch (operation) {
    case "add":
      return num1 + num2;
    case "subtract":
      return num1 - num2;
    case "multiply":
      return num1 * num2;
    case "divide":
      if (num2 === 0) {
        throw new Error("除数不能为零");
      }
      return num1 / num2;
    default:
      throw new Error(`不支持的操作: ${operation}`);
  }
};

// 辅助函数：延迟执行
export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// 模拟打字输出效果
export const simulateTyping = async (
  text: string,
  onCharacterAdd: (char: string) => void
): Promise<void> => {
  const chars = text.split("");
  for (const char of chars) {
    onCharacterAdd(char);
    await delay(30 + Math.random() * 30); // 固定打字速度
  }
};

// 检查是否支持流式输出
export const supportsStreaming = () =>
  typeof ReadableStream !== "undefined" && typeof TextDecoder !== "undefined";

// 解析模型返回的内容，提取主要内容和推理摘要
export const parseModelContent = (rawContent: string): { content: string; debug_reasoning: string | null } => {
  let content = rawContent; // 默认返回原始内容
  let debugReasoning: string | null = null;

  try {
    const jsonResponse = JSON.parse(rawContent);
    if (jsonResponse && typeof jsonResponse === "object") {
      if (typeof jsonResponse.result === "string") {
        content = jsonResponse.result;
      } else if (typeof jsonResponse.reason === "string") {
        content = jsonResponse.reason;
      }

      if (typeof jsonResponse.debug_reasoning === "string") {
        debugReasoning = jsonResponse.debug_reasoning;
      }
    }
  } catch (e) {
    // 非JSON格式，直接返回原始内容
  }

  return {
    content,
    debug_reasoning: debugReasoning
  };
};

const hexRegex = /^[0-9a-fA-F]+$/;

// 创建结果流式器
export const createResultStreamer = (onPartialResponse?: (chunk: string) => void) => {
  const RESULT_KEY = '"result"';
  type State =
    | "searchingKey"
    | "afterKey"
    | "waitingValue"
    | "inValue"
    | "done"
    | "nullValue";

  let state: State = "searchingKey";
  let keyIndex = 0;
  let escapeNext = false;
  let inUnicodeSequence = false;
  let unicodeBuffer = "";
  let pendingHighSurrogate: number | null = null;
  let resultValue = "";

  const emitChar = (char: string) => {
    resultValue += char;
    if (onPartialResponse) {
      onPartialResponse(char);
    }
  };

  const emitCodePoint = (codePoint: number) => {
    if (
      pendingHighSurrogate !== null &&
      codePoint >= 0xdc00 &&
      codePoint <= 0xdfff
    ) {
      const combined =
        ((pendingHighSurrogate - 0xd800) << 10) +
        (codePoint - 0xdc00) +
        0x10000;
      const char = String.fromCodePoint(combined);
      emitChar(char);
      pendingHighSurrogate = null;
      return;
    }

    if (pendingHighSurrogate !== null) {
      const danglingChar = String.fromCharCode(pendingHighSurrogate);
      emitChar(danglingChar);
      pendingHighSurrogate = null;
    }

    if (codePoint >= 0xd800 && codePoint <= 0xdbff) {
      pendingHighSurrogate = codePoint;
      return;
    }

    const char = String.fromCodePoint(codePoint);
    emitChar(char);
  };

  const handleEscapedChar = (char: string) => {
    switch (char) {
      case '"':
        emitChar('"');
        return;
      case "\\":
        emitChar("\\");
        return;
      case "/":
        emitChar("/");
        return;
      case "b":
        emitChar("\b");
        return;
      case "f":
        emitChar("\f");
        return;
      case "n":
        emitChar("\n");
        return;
      case "r":
        emitChar("\r");
        return;
      case "t":
        emitChar("\t");
        return;
      case "u":
        inUnicodeSequence = true;
        unicodeBuffer = "";
        return;
      default:
        emitChar(char);
    }
  };

  const handleChar = (char: string) => {
    if (state === "done" || state === "nullValue") {
      return;
    }

    if (inUnicodeSequence) {
      if (hexRegex.test(char)) {
        unicodeBuffer += char;
        if (unicodeBuffer.length === 4) {
          const codePoint = parseInt(unicodeBuffer, 16);
          emitCodePoint(codePoint);
          inUnicodeSequence = false;
          unicodeBuffer = "";
        }
        return;
      } else {
        // 非法unicode序列，结束处理
        inUnicodeSequence = false;
        unicodeBuffer = "";
      }
    }

    if (escapeNext) {
      handleEscapedChar(char);
      escapeNext = false;
      return;
    }

    switch (state) {
      case "searchingKey":
        if (char === RESULT_KEY[keyIndex]) {
          keyIndex += 1;
          if (keyIndex === RESULT_KEY.length) {
            state = "afterKey";
            keyIndex = 0;
          }
        } else {
          keyIndex = char === RESULT_KEY[0] ? 1 : 0;
        }
        break;
      case "afterKey":
        if (char === ":") {
          state = "waitingValue";
        } else if (!/\s/.test(char)) {
          state = "searchingKey";
          keyIndex = 0;
          handleChar(char);
        }
        break;
      case "waitingValue":
        if (char === '"') {
          state = "inValue";
        } else if (char === "n") {
          state = "nullValue";
        } else if (!/\s/.test(char)) {
          state = "searchingKey";
          keyIndex = 0;
          handleChar(char);
        }
        break;
      case "inValue":
        if (char === "\\") {
          escapeNext = true;
        } else if (char === '"') {
          state = "done";
        } else {
          emitChar(char);
        }
        break;
    }
  };

  return {
    handleChunk: (chunk: string) => {
      for (const char of chunk) {
        handleChar(char);
      }
    },
    hasValue: () => resultValue.length > 0,
    getValue: () => resultValue,
    finalize: () => {
      if (pendingHighSurrogate !== null) {
        const char = String.fromCharCode(pendingHighSurrogate);
        emitChar(char);
        pendingHighSurrogate = null;
      }
    }
  };
};

// 裁剪模型消息 只保留最近 6 轮对话
export const trimModelMessages = (modelMessages: any[]) => {
  const system = modelMessages[0];
  const rest = modelMessages.slice(1);
  // 如果消息数量大于6，则裁剪只保留最近三轮对话
  if (rest.length > 6) {
    const trimmed = rest.slice(-6); // slice 传递负数时，表示从后往前数
    return [system, ...trimmed];
  }
  return [system, ...rest]; // 如果消息数量小于6，则不裁剪
};
