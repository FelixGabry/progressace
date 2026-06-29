import type { Step } from "@prisma/client";

type StepLike = Pick<Step, "percentage" | "completed">;

export function computeGoalPercentage(steps: StepLike[]): number {
  return steps
    .filter((s) => s.completed)
    .reduce((sum, s) => sum + s.percentage, 0);
}

/** Split 100% across n steps as evenly as possible (integers). */
export function equalSplitPercentages(count: number): number[] {
  if (count <= 0) return [];
  const base = Math.floor(100 / count);
  const remainder = 100 - base * count;
  return Array.from({ length: count }, (_, i) => base + (i < remainder ? 1 : 0));
}

export function validateStepPercentages(percentages: number[]): string | null {
  if (percentages.length === 0) {
    return "Add at least one step.";
  }
  const sum = percentages.reduce((a, b) => a + b, 0);
  if (sum !== 100) {
    return `Step percentages must sum to 100% (currently ${sum}%).`;
  }
  if (percentages.some((p) => p <= 0)) {
    return "Each step must be greater than 0%.";
  }
  return null;
}

export function cumulativeStepPositions(
  steps: { percentage: number; order: number }[]
): number[] {
  const sorted = [...steps].sort((a, b) => a.order - b.order);
  let cumulative = 0;
  return sorted.map((step) => {
    cumulative += step.percentage;
    return cumulative;
  });
}

export const PRIORITY_LABELS: Record<number, string> = {
  0: "Normal",
  1: "High",
  2: "Urgent",
};
