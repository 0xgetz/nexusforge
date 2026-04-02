"use client";

import { motion } from "framer-motion";
import { Rocket, Shield, Wrench, Puzzle } from "lucide-react";

const phases = [
  {
    phase: "Phase 1",
    title: "Foundation",
    timeline: "Q2 2026 (Apr–Jun)",
    icon: Rocket,
    color: "emerald",
    borderColor: "border-emerald-500/40",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-400",
    dotColor: "bg-emerald-400",
    items: [
      "Interactive CLI terminal with rich UI (Ink)",
      "Multi-model integration (Ollama, Claude, GPT)",
      "Basic code generation & completion",
      "Syntax highlighting & Vim keybindings",
      "Project scaffolding & context awareness",
    ],
    status: "In Development",
  },
  {
    phase: "Phase 2",
    title: "Security",
    timeline: "Q3 2026 (Jul–Sep)",
    icon: Shield,
    color: "cyan",
    borderColor: "border-cyan-500/40",
    iconBg: "bg-cyan-500/10",
    iconColor: "text-cyan-400",
    dotColor: "bg-cyan-400",
    items: [
      "Real-time vulnerability scanner",
      "Dependency health monitor",
      "CVE database sync & alerting",
      "GitHub Actions / GitLab CI integration",
      "Automated security reports",
    ],
    status: "Planned",
  },
  {
    phase: "Phase 3",
    title: "Healing",
    timeline: "Q4 2026 (Oct–Dec)",
    icon: Wrench,
    color: "purple",
    borderColor: "border-purple-500/40",
    iconBg: "bg-purple-500/10",
    iconColor: "text-purple-400",
    dotColor: "bg-purple-400",
    items: [
      "Autonomous bug detection engine",
      "Root cause analysis with AI reasoning",
      "Auto-generated fix pull requests",
      "Production monitoring integration",
      "Self-healing pipeline orchestration",
    ],
    status: "Planned",
  },
  {
    phase: "Phase 4",
    title: "Ecosystem",
    timeline: "Q1–Q2 2027",
    icon: Puzzle,
    color: "amber",
    borderColor: "border-amber-500/40",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-400",
    dotColor: "bg-amber-400",
    items: [
      "Plugin SDK & open marketplace",
      "Visual app builder (no-code layer)",
      "One-click deployment integration",
      "Collaborative mode & team features",
      "Mobile support & companion app",
    ],
    status: "Vision",
  },
];

export default function Roadmap() {
  return (
    <section data-design-id="roadmap-section" id="roadmap" className="relative py-28 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/3 to-transparent" />

      <div className="relative max-w-5xl mx-auto px-6">
        <motion.div
          data-design-id="roadmap-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <span data-design-id="roadmap-label" className="text-xs font-semibold uppercase tracking-widest text-amber-400 mb-4 block">
            The Journey
          </span>
          <h2 data-design-id="roadmap-title" className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
            Development{" "}
            <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              Roadmap
            </span>
          </h2>
          <p data-design-id="roadmap-desc" className="text-muted-foreground max-w-xl mx-auto text-base">
            Four iterative phases, each delivering real value while building
            toward the complete vision.
          </p>
        </motion.div>

        <div data-design-id="roadmap-timeline" className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-emerald-500/40 via-purple-500/30 to-amber-500/20 hidden md:block" />

          <div className="space-y-12">
            {phases.map((phase, idx) => (
              <motion.div
                key={phase.phase}
                data-design-id={`roadmap-phase-${idx + 1}`}
                initial={{ opacity: 0, x: idx % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className={`relative md:flex ${idx % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"} items-start gap-8`}
              >
                {/* Dot on timeline */}
                <div className="hidden md:block absolute left-1/2 -translate-x-1/2 top-6">
                  <div className={`w-4 h-4 rounded-full ${phase.dotColor} ring-4 ring-background`} />
                </div>

                {/* Card */}
                <div className={`md:w-[calc(50%-2rem)] ${idx % 2 === 0 ? "md:text-right md:pr-8" : "md:text-left md:pl-8"}`}>
                  <div
                    className={`gradient-border rounded-xl border ${phase.borderColor} bg-card/50 backdrop-blur-sm p-6 text-left`}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 rounded-lg ${phase.iconBg} flex items-center justify-center`}>
                        <phase.icon className={`w-5 h-5 ${phase.iconColor}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">{phase.phase}: {phase.title}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            phase.status === "In Development"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : phase.status === "Planned"
                              ? "bg-cyan-500/10 text-cyan-400"
                              : "bg-amber-500/10 text-amber-400"
                          }`}>
                            {phase.status}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">{phase.timeline}</span>
                      </div>
                    </div>
                    <ul className="space-y-2">
                      {phase.items.map((item, iIdx) => (
                        <li
                          key={iIdx}
                          data-design-id={`roadmap-phase-${idx + 1}-item-${iIdx}`}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${phase.dotColor} mt-1.5 flex-shrink-0`} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}