"use client";

import { motion } from "framer-motion";
import { Star, Users, Globe, Heart, ArrowRight, BookOpen, MessageCircle } from "lucide-react";
import GithubIcon from "@/components/icons/GithubIcon";
import { Button } from "@/components/ui/button";

const stats = [
  { value: "50K+", label: "Star target (6 months)", icon: Star, color: "text-amber-400" },
  { value: "36M+", label: "New devs on GitHub in 2025", icon: Users, color: "text-emerald-400" },
  { value: "100%", label: "Free & open-source", icon: Heart, color: "text-red-400" },
  { value: "50+", label: "Languages supported", icon: Globe, color: "text-cyan-400" },
];

export default function Community() {
  return (
    <section data-design-id="community-section" id="community" className="relative py-28 overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-emerald-500/5 rounded-full blur-[150px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6">
        <motion.div
          data-design-id="community-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span data-design-id="community-label" className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-4 block">
            Join The Movement
          </span>
          <h2 data-design-id="community-title" className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
            Built by the{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Community
            </span>
          </h2>
          <p data-design-id="community-desc" className="text-muted-foreground max-w-2xl mx-auto text-base leading-relaxed">
            NexusForge is designed for organic growth. With an open plugin ecosystem,
            multilingual docs, and beginner-friendly onboarding — everyone belongs here.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          data-design-id="community-stats"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16"
        >
          {stats.map((stat, idx) => (
            <div
              key={stat.label}
              data-design-id={`community-stat-${idx}`}
              className="rounded-xl bg-card/40 border border-border/30 p-5 text-center hover:border-emerald-500/20 transition-colors"
            >
              <stat.icon className={`w-5 h-5 mx-auto mb-2 ${stat.color}`} />
              <div className="text-2xl font-extrabold mb-1">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Contribute Cards */}
        <motion.div
          data-design-id="community-contribute"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-16"
        >
          <div data-design-id="community-card-contribute" className="gradient-border rounded-xl bg-card/50 p-6 hover:bg-card/70 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4">
              <GithubIcon className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 data-design-id="community-card-contribute-title" className="font-semibold text-sm mb-2">Contribute Code</h3>
            <p data-design-id="community-card-contribute-desc" className="text-xs text-muted-foreground leading-relaxed mb-4">
              Pick up issues, submit PRs, or build plugins. Every contribution matters.
            </p>
            <a href="https://github.com/0xgetz/nexusforge" className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
              View Repository <ArrowRight className="w-3 h-3" />
            </a>
          </div>
          <div data-design-id="community-card-docs" className="gradient-border rounded-xl bg-card/50 p-6 hover:bg-card/70 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center mb-4">
              <BookOpen className="w-5 h-5 text-cyan-400" />
            </div>
            <h3 data-design-id="community-card-docs-title" className="font-semibold text-sm mb-2">Read the Docs</h3>
            <p data-design-id="community-card-docs-desc" className="text-xs text-muted-foreground leading-relaxed mb-4">
              Comprehensive documentation in multiple languages including English and Indonesian.
            </p>
            <a href="#" className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
              Documentation <ArrowRight className="w-3 h-3" />
            </a>
          </div>
          <div data-design-id="community-card-discuss" className="gradient-border rounded-xl bg-card/50 p-6 hover:bg-card/70 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4">
              <MessageCircle className="w-5 h-5 text-purple-400" />
            </div>
            <h3 data-design-id="community-card-discuss-title" className="font-semibold text-sm mb-2">Join Discussions</h3>
            <p data-design-id="community-card-discuss-desc" className="text-xs text-muted-foreground leading-relaxed mb-4">
              Share ideas, report bugs, and connect with other developers building with NexusForge.
            </p>
            <a href="#" className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1">
              GitHub Discussions <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          data-design-id="community-cta"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="gradient-border rounded-2xl bg-gradient-to-br from-emerald-500/5 via-card/50 to-purple-500/5 backdrop-blur-sm p-12">
            <h3 data-design-id="community-cta-title" className="text-2xl md:text-3xl font-extrabold mb-4">
              Ready to forge the future of code?
            </h3>
            <p data-design-id="community-cta-desc" className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Star the repo, try the CLI, or contribute a PR. NexusForge is yours.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                data-design-id="community-cta-btn-primary"
                size="lg"
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-8 glow-green group"
              >
                <GithubIcon className="w-4 h-4 mr-2" />
                Star on GitHub
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                data-design-id="community-cta-btn-secondary"
                size="lg"
                variant="outline"
                className="border-border/80 hover:border-emerald-500/40 hover:bg-emerald-500/5 px-8"
              >
                Read the Docs
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}