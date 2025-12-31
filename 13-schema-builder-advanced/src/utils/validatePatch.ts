export type FieldType = "string" | "number" | "boolean" | "select";

export interface SchemaField {
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  default?: any;
  enum?: string[] | null;
}

export interface SchemaState {
  meta?: { version: number };
  title: string;
  description?: string;
  fields: SchemaField[];
}

export type PatchOp =
  | { op: "add"; target: "field"; value: SchemaField }
  | { op: "update"; target: "field"; name: string; value: Partial<SchemaField> }
  | { op: "remove"; target: "field"; name: string }
  | { op: "update"; target: "schema"; value: Partial<Pick<SchemaState, "title" | "description">> };

export interface PatchModelOutput {
  baseVersion?: number;
  summary?: string;
  operations?: any[];
  error?: string;
}

const REASON_MAP: Record<string, string> = {
  'invalid_operations_array': 'operations 结构不合法',
  'invalid_op_shape': '操作结构不完整',
  'field_not_found': '字段不存在',
  'duplicate_field_name': '字段名已存在',
  'invalid_field_type': '字段类型不合法',
  'select_enum_required': 'select 类型必须提供 enum',
  'enum_only_for_select': '只有 select 字段才能设置 enum',
  'unknown_field_props': '包含不支持的字段属性',
  'unknown_schema_props': '包含不支持的 schema 属性'
};

function getReasonText(reason: string): string {
  return REASON_MAP[reason] || reason;
}

function isObject(val: any): val is Record<string, any> {
  return val !== null && typeof val === 'object' && !Array.isArray(val);
}

export function validatePatch(
  currentSchema: SchemaState,
  patch: PatchModelOutput
): {
  ok: boolean;
  baseVersion?: number;
  summary?: string;
  modelError?: string;
  validOps: PatchOp[];
  invalidOps: Array<{ op: any; reason: string }>;
  stats: { total: number; valid: number; invalid: number };
} {
  const validOps: PatchOp[] = [];
  const invalidOps: Array<{ op: any; reason: string }> = [];
  const existingFieldNames = new Set(currentSchema.fields.map(f => f.name));

  // Check if patch has model error
  if (patch.error) {
    return {
      ok: false,
      baseVersion: patch.baseVersion,
      summary: patch.summary,
      modelError: patch.error,
      validOps: [],
      invalidOps: [],
      stats: { total: 0, valid: 0, invalid: 0 }
    };
  }

  // A. 结构校验
  if (!Array.isArray(patch.operations)) {
    return {
      ok: false,
      baseVersion: patch.baseVersion,
      summary: patch.summary,
      validOps: [],
      invalidOps: patch.operations ? [{ op: patch.operations, reason: 'invalid_operations_array' }] : [],
      stats: { total: 0, valid: 0, invalid: 0 }
    };
  }

  const totalOps = patch.operations.length;

  for (const op of patch.operations) {
    let isValid = true;
    let reason = '';

    // Basic structure validation
    if (!isObject(op) || !op.op || !op.target) {
      isValid = false;
      reason = 'invalid_op_shape';
    } else if (!['add', 'update', 'remove'].includes(op.op)) {
      isValid = false;
      reason = 'invalid_op_shape';
    } else if (!['schema', 'field'].includes(op.target)) {
      isValid = false;
      reason = 'invalid_op_shape';
    } else if (op.target === 'field' && (op.op === 'update' || op.op === 'remove') && (!op.name || typeof op.name !== 'string')) {
      isValid = false;
      reason = 'invalid_op_shape';
    } else if ((op.op === 'add' || op.op === 'update') && !isObject(op.value)) {
      isValid = false;
      reason = 'invalid_op_shape';
    }

    // If basic structure is invalid, mark as invalid
    if (!isValid) {
      invalidOps.push({ op, reason });
      continue;
    }

    // B. 语义校验
    if (op.target === 'field') {
      if (op.op === 'add') {
        const value = op.value as SchemaField;
        if (!value.name || typeof value.name !== 'string') {
          isValid = false;
          reason = 'invalid_op_shape';
        } else if (existingFieldNames.has(value.name)) {
          isValid = false;
          reason = 'duplicate_field_name';
        } else if (!['string', 'number', 'boolean', 'select'].includes(value.type)) {
          isValid = false;
          reason = 'invalid_field_type';
        } else if (!value.label || typeof value.label !== 'string') {
          isValid = false;
          reason = 'invalid_op_shape';
        } else if (value.required === undefined || typeof value.required !== 'boolean') {
          isValid = false;
          reason = 'invalid_op_shape';
        } else if (value.type === 'select') {
          if (!Array.isArray(value.enum) || value.enum.length === 0) {
            isValid = false;
            reason = 'select_enum_required';
          }
        } else if (value.type && (value.type as string) !== 'select' && value.enum !== undefined) {
          // For non-select types, enum should not be present
          isValid = false;
          reason = 'enum_only_for_select';
        }

        if (isValid) {
          validOps.push(op as PatchOp);
        } else {
          invalidOps.push({ op, reason });
        }
      } else if (op.op === 'update') {
        const name = op.name!;
        const value = op.value as Partial<SchemaField>;

        if (!existingFieldNames.has(name)) {
          isValid = false;
          reason = 'field_not_found';
        } else {
          // Check allowed properties
          const allowedKeys = ['label', 'type', 'required', 'default', 'enum', 'description'];
          const updateKeys = Object.keys(value);

          for (const key of updateKeys) {
            if (!allowedKeys.includes(key)) {
              isValid = false;
              reason = 'unknown_field_props';
              break;
            }
          }

          if (isValid && value.type && !['string', 'number', 'boolean', 'select'].includes(value.type)) {
            isValid = false;
            reason = 'invalid_field_type';
          }

          if (isValid && value.type === 'select' && value.enum !== undefined) {
            if (!Array.isArray(value.enum) || value.enum.length === 0) {
              isValid = false;
              reason = 'select_enum_required';
            }
          }

          if (isValid && value.enum !== undefined) {
            const currentField = currentSchema.fields.find(f => f.name === name);
            if (currentField && currentField.type !== 'select' && value.type !== 'select') {
              isValid = false;
              reason = 'enum_only_for_select';
            }
          }
        }

        if (isValid) {
          validOps.push(op as PatchOp);
        } else {
          invalidOps.push({ op, reason });
        }
      } else if (op.op === 'remove') {
        const name = op.name!;
        if (!existingFieldNames.has(name)) {
          isValid = false;
          reason = 'field_not_found';
        }

        if (isValid) {
          validOps.push(op as PatchOp);
        } else {
          invalidOps.push({ op, reason });
        }
      }
    } else if (op.target === 'schema') {
      if (op.op === 'update') {
        const value = op.value as Partial<Pick<SchemaState, "title" | "description">>;
        const allowedKeys = ['title', 'description'];

        for (const key of Object.keys(value)) {
          if (!allowedKeys.includes(key)) {
            isValid = false;
            reason = 'unknown_schema_props';
            break;
          }
        }

        if (isValid) {
          validOps.push(op as PatchOp);
        } else {
          invalidOps.push({ op, reason });
        }
      } else {
        isValid = false;
        reason = 'invalid_op_shape';
        invalidOps.push({ op, reason });
      }
    }
  }

  // Convert reasons to Chinese text
  invalidOps.forEach(invalid => {
    invalid.reason = getReasonText(invalid.reason);
  });

  return {
    ok: validOps.length > 0,
    baseVersion: patch.baseVersion,
    summary: patch.summary,
    modelError: patch.error,
    validOps,
    invalidOps,
    stats: {
      total: totalOps,
      valid: validOps.length,
      invalid: invalidOps.length
    }
  };
}