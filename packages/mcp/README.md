# ⚡ @nexusforge/mcp

**Model Context Protocol server for NexusForge.** Expose the security scanner, self-healing engine, code guardian, and deployer as MCP tools — usable from Claude Desktop, Cursor, Windsurf, Cline, or any MCP-compatible client.

Your AI assistant can now scan dependencies for CVEs, diagnose bugs, review code, and inspect projects directly, with no copy-pasting.

## Install

```bash
npm install -g @nexusforge/mcp
# or run on demand
npx @nexusforge/mcp
```

The server speaks MCP over stdio.

## Tools

| Tool | What it does |
|------|-------------|
| `scan_dependencies` | Audit npm/pip/Cargo/Go deps for CVEs (OSV.dev), returns a scored Markdown report |
| `lookup_cve` | Fetch details for a specific CVE / GHSA advisory |
| `diagnose_code` | Static bug & security scan (read-only), returns a health report |
| `review_code` | Rule-based code review with an A–F grade |
| `quality_metrics` | Maintainability index, technical debt, complexity hotspots |
| `detect_project` | Detect framework/runtime and recommend a deploy target |
| `list_security_rules` | List built-in review rules, filterable by severity/category |

All tools are read-only — none modify your files.

## Configure your client

### Claude Desktop

Edit `claude_desktop_config.json` (macOS: `~/Library/Application Support/Claude/`, Windows: `%APPDATA%\Claude\`):

```json
{
  "mcpServers": {
    "nexusforge": {
      "command": "npx",
      "args": ["-y", "@nexusforge/mcp"]
    }
  }
}
```

### Cursor / Windsurf / Cline

Add the same `command` / `args` pair to the editor's MCP server settings, then reload. The seven NexusForge tools appear automatically.

## Example prompts

- "Scan `/path/to/repo` for vulnerable dependencies."
- "Diagnose bugs in this project and summarise the critical ones."
- "Review the code in `./src` and give me the grade."
- "What's the maintainability index of this repo?"

## License

MIT — part of the [NexusForge](https://github.com/0xgetz/nexusforge) platform.
