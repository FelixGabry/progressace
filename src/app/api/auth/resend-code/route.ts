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
  email: z.string().email(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase();

    const pending = await prisma.pendingSignup.findUnique({
      where: { email },
    });

    if (!pending) {
      return NextResponse.json(
        { error: "No pending signup found. Please register again." },
        { status: 404 }
      );
    }

    const code = generateVerificationCode();
    const codeHash = await hashVerificationCode(code);
    const expiresAt = getCodeExpiry();

    await prisma.pendingSignup.update({
      where: { email },
      data: { codeHash, expiresAt },
    });

    await sendVerificationCodeEmail(email, code, pending.name);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[resend-code]", error);
    return NextResponse.json(
      { error: "Could not resend code. Try again later." },
      { status: 500 }
    );
  }
}
