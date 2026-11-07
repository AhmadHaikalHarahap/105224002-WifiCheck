
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import {
    createRateLimitIdentifier,
    isLoginBlocked,
    recordLoginFailure,
    clearLoginFailures,
} from "@/lib/auth/rate-limit";

const loginSchema = z.object({
    email: z.string().trim().email().max(255),
    password: z.string().min(1).max(128),
});

export async function POST(request: Request) {
    try {
        // Memeriksa format data login
        const body = await request.json();
        const result = loginSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Email atau password tidak valid.",
                },
                { status: 400 }
            );
        }

        const email = result.data.email.toLowerCase();
        const password = result.data.password;

        // Membatasi panjang password berdasarkan byte UTF-8
        if (Buffer.byteLength(password, "utf8") > 128) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Email atau password tidak valid.",
                },
                { status: 400 }
            );
        }

        // Mengambil alamat IP pengguna
        const forwardedFor = request.headers.get("x-forwarded-for");

        const ipAddress =
            forwardedFor?.split(",")[0]?.trim() ||
            request.headers.get("x-real-ip") ||
            "unknown";

        // Membuat identitas rate limit
        const rateLimitIdentifier = createRateLimitIdentifier(
            email,
            ipAddress
        );

        // Memeriksa apakah login sedang dibatasi
        const blocked = await isLoginBlocked(rateLimitIdentifier);

        if (blocked) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Terlalu banyak percobaan login. Coba lagi dalam 15 menit.",
                },
                {
                    status: 429,
                    headers: {
                        "Retry-After": "900",
                        "Cache-Control": "no-store",
                    },
                }
            );
        }

        // Mencari pengguna berdasarkan email
        const user = await prisma.user.findUnique({
            where: { email },
        });

        // Jika email tidak ditemukan, catat kegagalan
        if (!user) {
            await recordLoginFailure(rateLimitIdentifier);

            return NextResponse.json(
                {
                    success: false,
                    message: "Email atau password salah.",
                },
                { status: 401 }
            );
        }

        // Memverifikasi password menggunakan Argon2id
        const passwordValid = await verifyPassword(
            password,
            user.passwordHash
        );

        // Jika password salah, catat kegagalan
        if (!passwordValid) {
            await recordLoginFailure(rateLimitIdentifier);

            return NextResponse.json(
                {
                    success: false,
                    message: "Email atau password salah.",
                },
                { status: 401 }
            );
        }

        // Menghapus catatan kegagalan setelah login berhasil
        await clearLoginFailures(rateLimitIdentifier);

        // Membuat session pengguna
        const expiresAt = await createSession(user.id);

        return NextResponse.json(
            {
                success: true,
                message: "Login berhasil.",
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                },
                expiresAt,
            },
            {
                status: 200,
                headers: {
                    "Cache-Control": "no-store",
                },
            }
        );
    } catch (error) {
        console.error("Login error:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Terjadi kesalahan saat login.",
            },
            { status: 500 }
        );
    }
}
