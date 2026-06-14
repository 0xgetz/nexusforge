import { test, expect } from "bun:test";
import { parseGitHubRemote, buildBranchName, buildPRBody } from "../src/pr.js";
import type { Fix } from "../src/types.js";

test("parseGitHubRemote handles SSH form", () => {
  expect(parseGitHubRemote("git@github.com:0xgetz/nexusforge.git")).toEqual({ owner: "0xgetz", repo: "nexusforge" });
  expect(parseGitHubRemote("git@github.com:acme/my-repo")).toEqual({ owner: "acme", repo: "my-repo" });
});

test("parseGitHubRemote handles HTTPS form, with and without .git and token", () => {
  expect(parseGitHubRemote("https://github.com/0xgetz/nexusforge.git")).toEqual({ owner: "0xgetz", repo: "nexusforge" });
  expect(parseGitHubRemote("https://github.com/0xgetz/nexusforge")).toEqual({ owner: "0xgetz", repo: "nexusforge" });
  expect(parseGitHubRemote("https://x-access-token:ghp_abc@github.com/acme/repo.git")).toEqual({ owner: "acme", repo: "repo" });
});

test("parseGitHubRemote handles ssh:// form", () => {
  expect(parseGitHubRemote("ssh://git@github.com/acme/repo.git")).toEqual({ owner: "acme", repo: "repo" });
});

test("parseGitHubRemote rejects non-GitHub remotes", () => {
  expect(parseGitHubRemote("https://gitlab.com/acme/repo.git")).toBeNull();
  expect(parseGitHubRemote("not a url")).toBeNull();
});

test("buildBranchName is unique-ish and well-formed", () => {
  const b = buildBranchName();
  expect(b).toMatch(/^nexusforge\/auto-fix-\d{8}-\d{6}$/);
  expect(buildBranchName("hotfix")).toMatch(/^hotfix-\d{8}-\d{6}$/);
});

test("buildPRBody summarises fixes by file with counts and confidence", () => {
  const fixes: Fix[] = [
    { bugId: "NXF-0001", file: "src/a.ts", original: "var x=1", fixed: "const x=1", description: "var → const", confidence: 0.85 },
    { bugId: "NXF-0002", file: "src/a.ts", original: "x == 1", fixed: "x === 1", description: "== → ===", confidence: 0.9 },
    { bugId: "NXF-0003", file: "src/b.ts", original: "console.log(1)", fixed: "// console.log(1)", description: "remove console", confidence: 0.95 },
  ];
  const body = buildPRBody(fixes);
  expect(body).toContain("3");           // total fixes
  expect(body).toContain("src/a.ts");
  expect(body).toContain("src/b.ts");
  expect(body).toContain("NXF-0002");
  expect(body).toContain("90%");
  expect(body).toContain("NexusForge");
});
