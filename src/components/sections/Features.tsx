"use client";

import { motion } from "framer-motion";
import {
  Cpu,
  Shield,
  Wrench,
  BrainCircuit,
  Globe,
  Lock,
  Layers,
  Zap,
  GitPullRequest,
} from "lucide-react";

const pillars = [
  {
    id: "coding",
    icon: Cpu,
    color: "emerald",
    gradient: "from-emerald-500 to-emerald-700",
    title: "AI Coding Assistant",
    subtitle: "Pillar 1",
    description:
      "A multi-agent coding system rivaling premium tools — completely free. Describe what you want in plain English, and our agent swarm builds it collaboratively.",
    features: [
      {
        icon: BrainCircuit,
        text: "6 specialized agents (Coordinator, Architect, Frontend, Backend, QA, Security)",
      },
      {
        icon: Layers,
        text: "Contextual code generation that understands your entire codebase",
      },
      {
        icon: Zap,
        text: "Parallel task execution with intelligent work decomposition",
      },
    ],
  },
  {
    id: "security",
    icon: Shield,
    color: "cyan",
    gradient: "from-cyan-500 to-cyan-700",
    title: "AI Security Scanner",
    subtitle: "Pillar 2",
    description:
      "AI-driven semantic analysis that goes beyond pattern matching. Detects zero-day patterns, logic flaws, and complex vulnerabilities traditional scanners miss.",
    features: [
      {
        icon: Globe,
        text: "Supports 50+ programming languages and frameworks",
      },
      {
        icon: GitPullRequest,
        text: "Automatic analysis on every commit, PR, and dependency change",
      },
      {
        icon: Shield,
        text: "Impact analysis + PoC exploit scripts + specific fix recommendations",
      },
    ],
  },
  {
    id: "healing",
    icon: Wrench,
    color: "purple",
    gradient: "from-purple-500 to-purple-700",
    title: "Self-Healing Engine",
    subtitle: "Pillar 3",
    description:
      "The industry's first production-ready self-healing code system. Your codebase's immune system that works 24/7 — detecting, diagnosing, and fixing issues autonomously.",
    features: [
      {
        icon: Zap,
        text: "3-phase process: Detection → Diagnosis → Repair, fully automated",
      },
      {
        icon: GitPullRequest,
        text: "Auto-generated pull requests with full documentation and test coverage",
      },
      {
        icon: Lock,
        text: "Production monitoring integration with real-time anomaly detection",
      },
    ],
  },
];

const colorMap: Record<string, { iconBg: string; iconText: string; badge: string; featureIcon: string }> = {
  emerald: {
    iconBg: "bg-emerald-500/10",
    iconText: "text-emerald-400",
    badge: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    featureIcon: "text-emerald-400/70",
  },
  cyan: {
    iconBg: "bg-cyan-500/10",
    iconText: "text-cyan-400",
    badge: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    featureIcon: "text-cyan-400/70",
  },
  purple: {
    iconBg: "bg-purple-500/10",
    iconText: "text-purple-400",
    badge: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    featureIcon: "text-purple-400/70",
  },
};

export default function Features() {
  return (
    <section data-design-id="features-section" id="features" className="relative py-28 overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[150px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6">
        <motion.div
          data-design-id="features-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <span data-design-id="features-label" className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-4 block">
            Three Pillars
          </span>
          <h2 data-design-id="features-title" className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
            One Platform.{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Complete Protection.
            </span>
          </h2>
          <p data-design-id="features-desc" className="text-muted-foreground max-w-2xl mx-auto text-base leading-relaxed">
            No other tool combines coding, security, and self-healing. NexusForge
            is the first — and it&apos;s free.
          </p>
        </motion.div>

        <div data-design-id="features-pillars" className="space-y-8">
          {pillars.map((pillar, idx) => {
            const colors = colorMap[pillar.color];
            return (
              <motion.div
                key={pillar.id}
                data-design-id={`feature-pillar-${pillar.id}`}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="gradient-border rounded-2xl bg-card/50 backdrop-blur-sm p-8 md:p-10 hover:bg-card/70 transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-start gap-8">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-5">
                      <div
                        className={`w-12 h-12 rounded-xl ${colors.iconBg} flex items-center justify-center`}
                      >
                        <pillar.icon className={`w-6 h-6 ${colors.iconText}`} />
                      </div>
                      <div>
                        <span
                          className={`text-[10px] uppercase tracking-widest font-semibold px-2.5 py-0.5 rounded-full border ${colors.badge}`}
                        >
                          {pillar.subtitle}
                        </span>
                        <h3
                          data-design-id={`feature-pillar-${pillar.id}-title`}
                          className="text-xl font-bold mt-1"
                        >
                          {pillar.title}
                        </h3>
                      </div>
                    </div>
                    <p
                      data-design-id={`feature-pillar-${pillar.id}-desc`}
                      className="text-muted-foreground text-sm leading-relaxed mb-6"
                    >
                      {pillar.description}
                    </p>
                    <div className="space-y-3">
                      {pillar.features.map((feat, fIdx) => (
                        <div
                          key={fIdx}
                          data-design-id={`feature-pillar-${pillar.id}-feat-${fIdx}`}
                          className="flex items-start gap-3"
                        >
                          <span className={`w-5 h-5 mt-0.5 flex-shrink-0 ${colors.featureIcon}`}>
                            <feat.icon className="w-5 h-5" />
                          </span>
                          <span className="text-sm text-muted-foreground">{feat.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}