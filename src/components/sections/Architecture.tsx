"use client";

import { motion } from "framer-motion";
import {
  Cpu,
  Shield,
  Code2,
  Terminal,
  TestTube,
  LayoutDashboard,
  ArrowRight,
} from "lucide-react";

const agents = [
  {
    name: "Coordinator",
    role: "Task decomposition & orchestration",
    model: "Claude / DeepSeek-V3",
    icon: LayoutDashboard,
    color: "border-emerald-500/40 bg-emerald-500/5",
    iconColor: "text-emerald-400",
  },
  {
    name: "Architect",
    role: "System design & code review",
    model: "Claude / GPT-4o",
    icon: Cpu,
    color: "border-cyan-500/40 bg-cyan-500/5",
    iconColor: "text-cyan-400",
  },
  {
    name: "Frontend Dev",
    role: "UI, components & styling",
    model: "Claude / Llama 4",
    icon: Code2,
    color: "border-violet-500/40 bg-violet-500/5",
    iconColor: "text-violet-400",
  },
  {
    name: "Backend Dev",
    role: "APIs, database & logic",
    model: "DeepSeek-V3 / GPT-4o",
    icon: Terminal,
    color: "border-amber-500/40 bg-amber-500/5",
    iconColor: "text-amber-400",
  },
  {
    name: "QA Engineer",
    role: "Testing, debugging & validation",
    model: "Claude / DeepSeek-V3",
    icon: TestTube,
    color: "border-blue-500/40 bg-blue-500/5",
    iconColor: "text-blue-400",
  },
  {
    name: "Security Guard",
    role: "Vulnerability scanning & auto-fix",
    model: "Claude / GPT-4o",
    icon: Shield,
    color: "border-red-500/40 bg-red-500/5",
    iconColor: "text-red-400",
  },
];

const stack = [
  { label: "Core Engine", tech: "TypeScript + Rust", desc: "Speed meets performance" },
  { label: "AI Integration", tech: "Model Context Protocol", desc: "Open standard, multi-model" },
  { label: "CLI Interface", tech: "Ink (React for CLI)", desc: "Rich terminal UI" },
  { label: "Security Engine", tech: "AST Analyzer + Semgrep", desc: "Deep semantic analysis" },
  { label: "Local AI", tech: "Ollama Integration", desc: "Privacy-first, offline-ready" },
  { label: "Plugin System", tech: "Open Plugin API", desc: "Community-extensible" },
];

export default function Architecture() {
  return (
    <section data-design-id="architecture-section" id="architecture" className="relative py-28 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/3 to-transparent" />

      <div className="relative max-w-7xl mx-auto px-6">
        <motion.div
          data-design-id="arch-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <span data-design-id="arch-label" className="text-xs font-semibold uppercase tracking-widest text-purple-400 mb-4 block">
            Under The Hood
          </span>
          <h2 data-design-id="arch-title" className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
            Multi-Agent{" "}
            <span className="bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent">
              Architecture
            </span>
          </h2>
          <p data-design-id="arch-desc" className="text-muted-foreground max-w-2xl mx-auto text-base leading-relaxed">
            Six specialized AI agents collaborate through an internal message bus
            — debating, reviewing, and reaching consensus before shipping code.
          </p>
        </motion.div>

        {/* Agent Grid */}
        <motion.div
          data-design-id="arch-agent-grid"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-20"
        >
          {agents.map((agent, idx) => (
            <motion.div
              key={agent.name}
              data-design-id={`arch-agent-${agent.name.toLowerCase().replace(/\s/g, "-")}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.08 }}
              className={`rounded-xl border ${agent.color} p-5 hover:scale-[1.02] transition-transform`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-lg ${agent.color} flex items-center justify-center flex-shrink-0`}>
                  <agent.icon className={`w-4.5 h-4.5 ${agent.iconColor}`} />
                </div>
                <div>
                  <h4 data-design-id={`arch-agent-${agent.name.toLowerCase().replace(/\s/g, "-")}-name`} className="font-semibold text-sm">
                    {agent.name}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{agent.role}</p>
                  <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full bg-secondary/80 text-muted-foreground font-mono">
                    {agent.model}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Flow Diagram */}
        <motion.div
          data-design-id="arch-flow"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="gradient-border rounded-2xl bg-card/50 backdrop-blur-sm p-8 mb-20"
        >
          <h3 data-design-id="arch-flow-title" className="text-lg font-bold mb-6 text-center">How It Works</h3>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
            {[
              { step: "1", label: "You describe a task", color: "text-emerald-400 border-emerald-500/40" },
              { step: "2", label: "Coordinator decomposes", color: "text-cyan-400 border-cyan-500/40" },
              { step: "3", label: "Agents work in parallel", color: "text-purple-400 border-purple-500/40" },
              { step: "4", label: "Security scans output", color: "text-amber-400 border-amber-500/40" },
              { step: "5", label: "Production-ready code", color: "text-emerald-400 border-emerald-500/40" },
            ].map((item, idx) => (
              <div key={item.step} className="flex items-center gap-3 md:gap-4">
                <div
                  data-design-id={`arch-flow-step-${item.step}`}
                  className={`flex flex-col items-center gap-2 border rounded-xl px-5 py-4 ${item.color} bg-card/80 min-w-[140px]`}
                >
                  <span className="text-2xl font-extrabold">{item.step}</span>
                  <span className="text-xs text-center">{item.label}</span>
                </div>
                {idx < 4 && (
                  <ArrowRight className="w-4 h-4 text-muted-foreground/40 hidden md:block" />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Tech Stack */}
        <motion.div
          data-design-id="arch-stack"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h3 data-design-id="arch-stack-title" className="text-lg font-bold mb-6 text-center">Technology Stack</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {stack.map((item) => (
              <div
                key={item.label}
                data-design-id={`arch-stack-${item.label.toLowerCase().replace(/\s/g, "-")}`}
                className="flex items-center gap-4 rounded-xl bg-secondary/30 border border-border/30 px-5 py-4 hover:border-emerald-500/20 transition-colors"
              >
                <div>
                  <div className="text-xs text-muted-foreground">{item.label}</div>
                  <div className="font-semibold text-sm font-mono text-emerald-400">{item.tech}</div>
                  <div className="text-xs text-muted-foreground/70 mt-0.5">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}