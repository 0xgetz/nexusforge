import { readFileSync, existsSync } from "fs";
import { join, basename } from "path";
import { batchQueryOSV } from "./cve.js";
import type { ScanResult, ScanOptions, DependencyInfo, ScanSummary, Vulnerability } from "./types.js";

export async function scan(options: ScanOptions): Promise<ScanResult> {
  const startTime = Date.now();
  const ecosystem = detectEcosystem(options.path);
  const projectName = basename(options.path);

  let dependencies: DependencyInfo[] = [];

  switch (ecosystem) {
    case "npm":
      dependencies = await scanNpm(options);
      break;
    case "pip":
      dependencies = await scanPip(options);
      break;
    case "cargo":
      dependencies = await scanCargo(options);
      break;
    case "go":
      dependencies = await scanGo(options);
      break;
    default:
      throw new Error(`No supported package manager found in ${options.path}`);
  }

  const allVulnerabilities = dependencies.flatMap((d) => d.vulnerabilities);
  const summary = calculateSummary(allVulnerabilities);

  return {
    projectName,
    projectPath: options.path,
    timestamp: new Date().toISOString(),
    duration: Date.now() - startTime,
    ecosystem,
    totalDependencies: dependencies.length,
    vulnerablePackages: dependencies.filter((d) => d.vulnerabilities.length > 0).length,
    vulnerabilities: allVulnerabilities,
    dependencies,
    summary,
  };
}

function detectEcosystem(path: string): ScanResult["ecosystem"] {
  if (existsSync(join(path, "package.json"))) return "npm";
  if (existsSync(join(path, "requirements.txt")) || existsSync(join(path, "pyproject.toml"))) return "pip";
  if (existsSync(join(path, "Cargo.toml"))) return "cargo";
  if (existsSync(join(path, "go.mod"))) return "go";
  return "unknown";
}

async function scanNpm(options: ScanOptions): Promise<DependencyInfo[]> {
  const pkgPath = join(options.path, "package.json");
  if (!existsSync(pkgPath)) return [];

  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
  const deps: Record<string, string> = { ...(pkg.dependencies || {}) };

  if (options.includeDev) {
    Object.assign(deps, pkg.devDependencies || {});
  }

  const lockPath = join(options.path, "package-lock.json");
  const bunLockPath = join(options.path, "bun.lock");
  let resolvedVersions: Record<string, string> = {};

  if (existsSync(lockPath)) {
    try {
      const lock = JSON.parse(readFileSync(lockPath, "utf-8"));
      if (lock.packages) {
        for (const [key, value] of Object.entries(lock.packages)) {
          const name = key.replace("node_modules/", "");
          if (name && (value as { version?: string }).version) {
            resolvedVersions[name] = (value as { version: string }).version;
          }
        }
      }
    } catch {
      // ignore lock parse errors
    }
  }

  const packages = Object.entries(deps).map(([name, versionRange]) => ({
    name,
    version: resolvedVersions[name] || cleanVersion(versionRange),
  }));

  let vulnMap = new Map<string, Vulnerability[]>();
  if (!options.offline) {
    vulnMap = await batchQueryOSV(packages, "npm");
  }

  const latestVersions = options.offline ? {} : await fetchLatestVersions(packages.map(p => p.name));

  return packages.map((pkg) => ({
    name: pkg.name,
    version: pkg.version,
    latest: latestVersions[pkg.name],
    outdated: !!latestVersions[pkg.name] && latestVersions[pkg.name] !== pkg.version,
    vulnerabilities: vulnMap.get(pkg.name) || [],
  }));
}

async function scanPip(options: ScanOptions): Promise<DependencyInfo[]> {
  const reqPath = join(options.path, "requirements.txt");
  if (!existsSync(reqPath)) return [];

  const content = readFileSync(reqPath, "utf-8");
  const packages = content
    .split("\n")
    .filter((line) => line.trim() && !line.startsWith("#") && !line.startsWith("-"))
    .map((line) => {
      const match = line.match(/^([a-zA-Z0-9_-]+)\s*(?:[>=<~!]+\s*)?([\d.]+)?/);
      return match ? { name: match[1], version: match[2] || "0.0.0" } : null;
    })
    .filter((p): p is { name: string; version: string } => p !== null);

  let vulnMap = new Map<string, Vulnerability[]>();
  if (!options.offline) {
    vulnMap = await batchQueryOSV(packages, "PyPI");
  }

  return packages.map((pkg) => ({
    name: pkg.name,
    version: pkg.version,
    outdated: false,
    vulnerabilities: vulnMap.get(pkg.name) || [],
  }));
}

async function scanCargo(options: ScanOptions): Promise<DependencyInfo[]> {
  const cargoPath = join(options.path, "Cargo.toml");
  if (!existsSync(cargoPath)) return [];

  const content = readFileSync(cargoPath, "utf-8");
  const packages: Array<{ name: string; version: string }> = [];

  const depSection = content.match(/\[dependencies\]([\s\S]*?)(?:\[|$)/);
  if (depSection) {
    const lines = depSection[1].split("\n");
    for (const line of lines) {
      const match = line.match(/^(\w[\w-]*)\s*=\s*(?:"([^"]+)"|.*version\s*=\s*"([^"]+)")/);
      if (match) {
        packages.push({ name: match[1], version: cleanVersion(match[2] || match[3]) });
      }
    }
  }

  let vulnMap = new Map<string, Vulnerability[]>();
  if (!options.offline) {
    vulnMap = await batchQueryOSV(packages, "crates.io");
  }

  return packages.map((pkg) => ({
    name: pkg.name,
    version: pkg.version,
    outdated: false,
    vulnerabilities: vulnMap.get(pkg.name) || [],
  }));
}

async function scanGo(options: ScanOptions): Promise<DependencyInfo[]> {
  const goModPath = join(options.path, "go.mod");
  if (!existsSync(goModPath)) return [];

  const content = readFileSync(goModPath, "utf-8");
  const packages: Array<{ name: string; version: string }> = [];

  const lines = content.split("\n");
  let inRequire = false;

  for (const line of lines) {
    if (line.trim() === "require (") {
      inRequire = true;
      continue;
    }
    if (line.trim() === ")") {
      inRequire = false;
      continue;
    }

    if (inRequire) {
      const match = line.trim().match(/^(\S+)\s+(v[\d.]+)/);
      if (match) {
        packages.push({ name: match[1], version: match[2].replace("v", "") });
      }
    }
  }

  let vulnMap = new Map<string, Vulnerability[]>();
  if (!options.offline) {
    vulnMap = await batchQueryOSV(packages, "Go");
  }

  return packages.map((pkg) => ({
    name: pkg.name,
    version: pkg.version,
    outdated: false,
    vulnerabilities: vulnMap.get(pkg.name) || [],
  }));
}

function cleanVersion(version: string): string {
  return version.replace(/^[\^~>=<]+/, "").trim();
}

async function fetchLatestVersions(
  packageNames: string[]
): Promise<Record<string, string>> {
  const results: Record<string, string> = {};

  const promises = packageNames.slice(0, 50).map(async (name) => {
    try {
      const response = await fetch(`https://registry.npmjs.org/${name}/latest`, {
        signal: AbortSignal.timeout(5000),
      });
      if (response.ok) {
        const data = await response.json() as { version: string };
        results[name] = data.version;
      }
    } catch {
      // skip
    }
  });

  await Promise.allSettled(promises);
  return results;
}

function calculateSummary(vulnerabilities: Vulnerability[]): ScanSummary {
  const summary: ScanSummary = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
    total: vulnerabilities.length,
    score: 100,
  };

  for (const vuln of vulnerabilities) {
    summary[vuln.severity]++;
  }

  summary.score = Math.max(
    0,
    100 - summary.critical * 25 - summary.high * 15 - summary.medium * 5 - summary.low * 1
  );

  return summary;
}

export { detectEcosystem };