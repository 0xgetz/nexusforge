import { describe, test, expect } from "bun:test";
import { getRecommendedProvider } from "../packages/deployer/src/detector.js";
import type { ProjectConfig } from "../packages/deployer/src/types.js";

function makeConfig(type: ProjectConfig["type"]): ProjectConfig {
  return {
    type,
    runtime: "node",
    runtimeVersion: "22",
    framework: type,
    buildCommand: "build",
    startCommand: "start",
    outputDir: "dist",
    port: 3000,
    envVars: [],
    hasDatabase: false,
    hasDocker: false,
    hasCICD: false,
    packageManager: "npm",
  };
}

describe("getRecommendedProvider", () => {
  test("recommends vercel for Next.js", () => {
    expect(getRecommendedProvider(makeConfig("nextjs"))).toBe("vercel");
  });

  test("recommends netlify for static frontends", () => {
    expect(getRecommendedProvider(makeConfig("react"))).toBe("netlify");
    expect(getRecommendedProvider(makeConfig("vue"))).toBe("netlify");
  });

  test("recommends docker for compiled backends", () => {
    expect(getRecommendedProvider(makeConfig("go"))).toBe("docker");
    expect(getRecommendedProvider(makeConfig("rust"))).toBe("docker");
  });
});
