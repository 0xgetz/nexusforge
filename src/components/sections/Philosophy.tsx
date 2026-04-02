"use client";

import { motion } from "framer-motion";
import { Shield, Wrench, Lock, Layers } from "lucide-react";

const principles = [
  {
    icon: Shield,
    title: "Security-First by Default",
    description:
      "Security isn't a bolt-on feature — it's the foundation. Every line of generated code, every recommended dependency, every proposed change passes through multi-level security analysis.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  {
    icon: Wrench,
    title: "Autonomous Healing",
    description:
      "The system doesn't just detect problems — it autonomously analyzes root causes, proposes solutions, and applies fixes. Zero-touch code maintenance becomes reality.",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
  },
  {
    icon: Lock,
    title: "Privacy-Preserving Architecture",
    description:
      "All analysis and healing can run entirely locally. Your code never leaves your machine. GDPR and HIPAA compliant by design, not by afterthought.",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
  },
  {
    icon: Layers,
    title: "Model Agnosticism",
    description:
      "Not locked into any single AI provider. Supports Llama 4, DeepSeek, Claude, GPT-4o, Mistral, and local models via Ollama. Your choice, always.",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
];

export default function Philosophy() {
  return (
    <section data-design-id="philosophy-section" className="relative py-28 overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-6">
        <motion.div
          data-design-id="philosophy-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span data-design-id="philosophy-label" className="text-xs font-semibold uppercase tracking-widest text-violet-400 mb-4 block">
            Our Principles
          </span>
          <h2 data-design-id="philosophy-title" className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
            Design{" "}
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              Philosophy
            </span>
          </h2>
          <p data-design-id="philosophy-desc" className="text-muted-foreground max-w-2xl mx-auto text-base leading-relaxed">
            Every developer deserves world-class AI tools — regardless of budget.
            NexusForge is built on four non-negotiable principles.
          </p>
        </motion.div>

        <div data-design-id="philosophy-grid" className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {principles.map((principle, idx) => (
            <motion.div
              key={principle.title}
              data-design-id={`philosophy-card-${idx}`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className={`rounded-xl border ${principle.border} bg-card/40 backdrop-blur-sm p-7 hover:bg-card/60 transition-colors group`}
            >
              <div className={`w-11 h-11 rounded-xl ${principle.bg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                <principle.icon className={`w-5.5 h-5.5 ${principle.color}`} />
              </div>
              <h3 data-design-id={`philosophy-card-${idx}-title`} className="font-bold text-base mb-2">
                {principle.title}
              </h3>
              <p data-design-id={`philosophy-card-${idx}-desc`} className="text-sm text-muted-foreground leading-relaxed">
                {principle.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}