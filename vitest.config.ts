import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "."),
      // Stub 'server-only' agar lib/crypto.ts dapat diimpor di Vitest.
      // Next.js menangani 'server-only' secara internal di lingkungan build;
      // di sini kita arahkan ke modul stub kosong yang tidak melakukan apa-apa.
      "server-only": path.resolve(
        import.meta.dirname,
        "tests/__mocks__/server-only.ts",
      ),
    },
  },
  test: {
    // Jalankan setiap file test dalam proses Node.js terisolasi,
    // sehingga vi.resetModules() benar-benar mengosongkan cache modul.
    pool: "forks",
    globals: false,
    environment: "node",
  },
});
