// 创建结果流式器
const hexRegex = /^[0-9a-fA-F]+$/;
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