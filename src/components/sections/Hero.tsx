"use client";

import { motion } from "framer-motion";
import { ArrowRight, Shield, Cpu, Wrench, Star } from "lucide-react";
import GithubIcon from "@/components/icons/GithubIcon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Hero() {
  return (
    <section
      data-design-id="hero-section"
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16"
    >
      {/* Background effects */}
      <div data-design-id="hero-bg" className="absolute inset-0">
        <div className="absolute inset-0 grid-pattern opacity-30" />
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-emerald-500/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-500/6 rounded-full blur-[100px]" />
        <div className="absolute top-1/3 right-1/3 w-[300px] h-[300px] bg-cyan-500/5 rounded-full blur-[80px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-24 text-center">
        {/* Badge */}
        <motion.div
          data-design-id="hero-badge"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Badge
            variant="outline"
            className="mb-8 px-4 py-1.5 text-xs font-medium border-emerald-500/30 text-emerald-400 bg-emerald-500/5 backdrop-blur-sm"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2 animate-pulse" />
            Open Source &middot; Free Forever &middot; Phase 1 Launching Q2 2026
          </Badge>
        </motion.div>

        {/* Heading */}
        <motion.h1
          data-design-id="hero-title"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[0.95] mb-6"
        >
          <span className="block text-foreground">Write Code.</span>
          <span className="block bg-gradient-to-r from-emerald-400 via-emerald-300 to-cyan-400 bg-clip-text text-transparent glow-text-green">
            Shield Code.
          </span>
          <span className="block bg-gradient-to-r from-purple-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            Heal Code.
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          data-design-id="hero-subtitle"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground leading-relaxed mb-10"
        >
          The world&apos;s first open-source AI platform that combines a{" "}
          <span className="text-emerald-400 font-medium">Coding Assistant</span>,{" "}
          <span className="text-cyan-400 font-medium">Security Scanner</span>, and{" "}
          <span className="text-purple-400 font-medium">Self-Healing Engine</span>{" "}
          — all free, private, and multi-model.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          data-design-id="hero-cta-group"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14"
        >
          <Button
            data-design-id="hero-cta-primary"
            size="lg"
            className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-8 py-6 text-base glow-green group"
          >
            Get Started Free
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button
            data-design-id="hero-cta-github"
            size="lg"
            variant="outline"
            className="border-border/80 hover:border-emerald-500/40 hover:bg-emerald-500/5 px-8 py-6 text-base group"
          >
            <GithubIcon className="w-4 h-4 mr-2" />
            Star on GitHub
            <Star className="w-3.5 h-3.5 ml-2 text-amber-400 group-hover:scale-110 transition-transform" />
          </Button>
        </motion.div>

        {/* Pillars preview */}
        <motion.div
          data-design-id="hero-pillars"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto"
        >
          <div
            data-design-id="hero-pillar-coding"
            className="gradient-border rounded-xl bg-card/60 backdrop-blur-sm p-6 text-left hover:bg-card/80 transition-colors group"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 transition-colors">
              <Cpu className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 data-design-id="hero-pillar-coding-title" className="font-semibold text-sm mb-1.5">AI Coding Assistant</h3>
            <p data-design-id="hero-pillar-coding-desc" className="text-xs text-muted-foreground leading-relaxed">
              Multi-agent system with Architect, Frontend, Backend & QA agents
              working in parallel.
            </p>
          </div>
          <div
            data-design-id="hero-pillar-security"
            className="gradient-border rounded-xl bg-card/60 backdrop-blur-sm p-6 text-left hover:bg-card/80 transition-colors group"
          >
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center mb-4 group-hover:bg-cyan-500/20 transition-colors">
              <Shield className="w-5 h-5 text-cyan-400" />
            </div>
            <h3 data-design-id="hero-pillar-security-title" className="font-semibold text-sm mb-1.5">AI Security Scanner</h3>
            <p data-design-id="hero-pillar-security-desc" className="text-xs text-muted-foreground leading-relaxed">
              Continuous AI-driven vulnerability detection across 50+ languages
              and frameworks.
            </p>
          </div>
          <div
            data-design-id="hero-pillar-healing"
            className="gradient-border rounded-xl bg-card/60 backdrop-blur-sm p-6 text-left hover:bg-card/80 transition-colors group"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4 group-hover:bg-purple-500/20 transition-colors">
              <Wrench className="w-5 h-5 text-purple-400" />
            </div>
            <h3 data-design-id="hero-pillar-healing-title" className="font-semibold text-sm mb-1.5">Self-Healing Engine</h3>
            <p data-design-id="hero-pillar-healing-desc" className="text-xs text-muted-foreground leading-relaxed">
              Autonomous bug detection, root-cause analysis & auto-generated
              fix PRs 24/7.
            </p>
          </div>
        </motion.div>

        {/* Terminal preview */}
        <motion.div
          data-design-id="hero-terminal"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="mt-16 max-w-3xl mx-auto"
        >
          <div className="rounded-xl overflow-hidden border border-border/60 bg-card/80 backdrop-blur-sm glow-green">
            <div data-design-id="hero-terminal-bar" className="flex items-center gap-2 px-4 py-3 border-b border-border/40 bg-secondary/30">
              <span className="w-3 h-3 rounded-full bg-red-500/60" />
              <span className="w-3 h-3 rounded-full bg-amber-500/60" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/60" />
              <span className="ml-3 text-xs text-muted-foreground font-mono">nexusforge — terminal</span>
            </div>
            <div data-design-id="hero-terminal-body" className="p-6 font-mono text-sm leading-relaxed">
              <div className="text-muted-foreground">
                <span className="text-emerald-400">$</span> npx nexusforge init my-project
              </div>
              <div className="mt-2 text-muted-foreground/70">
                <span className="text-cyan-400">⟐</span> Initializing NexusForge v1.0...
              </div>
              <div className="mt-1 text-muted-foreground/70">
                <span className="text-emerald-400">✓</span> Multi-agent system ready (6 agents online)
              </div>
              <div className="mt-1 text-muted-foreground/70">
                <span className="text-emerald-400">✓</span> Security scanner activated
              </div>
              <div className="mt-1 text-muted-foreground/70">
                <span className="text-emerald-400">✓</span> Self-healing engine watching...
              </div>
              <div className="mt-1 text-muted-foreground/70">
                <span className="text-purple-400">✓</span> Connected to Ollama (Llama 4 loaded)
              </div>
              <div className="mt-3 text-foreground">
                <span className="text-emerald-400">nexusforge</span>
                <span className="text-muted-foreground"> &gt; </span>
                <span>Build a full-stack e-commerce app with auth</span>
                <span className="animate-blink text-emerald-400 ml-0.5">▊</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}