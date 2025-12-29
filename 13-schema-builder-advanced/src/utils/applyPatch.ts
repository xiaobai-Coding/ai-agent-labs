import type { SchemaState, PatchOp, SchemaField } from './validatePatch'

// 深拷贝工具，避免直接修改原对象
function cloneSchema(schema: SchemaState): SchemaState {
  return JSON.parse(JSON.stringify(schema));
}

// 简化的 applyPatch：仅执行操作数组，不处理版本号
export function applyPatch(schema: SchemaState, ops: PatchOp[]): SchemaState {
  if (!Array.isArray(ops)) {
    throw new Error("无效的 ops：必须是数组");
  }

  if (ops.length === 0) {
    return cloneSchema(schema);
  }

  let nextSchema = cloneSchema(schema);

  for (const op of ops) {
    const { op: opType, target } = op;

    if (opType === "add") {
      if (target !== "field") {
        throw new Error('ADD 操作目前仅支持 target = "field"');
      }
      const { value } = op;
      if (!value) {
        throw new Error("ADD 操作必须提供 value");
      }
      if (!value.name) {
        throw new Error("ADD field 时必须提供字段 name");
      }
      const exists = nextSchema.fields.some((f) => f.name === value.name);
      if (exists) {
        throw new Error(`ADD 失败：字段 "${value.name}" 已存在`);
      }
      nextSchema = {
        ...nextSchema,
        fields: [...nextSchema.fields, value]
      };
      continue;
    }

    if (opType === "update") {
      if (target === "field") {
        const { name, value } = op;
        if (!name) {
          throw new Error("UPDATE field 时必须提供 name");
        }
        if (!value || typeof value !== "object") {
          throw new Error("UPDATE field 时必须提供有效的 value 对象");
        }
        const index = nextSchema.fields.findIndex((f) => f.name === name);
        if (index === -1) {
          throw new Error(`UPDATE 失败：未找到字段 "${name}"`);
        }
        const updatedField = {
          ...nextSchema.fields[index],
          ...value
        } as SchemaField;
        const newFields = [...nextSchema.fields];
        newFields[index] = updatedField;
        nextSchema = {
          ...nextSchema,
          fields: newFields
        };
      } else if (target === "schema") {
        const { value } = op;
        if (!value || typeof value !== "object") {
          throw new Error("UPDATE schema 时必须提供有效的 value 对象");
        }
        nextSchema = {
          ...nextSchema,
          title: value.title ?? nextSchema.title,
          description: value.description ?? nextSchema.description
        };
      } else {
        throw new Error(`不支持的 UPDATE target：${target}`);
      }
      continue;
    }

    if (opType === "remove") {
      if (target !== "field") {
        throw new Error('REMOVE 操作目前仅支持 target = "field"');
      }
      const { name } = op;
      if (!name) {
        throw new Error("REMOVE field 时必须提供 name");
      }
      const index = nextSchema.fields.findIndex((f) => f.name === name);
      if (index === -1) {
        throw new Error(`REMOVE 失败：未找到字段 "${name}"`);
      }
      const newFields = nextSchema.fields.filter((f) => f.name !== name);
      nextSchema = {
        ...nextSchema,
        fields: newFields
      };
      continue;
    }

    throw new Error(`不支持的操作类型：${opType}`);
  }

  // 应用操作后，如果 schema 有版本号，则递增
  if (nextSchema.version !== undefined) {
    nextSchema.version += 1;
  }

  return nextSchema;
}

// 安全应用：校验 baseVersion 与当前 schema.version 匹配，匹配后应用
export function applyPatchSafe(schema: SchemaState, patch: { baseVersion?: number; operations: PatchOp[] }): SchemaState {
  const currentVersion = schema?.version ?? 1;
  const baseVersion = patch?.baseVersion ?? 1;

  if (currentVersion !== baseVersion) {
    const err: any = new Error("SCHEMA_VERSION_MISMATCH");
    err.code = "SCHEMA_VERSION_MISMATCH";
    err.currentVersion = currentVersion;
    err.baseVersion = baseVersion;
    throw err;
  }

  // 调用 applyPatch 执行变更
  return applyPatch(schema, patch.operations);
}
