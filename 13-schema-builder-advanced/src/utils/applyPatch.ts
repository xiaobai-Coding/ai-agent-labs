interface Field {
  name: string;
  label: string;
  type: "string" | "number" | "boolean" | "select";
  required: boolean;
  default: any;
  enum: string[] | null;
}

interface Schema {
  meta?: { version: number };
  title: string;
  description: string;
  fields: Field[];
}

interface PatchOperation {
  op: "add" | "update" | "remove";
  target: "schema" | "field";
  name?: string;
  value?: any;
}

interface Patch {
  baseVersion?: number;
  operations: PatchOperation[];
}

// 深拷贝工具，避免直接修改原对象
function cloneSchema(schema: Schema): Schema {
  return JSON.parse(JSON.stringify(schema));
}

// 兼容性 applyPatch：仅执行操作，不处理版本号（保留旧逻辑）
export function applyPatch(schema: Schema, patch: Patch): Schema {
  if (!patch || !Array.isArray(patch.operations)) {
    throw new Error("无效的 patch：operations 必须是数组");
  }

  let nextSchema = cloneSchema(schema);

  for (const op of patch.operations) {
    const { op: opType, target, name, value } = op;

    if (!opType || !target) {
      throw new Error("无效的 PatchOperation：缺少 op 或 target");
    }

    if (opType === "add") {
      if (target !== "field") {
        throw new Error('ADD 操作目前仅支持 target = "field"');
      }
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
        fields: [...nextSchema.fields, value as Field]
      };
      continue;
    }

    if (opType === "update") {
      if (target === "field") {
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
        };
        const newFields = [...nextSchema.fields];
        newFields[index] = updatedField;
        nextSchema = {
          ...nextSchema,
          fields: newFields
        };
      } else if (target === "schema") {
        if (!value || typeof value !== "object") {
          throw new Error("UPDATE schema 时必须提供有效的 value 对象");
        }
        const allowedKeys: Array<keyof Schema> = ["title", "description"];
        const updates: Partial<Schema> = {};
        for (const key of allowedKeys) {
          if (key in value) {
            (updates as any)[key] = value[key];
          }
        }
        nextSchema = {
          ...nextSchema,
          ...updates
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

  return nextSchema;
}

// 安全应用：校验 baseVersion 与当前 schema.meta.version 匹配，匹配后应用并将 version +1
export function applyPatchSafe(schema: Schema, patch: Patch): Schema {
  const currentVersion = schema?.meta?.version ?? 1;
  const baseVersion = patch?.baseVersion ?? 1;

  if (currentVersion !== baseVersion) {
    const err: any = new Error("SCHEMA_VERSION_MISMATCH");
    err.code = "SCHEMA_VERSION_MISMATCH";
    err.currentVersion = currentVersion;
    err.baseVersion = baseVersion;
    throw err;
  }

  // 调用现有 applyPatch 执行变更
  const applied = applyPatch(schema, patch);
  const next = cloneSchema(applied);
  // 确保 meta 存在并递增
  next.meta = { ...(next.meta || {}), version: (schema?.meta?.version ?? 1) + 1 };
  return next;
}
