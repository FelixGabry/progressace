import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/goal-auth";

const patchSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
});

export async function PATCH(request: Request) {
  const { user, response } = await requireUser();
  if (response) return response;

  try {
    const body = await request.json();
    const parsed = patchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const updated = await prisma.user.update({
      where: { id: user!.id },
      data: { name: parsed.data.name },
    });

    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    await supabase.auth.updateUser({
      data: { name: parsed.data.name },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[profile PATCH]", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
