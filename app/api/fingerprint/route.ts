import { NextResponse } from "next/server";
import {
    createWifiFingerprint,
    type WifiFingerprintInput,
} from "@/lib/wifi-fingerprint";

export async function POST(request: Request) {
    let body: unknown;

    try {
        body = await request.json();
    } catch {
        return NextResponse.json(
            { error: "Body harus berupa JSON yang valid." },
            { status: 400 },
        );
    }

    if (
        typeof body !== "object" ||
        body === null ||
        Array.isArray(body)
    ) {
        return NextResponse.json(
            { error: "Input harus berupa objek konfigurasi." },
            { status: 400 },
        );
    }

    try {
        const fingerprint = createWifiFingerprint(
            body as WifiFingerprintInput,
        );

        return NextResponse.json({
            algorithm: "SHA-256",
            schemaVersion: 1,
            fingerprint,
        });
    } catch (error) {
        const message =
            error instanceof Error
                ? error.message
                : "Input tidak valid.";

        return NextResponse.json(
            { error: message },
            { status: 400 },
        );
    }
}