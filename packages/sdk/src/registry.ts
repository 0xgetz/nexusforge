import type { PluginManifest } from "./types.js";

interface RegistryEntry {
  manifest: PluginManifest;
  downloads: number;
  rating: number;
  publishedAt: string;
  updatedAt: string;
  installCommand: string;
}

export class PluginRegistry {
  private baseUrl: string;

  constructor(baseUrl = "https://registry.nexusforge.dev") {
    this.baseUrl = baseUrl;
  }

  async search(query: string): Promise<RegistryEntry[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/plugins/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) return [];
      return await response.json() as RegistryEntry[];
    } catch {
      return this.getBuiltinPlugins().filter(
        (p) =>
          p.manifest.name.includes(query) ||
          p.manifest.description.includes(query)
      );
    }
  }

  async getPlugin(name: string): Promise<RegistryEntry | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/plugins/${encodeURIComponent(name)}`);
      if (!response.ok) return null;
      return await response.json() as RegistryEntry;
    } catch {
      return this.getBuiltinPlugins().find((p) => p.manifest.name === name) || null;
    }
  }

  async listCategories(): Promise<string[]> {
    return [
      "code-generation",
      "security",
      "testing",
      "deployment",
      "monitoring",
      "documentation",
      "formatting",
      "database",
      "api",
      "ui",
    ];
  }

  getBuiltinPlugins(): RegistryEntry[] {
    return [
      {
        manifest: {
          name: "nexusforge-plugin-prettier",
          version: "0.1.0",
          description: "Auto-format code on save using Prettier",
          keywords: ["formatting", "prettier", "code-style"],
          permissions: ["fs:read", "fs:write"],
        },
        downloads: 0,
        rating: 0,
        publishedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        installCommand: "npm install nexusforge-plugin-prettier",
      },
      {
        manifest: {
          name: "nexusforge-plugin-docker",
          version: "0.1.0",
          description: "Generate Dockerfiles and compose configs with AI",
          keywords: ["docker", "containers", "deployment"],
          permissions: ["fs:read", "fs:write", "exec"],
        },
        downloads: 0,
        rating: 0,
        publishedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        installCommand: "npm install nexusforge-plugin-docker",
      },
      {
        manifest: {
          name: "nexusforge-plugin-test-gen",
          version: "0.1.0",
          description: "AI-powered test generation for your codebase",
          keywords: ["testing", "test-generation", "ai"],
          permissions: ["fs:read", "fs:write"],
        },
        downloads: 0,
        rating: 0,
        publishedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        installCommand: "npm install nexusforge-plugin-test-gen",
      },
      {
        manifest: {
          name: "nexusforge-plugin-docs",
          version: "0.1.0",
          description: "Auto-generate documentation from code comments and types",
          keywords: ["documentation", "jsdoc", "typedoc"],
          permissions: ["fs:read", "fs:write"],
        },
        downloads: 0,
        rating: 0,
        publishedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        installCommand: "npm install nexusforge-plugin-docs",
      },
    ];
  }
}

export const globalRegistry = new PluginRegistry();