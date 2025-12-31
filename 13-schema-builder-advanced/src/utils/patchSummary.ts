export function buildImpactFromOps(ops: any[] = []) {
  const added: string[] = []
  const updated: string[] = []
  const removed: string[] = []

  for (const op of ops || []) {
    try {
      if (!op || !op.op || !op.target) continue
      if (op.target === 'field') {
        if (op.op === 'add' && op.value?.name) added.push(op.value.name)
        else if (op.op === 'update' && op.name) updated.push(op.name)
        else if (op.op === 'remove' && op.name) removed.push(op.name)
      }
    } catch (e) {
      // ignore malformed ops
    }
  }
  return { added, updated, removed }
}

function keyChangeSummary(name: string, before: any, after: any) {
  const interesting = ['required', 'default', 'enum', 'type']
  const parts: string[] = []
  for (const k of interesting) {
    const a = before?.[k]
    const b = after?.[k]
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      parts.push(k)
    }
  }
  if (parts.length === 0) return `~${name}`
  return `~${name}(${parts.join(',')})`
}

export function buildStandardSummary(impact: { added: string[]; updated: string[]; removed: string[] }, schemaBefore: any, schemaAfter: any) {
  const parts: string[] = []
  // added
  for (const name of impact.added || []) {
    // find field in after schema to check required
    const f = schemaAfter?.fields?.find((x: any) => x.name === name)
    const req = f?.required ? ' (required)' : ''
    parts.push(`+${name}${req}`)
  }
  // removed
  for (const name of impact.removed || []) {
    parts.push(`-${name}`)
  }
  // updated
  for (const name of impact.updated || []) {
    const beforeField = schemaBefore?.fields?.find((x: any) => x.name === name)
    const afterField = schemaAfter?.fields?.find((x: any) => x.name === name)
    parts.push(keyChangeSummary(name, beforeField, afterField))
  }

  if (parts.length === 0) return 'No-op'
  return parts.join(' ')
}


