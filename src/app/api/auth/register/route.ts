import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendVerificationCodeEmail } from "@/lib/email";
import {
  generateVerificationCode,
  getCodeExpiry,
  hashVerificationCode,
} from "@/lib/verification-codes";

const schema = z.object({
  name: z.string().trim().optional(),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
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

    const { name, email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists. Try logging in." },
        { status: 409 }
      );
    }

    const code = generateVerificationCode();
    const codeHash = await hashVerificationCode(code);
    const expiresAt = getCodeExpiry();

    await prisma.pendingSignup.upsert({
      where: { email: normalizedEmail },
      create: {
        email: normalizedEmail,
        password,
        name: name || null,
        codeHash,
        expiresAt,
      },
      update: {
        password,
        name: name || null,
        codeHash,
        expiresAt,
      },
    });

    await sendVerificationCodeEmail(normalizedEmail, code, name);

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("[register]", error);
    const message =
      error instanceof Error && error.message.includes("RESEND")
        ? "Email service is not configured. Add RESEND_API_KEY to your .env file."
        : error instanceof Error
          ? error.message
          : "Registration failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
