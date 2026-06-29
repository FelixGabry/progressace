import { NextResponse } from "next/server";
import { z } from "zod";
import { GoalType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  equalSplitPercentages,
  validateStepPercentages,
} from "@/lib/goals";
import { requireUser } from "@/lib/goal-auth";

const stepSchema = z.object({
  title: z.string().trim().min(1),
  percentage: z.number().min(0.01).max(100).optional(),
});

const createSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().optional(),
  type: z.nativeEnum(GoalType),
  deadline: z.string().datetime().optional().nullable(),
  priority: z.number().int().min(0).max(2).optional(),
  steps: z.array(stepSchema).optional(),
});

export async function GET() {
  const { user, response } = await requireUser();
  if (response) return response;

  const goals = await prisma.goal.findMany({
    where: { userId: user!.id },
    include: { steps: { orderBy: { order: "asc" } } },
    orderBy: [{ updatedAt: "desc" }],
  });

  return NextResponse.json(goals);
}

export async function POST(request: Request) {
  const { user, response } = await requireUser();
  if (response) return response;

  try {
    const body = await request.json();
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { title, description, type, deadline, priority, steps } = parsed.data;

    let stepInputs: { title: string; percentage: number }[] = [];

    if (type === "SIMPLE") {
      stepInputs = [{ title, percentage: 100 }];
    } else {
      if (!steps?.length) {
        return NextResponse.json(
          { error: "Complex goals need at least one step." },
          { status: 400 }
        );
      }

      const hasCustomPercentages = steps.some((s) => s.percentage !== undefined);
      if (hasCustomPercentages) {
        stepInputs = steps.map((s) => ({
          title: s.title,
          percentage: s.percentage ?? 0,
        }));
        const validationError = validateStepPercentages(
          stepInputs.map((s) => s.percentage)
        );
        if (validationError) {
          return NextResponse.json({ error: validationError }, { status: 400 });
        }
      } else {
        const splits = equalSplitPercentages(steps.length);
        stepInputs = steps.map((s, i) => ({
          title: s.title,
          percentage: splits[i],
        }));
      }
    }

    const percentage = 0;

    const goal = await prisma.goal.create({
      data: {
        userId: user!.id,
        title,
        description: description || null,
        type,
        deadline: deadline ? new Date(deadline) : null,
        priority: priority ?? 0,
        percentage,
        steps: {
          create: stepInputs.map((s, order) => ({
            title: s.title,
            percentage: s.percentage,
            order,
          })),
        },
      },
      include: { steps: { orderBy: { order: "asc" } } },
    });

    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    console.error("[goals POST]", error);
    return NextResponse.json({ error: "Failed to create goal" }, { status: 500 });
  }
}
