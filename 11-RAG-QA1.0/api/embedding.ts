import { scanInjectionRisk } from '../src/utils/scanInjectionRisk';

interface RequestBody {
  texts: string[];
  purpose?: 'query' | 'doc';
}

interface SuccessResponse {
  status: 'ok'; 
  data: { embeddings: number[][] };
  meta: {
    provider: string;
    model: string;
    hasInjectionRisk: boolean;
    flaggedIndexes: number[];
    requestId: string;
  };
}

interface ErrorResponse {
  status: 'error';
  code: 'BAD_REQUEST' | 'UNAUTHORIZED' | 'RATE_LIMITED' | 'UPSTREAM_ERROR' | 'INTERNAL_ERROR';
  message: string;
  requestId: string;
}

type ApiResponse = SuccessResponse | ErrorResponse;

// 生成请求ID
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// 验证请求体
function validateRequest(body: any): { isValid: boolean; error?: string } {
  if (!body || typeof body !== 'object') {
    return { isValid: false, error: '请求体必须是JSON对象' };
  }

  if (!Array.isArray(body.texts)) {
    return { isValid: false, error: 'texts必须是字符串数组' };
  }

  if (body.texts.length === 0) {
    return { isValid: false, error: 'texts不能为空数组' };
  }

  if (body.texts.length > 64) {
    return { isValid: false, error: 'texts最多支持64条' };
  }

  for (let i = 0; i < body.texts.length; i++) {
    const text = body.texts[i];
    if (typeof text !== 'string') {
      return { isValid: false, error: `texts[${i}]必须是字符串` };
    }

    const trimmed = text.trim();
    if (trimmed.length === 0) {
      return { isValid: false, error: `texts[${i}]不能为空字符串` };
    }

    if (trimmed.length > 4000) {
      return { isValid: false, error: `texts[${i}]长度不能超过4000字符` };
    }

    // 替换为处理后的文本
    body.texts[i] = trimmed;
  }

  if (body.purpose && !['query', 'doc'].includes(body.purpose)) {
    return { isValid: false, error: 'purpose必须是"query"或"doc"' };
  }

  return { isValid: true };
}

// 调用DashScope Embedding API
async function callDashScopeEmbedding(texts: string[]): Promise<{ embeddings: number[][]; model: string }> {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) {
    throw new Error('DASHSCOPE_API_KEY环境变量未设置');
  }

  const model = process.env.DASHSCOPE_EMBEDDING_MODEL || 'text-embedding-v3';
  const endpoint = 'https://dashscope.aliyuncs.com/api/v1/services/embeddings/multimodal-embedding/multimodal-embedding';

  const requestBody = {
    model,
    input: {
      contents: texts.map(text => ({ text }))
    }
  };

  console.log(`[embedding] 调用DashScope API, model=${model}, texts=${texts.length}`);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[embedding] DashScope API错误: ${response.status} ${errorText}`);
    throw new Error(`上游API错误: ${response.status} ${errorText}`);
  }

  const result = await response.json();

  if (!result.output?.embeddings || !Array.isArray(result.output.embeddings)) {
    throw new Error('上游API返回格式错误');
  }

  const embeddings = result.output.embeddings.map((item: any) => {
    if (!Array.isArray(item.embedding)) {
      throw new Error('上游API返回的embedding格式错误');
    }
    return item.embedding;
  });

  return { embeddings, model };
}

export default async function handler(
  request: Request
): Promise<Response> {
  const requestId = generateRequestId();
  const startTime = Date.now();

  try {
    // 只允许POST方法
    if (request.method !== 'POST') {
      const response: ErrorResponse = {
        status: 'error',
        code: 'BAD_REQUEST',
        message: '只支持POST方法',
        requestId
      };
      return Response.json(response, { status: 405 });
    }

    // 解析请求体
    let body: RequestBody;
    try {
      body = await request.json();
    } catch (e) {
      const response: ErrorResponse = {
        status: 'error',
        code: 'BAD_REQUEST',
        message: '请求体必须是有效的JSON',
        requestId
      };
      return Response.json(response, { status: 400 });
    }

    // 验证请求体
    const validation = validateRequest(body);
    if (!validation.isValid) {
      const response: ErrorResponse = {
        status: 'error',
        code: 'BAD_REQUEST',
        message: validation.error!,
        requestId
      };
      return Response.json(response, { status: 400 });
    }

    // 扫描注入风险
    const injectionResult = scanInjectionRisk(body.texts);

    // 调用DashScope API
    const { embeddings, model } = await callDashScopeEmbedding(body.texts);

    const duration = Date.now() - startTime;
    console.log(`[embedding] 完成, requestId=${requestId}, purpose=${body.purpose || 'unknown'}, texts=${body.texts.length}, duration=${duration}ms, hasInjectionRisk=${injectionResult.hasRisk}`);

    // 成功响应
    const response: SuccessResponse = {
      status: 'ok',
      data: { embeddings },
      meta: {
        provider: 'dashscope',
        model,
        hasInjectionRisk: injectionResult.hasRisk,
        flaggedIndexes: injectionResult.flaggedIndexes,
        requestId
      }
    };

    return Response.json(response);

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[embedding] 错误, requestId=${requestId}, duration=${duration}ms, error=${error}`);

    let code: ErrorResponse['code'] = 'INTERNAL_ERROR';
    let message = '内部服务器错误';
    let statusCode = 500;

    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();

      if (errorMessage.includes('环境变量') || errorMessage.includes('api key')) {
        code = 'INTERNAL_ERROR'; // 不暴露配置问题
        message = '服务配置错误';
      } else if (errorMessage.includes('上游api错误') || errorMessage.includes('上游api返回')) {
        code = 'UPSTREAM_ERROR';
        message = '向量化服务暂时不可用';
        statusCode = 502;
      } else {
        code = 'INTERNAL_ERROR';
        message = '处理请求时发生错误';
      }
    }

    const response: ErrorResponse = {
      status: 'error',
      code,
      message,
      requestId
    };

    return Response.json(response, { status: statusCode });
  }
}
