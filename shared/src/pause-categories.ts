export const PAUSE_CATEGORY_IDS = ["sleep", "reset", "focus", "confidence", "calm", "release"] as const;

export type PauseCategoryId = (typeof PAUSE_CATEGORY_IDS)[number];

export const pauseCategoryIds: PauseCategoryId[] = [...PAUSE_CATEGORY_IDS];
