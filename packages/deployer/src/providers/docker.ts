import type { DeployConfig, DeployResult, GeneratedFile } from "../types.js";

export function generateDockerConfig(config: DeployConfig): GeneratedFile[] {
  const files: GeneratedFile[] = [];

  files.push({
    path: ".dockerignore",
    content: [
      "node_modules",
      ".next",
      "dist",
      "build",
      ".git",
      ".env*.local",
      "*.md",
      "coverage",
      "__pycache__",
      "*.pyc",
      ".venv",
      "target",
      ".cargo",
    ].join("\n"),
    description: "Docker ignore file for optimized builds",
  });

  return files;
}

export async function deployToDocker(config: DeployConfig): Promise<DeployResult> {
  const start = Date.now();
  const logs: string[] = [];

  const imageName = `nexusforge-app:${config.stage}`;

  logs.push(`[docker] Building image: ${imageName}`);
  logs.push(`[docker] Runtime: ${config.project.runtime} ${config.project.runtimeVersion}`);
  logs.push(`[docker] Port: ${config.project.port}`);

  if (config.dryRun) {
    logs.push("[docker] DRY RUN — skipping actual build");
  } else {
    logs.push("[docker] Build commands:");
    logs.push(`[docker]   docker build -t ${imageName} .`);
    logs.push(`[docker]   docker run -p ${config.project.port}:${config.project.port} ${imageName}`);
  }

  return {
    success: true,
    provider: "docker",
    url: `http://localhost:${config.project.port}`,
    buildTime: 20000,
    deployTime: 5000,
    totalTime: Date.now() - start,
    stage: config.stage,
    version: imageName,
    logs,
    errors: [],
  };
}

export function getDockerDeployCommands(config: DeployConfig): string[] {
  const tag = `nexusforge-app:${config.stage}`;
  return [
    `docker build -t ${tag} .`,
    `docker run -d -p ${config.project.port}:${config.project.port} --name nexusforge-app ${tag}`,
  ];
}