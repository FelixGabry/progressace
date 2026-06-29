import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { validateStepPercentages } from "@/lib/goals";
import {
  getOwnedGoal,
  rebalanceStepPercentages,
  recalculateGoalProgress,
  requireUser,
} from "@/lib/goal-auth";

const createSchema = z.object({
  title: z.string().trim().min(1, "Step title is required"),
});

const syncSchema = z.object({
  steps: z.array(
    z.object({
      id: z.string().optional(),
      title: z.string().trim().min(1),
      percentage: z.number().min(0.01).max(100),
    })
  ),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireUser();
  if (response) return response;

  const { id } = await params;
  const goal = await getOwnedGoal(id, user!.id);

  if (!goal) {
    return NextResponse.json({ error: "Goal not found" }, { status: 404 });
  }

  if (goal.type === "SIMPLE") {
    return NextResponse.json(
      { error: "Simple goals cannot edit steps in bulk." },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const parsed = syncSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { steps } = parsed.data;

    if (steps.length === 0) {
      return NextResponse.json(
        { error: "Complex goals need at least one step." },
        { status: 400 }
      );
    }

    const validationError = validateStepPercentages(steps.map((s) => s.percentage));
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const incomingIds = new Set(steps.filter((s) => s.id).map((s) => s.id!));
    const toDelete = goal.steps.filter((s) => !incomingIds.has(s.id));

    await prisma.$transaction(async (tx) => {
      for (const step of toDelete) {
        await tx.step.delete({ where: { id: step.id } });
      }

      for (let order = 0; order < steps.length; order++) {
        const step = steps[order];
        if (step.id) {
          await tx.step.update({
            where: { id: step.id },
            data: {
              title: step.title,
              percentage: step.percentage,
              order,
              source: "USER_MODIFIED",
            },
          });
        } else {
          await tx.step.create({
            data: {
              goalId: id,
              title: step.title,
              percentage: step.percentage,
              order,
            },
          });
        }
      }
    });

    const updatedGoal = await recalculateGoalProgress(id);
    return NextResponse.json(updatedGoal);
  } catch (error) {
    console.error("[steps PUT]", error);
    return NextResponse.json({ error: "Failed to save steps" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireUser();
  if (response) return response;

  const { id } = await params;
  const goal = await getOwnedGoal(id, user!.id);

  if (!goal) {
    return NextResponse.json({ error: "Goal not found" }, { status: 404 });
  }

  if (goal.type === "SIMPLE") {
    return NextResponse.json(
      { error: "Simple goals have a single step and cannot add more." },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const maxOrder = goal.steps.reduce((max, s) => Math.max(max, s.order), -1);

    await prisma.step.create({
      data: {
        goalId: id,
        title: parsed.data.title,
        percentage: 0,
        order: maxOrder + 1,
      },
    });

    await rebalanceStepPercentages(id);
    const updatedGoal = await recalculateGoalProgress(id);

    return NextResponse.json(updatedGoal, { status: 201 });
  } catch (error) {
    console.error("[steps POST]", error);
    return NextResponse.json({ error: "Failed to add step" }, { status: 500 });
  }
}
