import { createHash } from "node:crypto";
import type { AssessmentInput } from "@/types/assessment";

export type WifiFingerprintInput = Pick<
    AssessmentInput,
    | "ssid"
    | "securityProtocol"
    | "passwordProtection"
    | "wpsEnabled"
    | "firmwareStatus"
>;

const protocols = ["open", "wep", "wpa2", "wpa3", "unknown"];
const protectionStatuses = ["enabled", "disabled", "unknown"];
const firmwareStatuses = ["up-to-date", "outdated", "unknown"];

function canonicalize(input: WifiFingerprintInput): string {
    if (!input || typeof input !== "object") {
        throw new TypeError("Input konfigurasi wajib berupa objek.");
    }

    if (typeof input.ssid !== "string") {
        throw new TypeError("SSID wajib berupa teks.");
    }

    const ssid = input.ssid.normalize("NFC");

    if (ssid.trim().length === 0) {
        throw new TypeError("SSID tidak boleh kosong.");
    }

    if (Buffer.byteLength(ssid, "utf8") > 32) {
        throw new RangeError("SSID tidak boleh melebihi 32 byte UTF-8.");
    }

    if (!protocols.includes(input.securityProtocol)) {
        throw new TypeError("Protokol keamanan tidak valid.");
    }

    if (!protectionStatuses.includes(input.passwordProtection)) {
        throw new TypeError("Status perlindungan password tidak valid.");
    }

    if (!protectionStatuses.includes(input.wpsEnabled)) {
        throw new TypeError("Status WPS tidak valid.");
    }

    if (!firmwareStatuses.includes(input.firmwareStatus)) {
        throw new TypeError("Status firmware tidak valid.");
    }

    return JSON.stringify({
        schemaVersion: 1,
        ssid,
        securityProtocol: input.securityProtocol,
        passwordProtection: input.passwordProtection,
        wpsEnabled: input.wpsEnabled,
        firmwareStatus: input.firmwareStatus,
    });
}

export function createWifiFingerprint(
    input: WifiFingerprintInput,
): string {
    const canonicalData = canonicalize(input);

    return createHash("sha256")
        .update(canonicalData, "utf8")
        .digest("hex");
}