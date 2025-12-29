import type { IntentResult } from '../types/intent'

// Intent 置信度阈值
// 置信度阈值为0.6，如果置信度小于0.6，则需要澄清意图
export const INTENT_CONF_THRESHOLD = 0.6

/**
 * 判断是否需要澄清意图
 */
export function shouldClarify(intentResult: IntentResult): {
  needClarify: boolean
  reason: string
  suggested?: "PATCH_UPDATE" | "REGENERATE" | "FULL_GENERATE"
} {
  const { intent, confidence } = intentResult

  // UNKNOWN 意图直接需要澄清
  if (intent === "UNKNOWN") {
    return {
      needClarify: true,
      reason: `无法识别意图类型：${intent}`
    }
  }

  // 置信度不足的意图需要澄清
  if (confidence < INTENT_CONF_THRESHOLD) {
    let suggested: "PATCH_UPDATE" | "REGENERATE" | "FULL_GENERATE" | undefined

    // 根据意图类型提供建议
    if (intent === "PATCH_UPDATE") {
      suggested = "PATCH_UPDATE"
    } else if (intent === "REGENERATE" || intent === "FULL_GENERATE") {
      suggested = "REGENERATE"
    }

    return {
      needClarify: true,
      reason: `置信度不足：${intent} (${(confidence * 100).toFixed(1)}%)`,
      suggested
    }
  }

  // 置信度足够，不需要澄清
  return {
    needClarify: false,
    reason: ""
  }
}

/**
 * 判断用户输入是否属于“泛化/模糊的优化请求”
 * 典型：优化一下、调整一下、改改、完善一下、看看怎么更好
 */
export function isVagueOptimizeInput(raw: string): boolean {
    const s = (raw || '').trim().toLowerCase()
    if (!s) return true
  
    // 太短：几乎一定不够表达明确修改
    if (s.length <= 3) return true
  
    // 纯标点/表情/无意义字符
    const onlySymbols = s.replace(/[\s\p{P}\p{S}]/gu, '')
    if (!onlySymbols) return true
  
    // 明确指令关键词（出现这些通常就不算“泛化”）
    // 例如：新增/删除/必填/默认值/字段名/手机号/email 等
    const explicitSignals = [
      '新增', '添加', '增加', '删除', '移除', '去掉', '改成', '修改', '设置',
      '必填', '可选', '默认', '默认值', '必选', '校验', '长度', '范围', '最小', '最大',
      'title', 'description', 'schema', '字段', 'field', 'name', 'label', 'type',
      'phone', 'email', 'username', 'password', 'age', 'gender'
    ]
    if (explicitSignals.some(k => s.includes(k))) return false
  
    // 常见“泛化优化”短语（中英都考虑）
    const vaguePatterns: RegExp[] = [
      /^(优化|优化一下|再优化|再优化一下)$/,
      /^(调整|调整一下|再调整|再调整一下)$/,
      /^(改|改改|改一下|修改一下|修一下)$/,
      /^(完善|完善一下|补全|补全一下)$/,
      /^(美化|美化一下)$/,
      /^(改进|改进一下)$/,
      /^(整理|整理一下)$/,
      /^(更好|更合理|更清晰|更规范)$/,
      /^(随便|随便弄|你看着办|看着办|你来)$/,
      /^(help|improve|optimize|refine|polish)(\s+it)?[.!?]*$/i,
      /(更好一点|更合理一点|更清晰一点|更规范一点|更漂亮一点|更美观一点)/,
      /(整体|全部|全局|通用).*(优化|调整|改进)/,
      /(帮我|帮忙).*(优化|调整|完善|改进|润色)/,
    ]
  
    return vaguePatterns.some(re => re.test(s))
  }