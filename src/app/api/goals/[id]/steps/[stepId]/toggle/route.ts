import { NextResponse } from "next/server";
import { getOwnedGoal, recalculateGoalProgress, requireUser } from "@/lib/goal-auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  const { user, response } = await requireUser();
  if (response) return response;

  const { id, stepId } = await params;
  const goal = await getOwnedGoal(id, user!.id);

  if (!goal) {
    return NextResponse.json({ error: "Goal not found" }, { status: 404 });
  }

  const step = goal.steps.find((s) => s.id === stepId);
  if (!step) {
    return NextResponse.json({ error: "Step not found" }, { status: 404 });
  }

  const completed = !step.completed;

  await prisma.step.update({
    where: { id: stepId },
    data: {
      completed,
      completedAt: completed ? new Date() : null,
    },
  });

  const updatedGoal = await recalculateGoalProgress(id);
  return NextResponse.json(updatedGoal);
}
