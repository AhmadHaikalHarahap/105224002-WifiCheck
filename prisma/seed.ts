
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import {
    PrismaClient,
    Prisma,
} from "../lib/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error("DATABASE_URL belum diatur.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
    const assessments = [
        {
            id: "11111111-1111-4111-8111-111111111111",
            ssid: "WiFi Kost Aman",
            securityProtocol: "wpa2",
            passwordProtection: "enabled",
            wpsEnabled: "disabled",
            firmwareStatus: "up-to-date",
            notes: "Data contoh untuk pengujian WiFi Check.",
            riskLevel: "low",
            summary: "Konfigurasi WiFi memiliki tingkat keamanan relatif baik.",
            recommendations: [
                "Gunakan password WiFi yang kuat.",
                "Periksa pembaruan firmware router secara berkala.",
            ] as Prisma.InputJsonValue,
            findings: [
                {
                    title: "WPS telah dinonaktifkan",
                    description: "WPS tidak aktif sehingga mengurangi risiko akses melalui fitur tersebut.",
                    severity: "low",
                },
            ],
        },
        {
            id: "22222222-2222-4222-8222-222222222222",
            ssid: "WiFi Kost Testing",
            securityProtocol: "wpa2",
            passwordProtection: "enabled",
            wpsEnabled: "enabled",
            firmwareStatus: "outdated",
            notes: "Data contoh dengan beberapa konfigurasi yang perlu diperbaiki.",
            riskLevel: "high",
            summary: "Konfigurasi WiFi memiliki beberapa risiko keamanan.",
            recommendations: [
                "Nonaktifkan fitur WPS.",
                "Perbarui firmware router ke versi terbaru.",
                "Gunakan password yang kuat dan unik.",
            ] as Prisma.InputJsonValue,
            findings: [
                {
                    title: "WPS masih aktif",
                    description: "WPS yang aktif dapat meningkatkan risiko akses tidak sah.",
                    severity: "medium",
                },
                {
                    title: "Firmware router sudah usang",
                    description: "Firmware lama berpotensi memiliki kerentanan keamanan.",
                    severity: "high",
                },
            ],
        },
    ];

    for (const item of assessments) {
        const { findings, ...assessmentData } = item;

        await prisma.assessment.upsert({
            where: { id: item.id },
            create: {
                ...assessmentData,
                findings: {
                    create: findings,
                },
            },
            update: {
                ...assessmentData,
                findings: {
                    deleteMany: {},
                    create: findings,
                },
            },
        });
    }

    console.log("Seed data berhasil dimasukkan.");
}

main()
    .catch((error) => {
        console.error("Gagal menjalankan seed data:", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
