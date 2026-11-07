
import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE_NAME = "wificheck_session";

const SESSION_DURATION = 7 * 24 * 60 * 60;

function hashToken(token: string): string {
    return createHash("sha256")
        .update(token)
        .digest("hex");
}

function isValidToken(token: string): boolean {
    return /^[A-Za-z0-9_-]{43}$/.test(token);
}

// Membuat session baru setelah login berhasil
export async function createSession(userId: string) {
    const token = randomBytes(32).toString("base64url");
    const tokenHash = hashToken(token);

    const expiresAt = new Date(
        Date.now() + SESSION_DURATION * 1000
    );

    await prisma.session.create({
        data: {
            userId,
            tokenHash,
            expiresAt,
        },
    });

    const cookieStore = await cookies();

    cookieStore.set(SESSION_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        expires: expiresAt,
    });

    return expiresAt;
}

// Mengambil dan memvalidasi session pengguna
export async function getCurrentSession() {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token || !isValidToken(token)) {
        return null;
    }

    const tokenHash = hashToken(token);

    const session = await prisma.session.findUnique({
        where: { tokenHash },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    role: true,
                },
            },
        },
    });

    if (!session) {
        return null;
    }

    if (session.expiresAt <= new Date()) {
        await prisma.session.deleteMany({
            where: { id: session.id },
        });

        cookieStore.delete(SESSION_COOKIE_NAME);

        return null;
    }

    return {
        user: session.user,
        expiresAt: session.expiresAt,
    };
}

// Menghapus session saat logout
export async function deleteSession() {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (token && isValidToken(token)) {
        const tokenHash = hashToken(token);

        await prisma.session.deleteMany({
            where: { tokenHash },
        });
    }

    cookieStore.delete(SESSION_COOKIE_NAME);
}
