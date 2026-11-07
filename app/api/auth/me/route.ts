
import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";

export async function GET() {
    try {
        const session = await getCurrentSession();

        if (!session) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Belum login atau session sudah berakhir.",
                },
                {
                    status: 401,
                    headers: {
                        "Cache-Control": "no-store",
                    },
                }
            );
        }

        return NextResponse.json(
            {
                success: true,
                message: "Session masih aktif.",
                user: session.user,
                expiresAt: session.expiresAt,
            },
            {
                status: 200,
                headers: {
                    "Cache-Control": "no-store",
                },
            }
        );
    } catch (error) {
        console.error("Session check error:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Terjadi kesalahan saat memeriksa session.",
            },
            { status: 500 }
        );
    }
}
