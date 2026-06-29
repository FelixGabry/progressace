import { getCurrentUser } from "@/lib/user";
import { NextResponse } from "next/server";
import { equalSplitPercentages } from "@/lib/goals";

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    return { user: null, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { user, response: null };
}

export async function getOwnedGoal(goalId: string, userId: string) {
  const { prisma } = await import("@/lib/prisma");
  return prisma.goal.findFirst({
    where: { id: goalId, userId },
    include: { steps: { orderBy: { order: "asc" } } },
  });
}

export async function rebalanceStepPercentages(goalId: string) {
  const { prisma } = await import("@/lib/prisma");
  const steps = await prisma.step.findMany({
    where: { goalId },
    orderBy: { order: "asc" },
  });

  if (steps.length === 0) return;

  const splits = equalSplitPercentages(steps.length);
  await prisma.$transaction(
    steps.map((step, index) =>
      prisma.step.update({
        where: { id: step.id },
        data: { percentage: splits[index] },
      })
    )
  );
}

export async function recalculateGoalProgress(goalId: string) {
  const { prisma } = await import("@/lib/prisma");
  const { computeGoalPercentage } = await import("@/lib/goals");

  const goal = await prisma.goal.findUnique({
    where: { id: goalId },
    include: { steps: true },
  });

  if (!goal) return null;

  const percentage = computeGoalPercentage(goal.steps);
  const allDone =
    goal.steps.length > 0 && goal.steps.every((s) => s.completed);

  return prisma.goal.update({
    where: { id: goalId },
    data: {
      percentage,
      status: allDone ? "COMPLETED" : goal.status === "COMPLETED" ? "ACTIVE" : goal.status,
    },
    include: { steps: { orderBy: { order: "asc" } } },
  });
}
