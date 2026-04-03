import { mkdirSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import chalk from "chalk";

export interface Template {
  name: string;
  description: string;
  files: Record<string, string>;
  postInstall?: string;
}

const templates: Record<string, Template> = {
  "ts-node": {
    name: "TypeScript Node.js",
    description: "Minimal TypeScript Node.js project with ESM",
    files: {
      "package.json": JSON.stringify({
        name: "my-project",
        version: "1.0.0",
        type: "module",
        scripts: {
          build: "tsc",
          dev: "tsx watch src/index.ts",
          start: "node dist/index.js",
          test: "vitest",
        },
        dependencies: {},
        devDependencies: {
          typescript: "^5.5.0",
          tsx: "^4.16.0",
          "@types/node": "^22.0.0",
          vitest: "^2.0.0",
        },
      }, null, 2),
      "tsconfig.json": JSON.stringify({
        compilerOptions: {
          target: "ES2022",
          module: "ESNext",
          moduleResolution: "bundler",
          esModuleInterop: true,
          strict: true,
          outDir: "./dist",
          rootDir: "./src",
          declaration: true,
          skipLibCheck: true,
        },
        include: ["src/**/*"],
      }, null, 2),
      "src/index.ts": `console.log("Hello from NexusForge scaffold!");\n`,
      ".gitignore": "node_modules\ndist\n.env\n",
      "README.md": "# My Project\n\nScaffolded with NexusForge.\n",
    },
    postInstall: "bun install || npm install",
  },
  "nextjs": {
    name: "Next.js App",
    description: "Next.js 14+ with TypeScript, Tailwind CSS, and App Router",
    files: {
      "package.json": JSON.stringify({
        name: "my-nextjs-app",
        version: "0.1.0",
        private: true,
        scripts: {
          dev: "next dev",
          build: "next build",
          start: "next start",
          lint: "next lint",
        },
        dependencies: {
          next: "^14.2.0",
          react: "^18.3.0",
          "react-dom": "^18.3.0",
        },
        devDependencies: {
          typescript: "^5.5.0",
          "@types/node": "^22.0.0",
          "@types/react": "^18.3.0",
          tailwindcss: "^3.4.0",
          postcss: "^8.4.0",
          autoprefixer: "^10.4.0",
        },
      }, null, 2),
      "tsconfig.json": JSON.stringify({
        compilerOptions: {
          lib: ["dom", "dom.iterable", "esnext"],
          allowJs: true,
          skipLibCheck: true,
          strict: true,
          noEmit: true,
          esModuleInterop: true,
          module: "esnext",
          moduleResolution: "bundler",
          resolveJsonModule: true,
          isolatedModules: true,
          jsx: "preserve",
          incremental: true,
          plugins: [{ name: "next" }],
          paths: { "@/*": ["./src/*"] },
        },
        include: ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
        exclude: ["node_modules"],
      }, null, 2),
      "src/app/layout.tsx": `export const metadata = { title: 'My App', description: 'Built with NexusForge' };\nexport default function RootLayout({ children }: { children: React.ReactNode }) {\n  return <html lang="en"><body>{children}</body></html>;\n}\n`,
      "src/app/page.tsx": `export default function Home() {\n  return <main><h1>Welcome to NexusForge</h1></main>;\n}\n`,
      "tailwind.config.ts": `import type { Config } from "tailwindcss";\nconst config: Config = {\n  content: ["./src/**/*.{ts,tsx}"],\n  theme: { extend: {} },\n  plugins: [],\n};\nexport default config;\n`,
      ".gitignore": "node_modules\n.next\nout\n.env\n",
    },
    postInstall: "bun install || npm install",
  },
  "python-fastapi": {
    name: "Python FastAPI",
    description: "FastAPI project with async support and auto-docs",
    files: {
      "requirements.txt": "fastapi>=0.111.0\nuvicorn[standard]>=0.30.0\npydantic>=2.8.0\npython-dotenv>=1.0.0\npytest>=8.2.0\nhttpx>=0.27.0\n",
      "main.py": `from fastapi import FastAPI\nfrom pydantic import BaseModel\n\napp = FastAPI(title="My API", description="Built with NexusForge")\n\nclass HealthResponse(BaseModel):\n    status: str\n    version: str\n\n@app.get("/health", response_model=HealthResponse)\nasync def health():\n    return HealthResponse(status="ok", version="1.0.0")\n\n@app.get("/")\nasync def root():\n    return {"message": "Welcome to NexusForge API"}\n`,
      ".gitignore": "__pycache__\n*.pyc\n.env\nvenv\n.venv\n",
      "README.md": "# My API\n\nScaffolded with NexusForge.\n\n```bash\npip install -r requirements.txt\nuvicorn main:app --reload\n```\n",
    },
    postInstall: "pip install -r requirements.txt",
  },
  "rust-cli": {
    name: "Rust CLI",
    description: "Rust CLI application with clap and error handling",
    files: {
      "Cargo.toml": `[package]\nname = "my-cli"\nversion = "0.1.0"\nedition = "2021"\n\n[dependencies]\nclap = { version = "4", features = ["derive"] }\nanyhow = "1"\ntokio = { version = "1", features = ["full"] }\nserde = { version = "1", features = ["derive"] }\nserde_json = "1"\n`,
      "src/main.rs": `use clap::Parser;\n\n#[derive(Parser)]\n#[command(name = "my-cli", about = "Built with NexusForge")]\nstruct Cli {\n    #[arg(short, long)]\n    name: Option<String>,\n}\n\nfn main() {\n    let cli = Cli::parse();\n    let name = cli.name.unwrap_or_else(|| "World".to_string());\n    println!("Hello, {}!", name);\n}\n`,
      ".gitignore": "target\n",
      "README.md": "# My CLI\n\nScaffolded with NexusForge.\n\n```bash\ncargo run\n```\n",
    },
  },
};

export function listTemplates(): Template[] {
  return Object.values(templates);
}

export function getTemplate(name: string): Template | undefined {
  return templates[name];
}

export function scaffold(templateName: string, projectName: string, targetDir: string): void {
  const template = templates[templateName];
  if (!template) {
    throw new Error(`Unknown template: ${templateName}. Available: ${Object.keys(templates).join(", ")}`);
  }

  const projectDir = join(targetDir, projectName);

  if (existsSync(projectDir)) {
    throw new Error(`Directory already exists: ${projectDir}`);
  }

  mkdirSync(projectDir, { recursive: true });

  for (const [filePath, content] of Object.entries(template.files)) {
    const fullPath = join(projectDir, filePath);
    const dir = fullPath.substring(0, fullPath.lastIndexOf("/"));
    mkdirSync(dir, { recursive: true });

    let finalContent = content;
    if (filePath === "package.json" || filePath === "Cargo.toml") {
      finalContent = content.replace(/my-project|my-nextjs-app|my-cli/g, projectName);
    }

    writeFileSync(fullPath, finalContent, "utf-8");
  }

  console.log(chalk.green(`\n✓ Project "${projectName}" created at ${projectDir}`));
  console.log(chalk.dim(`  Template: ${template.name}`));
  console.log(chalk.dim(`  Files: ${Object.keys(template.files).length}`));

  if (template.postInstall) {
    console.log(chalk.cyan(`\n  To get started:`));
    console.log(chalk.white(`    cd ${projectName}`));
    console.log(chalk.white(`    ${template.postInstall}`));
  }
}

export function getTemplateNames(): Record<string, string> {
  const names: Record<string, string> = {};
  for (const key of Object.keys(templates)) {
    names[key] = key;
  }
  return names;
}

export function getTemplateKeys(): string[] {
  return Object.keys(templates);
}