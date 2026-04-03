import { readFileSync } from "fs";
import { resolve, relative, dirname, basename } from "path";
import { glob } from "glob";
import type { ArchitectureAnalysis, ModuleInfo, DependencyEdge, CircularDependency, LayerViolation, CouplingMetric } from "./types.js";

const IGNORE = ["node_modules", "dist", "build", ".next", "__pycache__", ".git", "coverage", "vendor"];

export async function analyzeArchitecture(projectPath: string): Promise<ArchitectureAnalysis> {
  const absPath = resolve(projectPath);
  const files = await glob("**/*.{ts,tsx,js,jsx}", {
    cwd: absPath, absolute: true,
    ignore: IGNORE.map((d) => `**/${d}/**`),
  });

  const modules = buildModuleMap(files, absPath);
  const dependencies = extractDependencies(files, absPath);
  const circularDeps = findCircularDependencies(dependencies);
  const layerViolations = detectLayerViolations(dependencies);
  const coupling = calculateCoupling(modules, dependencies);

  return {
    projectPath: absPath, timestamp: new Date().toISOString(),
    modules, dependencies, circularDeps, layerViolations, coupling,
  };
}

function buildModuleMap(files: string[], root: string): ModuleInfo[] {
  const moduleMap = new Map<string, { files: number; lines: number; exports: number; imports: number }>();

  for (const file of files) {
    const rel = relative(root, file);
    const parts = rel.split("/");
    const moduleName = parts.length > 1 ? parts[0] : "(root)";

    if (!moduleMap.has(moduleName)) {
      moduleMap.set(moduleName, { files: 0, lines: 0, exports: 0, imports: 0 });
    }

    const mod = moduleMap.get(moduleName)!;
    mod.files++;

    try {
      const content = readFileSync(file, "utf-8");
      mod.lines += content.split("\n").length;
      const exportMatches = content.match(/\bexport\b/g);
      if (exportMatches) mod.exports += exportMatches.length;
      const importMatches = content.match(/\bimport\b/g);
      if (importMatches) mod.imports += importMatches.length;
    } catch { /* skip */ }
  }

  return Array.from(moduleMap.entries()).map(([name, data]) => ({
    name, path: name, ...data,
  }));
}

function extractDependencies(files: string[], root: string): DependencyEdge[] {
  const edges: DependencyEdge[] = [];
  const edgeSet = new Set<string>();

  for (const file of files) {
    try {
      const content = readFileSync(file, "utf-8");
      const rel = relative(root, file);
      const fromModule = rel.split("/")[0] || "(root)";

      const importPatterns = [
        /import\s+.*?from\s+["']([^"']+)["']/g,
        /import\s*\(\s*["']([^"']+)["']\s*\)/g,
        /require\s*\(\s*["']([^"']+)["']\s*\)/g,
      ];

      for (const pattern of importPatterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          const importPath = match[1];
          if (importPath.startsWith(".")) {
            const resolvedDir = dirname(file);
            const targetRel = relative(root, resolve(resolvedDir, importPath));
            const toModule = targetRel.split("/")[0] || "(root)";

            if (fromModule !== toModule) {
              const key = `${fromModule}->${toModule}`;
              if (!edgeSet.has(key)) {
                edgeSet.add(key);
                edges.push({ from: fromModule, to: toModule, weight: 1, type: "import" });
              } else {
                const edge = edges.find((e) => e.from === fromModule && e.to === toModule);
                if (edge) edge.weight++;
              }
            }
          }
        }
      }
    } catch { /* skip */ }
  }

  return edges;
}

function findCircularDependencies(edges: DependencyEdge[]): CircularDependency[] {
  const graph = new Map<string, string[]>();

  for (const edge of edges) {
    if (!graph.has(edge.from)) graph.set(edge.from, []);
    graph.get(edge.from)!.push(edge.to);
  }

  const cycles: CircularDependency[] = [];
  const visited = new Set<string>();
  const stack = new Set<string>();

  function dfs(node: string, path: string[]): void {
    if (stack.has(node)) {
      const cycleStart = path.indexOf(node);
      if (cycleStart >= 0) {
        const cycle = path.slice(cycleStart);
        cycle.push(node);
        cycles.push({
          cycle,
          severity: cycle.length > 3 ? "error" : "warning",
        });
      }
      return;
    }
    if (visited.has(node)) return;

    visited.add(node);
    stack.add(node);
    path.push(node);

    for (const neighbor of graph.get(node) || []) {
      dfs(neighbor, [...path]);
    }

    stack.delete(node);
  }

  for (const node of graph.keys()) {
    dfs(node, []);
  }

  return cycles;
}

function detectLayerViolations(edges: DependencyEdge[]): LayerViolation[] {
  const violations: LayerViolation[] = [];
  const layerOrder: Record<string, number> = {
    "ui": 0, "components": 0, "pages": 0, "views": 0,
    "controllers": 1, "routes": 1, "api": 1, "handlers": 1,
    "services": 2, "use-cases": 2, "usecases": 2,
    "domain": 3, "models": 3, "entities": 3,
    "infrastructure": 4, "repositories": 4, "database": 4, "db": 4,
    "utils": 5, "lib": 5, "helpers": 5, "shared": 5,
  };

  for (const edge of edges) {
    const fromLayer = layerOrder[edge.from.toLowerCase()];
    const toLayer = layerOrder[edge.to.toLowerCase()];

    if (fromLayer !== undefined && toLayer !== undefined && fromLayer > toLayer) {
      violations.push({
        from: edge.from, to: edge.to,
        fromLayer: edge.from, toLayer: edge.to,
        message: `Lower layer "${edge.from}" depends on upper layer "${edge.to}"`,
      });
    }
  }

  return violations;
}

function calculateCoupling(modules: ModuleInfo[], edges: DependencyEdge[]): CouplingMetric[] {
  return modules.map((mod) => {
    const afferent = edges.filter((e) => e.to === mod.name).reduce((s, e) => s + e.weight, 0);
    const efferent = edges.filter((e) => e.from === mod.name).reduce((s, e) => s + e.weight, 0);
    const total = afferent + efferent;
    const instability = total > 0 ? efferent / total : 0;
    const abstractness = mod.exports > 0 ? Math.min(1, mod.exports / (mod.lines / 50)) : 0;

    return {
      module: mod.name,
      afferentCoupling: afferent,
      efferentCoupling: efferent,
      instability: Math.round(instability * 100) / 100,
      abstractness: Math.round(abstractness * 100) / 100,
    };
  });
}
