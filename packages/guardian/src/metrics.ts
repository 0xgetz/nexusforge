import { readFileSync } from "fs";
import { resolve, extname, relative } from "path";
import { glob } from "glob";
import type { QualityMetrics, TechnicalDebt, DuplicationReport, ComplexityReport, LOCReport, MetricGrade, DebtItem, ComplexityHotspot, DuplicateBlock } from "./types.js";

const IGNORE = ["node_modules", "dist", "build", ".next", "__pycache__", ".git", "coverage", "vendor"];

export async function analyzeMetrics(projectPath: string): Promise<QualityMetrics> {
  const absPath = resolve(projectPath);
  const files = await glob("**/*.{ts,tsx,js,jsx,py,go,rs,java}", {
    cwd: absPath, absolute: true,
    ignore: IGNORE.map((d) => `**/${d}/**`),
  });

  const fileContents: { file: string; content: string; ext: string }[] = [];
  for (const f of files) {
    try {
      fileContents.push({ file: relative(absPath, f), content: readFileSync(f, "utf-8"), ext: extname(f) });
    } catch { /* skip */ }
  }

  const loc = analyzeLOC(fileContents);
  const complexity = analyzeComplexity(fileContents);
  const duplication = analyzeDuplication(fileContents);
  const debt = analyzeTechnicalDebt(fileContents, complexity, duplication);
  const mi = calculateMaintainabilityIndex(loc, complexity, duplication);
  const grade = miToGrade(mi);

  return {
    projectPath: absPath, timestamp: new Date().toISOString(),
    maintainabilityIndex: mi, technicalDebt: debt,
    codeDuplication: duplication, complexity, linesOfCode: loc, grade,
  };
}

function analyzeLOC(files: { file: string; content: string; ext: string }[]): LOCReport {
  let total = 0, source = 0, comments = 0, blank = 0;
  const byLanguage: Record<string, number> = {};
  const langMap: Record<string, string> = {
    ".ts": "TypeScript", ".tsx": "TypeScript", ".js": "JavaScript", ".jsx": "JavaScript",
    ".py": "Python", ".go": "Go", ".rs": "Rust", ".java": "Java",
  };

  for (const { content, ext } of files) {
    const lines = content.split("\n");
    const lang = langMap[ext] || "Other";
    for (const line of lines) {
      total++;
      const trimmed = line.trim();
      if (trimmed === "") blank++;
      else if (trimmed.startsWith("//") || trimmed.startsWith("#") || trimmed.startsWith("/*") || trimmed.startsWith("*")) comments++;
      else source++;
    }
    byLanguage[lang] = (byLanguage[lang] || 0) + lines.length;
  }

  return { total, source, comments, blank, byLanguage };
}

function analyzeComplexity(files: { file: string; content: string }[]): ComplexityReport {
  const hotspots: ComplexityHotspot[] = [];
  let totalComplexity = 0;
  let fnCount = 0;
  let maxComplexity = 0;

  for (const { file, content } of files) {
    const lines = content.split("\n");
    const funcPattern = /(?:function|def|func|fn)\s+(\w+)/;

    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(funcPattern);
      if (match) {
        let complexity = 1;
        const body = extractFuncBody(lines, i);
        const patterns = [/\bif\b/g, /\belse\b/g, /\bfor\b/g, /\bwhile\b/g, /\bswitch\b/g, /\bcatch\b/g, /\bcase\b/g, /&&/g, /\|\|/g];
        for (const p of patterns) {
          const m = body.match(p);
          if (m) complexity += m.length;
        }

        totalComplexity += complexity;
        fnCount++;
        if (complexity > maxComplexity) maxComplexity = complexity;

        if (complexity > 5) {
          hotspots.push({
            file, function: match[1], line: i + 1, complexity,
            risk: complexity > 20 ? "critical" : complexity > 15 ? "high" : complexity > 10 ? "medium" : "low",
          });
        }
      }
    }
  }

  return {
    average: fnCount > 0 ? Math.round((totalComplexity / fnCount) * 10) / 10 : 0,
    max: maxComplexity,
    hotspots: hotspots.sort((a, b) => b.complexity - a.complexity).slice(0, 20),
  };
}

function analyzeDuplication(files: { file: string; content: string }[]): DuplicationReport {
  const duplicates: DuplicateBlock[] = [];
  const MIN_LINES = 6;
  let totalDuplicatedLines = 0;
  let totalLines = 0;

  const fileLines = files.map(({ file, content }) => {
    const lines = content.split("\n").map((l) => l.trim()).filter((l) => l.length > 3);
    totalLines += lines.length;
    return { file, lines };
  });

  for (let i = 0; i < fileLines.length; i++) {
    for (let j = i; j < fileLines.length; j++) {
      const a = fileLines[i];
      const b = fileLines[j];

      for (let la = 0; la < a.lines.length - MIN_LINES; la++) {
        for (let lb = (i === j ? la + MIN_LINES : 0); lb < b.lines.length - MIN_LINES; lb++) {
          let matchLen = 0;
          while (la + matchLen < a.lines.length && lb + matchLen < b.lines.length && a.lines[la + matchLen] === b.lines[lb + matchLen]) {
            matchLen++;
          }
          if (matchLen >= MIN_LINES) {
            duplicates.push({
              fileA: a.file, fileB: b.file,
              lineA: la + 1, lineB: lb + 1,
              lines: matchLen, similarity: 1.0,
            });
            totalDuplicatedLines += matchLen;
            lb += matchLen;
          }
        }
        if (duplicates.length > 50) break;
      }
      if (duplicates.length > 50) break;
    }
    if (duplicates.length > 50) break;
  }

  return {
    percentage: totalLines > 0 ? Math.round((totalDuplicatedLines / totalLines) * 1000) / 10 : 0,
    duplicates: duplicates.slice(0, 20),
    totalDuplicatedLines,
  };
}

function analyzeTechnicalDebt(
  files: { file: string; content: string }[],
  complexity: ComplexityReport,
  duplication: DuplicationReport
): TechnicalDebt {
  const issues: DebtItem[] = [];
  let totalHours = 0;

  for (const { file, content } of files) {
    const lines = content.split("\n");
    if (lines.length > 400) {
      const hours = (lines.length - 400) * 0.01;
      totalHours += hours;
      issues.push({ file, type: "large-file", description: `${lines.length} lines`, estimatedHours: Math.round(hours * 10) / 10 });
    }
  }

  for (const hs of complexity.hotspots) {
    if (hs.complexity > 10) {
      const hours = (hs.complexity - 10) * 0.3;
      totalHours += hours;
      issues.push({ file: hs.file, type: "complexity", description: `${hs.function}: complexity ${hs.complexity}`, estimatedHours: Math.round(hours * 10) / 10 });
    }
  }

  if (duplication.percentage > 5) {
    const hours = duplication.totalDuplicatedLines * 0.02;
    totalHours += hours;
    issues.push({ file: "(project)", type: "duplication", description: `${duplication.percentage}% duplicated`, estimatedHours: Math.round(hours * 10) / 10 });
  }

  const rating: MetricGrade = totalHours <= 4 ? "A" : totalHours <= 16 ? "B" : totalHours <= 40 ? "C" : totalHours <= 80 ? "D" : "F";

  return { totalHours: Math.round(totalHours * 10) / 10, rating, issues: issues.sort((a, b) => b.estimatedHours - a.estimatedHours) };
}

function calculateMaintainabilityIndex(loc: LOCReport, complexity: ComplexityReport, duplication: DuplicationReport): number {
  const halsteadVolume = Math.max(1, Math.log2(loc.source));
  const avgComplexity = complexity.average;
  const commentRatio = loc.total > 0 ? loc.comments / loc.total : 0;

  let mi = 171 - 5.2 * Math.log(halsteadVolume) - 0.23 * avgComplexity - 16.2 * Math.log(Math.max(1, loc.source));
  mi += 50 * Math.sin(Math.sqrt(2.4 * commentRatio));
  mi -= duplication.percentage * 0.5;
  mi = Math.max(0, Math.min(100, (mi * 100) / 171));

  return Math.round(mi * 10) / 10;
}

function miToGrade(mi: number): MetricGrade {
  if (mi >= 80) return "A";
  if (mi >= 60) return "B";
  if (mi >= 40) return "C";
  if (mi >= 20) return "D";
  return "F";
}

function extractFuncBody(lines: string[], start: number): string {
  let depth = 0; let started = false;
  const body: string[] = [];
  for (let i = start; i < lines.length && i < start + 100; i++) {
    for (const c of lines[i]) { if (c === "{") { depth++; started = true; } if (c === "}") depth--; }
    body.push(lines[i]);
    if (started && depth === 0) break;
  }
  return body.join("\n");
}
