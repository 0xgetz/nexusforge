<div align="center">

# ⚡ NexusForge

### AI-Powered Code · Security · Self-Healing · Extensible

The world's first open-source AI development platform combining an **AI Coding Assistant**, **Security Scanner**, **Self-Healing Engine**, and **Plugin SDK** — all free, private, and multi-model.

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](https://opensource.org/licenses/MIT)
[![Phase](https://img.shields.io/badge/All_Phases-Built-brightgreen.svg)](#roadmap)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/0xgetz/nexusforge/pulls)

[Website](https://nexusforge.dev) · [Documentation](#packages) · [Roadmap](#-roadmap) · [Contributing](#-contributing)

</div>

---

## 🔥 The Problem

Open-source security in 2026 has reached a critical tipping point:

| Metric | 2024 | 2025 | Change |
|--------|------|------|--------|
| Avg. vulnerabilities per codebase | 280 | 581 | **+107%** |
| Unique vulnerabilities per codebase | 147 | 237 | **+61%** |
| Codebases with high-risk vulns | 44% | 65% | **+21pp** |
| Codebases with OSS components | 96% | 98% | **+2pp** |

> Source: OSSRA 2026 — Black Duck Software

## 🏗️ Three Pillars

### Pillar 1: AI Coding Assistant
A multi-agent coding system rivaling premium tools — completely free. Supports Ollama, OpenAI, Anthropic, and custom endpoints with streaming responses and project context awareness.

### Pillar 2: AI Security Scanner
Real-time vulnerability scanning via OSV.dev API with multi-ecosystem support (npm, pip, Cargo, Go). Generates reports in JSON, Markdown, HTML, and SARIF formats with GitHub Actions integration.

### Pillar 3: Self-Healing Engine
Autonomous bug detection across TypeScript, JavaScript, Python, Rust, Go, and Java. Detects hardcoded secrets, SQL injection, XSS, and more — with auto-fix capabilities and real-time file monitoring.

## 📦 Packages

NexusForge is a monorepo with four core packages:

```
nexusforge/
├── packages/
│   ├── cli/         # @nexusforge/cli     — AI Coding Assistant CLI
│   ├── scanner/     # @nexusforge/scanner — Security Scanner
│   ├── healer/      # @nexusforge/healer  — Self-Healing Engine
│   └── sdk/         # @nexusforge/sdk     — Plugin SDK
├── src/             # Landing page (Next.js)
└── .github/         # CI/CD workflows
```

---

### 📟 `@nexusforge/cli` — AI Coding Assistant

Interactive terminal-based AI coding assistant with multi-model support.

```bash
cd packages/cli && bun install && bun run build

# Start interactive chat
node dist/index.js chat

# Scaffold a new project
node dist/index.js init my-app --template ts-node

# Scan project context
node dist/index.js scan --dir .

# Configure models
node dist/index.js config models
node dist/index.js config use openai-gpt4
node dist/index.js config set-key openai-gpt4 sk-...
```

**Features:**
- Multi-model support: Ollama, OpenAI GPT-4o, Anthropic Claude, custom endpoints
- Interactive chat with streaming responses
- Project context awareness (auto-detects language, framework, structure)
- Project scaffolding: TypeScript Node.js, Next.js, Python FastAPI, Rust CLI
- Configurable model switching and API key management

---

### 🛡️ `@nexusforge/scanner` — Security Scanner

Dependency vulnerability scanner with CVE lookup, multi-format reports, and CI/CD integration.

```bash
cd packages/scanner && bun install && bun run build

# Scan dependencies
node dist/index.js audit --path /your/project

# HTML report
node dist/index.js audit --format html --output report.html

# SARIF for GitHub Security tab
node dist/index.js audit --format sarif --output results.sarif

# Lookup a specific CVE
node dist/index.js lookup GHSA-xxxx-xxxx-xxxx
```

**Features:**
- Multi-ecosystem: npm, pip, Cargo, Go modules
- Real-time CVE lookup via OSV.dev API
- Security scoring (0–100)
- Output: JSON, Markdown, HTML, SARIF
- GitHub Actions workflow included
- Offline mode support

**Programmatic:**
```typescript
import { scan, toHTML } from "@nexusforge/scanner";
const result = await scan({ path: "./my-project", includeDev: true });
console.log(`Score: ${result.summary.score}/100`);
```

---

### 🔧 `@nexusforge/healer` — Self-Healing Engine

Autonomous bug detection, root cause analysis, and auto-repair.

```bash
cd packages/healer && bun install && bun run build

# Diagnose
node dist/index.js diagnose --path /your/project

# Auto-fix
node dist/index.js diagnose --fix

# Watch mode
node dist/index.js watch --path /your/project

# Generate patch
node dist/index.js patch --output fixes.patch
```

**Detects:** Hardcoded secrets · SQL injection · XSS · eval() · Null references · Empty catch blocks · Console statements · `var` usage · Loose equality · `.unwrap()` (Rust) · Mutable defaults (Python) · TODO/FIXME

**Auto-Fixes:** console.log removal · empty catch → error logging · `var` → `const` · `==` → `===` · bare `except:` → `except Exception:`

**Languages:** TypeScript · JavaScript · Python · Rust · Go · Java

---

### 🧩 `@nexusforge/sdk` — Plugin SDK

Build extensions for the NexusForge ecosystem.

```typescript
import { definePlugin } from "@nexusforge/sdk";

export default definePlugin({
  name: "my-plugin",
  version: "1.0.0",
  description: "My awesome plugin",
  permissions: ["fs:read", "fs:write"],
  activate(context) { context.logger.info("Activated!"); },
  hooks: {
    onAfterScan: async (payload, ctx) => { ctx.logger.info("Scan done!"); },
  },
  commands: {
    hello: {
      description: "Say hello",
      handler: (args) => `Hello, ${args.name || "World"}!`,
    },
  },
});
```

**Features:** `definePlugin()` · `NexusPlugin` class · `EventBus` · `HookRegistry` · `PluginLoader` · `PluginRegistry` · TypeScript types · Plugin store · Scoped logger

**Hooks:** `onInit` · `onShutdown` · `onBeforeScan` · `onAfterScan` · `onBeforeFix` · `onAfterFix` · `onBeforeChat` · `onAfterChat` · `onFileChange` · `onError` · `onCommand`

---

## ⚡ Quick Start

```bash
git clone https://github.com/0xgetz/nexusforge.git && cd nexusforge

# Build all packages
for pkg in cli scanner healer sdk; do
  cd packages/$pkg && bun install && bun run build && cd ../..
done

# Start coding
node packages/cli/dist/index.js chat

# Scan vulnerabilities
node packages/scanner/dist/index.js audit

# Diagnose bugs
node packages/healer/dist/index.js diagnose
```

## 🛠️ Technology Stack

| Component | Technology |
|-----------|-----------|
| Core Engine | TypeScript + Rust |
| AI Integration | Model Context Protocol (MCP) |
| CLI Interface | Commander.js + Chalk + Ora |
| Security Engine | OSV.dev API + Custom AST |
| Plugin System | Custom SDK + EventBus + Hooks |
| Local AI | Ollama Integration |

## 🗺️ Roadmap

| Phase | Timeline | Focus | Status |
|-------|----------|-------|--------|
| **Phase 1: Foundation** | Q2 2026 | Core CLI, AI coding, multi-model | ✅ Built |
| **Phase 2: Security** | Q3 2026 | Security scanner, CVE lookup, CI/CD | ✅ Built |
| **Phase 3: Healing** | Q4 2026 | Self-healing, auto-fix, monitoring | ✅ Built |
| **Phase 4: Ecosystem** | Q1–Q2 2027 | Plugin SDK, events, marketplace | ✅ Built |

## 📊 Comparison

| Feature | NexusForge | Claude Code | Cursor | Aider |
|---------|-----------|-------------|--------|-------|
| AI Coding Assistant | ✅ | ✅ | ✅ | ⚠️ |
| Multi-Model Support | ✅ | ❌ | ❌ | ✅ |
| Security Scanning | ✅ | ❌ | ❌ | ❌ |
| Self-Healing Engine | ✅ | ❌ | ❌ | ❌ |
| Privacy-First / Local | ✅ | ❌ | ❌ | ✅ |
| 100% Free | ✅ | ❌ | ❌ | ✅ |
| Plugin Ecosystem | ✅ | ⚠️ | ⚠️ | ❌ |

## 🤝 Contributing

1. **Star the repo** — Help us grow
2. **Pick up an issue** — Check [Issues](https://github.com/0xgetz/nexusforge/issues)
3. **Submit a PR** — Follow our guidelines
4. **Build a plugin** — Use the Plugin SDK
5. **Improve docs** — PRs welcome

## 📄 License

MIT — see [LICENSE](LICENSE)

---

<div align="center">

**Built with ❤️ by [0xgetz](https://github.com/0xgetz) and the open-source community**

*Every developer deserves world-class AI tools — regardless of budget.*

</div>
