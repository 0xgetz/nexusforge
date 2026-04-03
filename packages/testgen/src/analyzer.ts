import { readFileSync } from "fs";
import { basename, extname } from "path";
import { glob } from "glob";
import type { FunctionSignature, ParamInfo } from "./types.js";

const SUPPORTED_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".py", ".go", ".rs", ".java"];

const IGNORE_DIRS = [
  "node_modules", "dist", "build", ".next", "__pycache__",
  ".git", "coverage", ".turbo", ".cache", "vendor",
];

export async function analyzeProject(projectPath: string): Promise<FunctionSignature[]> {
  const pattern = `**/*{${SUPPORTED_EXTENSIONS.join(",")}}`;
  const files = await glob(pattern, {
    cwd: projectPath,
    absolute: true,
    ignore: IGNORE_DIRS.map((d) => `**/${d}/**`),
  });

  const functions: FunctionSignature[] = [];
  for (const file of files) {
    const ext = extname(file);
    if (isTestFile(file)) continue;

    try {
      const content = readFileSync(file, "utf-8");
      const extracted = extractFunctions(content, file, ext);
      functions.push(...extracted);
    } catch {
      // skip unreadable files
    }
  }

  return functions;
}

export async function analyzeFile(filePath: string): Promise<FunctionSignature[]> {
  const ext = extname(filePath);
  const content = readFileSync(filePath, "utf-8");
  return extractFunctions(content, filePath, ext);
}

function isTestFile(file: string): boolean {
  const name = basename(file);
  return (
    name.includes(".test.") ||
    name.includes(".spec.") ||
    name.includes("_test.") ||
    name.startsWith("test_") ||
    file.includes("__tests__") ||
    file.includes("/tests/") ||
    file.includes("/test/")
  );
}

function extractFunctions(content: string, file: string, ext: string): FunctionSignature[] {
  if ([".ts", ".tsx", ".js", ".jsx"].includes(ext)) {
    return extractTSFunctions(content, file);
  }
  if (ext === ".py") {
    return extractPythonFunctions(content, file);
  }
  if (ext === ".go") {
    return extractGoFunctions(content, file);
  }
  if (ext === ".rs") {
    return extractRustFunctions(content, file);
  }
  if (ext === ".java") {
    return extractJavaFunctions(content, file);
  }
  return [];
}

function extractTSFunctions(content: string, file: string): FunctionSignature[] {
  const functions: FunctionSignature[] = [];
  const lines = content.split("\n");

  const functionPatterns = [
    /^(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*(?:<[^>]*>)?\s*\(([^)]*)\)\s*(?::\s*([^\s{]+))?\s*\{/,
    /^(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*(?::\s*[^=]+)?\s*=>/,
    /^(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?function\s*\([^)]*\)/,
  ];

  const classMethodPattern = /^\s+(?:async\s+)?(\w+)\s*\(([^)]*)\)\s*(?::\s*([^\s{]+))?\s*\{/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    for (const pattern of functionPatterns) {
      const match = trimmed.match(pattern);
      if (match) {
        const name = match[1];
        const paramsStr = match[2] || "";
        const returnType = match[3] || "unknown";
        const isAsync = trimmed.includes("async ");
        const isExported = trimmed.startsWith("export");
        const params = parseTSParams(paramsStr);
        const body = extractBody(lines, i);
        const deps = extractDependencies(body);

        functions.push({
          name,
          file,
          line: i + 1,
          params,
          returnType,
          isAsync,
          isExported,
          complexity: calculateComplexity(body),
          dependencies: deps,
          body,
        });
        break;
      }
    }

    const methodMatch = trimmed.match(classMethodPattern);
    if (methodMatch && !["if", "for", "while", "switch", "constructor"].includes(methodMatch[1])) {
      const name = methodMatch[1];
      const paramsStr = methodMatch[2] || "";
      const returnType = methodMatch[3] || "unknown";
      const params = parseTSParams(paramsStr);
      const body = extractBody(lines, i);

      functions.push({
        name,
        file,
        line: i + 1,
        params,
        returnType,
        isAsync: trimmed.includes("async "),
        isExported: false,
        complexity: calculateComplexity(body),
        dependencies: extractDependencies(body),
        body,
      });
    }
  }

  return functions;
}

function extractPythonFunctions(content: string, file: string): FunctionSignature[] {
  const functions: FunctionSignature[] = [];
  const lines = content.split("\n");

  const funcPattern = /^(?:async\s+)?def\s+(\w+)\s*\(([^)]*)\)\s*(?:->\s*(\S+))?\s*:/;

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(funcPattern);
    if (match) {
      const name = match[1];
      if (name.startsWith("_") && name !== "__init__") continue;
      const paramsStr = match[2] || "";
      const returnType = match[3] || "None";
      const isAsync = lines[i].trim().startsWith("async ");

      const params: ParamInfo[] = paramsStr
        .split(",")
        .map((p) => p.trim())
        .filter((p) => p && p !== "self" && p !== "cls")
        .map((p) => {
          const parts = p.split(":");
          const nameDefault = parts[0].trim().split("=");
          return {
            name: nameDefault[0].trim(),
            type: parts[1]?.trim().split("=")[0].trim() || "Any",
            optional: p.includes("="),
            defaultValue: nameDefault[1]?.trim(),
          };
        });

      const body = extractPythonBody(lines, i);

      functions.push({
        name,
        file,
        line: i + 1,
        params,
        returnType,
        isAsync,
        isExported: !name.startsWith("_"),
        complexity: calculateComplexity(body),
        dependencies: extractDependencies(body),
        body,
      });
    }
  }

  return functions;
}

function extractGoFunctions(content: string, file: string): FunctionSignature[] {
  const functions: FunctionSignature[] = [];
  const lines = content.split("\n");
  const funcPattern = /^func\s+(?:\([^)]+\)\s+)?(\w+)\s*\(([^)]*)\)\s*(?:\(([^)]+)\)|(\w+))?\s*\{/;

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(funcPattern);
    if (match) {
      const name = match[1];
      const paramsStr = match[2] || "";
      const returnType = match[3] || match[4] || "void";

      const params: ParamInfo[] = paramsStr
        .split(",")
        .filter((p) => p.trim())
        .map((p) => {
          const parts = p.trim().split(/\s+/);
          return {
            name: parts[0],
            type: parts.slice(1).join(" ") || "interface{}",
            optional: false,
          };
        });

      const body = extractBody(lines, i);
      const isExported = name[0] === name[0].toUpperCase();

      functions.push({
        name,
        file,
        line: i + 1,
        params,
        returnType,
        isAsync: false,
        isExported,
        complexity: calculateComplexity(body),
        dependencies: extractDependencies(body),
        body,
      });
    }
  }

  return functions;
}

function extractRustFunctions(content: string, file: string): FunctionSignature[] {
  const functions: FunctionSignature[] = [];
  const lines = content.split("\n");
  const funcPattern = /^(?:pub\s+)?(?:async\s+)?fn\s+(\w+)\s*(?:<[^>]*>)?\s*\(([^)]*)\)\s*(?:->\s*(\S+))?\s*\{/;

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(funcPattern);
    if (match) {
      const name = match[1];
      const paramsStr = match[2] || "";
      const returnType = match[3] || "()";

      const params: ParamInfo[] = paramsStr
        .split(",")
        .filter((p) => p.trim() && !p.includes("&self") && !p.includes("&mut self"))
        .map((p) => {
          const parts = p.trim().split(":");
          return {
            name: parts[0].trim(),
            type: parts.slice(1).join(":").trim() || "unknown",
            optional: false,
          };
        });

      const body = extractBody(lines, i);

      functions.push({
        name,
        file,
        line: i + 1,
        params,
        returnType,
        isAsync: lines[i].includes("async "),
        isExported: lines[i].includes("pub "),
        complexity: calculateComplexity(body),
        dependencies: extractDependencies(body),
        body,
      });
    }
  }

  return functions;
}

function extractJavaFunctions(content: string, file: string): FunctionSignature[] {
  const functions: FunctionSignature[] = [];
  const lines = content.split("\n");
  const methodPattern = /^\s+(?:public|protected|private)?\s*(?:static\s+)?(?:final\s+)?(\w+(?:<[^>]*>)?)\s+(\w+)\s*\(([^)]*)\)\s*(?:throws\s+\S+)?\s*\{/;

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(methodPattern);
    if (match) {
      const returnType = match[1];
      const name = match[2];
      const paramsStr = match[3] || "";

      const params: ParamInfo[] = paramsStr
        .split(",")
        .filter((p) => p.trim())
        .map((p) => {
          const parts = p.trim().split(/\s+/);
          return {
            name: parts[parts.length - 1],
            type: parts.slice(0, -1).join(" "),
            optional: false,
          };
        });

      const body = extractBody(lines, i);

      functions.push({
        name,
        file,
        line: i + 1,
        params,
        returnType,
        isAsync: false,
        isExported: lines[i].includes("public"),
        complexity: calculateComplexity(body),
        dependencies: extractDependencies(body),
        body,
      });
    }
  }

  return functions;
}

function parseTSParams(paramsStr: string): ParamInfo[] {
  if (!paramsStr.trim()) return [];

  const params: ParamInfo[] = [];
  let depth = 0;
  let current = "";

  for (const char of paramsStr) {
    if (char === "<" || char === "{" || char === "[" || char === "(") depth++;
    if (char === ">" || char === "}" || char === "]" || char === ")") depth--;
    if (char === "," && depth === 0) {
      params.push(parseSingleTSParam(current.trim()));
      current = "";
    } else {
      current += char;
    }
  }
  if (current.trim()) {
    params.push(parseSingleTSParam(current.trim()));
  }

  return params;
}

function parseSingleTSParam(param: string): ParamInfo {
  const optional = param.includes("?");
  const cleaned = param.replace("?", "");
  const [nameDefault, ...typeParts] = cleaned.split(":");
  const nameParts = nameDefault.trim().split("=");

  return {
    name: nameParts[0].trim(),
    type: typeParts.join(":").trim() || "unknown",
    optional: optional || nameParts.length > 1,
    defaultValue: nameParts[1]?.trim(),
  };
}

function extractBody(lines: string[], startLine: number): string {
  let depth = 0;
  let started = false;
  const bodyLines: string[] = [];

  for (let i = startLine; i < lines.length && i < startLine + 100; i++) {
    const line = lines[i];
    for (const char of line) {
      if (char === "{") {
        depth++;
        started = true;
      }
      if (char === "}") depth--;
    }
    bodyLines.push(line);
    if (started && depth === 0) break;
  }

  return bodyLines.join("\n");
}

function extractPythonBody(lines: string[], startLine: number): string {
  const bodyLines: string[] = [lines[startLine]];
  const baseIndent = lines[startLine].search(/\S/);

  for (let i = startLine + 1; i < lines.length && i < startLine + 100; i++) {
    const line = lines[i];
    if (line.trim() === "") {
      bodyLines.push(line);
      continue;
    }
    const indent = line.search(/\S/);
    if (indent <= baseIndent) break;
    bodyLines.push(line);
  }

  return bodyLines.join("\n");
}

function calculateComplexity(body: string): number {
  let complexity = 1;
  const patterns = [/\bif\b/g, /\belse\b/g, /\bfor\b/g, /\bwhile\b/g, /\bswitch\b/g, /\bcatch\b/g, /\bcase\b/g, /&&/g, /\|\|/g, /\?\./g];

  for (const pattern of patterns) {
    const matches = body.match(pattern);
    if (matches) complexity += matches.length;
  }

  return complexity;
}

function extractDependencies(body: string): string[] {
  const deps: string[] = [];
  const importMatches = body.matchAll(/(?:import|require)\s*\(?["']([^"']+)["']\)?/g);
  for (const match of importMatches) {
    deps.push(match[1]);
  }
  const callMatches = body.matchAll(/(\w+)\s*\.\s*(\w+)\s*\(/g);
  for (const match of callMatches) {
    deps.push(`${match[1]}.${match[2]}`);
  }
  return [...new Set(deps)];
}

export function getProjectLanguage(projectPath: string): string {
  try {
    const files = glob.sync("**/*", {
      cwd: projectPath,
      ignore: IGNORE_DIRS.map((d) => `**/${d}/**`),
      nodir: true,
    });

    const extCount: Record<string, number> = {};
    for (const f of files) {
      const ext = extname(f);
      if (SUPPORTED_EXTENSIONS.includes(ext)) {
        extCount[ext] = (extCount[ext] || 0) + 1;
      }
    }

    let maxExt = ".ts";
    let maxCount = 0;
    for (const [ext, count] of Object.entries(extCount)) {
      if (count > maxCount) {
        maxExt = ext;
        maxCount = count;
      }
    }

    const langMap: Record<string, string> = {
      ".ts": "typescript",
      ".tsx": "typescript",
      ".js": "javascript",
      ".jsx": "javascript",
      ".py": "python",
      ".go": "go",
      ".rs": "rust",
      ".java": "java",
    };

    return langMap[maxExt] || "typescript";
  } catch {
    return "typescript";
  }
}