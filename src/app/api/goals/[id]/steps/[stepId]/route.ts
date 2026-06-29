import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { validateStepPercentages } from "@/lib/goals";
import {
  getOwnedGoal,
  recalculateGoalProgress,
  requireUser,
} from "@/lib/goal-auth";

const patchSchema = z.object({
  title: z.string().trim().min(1).optional(),
  percentage: z.number().min(0.01).max(100).optional(),
});

export async function PATCH(
  request: Request,
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

  try {
    const body = await request.json();
    const parsed = patchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { title, percentage } = parsed.data;

    if (percentage !== undefined && goal.type === "COMPLEX") {
      const otherTotal = goal.steps
        .filter((s) => s.id !== stepId)
        .reduce((sum, s) => sum + s.percentage, 0);
      const validationError = validateStepPercentages([
        ...goal.steps.filter((s) => s.id !== stepId).map((s) => s.percentage),
        percentage,
      ]);
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
      }
      if (otherTotal + percentage !== 100) {
        return NextResponse.json(
          { error: "Step percentages must sum to 100%." },
          { status: 400 }
        );
      }
    }

    await prisma.step.update({
      where: { id: stepId },
      data: {
        ...(title !== undefined && { title, source: "USER_MODIFIED" }),
        ...(percentage !== undefined && { percentage }),
      },
    });

    const updatedGoal = await recalculateGoalProgress(id);
    return NextResponse.json(updatedGoal);
  } catch (error) {
    console.error("[step PATCH]", error);
    return NextResponse.json({ error: "Failed to update step" }, { status: 500 });
  }
}

export async function DELETE(
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

  if (goal.type === "SIMPLE") {
    return NextResponse.json(
      { error: "Cannot delete the only step on a simple goal." },
      { status: 400 }
    );
  }

  if (goal.steps.length <= 1) {
    return NextResponse.json(
      { error: "Complex goals need at least one step." },
      { status: 400 }
    );
  }

  const step = goal.steps.find((s) => s.id === stepId);
  if (!step) {
    return NextResponse.json({ error: "Step not found" }, { status: 404 });
  }

  await prisma.step.delete({ where: { id: stepId } });

  const { rebalanceStepPercentages } = await import("@/lib/goal-auth");
  await rebalanceStepPercentages(id);
  const updatedGoal = await recalculateGoalProgress(id);

  return NextResponse.json(updatedGoal);
}
