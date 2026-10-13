import { describe, expect, it } from "vitest";
import {
    createWifiFingerprint,
    type WifiFingerprintInput,
} from "../lib/wifi-fingerprint";

const sample: WifiFingerprintInput = {
    ssid: "Lab-WiFi-01",
    securityProtocol: "wpa3",
    passwordProtection: "enabled",
    wpsEnabled: "disabled",
    firmwareStatus: "up-to-date",
};

describe("createWifiFingerprint", () => {
    it("menghasilkan SHA-256 sepanjang 64 karakter heksadesimal", () => {
        expect(createWifiFingerprint(sample)).toMatch(/^[a-f0-9]{64}$/);
    });

    it("menghasilkan fingerprint konsisten untuk input yang sama", () => {
        expect(createWifiFingerprint(sample)).toBe(
            createWifiFingerprint(sample),
        );
    });

    it("menghasilkan fingerprint berbeda ketika konfigurasi berubah", () => {
        const changed = { ...sample, securityProtocol: "wpa2" as const };

        expect(createWifiFingerprint(changed)).not.toBe(
            createWifiFingerprint(sample),
        );
    });

    it("menolak SSID kosong", () => {
        expect(() =>
            createWifiFingerprint({ ...sample, ssid: "   " }),
        ).toThrow("SSID tidak boleh kosong.");
    });

    it("menolak SSID lebih dari 32 byte UTF-8", () => {
        expect(() =>
            createWifiFingerprint({ ...sample, ssid: "A".repeat(33) }),
        ).toThrow("SSID tidak boleh melebihi 32 byte UTF-8.");
    });

    it("menolak protokol keamanan yang tidak valid", () => {
        expect(() =>
            createWifiFingerprint({
                ...sample,
                securityProtocol:
                    "invalid" as WifiFingerprintInput["securityProtocol"],
            }),
        ).toThrow("Protokol keamanan tidak valid.");
    });
});