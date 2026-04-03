import { readFileSync } from "fs";
import { resolve, relative, extname } from "path";
import { glob } from "glob";

const IGNORE = ["node_modules", "dist", "build", ".next", "__pycache__", ".git", "coverage", "vendor"];

export interface CyclomaticResult {
  file: string;
  functionName: string;
  line: number;
  cyclomatic: number;
  cognitive: number;
  linesOfCode: number;
  params: number;
  risk: "low" | "moderate" | "high" | "very-high";
}

export interface ComplexityOverview {
  projectPath: string;
  timestamp: string;
  totalFunctions: number;
  avgCyclomatic: number;
  avgCognitive: number;
  maxCyclomatic: CyclomaticResult | null;
  maxCognitive: CyclomaticResult | null;
  distribution: { low: number; moderate: number; high: number; veryHigh: number };
  hotspots: CyclomaticResult[];
}

export async function analyzeComplexity(projectPath: string): Promise<ComplexityOverview> {
  const absPath = resolve(projectPath);
  const files = await glob("**/*.{ts,tsx,js,jsx,py,go,rs,java}", {
    cwd: absPath,
    absolute: true,
    ignore: IGNORE.map((d) => `**/${d}/**`),
  });

  const results: CyclomaticResult[] = [];

  for (const file of files) {
    try {
      const content = readFileSync(file, "utf-8");
      const ext = extname(file);
      const relPath = relative(absPath, file);
      const functions = extractFunctionComplexity(content, relPath, ext);
      results.push(...functions);
    } catch { /* skip */ }
  }

  const totalFunctions = results.length;
  const avgCyclomatic = totalFunctions > 0
    ? Math.round((results.reduce((s, r) => s + r.cyclomatic, 0) / totalFunctions) * 10) / 10
    : 0;
  const avgCognitive = totalFunctions > 0
    ? Math.round((results.reduce((s, r) => s + r.cognitive, 0) / totalFunctions) * 10) / 10
    : 0;

  const sorted = [...results].sort((a, b) => b.cyclomatic - a.cyclomatic);
  const sortedCog = [...results].sort((a, b) => b.cognitive - a.cognitive);

  const distribution = {
    low: results.filter((r) => r.risk === "low").length,
    moderate: results.filter((r) => r.risk === "moderate").length,
    high: results.filter((r) => r.risk === "high").length,
    veryHigh: results.filter((r) => r.risk === "very-high").length,
  };

  return {
    projectPath: absPath,
    timestamp: new Date().toISOString(),
    totalFunctions,
    avgCyclomatic,
    avgCognitive,
    maxCyclomatic: sorted[0] || null,
    maxCognitive: sortedCog[0] || null,
    distribution,
    hotspots: sorted.slice(0, 20),
  };
}

function extractFunctionComplexity(content: string, file: string, ext: string): CyclomaticResult[] {
  const lines = content.split("\n");
  const results: CyclomaticResult[] = [];
  const patterns = getFuncPatterns(ext);

  for (let i = 0; i < lines.length; i++) {
    for (const pattern of patterns) {
      const match = lines[i].match(pattern);
      if (match) {
        const funcName = match[1];
        if (isKeyword(funcName)) continue;

        const body = extractBody(lines, i, ext);
        const loc = body.split("\n").length;
        const cyclomatic = calculateCyclomatic(body);
        const cognitive = calculateCognitive(body);
        const params = countParams(lines[i]);

        results.push({
          file,
          functionName: funcName,
          line: i + 1,
          cyclomatic,
          cognitive,
          linesOfCode: loc,
          params,
          risk: getRisk(cyclomatic, cognitive),
        });
        break;
      }
    }
  }

  return results;
}

function getFuncPatterns(ext: string): RegExp[] {
  if ([".ts", ".tsx", ".js", ".jsx"].includes(ext)) {
    return [
      /(?:export\s+)?(?:async\s+)?function\s+(\w+)/,
      /(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?(?:\([^)]*\)|[^=])\s*=>/,
      /^\s+(?:async\s+)?(\w+)\s*\([^)]*\)\s*(?::\s*\S+)?\s*\{/,
    ];
  }
  if (ext === ".py") return [/(?:async\s+)?def\s+(\w+)/];
  if (ext === ".go") return [/func\s+(?:\([^)]+\)\s+)?(\w+)/];
  if (ext === ".rs") return [/(?:pub\s+)?(?:async\s+)?fn\s+(\w+)/];
  if (ext === ".java") return [/(?:public|private|protected)?\s*(?:static\s+)?(?:final\s+)?\w+\s+(\w+)\s*\(/];
  return [];
}

function isKeyword(name: string): boolean {
  return ["if", "else", "for", "while", "switch", "catch", "return", "class", "import", "export"].includes(name);
}

function calculateCyclomatic(body: string): number {
  let cc = 1;
  const matchers: RegExp[] = [
    /\bif\b/g, /\belse\s+if\b/g, /\bfor\b/g, /\bwhile\b/g,
    /\bcase\b/g, /\bcatch\b/g, /&&/g, /\|\|/g, /\?\?/g, /\?[^:?]/g,
  ];

  for (const re of matchers) {
    const m = body.match(re);
    if (m) cc += m.length;
  }

  return cc;
}

function calculateCognitive(body: string): number {
  let score = 0;
  const lines = body.split("\n");
  let nestingLevel = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    if (/\b(if|else\s+if|switch)\b/.test(trimmed)) {
      score += 1 + nestingLevel;
    }
    if (/\b(for|while|do)\b/.test(trimmed)) {
      score += 1 + nestingLevel;
    }
    if (/\bcatch\b/.test(trimmed)) {
      score += 1 + nestingLevel;
    }
    if (/\belse\b/.test(trimmed) && !/else\s+if/.test(trimmed)) {
      score += 1;
    }
    if (/\bbreak\b/.test(trimmed) || /\bcontinue\b/.test(trimmed)) {
      score += 1;
    }

    for (const char of line) {
      if (char === "{") nestingLevel++;
      if (char === "}") nestingLevel = Math.max(0, nestingLevel - 1);
    }
  }

  return score;
}

function countParams(line: string): number {
  const paramMatch = line.match(/\(([^)]*)\)/);
  if (!paramMatch || !paramMatch[1].trim()) return 0;
  return paramMatch[1].split(",").filter((p) => p.trim()).length;
}

function extractBody(lines: string[], start: number, ext: string): string {
  if (ext === ".py") {
    return extractPythonBody(lines, start);
  }
  return extractBracedBody(lines, start);
}

function extractBracedBody(lines: string[], start: number): string {
  let depth = 0;
  let started = false;
  const body: string[] = [];

  for (let i = start; i < lines.length && i < start + 150; i++) {
    for (const c of lines[i]) {
      if (c === "{") { depth++; started = true; }
      if (c === "}") depth--;
    }
    body.push(lines[i]);
    if (started && depth === 0) break;
  }

  return body.join("\n");
}

function extractPythonBody(lines: string[], start: number): string {
  const body: string[] = [lines[start]];
  const baseIndent = lines[start].search(/\S/);

  for (let i = start + 1; i < lines.length && i < start + 150; i++) {
    if (lines[i].trim() === "") { body.push(lines[i]); continue; }
    const indent = lines[i].search(/\S/);
    if (indent <= baseIndent) break;
    body.push(lines[i]);
  }

  return body.join("\n");
}

function getRisk(cyclomatic: number, cognitive: number): "low" | "moderate" | "high" | "very-high" {
  if (cyclomatic > 25 || cognitive > 40) return "very-high";
  if (cyclomatic > 15 || cognitive > 25) return "high";
  if (cyclomatic > 8 || cognitive > 12) return "moderate";
  return "low";
}

export function formatComplexityReport(overview: ComplexityOverview): string {
  const lines: string[] = [];

  lines.push("┌──────────────────────────────────────────────────────────┐");
  lines.push("│              Complexity Analysis Report                   │");
  lines.push("├──────────────────────────────────────────────────────────┤");
  lines.push(`│  Total Functions:     ${overview.totalFunctions}`);
  lines.push(`│  Avg Cyclomatic:      ${overview.avgCyclomatic}  ${overview.avgCyclomatic < 10 ? "✓" : "✗"}`);
  lines.push(`│  Avg Cognitive:       ${overview.avgCognitive}  ${overview.avgCognitive < 15 ? "✓" : "✗"}`);

  if (overview.maxCyclomatic) {
    lines.push(`│  Max Cyclomatic:      ${overview.maxCyclomatic.cyclomatic} → ${overview.maxCyclomatic.file}:${overview.maxCyclomatic.functionName}`);
  }
  if (overview.maxCognitive) {
    lines.push(`│  Max Cognitive:       ${overview.maxCognitive.cognitive} → ${overview.maxCognitive.file}:${overview.maxCognitive.functionName}`);
  }

  lines.push("├──────────────────────────────────────────────────────────┤");
  lines.push("│  Distribution:");
  lines.push(`│    🟢 Low:         ${overview.distribution.low}`);
  lines.push(`│    🟡 Moderate:    ${overview.distribution.moderate}`);
  lines.push(`│    🟠 High:        ${overview.distribution.high}`);
  lines.push(`│    🔴 Very High:   ${overview.distribution.veryHigh}`);

  if (overview.hotspots.length > 0) {
    lines.push("├──────────────────────────────────────────────────────────┤");
    lines.push("│  Top Hotspots:");
    for (const hs of overview.hotspots.slice(0, 10)) {
      lines.push(`│    ${hs.risk === "very-high" ? "🔴" : hs.risk === "high" ? "🟠" : "🟡"} ${hs.file}:${hs.functionName} CC:${hs.cyclomatic} Cog:${hs.cognitive}`);
    }
  }

  lines.push("└──────────────────────────────────────────────────────────┘");
  return lines.join("\n");
}