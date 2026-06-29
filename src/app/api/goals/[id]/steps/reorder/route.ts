import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOwnedGoal, requireUser } from "@/lib/goal-auth";

const reorderSchema = z.object({
  stepIds: z.array(z.string()).min(1),
});

export async function PATCH(
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

  try {
    const body = await request.json();
    const parsed = reorderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { stepIds } = parsed.data;
    const existingIds = new Set(goal.steps.map((s) => s.id));

    if (
      stepIds.length !== goal.steps.length ||
      stepIds.some((stepId) => !existingIds.has(stepId))
    ) {
      return NextResponse.json(
        { error: "Step order must include every step exactly once." },
        { status: 400 }
      );
    }

    await prisma.$transaction(
      stepIds.map((stepId, order) =>
        prisma.step.update({
          where: { id: stepId },
          data: { order },
        })
      )
    );

    const updatedGoal = await getOwnedGoal(id, user!.id);
    return NextResponse.json(updatedGoal);
  } catch (error) {
    console.error("[steps reorder PATCH]", error);
    return NextResponse.json({ error: "Failed to reorder steps" }, { status: 500 });
  }
}
