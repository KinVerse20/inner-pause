export type ExpressionActionId = "insight" | "private" | "reset";

export interface ExpressionActionDefinition {
  id: ExpressionActionId;
  label: string;
  text: string;
  points: string[];
}

export const expressionActions: Record<ExpressionActionId, ExpressionActionDefinition> = {
  insight: {
    id: "insight",
    label: "Get AI insight",
    text: "AI reads and understands what you’ve expressed.",
    points: ["Identifies emotions", "Maps affected chakras", "Suggests a healing path"],
  },
  private: {
    id: "private",
    label: "Save as private release",
    text: "Keeps this entry private and only visible to you.",
    points: ["Saves your expression securely", "No AI analysis", "You can return to it later"],
  },
  reset: {
    id: "reset",
    label: "Start over",
    text: "Clears everything and gives you a fresh start.",
    points: ["Removes the current text/transcript", "Resets the input area"],
  },
};
