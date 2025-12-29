export type Intent = "FULL_GENERATE" | "PATCH_UPDATE" | "REGENERATE" | "UNKNOWN";

export interface IntentResult {
  intent: Intent;
  confidence: number;
}

export interface ClarifyInfo {
  intent: Intent;
  confidence: number;
  reason: string;
}
