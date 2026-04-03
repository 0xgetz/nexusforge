import type { FunctionSignature, TestFramework, TestStyle } from "./types.js";

export function buildGeneratePrompt(
  fn: FunctionSignature,
  framework: TestFramework,
  style: TestStyle,
  opts: { edgeCases: boolean; mocks: boolean }
): string {
  const frameworkGuide = getFrameworkGuide(framework);
  const styleGuide = getStyleGuide(style, framework);

  const sections = [
    `Generate comprehensive ${frameworkGuide.displayName} tests for the following function.`,
    "",
    "## Source Function",
    "```",
    `File: ${fn.file}`,
    `Name: ${fn.name}`,
    `Async: ${fn.isAsync}`,
    `Parameters: ${fn.params.map((p) => `${p.name}: ${p.type}${p.optional ? " (optional)" : ""}`).join(", ") || "none"}`,
    `Return Type: ${fn.returnType}`,
    `Complexity: ${fn.complexity}`,
    "```",
    "",
    "## Function Body",
    "```",
    fn.body,
    "```",
    "",
    "## Requirements",
    `- Use ${frameworkGuide.displayName} testing framework`,
    `- Follow ${styleGuide} style`,
    "- Include happy path tests",
    "- Include error handling tests",
  ];

  if (opts.edgeCases) {
    sections.push(
      "- Include edge case tests (boundary values, empty inputs, null/undefined)",
      "- Include type coercion tests if applicable"
    );
  }

  if (opts.mocks) {
    sections.push(
      "- Mock external dependencies",
      `- Dependencies found: ${fn.dependencies.join(", ") || "none"}`
    );
  }

  sections.push(
    "",
    "## Output Format",
    "Return ONLY the test code, no explanations.",
    `Use ${frameworkGuide.importStyle} imports.`,
    `File extension should be ${frameworkGuide.testExtension}`
  );

  return sections.join("\n");
}

export function buildCoveragePrompt(
  uncoveredFunctions: string[],
  framework: TestFramework
): string {
  const guide = getFrameworkGuide(framework);

  return [
    `Analyze the following uncovered functions and generate test recommendations for ${guide.displayName}.`,
    "",
    "## Uncovered Functions",
    ...uncoveredFunctions.map((f) => `- ${f}`),
    "",
    "## Requirements",
    "- Prioritize by risk (public APIs first, then internal logic)",
    "- Estimate assertions needed per function",
    "- Suggest mock strategies for external dependencies",
    "",
    "## Output Format",
    "JSON array of { function, priority, estimatedTests, mockStrategy }",
  ].join("\n");
}

export function buildMutationPrompt(survivingMutants: string[]): string {
  return [
    "Analyze the following surviving mutants and suggest additional tests to kill them.",
    "",
    "## Surviving Mutants",
    ...survivingMutants.map((m) => `- ${m}`),
    "",
    "## Requirements",
    "- For each mutant, suggest a specific test assertion",
    "- Explain why the current tests failed to catch it",
    "- Prioritize by severity (conditional > arithmetic > string)",
    "",
    "## Output Format",
    "List of recommended test cases with code snippets.",
  ].join("\n");
}

interface FrameworkGuide {
  displayName: string;
  importStyle: string;
  testExtension: string;
  assertionExample: string;
}

function getFrameworkGuide(framework: TestFramework): FrameworkGuide {
  const guides: Record<TestFramework, FrameworkGuide> = {
    jest: {
      displayName: "Jest",
      importStyle: "ESM/CJS",
      testExtension: ".test.ts",
      assertionExample: "expect(result).toBe(expected)",
    },
    vitest: {
      displayName: "Vitest",
      importStyle: "ESM",
      testExtension: ".test.ts",
      assertionExample: "expect(result).toBe(expected)",
    },
    mocha: {
      displayName: "Mocha + Chai",
      importStyle: "ESM",
      testExtension: ".test.ts",
      assertionExample: "expect(result).to.equal(expected)",
    },
    pytest: {
      displayName: "pytest",
      importStyle: "Python",
      testExtension: "_test.py",
      assertionExample: "assert result == expected",
    },
    unittest: {
      displayName: "unittest",
      importStyle: "Python",
      testExtension: "_test.py",
      assertionExample: "self.assertEqual(result, expected)",
    },
    "go-test": {
      displayName: "Go testing",
      importStyle: "Go",
      testExtension: "_test.go",
      assertionExample: 'if got != want { t.Errorf("got %v, want %v", got, want) }',
    },
    "cargo-test": {
      displayName: "Cargo test",
      importStyle: "Rust",
      testExtension: ".rs",
      assertionExample: "assert_eq!(result, expected)",
    },
    junit: {
      displayName: "JUnit 5",
      importStyle: "Java",
      testExtension: "Test.java",
      assertionExample: "assertEquals(expected, result)",
    },
  };

  return guides[framework];
}

function getStyleGuide(style: TestStyle, framework: TestFramework): string {
  if (framework === "pytest") return "function-based (def test_xxx)";
  if (framework === "unittest") return "class-based (class TestXxx)";
  if (framework === "go-test") return "function-based (func TestXxx)";
  if (framework === "cargo-test") return "#[test] fn test_xxx";
  if (framework === "junit") return "@Test void testXxx";

  const styleMap: Record<TestStyle, string> = {
    "describe-it": "describe/it blocks",
    "test-block": "test() blocks",
    "class-based": "class-based with methods",
    "function-based": "standalone test functions",
  };

  return styleMap[style];
}