import { readFileSync } from "fs";
import { resolve, relative, extname, basename } from "path";
import { glob } from "glob";
import type { DocEntry } from "./types.js";

const IGNORE = ["node_modules", "dist", "build", ".next", ".git", "coverage"];

export async function generateDocs(projectPath: string): Promise<DocEntry[]> {
  const absPath = resolve(projectPath);
  const files = await glob("**/*.{ts,tsx,js,jsx}", {
    cwd: absPath, absolute: true,
    ignore: IGNORE.map((d) => `**/${d}/**`),
  });

  const entries: DocEntry[] = [];
  for (const file of files) {
    try {
      const content = readFileSync(file, "utf-8");
      const rel = relative(absPath, file);
      const fileEntries = extractDocEntries(content, rel);
      entries.push(...fileEntries);
    } catch { /* skip */ }
  }

  return entries;
}

function extractDocEntries(content: string, file: string): DocEntry[] {
  const entries: DocEntry[] = [];
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    const funcMatch = trimmed.match(/^(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*(?:<[^>]*>)?\s*\(([^)]*)\)(?:\s*:\s*([^\s{]+))?/);
    if (funcMatch) {
      const jsdoc = extractJSDoc(lines, i);
      entries.push({
        name: funcMatch[1],
        type: "function",
        file, line: i + 1,
        description: jsdoc.description || `Function ${funcMatch[1]}`,
        params: parseParams(funcMatch[2], jsdoc.params),
        returns: funcMatch[3] || jsdoc.returns || "void",
        examples: jsdoc.examples,
        isExported: trimmed.startsWith("export"),
      });
    }

    const constFnMatch = trimmed.match(/^(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?\(([^)]*)\)(?:\s*:\s*([^=]+))?\s*=>/);
    if (constFnMatch) {
      const jsdoc = extractJSDoc(lines, i);
      entries.push({
        name: constFnMatch[1],
        type: "function",
        file, line: i + 1,
        description: jsdoc.description || `Arrow function ${constFnMatch[1]}`,
        params: parseParams(constFnMatch[2], jsdoc.params),
        returns: constFnMatch[3]?.trim() || jsdoc.returns || "unknown",
        isExported: trimmed.startsWith("export"),
      });
    }

    const interfaceMatch = trimmed.match(/^(?:export\s+)?interface\s+(\w+)/);
    if (interfaceMatch) {
      const jsdoc = extractJSDoc(lines, i);
      entries.push({
        name: interfaceMatch[1], type: "interface",
        file, line: i + 1,
        description: jsdoc.description || `Interface ${interfaceMatch[1]}`,
        isExported: trimmed.startsWith("export"),
      });
    }

    const typeMatch = trimmed.match(/^(?:export\s+)?type\s+(\w+)/);
    if (typeMatch) {
      entries.push({
        name: typeMatch[1], type: "type",
        file, line: i + 1,
        description: `Type alias ${typeMatch[1]}`,
        isExported: trimmed.startsWith("export"),
      });
    }

    const classMatch = trimmed.match(/^(?:export\s+)?class\s+(\w+)/);
    if (classMatch) {
      const jsdoc = extractJSDoc(lines, i);
      entries.push({
        name: classMatch[1], type: "class",
        file, line: i + 1,
        description: jsdoc.description || `Class ${classMatch[1]}`,
        isExported: trimmed.startsWith("export"),
      });
    }
  }

  return entries;
}

interface JSDocInfo {
  description: string;
  params: Record<string, string>;
  returns?: string;
  examples: string[];
}

function extractJSDoc(lines: string[], funcLine: number): JSDocInfo {
  const info: JSDocInfo = { description: "", params: {}, examples: [] };
  if (funcLine === 0) return info;

  let commentEnd = funcLine - 1;
  while (commentEnd >= 0 && lines[commentEnd].trim() === "") commentEnd--;
  if (commentEnd < 0 || !lines[commentEnd].trim().endsWith("*/")) return info;

  let commentStart = commentEnd;
  while (commentStart >= 0 && !lines[commentStart].trim().startsWith("/**")) commentStart--;
  if (commentStart < 0) return info;

  const commentLines = lines.slice(commentStart, commentEnd + 1)
    .map((l) => l.trim().replace(/^\/?\*+\/?/, "").trim())
    .filter(Boolean);

  for (const cl of commentLines) {
    const paramMatch = cl.match(/@param\s+(?:\{[^}]+\}\s+)?(\w+)\s*(.*)/);
    if (paramMatch) { info.params[paramMatch[1]] = paramMatch[2]; continue; }
    const returnMatch = cl.match(/@returns?\s+(.*)/);
    if (returnMatch) { info.returns = returnMatch[1]; continue; }
    const exampleMatch = cl.match(/@example\s+(.*)/);
    if (exampleMatch) { info.examples.push(exampleMatch[1]); continue; }
    if (!cl.startsWith("@")) info.description += (info.description ? " " : "") + cl;
  }

  return info;
}

function parseParams(paramsStr: string, jsdocParams: Record<string, string>): DocEntry["params"] {
  if (!paramsStr.trim()) return [];
  return paramsStr.split(",").map((p) => {
    const parts = p.trim().split(":");
    const name = parts[0].replace("?", "").trim();
    const type = parts.slice(1).join(":").trim() || "unknown";
    return { name, type, description: jsdocParams[name] || "" };
  });
}

export function formatDocs(entries: DocEntry[]): string {
  const lines: string[] = ["# API Documentation", "", `> Generated by NexusForge Guardian`, ""];
  const exported = entries.filter((e) => e.isExported);
  const byFile = new Map<string, DocEntry[]>();

  for (const entry of exported) {
    if (!byFile.has(entry.file)) byFile.set(entry.file, []);
    byFile.get(entry.file)!.push(entry);
  }

  for (const [file, fileEntries] of byFile) {
    lines.push(`## ${file}`, "");
    for (const e of fileEntries) {
      lines.push(`### \`${e.name}\` (${e.type})`, "", e.description, "");
      if (e.params && e.params.length > 0) {
        lines.push("**Parameters:**", "");
        for (const p of e.params) {
          lines.push(`- \`${p.name}\`: \`${p.type}\` — ${p.description || "No description"}`);
        }
        lines.push("");
      }
      if (e.returns) lines.push(`**Returns:** \`${e.returns}\``, "");
      lines.push("---", "");
    }
  }

  return lines.join("\n");
}
