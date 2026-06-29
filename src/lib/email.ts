import { Resend } from "resend";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error("RESEND_API_KEY is not configured");
  }
  return new Resend(key);
}

function getFromAddress() {
  return process.env.RESEND_FROM_EMAIL ?? "ProgressAce <onboarding@resend.dev>";
}

export async function sendVerificationCodeEmail(
  email: string,
  code: string,
  name?: string | null
) {
  const resend = getResend();
  const greeting = name ? `Hi ${name},` : "Hi,";

  const { error } = await resend.emails.send({
    from: getFromAddress(),
    to: email,
    subject: `${code} is your ProgressAce verification code`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #0f172a;">Verify your ProgressAce account</h2>
        <p style="color: #475569;">${greeting}</p>
        <p style="color: #475569;">Enter this 6-digit code on the website to complete registration:</p>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #4f46e5; margin: 24px 0;">${code}</p>
        <p style="color: #94a3b8; font-size: 14px;">This code expires in 15 minutes. If you did not sign up, you can ignore this email.</p>
      </div>
    `,
  });

  if (error) {
    throw new Error(error.message);
  }
}
