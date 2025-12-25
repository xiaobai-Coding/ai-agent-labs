export interface SchemaField {
  name: string;
  type: string;
  required?: boolean;
}

export interface SchemaDefinition {
  title?: string;
  fields: SchemaField[];
}

