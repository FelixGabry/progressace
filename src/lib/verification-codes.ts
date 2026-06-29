import { randomInt } from "crypto";
import bcrypt from "bcryptjs";

const CODE_TTL_MS = 15 * 60 * 1000;

export function generateVerificationCode(): string {
  return String(randomInt(100000, 1000000));
}

export function getCodeExpiry(): Date {
  return new Date(Date.now() + CODE_TTL_MS);
}

export async function hashVerificationCode(code: string): Promise<string> {
  return bcrypt.hash(code, 10);
}

export async function verifyVerificationCode(
  code: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(code, hash);
}
