// api/ai.ts
import type { VercelRequest, VercelResponse } from '@vercel/node'

/**
 * ========= 简单内存限流 =========
 * 每个 IP 每分钟最多 20 次
 */
const rateLimitMap = new Map<string, number[]>()

function checkRateLimit(ip: string) {
  const now = Date.now()
  const windowMs = 60_000
  const limit = 20

  const records = rateLimitMap.get(ip) || []
  const recent = records.filter(t => now - t < windowMs)

  if (recent.length >= limit) {
    return false
  }

  recent.push(now)
  rateLimitMap.set(ip, recent)
  return true
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // 1️⃣ 方法校验
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  // 2️⃣ IP 限流
  const ip =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
    req.socket.remoteAddress ||
    'unknown'

  if (!checkRateLimit(ip)) {
    return res.status(429).json({
      error: 'Too many requests, please slow down.',
    })
  }

  // 3️⃣ 参数校验
  const { messages } = req.body
  if (!Array.isArray(messages)) {
    return res.status(400).json({
      error: 'Invalid request body: messages is required',
    })
  }

  // 4️⃣ 读取服务端 Key
  const apiKey = process.env.DEEPSEEK_API_KEY
  try {
    // 5️⃣ 转发请求到 DeepSeek
    const response = await fetch(
      `${process.env.DEEPSEEK_BASE_URL}/chat/completions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages,
          temperature: 0.2,
        }),
      }
    )

    if (!response.ok) {
      const text = await response.text()
      console.error('DeepSeek error:', text)
      return res.status(502).json({
        error: 'AI service error',
      })
    }

    const data = await response.json()
    return res.status(200).json(data)
  } catch (err) {
    console.error('AI request failed:', err)
    return res.status(500).json({
      error: 'Internal Server Error',
    })
  }
}