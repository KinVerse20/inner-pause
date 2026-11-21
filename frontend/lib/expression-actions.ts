export type ExpressionActionId = "insight" | "private" | "reset";

export interface ExpressionActionDefinition {
  id: ExpressionActionId;
  label: string;
  text: string;
}

export const expressionActions: Record<ExpressionActionId, ExpressionActionDefinition> = {
  insight: {
    id: "insight",
    label: "Understand what I’m feeling",
    text: "Reads what you’ve expressed, identifies the emotions showing up, maps the affected chakras and suggests a healing path.",
  },
  private: {
    id: "private",
    label: "Save as private release",
    text: "Saves what you’ve expressed privately without analysing it. Use this when you simply want to let something out.",
  },
  reset: {
    id: "reset",
    label: "Start over",
    text: "Clears the current entry and gives you a fresh space to begin again.",
  },
};
