
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";

const loginSchema = z.object({
    email: z.string().trim().email().max(255),
    password: z.string().min(1).max(128),
});

export async function POST(request: Request) {
    try {
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

        if (Buffer.byteLength(password, "utf8") > 128) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Email atau password tidak valid.",
                },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Email atau password salah.",
                },
                { status: 401 }
            );
        }

        const passwordValid = await verifyPassword(
            password,
            user.passwordHash
        );

        if (!passwordValid) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Email atau password salah.",
                },
                { status: 401 }
            );
        }

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
            { status: 200 }
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
