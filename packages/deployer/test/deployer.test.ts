import { test, expect } from "bun:test";
import { mkdtempSync, writeFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { detectProject, getRecommendedProvider } from "../src/detector.js";
import { generateDockerfile, generateDockerCompose } from "../src/builder.js";

function withProject(files: Record<string, string>, fn: (dir: string) => void) {
  const dir = mkdtempSync(join(tmpdir(), "nxf-deploy-"));
  try {
    for (const [name, content] of Object.entries(files)) writeFileSync(join(dir, name), content);
    fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("detectProject identifies a Next.js app", () => {
  withProject({ "package.json": JSON.stringify({ dependencies: { next: "^16.0.0" }, scripts: { build: "next build" } }) }, (dir) => {
    const config = detectProject(dir);
    expect(config.type).toBe("nextjs");
    expect(config.runtime).toBe("node");
    expect(config.outputDir).toBe(".next");
    expect(config.port).toBe(3000);
  });
});

test("detectProject identifies a FastAPI app", () => {
  withProject({ "requirements.txt": "fastapi==0.110.0\nuvicorn" }, (dir) => {
    const config = detectProject(dir);
    expect(config.type).toBe("fastapi");
    expect(config.runtime).toBe("python");
  });
});

test("detectProject identifies Go and Rust", () => {
  withProject({ "go.mod": "module x\n\ngo 1.22\n" }, (dir) => expect(detectProject(dir).type).toBe("go"));
  withProject({ "Cargo.toml": "[package]\nname='x'\n" }, (dir) => expect(detectProject(dir).type).toBe("rust"));
});

test("getRecommendedProvider maps project type to a provider", () => {
  withProject({ "package.json": JSON.stringify({ dependencies: { next: "^16.0.0" } }) }, (dir) => {
    expect(getRecommendedProvider(detectProject(dir))).toBe("vercel");
  });
  withProject({ "go.mod": "module x\ngo 1.22\n" }, (dir) => {
    expect(getRecommendedProvider(detectProject(dir))).toBe("docker");
  });
});

test("generateDockerfile produces a Dockerfile for Next.js", () => {
  withProject({ "package.json": JSON.stringify({ dependencies: { next: "^16.0.0" }, scripts: { build: "next build" } }) }, (dir) => {
    const config = detectProject(dir);
    const file = generateDockerfile(config, dir);
    expect(file.content).toContain("FROM");
    expect(file.path.toLowerCase()).toContain("dockerfile");
  });
});

test("generateDockerCompose emits a services block", () => {
  withProject({ "package.json": JSON.stringify({ dependencies: { next: "^16.0.0" } }) }, (dir) => {
    const config = detectProject(dir);
    expect(generateDockerCompose(config).content).toContain("services:");
  });
});
