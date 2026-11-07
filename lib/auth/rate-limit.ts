
import "server-only";

import { createHmac } from "node:crypto";
import { prisma } from "@/lib/prisma";

const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;
const BLOCK_MINUTES = 15;

export function createRateLimitIdentifier(
    email: string,
    ipAddress: string
): string {
    const secret = process.env.RATE_LIMIT_SECRET;

    if (!secret || secret.length < 32) {
        throw new Error("RATE_LIMIT_SECRET belum diatur dengan benar.");
    }

    return createHmac("sha256", secret)
        .update(`${email.toLowerCase()}:${ipAddress}`)
        .digest("hex");
}

export async function isLoginBlocked(identifier: string) {
    const record = await prisma.loginRateLimit.findUnique({
        where: { identifier },
    });

    if (!record?.blockedUntil) {
        return false;
    }

    return record.blockedUntil > new Date();
}

export async function recordLoginFailure(identifier: string) {
    const rows = await prisma.$queryRaw<
        { attempts: number; blockedUntil: Date | null }[]
    >`
    INSERT INTO "LoginRateLimit" (
      "identifier",
      "attempts",
      "windowStartedAt",
      "blockedUntil",
      "updatedAt"
    )
    VALUES (${identifier}, 1, NOW(), NULL, NOW())

    ON CONFLICT ("identifier")
    DO UPDATE SET
      "attempts" = CASE
        WHEN
          "LoginRateLimit"."windowStartedAt"
            <= NOW() - INTERVAL '15 minutes'
          OR (
            "LoginRateLimit"."blockedUntil" IS NOT NULL
            AND "LoginRateLimit"."blockedUntil" <= NOW()
          )
        THEN 1
        ELSE "LoginRateLimit"."attempts" + 1
      END,

      "windowStartedAt" = CASE
        WHEN
          "LoginRateLimit"."windowStartedAt"
            <= NOW() - INTERVAL '15 minutes'
          OR (
            "LoginRateLimit"."blockedUntil" IS NOT NULL
            AND "LoginRateLimit"."blockedUntil" <= NOW()
          )
        THEN NOW()
        ELSE "LoginRateLimit"."windowStartedAt"
      END,

      "blockedUntil" = CASE
        WHEN
          "LoginRateLimit"."windowStartedAt"
            <= NOW() - INTERVAL '15 minutes'
          OR (
            "LoginRateLimit"."blockedUntil" IS NOT NULL
            AND "LoginRateLimit"."blockedUntil" <= NOW()
          )
        THEN NULL
        WHEN "LoginRateLimit"."attempts" + 1 >= ${MAX_ATTEMPTS}
        THEN NOW() + INTERVAL '15 minutes'
        ELSE "LoginRateLimit"."blockedUntil"
      END,

      "updatedAt" = NOW()

    RETURNING "attempts", "blockedUntil"
  `;

    return rows[0];
}

export async function clearLoginFailures(identifier: string) {
    await prisma.loginRateLimit.deleteMany({
        where: { identifier },
    });
}

export const LOGIN_RATE_LIMIT_CONFIG = {
    maxAttempts: MAX_ATTEMPTS,
    windowMinutes: WINDOW_MINUTES,
    blockMinutes: BLOCK_MINUTES,
};
