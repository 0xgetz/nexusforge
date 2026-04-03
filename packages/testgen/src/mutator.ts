import { readFileSync } from "fs";
import { resolve } from "path";
import { glob } from "glob";
import type { MutationResult, MutationOptions, SurvivingMutant, MutatorType } from "./types.js";

interface Mutation {
  file: string;
  line: number;
  original: string;
  mutated: string;
  mutator: MutatorType;
  description: string;
}

const MUTATOR_RULES: Record<MutatorType, { pattern: RegExp; replacement: string; description: string }[]> = {
  arithmetic: [
    { pattern: /\+(?!=)/g, replacement: "-", description: "Changed + to -" },
    { pattern: /(?<!=)-(?!=|>)/g, replacement: "+", description: "Changed - to +" },
    { pattern: /\*(?!=)/g, replacement: "/", description: "Changed * to /" },
    { pattern: /\/(?!=)/g, replacement: "*", description: "Changed / to *" },
    { pattern: /%(?!=)/g, replacement: "*", description: "Changed % to *" },
  ],
  conditional: [
    { pattern: /===/g, replacement: "!==", description: "Changed === to !==" },
    { pattern: /!==/g, replacement: "===", description: "Changed !== to ===" },
    { pattern: /==/g, replacement: "!=", description: "Changed == to !=" },
    { pattern: /!=/g, replacement: "==", description: "Changed != to ==" },
    { pattern: /&&/g, replacement: "||", description: "Changed && to ||" },
    { pattern: /\|\|/g, replacement: "&&", description: "Changed || to &&" },
  ],
  boundary: [
    { pattern: />/g, replacement: ">=", description: "Changed > to >=" },
    { pattern: />=/g, replacement: ">", description: "Changed >= to >" },
    { pattern: /</g, replacement: "<=", description: "Changed < to <=" },
    { pattern: /<=/g, replacement: "<", description: "Changed <= to <" },
  ],
  negation: [
    { pattern: /true/g, replacement: "false", description: "Changed true to false" },
    { pattern: /false/g, replacement: "true", description: "Changed false to true" },
    { pattern: /!(\w)/g, replacement: "$1", description: "Removed negation" },
  ],
  "return-value": [
    { pattern: /return\s+(\w+)/g, replacement: "return null", description: "Changed return value to null" },
    { pattern: /return\s+0/g, replacement: "return 1", description: "Changed return 0 to return 1" },
    { pattern: /return\s+1/g, replacement: "return 0", description: "Changed return 1 to return 0" },
    { pattern: /return\s+true/g, replacement: "return false", description: "Changed return true to false" },
    { pattern: /return\s+""/g, replacement: 'return "mutated"', description: 'Changed return "" to "mutated"' },
  ],
  "void-call": [
    { pattern: /(\w+)\s*\(\s*\)/g, replacement: "/* removed call */", description: "Removed void function call" },
  ],
  string: [
    { pattern: /"([^"]+)"/g, replacement: '""', description: "Changed string to empty string" },
    { pattern: /'([^']+)'/g, replacement: "''", description: "Changed string to empty string" },
  ],
  array: [
    { pattern: /\[\]/g, replacement: "[null]", description: "Changed empty array to [null]" },
    { pattern: /\.push\(/g, replacement: ".pop(", description: "Changed push to pop" },
    { pattern: /\.length/g, replacement: ".length + 1", description: "Changed .length to .length + 1" },
  ],
};

export async function mutationTest(options: MutationOptions): Promise<MutationResult> {
  const start = Date.now();
  const projectPath = resolve(options.path);
  const mutators = options.mutators || ["arithmetic", "conditional", "boundary"];
  const maxMutants = options.maxMutants || 100;

  const sourceFiles = await glob("**/*.{ts,tsx,js,jsx,py,go,rs}", {
    cwd: projectPath,
    absolute: true,
    ignore: ["**/node_modules/**", "**/dist/**", "**/*.test.*", "**/*.spec.*", "**/test_*", "**/__tests__/**"],
  });

  const allMutations: Mutation[] = [];

  for (const file of sourceFiles) {
    try {
      const content = readFileSync(file, "utf-8");
      const lines = content.split("\n");

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim().startsWith("//") || line.trim().startsWith("#") || line.trim() === "") continue;

        for (const mutator of mutators) {
          const rules = MUTATOR_RULES[mutator];
          if (!rules) continue;

          for (const rule of rules) {
            if (rule.pattern.test(line)) {
              allMutations.push({
                file,
                line: i + 1,
                original: line.trim(),
                mutated: line.trim().replace(rule.pattern, rule.replacement),
                mutator,
                description: rule.description,
              });

              rule.pattern.lastIndex = 0;

              if (allMutations.length >= maxMutants) break;
            }
          }
          if (allMutations.length >= maxMutants) break;
        }
        if (allMutations.length >= maxMutants) break;
      }
    } catch {
      // skip unreadable files
    }
    if (allMutations.length >= maxMutants) break;
  }

  const testFiles = await glob("**/*.{test,spec}.{ts,tsx,js,jsx}", {
    cwd: resolve(options.testsPath),
    absolute: true,
  });

  const testedPatterns = extractTestedPatterns(testFiles);

  let killed = 0;
  let survived = 0;
  const survivingMutants: SurvivingMutant[] = [];

  for (const mutation of allMutations) {
    const isLikelyKilled = checkIfLikelyKilled(mutation, testedPatterns);

    if (isLikelyKilled) {
      killed++;
    } else {
      survived++;
      survivingMutants.push({
        file: mutation.file,
        line: mutation.line,
        original: mutation.original,
        mutated: mutation.mutated,
        mutator: mutation.mutator,
        description: mutation.description,
      });
    }
  }

  const total = allMutations.length;
  const score = total > 0 ? (killed / total) * 100 : 100;

  return {
    projectPath,
    timestamp: new Date().toISOString(),
    totalMutants: total,
    killed,
    survived,
    timeout: 0,
    noCoverage: 0,
    mutationScore: Math.round(score * 10) / 10,
    survivingMutants: survivingMutants.slice(0, 50),
    duration: Date.now() - start,
  };
}

function extractTestedPatterns(testFiles: string[]): Set<string> {
  const patterns = new Set<string>();

  for (const file of testFiles) {
    try {
      const content = readFileSync(file, "utf-8");

      const matches = content.matchAll(/(?:expect|assert|toBe|toEqual|toThrow|toMatch|toContain)\s*\(/g);
      for (const m of matches) {
        const surrounding = content.substring(Math.max(0, m.index! - 100), m.index! + 100);
        const words = surrounding.match(/\w+/g);
        if (words) {
          for (const w of words) {
            patterns.add(w.toLowerCase());
          }
        }
      }
    } catch {
      // skip
    }
  }

  return patterns;
}

function checkIfLikelyKilled(mutation: Mutation, testedPatterns: Set<string>): boolean {
  const words = mutation.original.match(/\w+/g) || [];

  let matchCount = 0;
  for (const word of words) {
    if (testedPatterns.has(word.toLowerCase())) {
      matchCount++;
    }
  }

  const coverage = words.length > 0 ? matchCount / words.length : 0;

  if (mutation.mutator === "conditional" && coverage > 0.3) return true;
  if (mutation.mutator === "arithmetic" && coverage > 0.4) return true;
  if (mutation.mutator === "boundary" && coverage > 0.5) return true;
  if (coverage > 0.6) return true;

  return false;
}

export function getMutatorDescriptions(): Record<MutatorType, string> {
  return {
    arithmetic: "Replaces arithmetic operators (+, -, *, /, %)",
    conditional: "Replaces conditional operators (===, !==, &&, ||)",
    boundary: "Replaces boundary operators (>, >=, <, <=)",
    negation: "Negates boolean values and removes negation operators",
    "return-value": "Modifies return values (null, 0, 1, true, false)",
    "void-call": "Removes void function calls",
    string: "Replaces strings with empty strings",
    array: "Modifies array operations (push/pop, length, empty array)",
  };
}