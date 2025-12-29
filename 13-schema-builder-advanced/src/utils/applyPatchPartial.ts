import type { Schema, Operation, OpDecision, ApplyReport } from './types'
import { applyPatch } from './applyPatch'

// apply decisions partially: only apply action === 'apply'
export function applyPatchPartial(currentSchema: Schema, decisions: OpDecision[]): { nextSchema: Schema; report: ApplyReport } {
  // collect operations that will be applied in order
  const opsToApply: Operation[] = []
  const appliedIndexes: number[] = []
  const skipped: Array<{ index: number; reason: string }> = []

  for (const d of decisions) {
    if (d.action === 'apply' && d.ok) {
      opsToApply.push(d.op)
      appliedIndexes.push(d.index)
    } else {
      skipped.push({ index: d.index, reason: d.reason || 'skipped by validation' })
    }
  }

  // build a patch-like structure and try to apply; but we want per-op granularity
  let workingSchema = JSON.parse(JSON.stringify(currentSchema)) as Schema
  const actuallyAppliedIndexes: number[] = []
  const actuallySkipped: Array<{ index: number; reason: string }> = [...skipped]

  for (let i = 0; i < opsToApply.length; i++) {
    const op = opsToApply[i]
    const originalIndex = appliedIndexes[i]
    try {
      // apply single operation by wrapping as a patch
      const patch = { operations: [op] }
      workingSchema = applyPatch(workingSchema as any, patch as any) as Schema
      actuallyAppliedIndexes.push(originalIndex!)
    } catch (err: any) {
      actuallySkipped.push({ index: originalIndex!, reason: `apply failed: ${err?.message || String(err)}` })
    }
  }

  // increment version after successful partial apply (only if any applied)
  const appliedCount = actuallyAppliedIndexes.length
  if (appliedCount > 0) {
    const currentVer = (currentSchema.meta?.version ?? 1)
    workingSchema.meta = { ...(workingSchema.meta || {}), version: currentVer + 1 }
  }

  const skippedCount = actuallySkipped.length

  // build summary: for each actuallyAppliedIndexes map to ops to produce human summary
  const summaryParts: string[] = []
  for (const idx of actuallyAppliedIndexes) {
    // find decision to get op
    const d = decisions.find((x) => x.index === idx)
    if (!d) continue
    const op = d.op
    if (op.target === 'field') {
      if (op.op === 'add') summaryParts.push(`+${op.value?.name ?? op.name ?? 'field'}`)
      else if (op.op === 'update') summaryParts.push(`~${op.name}`)
      else if (op.op === 'remove') summaryParts.push(`-${op.name}`)
    } else if (op.target === 'schema') {
      summaryParts.push(`~schema`)
    }
  }

  const summary = summaryParts.join(', ')

  const report: ApplyReport = {
    appliedCount: actuallyAppliedIndexes.length,
    skippedCount,
    appliedIndexes: actuallyAppliedIndexes,
    skipped: actuallySkipped,
    summary
  }

  return { nextSchema: workingSchema, report }
}


