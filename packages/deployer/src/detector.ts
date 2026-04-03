import { existsSync, readFileSync } from "fs";
import { join } from "path";
import type { ProjectConfig, ProjectType, Runtime } from "./types.js";

export function detectProject(projectPath: string): ProjectConfig {
  const type = detectProjectType(projectPath);
  const runtime = detectRuntime(type);
  const runtimeVersion = detectRuntimeVersion(projectPath, runtime);
  const packageManager = detectPackageManager(projectPath);
  const framework = detectFramework(projectPath, type);
  const buildCommand = detectBuildCommand(projectPath, packageManager);
  const startCommand = detectStartCommand(projectPath, packageManager, type);
  const outputDir = detectOutputDir(type);
  const port = detectPort(projectPath, type);
  const envVars = detectEnvVars(projectPath);
  const hasDatabase = detectDatabase(projectPath);
  const hasDocker = existsSync(join(projectPath, "Dockerfile")) || existsSync(join(projectPath, "docker-compose.yml"));
  const hasCICD = detectCICD(projectPath);

  return {
    type,
    runtime,
    runtimeVersion,
    framework,
    buildCommand,
    startCommand,
    outputDir,
    port,
    envVars,
    hasDatabase,
    hasDocker,
    hasCICD,
    packageManager,
  };
}

function detectProjectType(path: string): ProjectType {
  const pkgPath = join(path, "package.json");
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

      if (allDeps["next"]) return "nextjs";
      if (allDeps["react"] && !allDeps["next"]) return "react";
      if (allDeps["vue"]) return "vue";
      if (allDeps["svelte"] || allDeps["@sveltejs/kit"]) return "svelte";
      if (allDeps["astro"]) return "astro";
      if (allDeps["express"] || allDeps["fastify"] || allDeps["koa"]) return "express";
    } catch { /* fallthrough */ }
  }

  if (existsSync(join(path, "requirements.txt")) || existsSync(join(path, "pyproject.toml"))) {
    try {
      const reqs = existsSync(join(path, "requirements.txt"))
        ? readFileSync(join(path, "requirements.txt"), "utf-8")
        : "";
      if (reqs.includes("fastapi")) return "fastapi";
      if (reqs.includes("django")) return "django";
      return "fastapi";
    } catch {
      return "fastapi";
    }
  }

  if (existsSync(join(path, "go.mod"))) return "go";
  if (existsSync(join(path, "Cargo.toml"))) return "rust";
  if (existsSync(join(path, "index.html"))) return "static";

  return "static";
}

function detectRuntime(type: ProjectType): Runtime {
  const map: Record<ProjectType, Runtime> = {
    nextjs: "node",
    react: "node",
    vue: "node",
    svelte: "node",
    astro: "node",
    express: "node",
    fastapi: "python",
    django: "python",
    go: "go",
    rust: "rust",
    static: "static",
  };
  return map[type];
}

function detectRuntimeVersion(path: string, runtime: Runtime): string {
  if (runtime === "node") {
    const nvmrc = join(path, ".nvmrc");
    if (existsSync(nvmrc)) {
      return readFileSync(nvmrc, "utf-8").trim();
    }
    const nodeVersion = join(path, ".node-version");
    if (existsSync(nodeVersion)) {
      return readFileSync(nodeVersion, "utf-8").trim();
    }
    return "22";
  }

  if (runtime === "python") {
    const pythonVersion = join(path, ".python-version");
    if (existsSync(pythonVersion)) {
      return readFileSync(pythonVersion, "utf-8").trim();
    }
    return "3.12";
  }

  if (runtime === "go") return "1.22";
  if (runtime === "rust") return "1.78";

  return "latest";
}

function detectPackageManager(path: string): ProjectConfig["packageManager"] {
  if (existsSync(join(path, "bun.lock")) || existsSync(join(path, "bun.lockb"))) return "bun";
  if (existsSync(join(path, "pnpm-lock.yaml"))) return "pnpm";
  if (existsSync(join(path, "yarn.lock"))) return "yarn";
  if (existsSync(join(path, "package-lock.json"))) return "npm";
  if (existsSync(join(path, "requirements.txt")) || existsSync(join(path, "pyproject.toml"))) return "pip";
  if (existsSync(join(path, "go.mod"))) return "go";
  if (existsSync(join(path, "Cargo.toml"))) return "cargo";
  return "npm";
}

function detectFramework(path: string, type: ProjectType): string {
  const pkgPath = join(path, "package.json");
  if (!existsSync(pkgPath)) return type;

  try {
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

    if (allDeps["next"]) return `Next.js ${allDeps["next"].replace("^", "")}`;
    if (allDeps["react"]) return `React ${allDeps["react"].replace("^", "")}`;
    if (allDeps["vue"]) return `Vue ${allDeps["vue"].replace("^", "")}`;
    if (allDeps["svelte"]) return `Svelte ${allDeps["svelte"].replace("^", "")}`;
    if (allDeps["astro"]) return `Astro ${allDeps["astro"].replace("^", "")}`;
  } catch { /* fallthrough */ }

  return type;
}

function detectBuildCommand(path: string, pm: ProjectConfig["packageManager"]): string {
  const pkgPath = join(path, "package.json");
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
      if (pkg.scripts?.build) {
        return `${pm} run build`;
      }
    } catch { /* fallthrough */ }
  }

  if (pm === "pip") return "pip install -r requirements.txt";
  if (pm === "go") return "go build -o app .";
  if (pm === "cargo") return "cargo build --release";
  return `${pm} run build`;
}

function detectStartCommand(path: string, pm: ProjectConfig["packageManager"], type: ProjectType): string {
  const pkgPath = join(path, "package.json");
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
      if (pkg.scripts?.start) return `${pm} run start`;
    } catch { /* fallthrough */ }
  }

  if (type === "fastapi") return "uvicorn main:app --host 0.0.0.0 --port 8080";
  if (type === "django") return "python manage.py runserver 0.0.0.0:8080";
  if (type === "go") return "./app";
  if (type === "rust") return "./target/release/app";
  return `${pm} run start`;
}

function detectOutputDir(type: ProjectType): string {
  const map: Record<ProjectType, string> = {
    nextjs: ".next",
    react: "dist",
    vue: "dist",
    svelte: "build",
    astro: "dist",
    express: "dist",
    fastapi: ".",
    django: ".",
    go: ".",
    rust: "target/release",
    static: ".",
  };
  return map[type];
}

function detectPort(path: string, type: ProjectType): number {
  const envPath = join(path, ".env");
  if (existsSync(envPath)) {
    try {
      const env = readFileSync(envPath, "utf-8");
      const match = env.match(/PORT\s*=\s*(\d+)/);
      if (match) return parseInt(match[1], 10);
    } catch { /* fallthrough */ }
  }

  const portMap: Record<ProjectType, number> = {
    nextjs: 3000,
    react: 3000,
    vue: 3000,
    svelte: 3000,
    astro: 4321,
    express: 3000,
    fastapi: 8000,
    django: 8000,
    go: 8080,
    rust: 8080,
    static: 80,
  };
  return portMap[type];
}

function detectEnvVars(path: string): string[] {
  const envVars: string[] = [];
  const envFiles = [".env", ".env.local", ".env.example"];

  for (const file of envFiles) {
    const envPath = join(path, file);
    if (existsSync(envPath)) {
      try {
        const content = readFileSync(envPath, "utf-8");
        const lines = content.split("\n");
        for (const line of lines) {
          const match = line.match(/^([A-Z_][A-Z0-9_]*)\s*=/);
          if (match) envVars.push(match[1]);
        }
      } catch { /* continue */ }
    }
  }

  return [...new Set(envVars)];
}

function detectDatabase(path: string): boolean {
  const dbIndicators = [
    "prisma/schema.prisma",
    "drizzle.config.ts",
    "typeorm.config.ts",
    "knexfile.js",
    "sequelize.config.js",
    "alembic.ini",
    "migrations/",
  ];

  for (const indicator of dbIndicators) {
    if (existsSync(join(path, indicator))) return true;
  }

  const pkgPath = join(path, "package.json");
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
      const dbPackages = ["prisma", "@prisma/client", "typeorm", "sequelize", "drizzle-orm", "mongoose", "pg", "mysql2"];
      for (const dbPkg of dbPackages) {
        if (allDeps[dbPkg]) return true;
      }
    } catch { /* continue */ }
  }

  return false;
}

function detectCICD(path: string): boolean {
  const ciFiles = [
    ".github/workflows",
    ".gitlab-ci.yml",
    "Jenkinsfile",
    ".circleci/config.yml",
    ".travis.yml",
  ];
  return ciFiles.some((f) => existsSync(join(path, f)));
}

export function getRecommendedProvider(config: ProjectConfig): string {
  if (config.type === "nextjs") return "vercel";
  if (config.type === "react" || config.type === "vue" || config.type === "static") return "netlify";
  if (config.type === "fastapi" || config.type === "django") return "gcp";
  if (config.type === "go" || config.type === "rust") return "docker";
  if (config.type === "express") return "vercel";
  return "docker";
}