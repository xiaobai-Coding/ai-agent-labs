export type FieldType = 'string' | 'number' | 'boolean' | 'select'

export interface Field {
  name: string
  label?: string
  type: FieldType
  required?: boolean
  default?: any
  enum?: string[] | null
  description?: string
}

export interface SchemaMeta {
  version: number
}

export interface Schema {
  meta?: SchemaMeta
  title: string
  description?: string
  fields: Field[]
}

export interface Operation {
  op: 'add' | 'update' | 'remove'
  target: 'schema' | 'field'
  name?: string
  value?: any
  // keep compatibility with older shapes
  label?: string
}

export interface OpDecision {
  index: number
  op: Operation
  ok: boolean
  action: 'apply' | 'skip'
  reason?: string
}

export interface ApplyReport {
  appliedCount: number
  skippedCount: number
  appliedIndexes: number[]
  skipped: Array<{ index: number; reason: string }>
  summary: string
}


