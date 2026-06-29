import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncUserToDatabase } from "@/lib/user";
import { verifyVerificationCode } from "@/lib/verification-codes";

const schema = z.object({
  email: z.string().email(),
  code: z.string().length(6, "Code must be 6 digits"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const email = parsed.data.email.toLowerCase();
    const code = parsed.data.code;

    const pending = await prisma.pendingSignup.findUnique({
      where: { email },
    });

    if (!pending) {
      return NextResponse.json(
        { error: "No pending signup found. Please register again." },
        { status: 404 }
      );
    }

    if (pending.expiresAt < new Date()) {
      await prisma.pendingSignup.delete({ where: { email } });
      return NextResponse.json(
        { error: "This code has expired. Please sign up again." },
        { status: 410 }
      );
    }

    const valid = await verifyVerificationCode(code, pending.codeHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid code. Check your email and try again." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data: created, error: createError } =
      await admin.auth.admin.createUser({
        email,
        password: pending.password,
        email_confirm: true,
        user_metadata: pending.name ? { name: pending.name } : undefined,
      });

    if (createError) {
      if (createError.message.toLowerCase().includes("already")) {
        return NextResponse.json(
          {
            error:
              "This email is already registered. Try logging in or use forgot password.",
          },
          { status: 409 }
        );
      }
      throw createError;
    }

    if (created.user) {
      await syncUserToDatabase(created.user);
    }

    await prisma.pendingSignup.delete({ where: { email } });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[verify]", error);
    return NextResponse.json(
      { error: "Verification failed. Please try again." },
      { status: 500 }
    );
  }
}
