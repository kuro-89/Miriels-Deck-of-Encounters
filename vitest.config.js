/**
 * Vitest-Konfiguration für reine Logik- und Inhaltsprüfungen.
 * Produktivcode wird nicht durch Test-Hooks verändert.
 */
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/unit/**/*.test.js"],
    environment: "node",
    clearMocks: true,
    reporters: ["default"]
  }
});
