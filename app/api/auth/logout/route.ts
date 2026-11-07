
import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/auth/session";

export async function POST() {
    try {
        await deleteSession();

        return NextResponse.json(
            {
                success: true,
                message: "Logout berhasil.",
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Logout error:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Terjadi kesalahan saat logout.",
            },
            { status: 500 }
        );
    }
}
