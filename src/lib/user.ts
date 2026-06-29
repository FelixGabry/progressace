import type { User as SupabaseUser } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";

export async function syncUserToDatabase(supabaseUser: SupabaseUser) {
  const email = supabaseUser.email?.toLowerCase();
  if (!email) return null;

  const name =
    (supabaseUser.user_metadata?.name as string | undefined) ??
    (supabaseUser.user_metadata?.full_name as string | undefined) ??
    null;

  const emailVerified = supabaseUser.email_confirmed_at
    ? new Date(supabaseUser.email_confirmed_at)
    : null;

  const image =
    (supabaseUser.user_metadata?.avatar_url as string | undefined) ?? null;

  const existingByEmail = await prisma.user.findUnique({ where: { email } });

  if (existingByEmail && existingByEmail.id !== supabaseUser.id) {
    await prisma.$transaction(async (tx) => {
      await tx.goal.updateMany({
        where: { userId: existingByEmail.id },
        data: { userId: supabaseUser.id },
      });
      await tx.user.delete({ where: { id: existingByEmail.id } });
    });
  }

  return prisma.user.upsert({
    where: { id: supabaseUser.id },
    create: {
      id: supabaseUser.id,
      email,
      name,
      emailVerified,
      image,
    },
    update: {
      email,
      name,
      emailVerified,
      image,
    },
  });
}

export async function getCurrentUser() {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  await syncUserToDatabase(user);

  return prisma.user.findUnique({
    where: { id: user.id },
  });
}
