"use client";

import { motion } from "framer-motion";
import { AlertTriangle, TrendingUp, ShieldAlert, Package } from "lucide-react";

const stats = [
  {
    icon: AlertTriangle,
    metric: "581",
    label: "Avg. vulnerabilities per codebase",
    change: "+107%",
    color: "text-red-400",
    bgColor: "bg-red-500/10",
  },
  {
    icon: TrendingUp,
    metric: "237",
    label: "Unique vulnerabilities per codebase",
    change: "+61%",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
  },
  {
    icon: ShieldAlert,
    metric: "65%",
    label: "Codebases with high-risk vulnerabilities",
    change: "+21pp",
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
  },
  {
    icon: Package,
    metric: "98%",
    label: "Codebases using open-source components",
    change: "+2pp",
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function CrisisStats() {
  return (
    <section data-design-id="crisis-section" className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-500/3 to-transparent" />
      <div className="relative max-w-7xl mx-auto px-6">
        <motion.div
          data-design-id="crisis-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span data-design-id="crisis-label" className="text-xs font-semibold uppercase tracking-widest text-red-400 mb-4 block">
            The 2026 Crisis
          </span>
          <h2 data-design-id="crisis-title" className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
            Open-Source Security Is{" "}
            <span className="text-red-400">Breaking</span>
          </h2>
          <p data-design-id="crisis-desc" className="text-muted-foreground max-w-2xl mx-auto text-base leading-relaxed">
            The OSSRA 2026 report reveals a critical surge in vulnerabilities.
            AI-generated code is accelerating the problem. NexusForge is the
            antidote.
          </p>
        </motion.div>

        <motion.div
          data-design-id="crisis-grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              variants={itemVariants}
              data-design-id={`crisis-stat-${stat.metric}`}
              className="gradient-border rounded-xl bg-card/60 backdrop-blur-sm p-6 text-center hover:bg-card/80 transition-colors"
            >
              <div
                className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center mx-auto mb-4`}
              >
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className={`text-4xl font-extrabold ${stat.color} mb-1`}>
                {stat.metric}
              </div>
              <div className="text-xs text-muted-foreground mb-3 leading-relaxed">
                {stat.label}
              </div>
              <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-semibold">
                {stat.change} YoY
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.p
          data-design-id="crisis-source"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center text-xs text-muted-foreground/60 mt-8"
        >
          Source: OSSRA 2026 — Black Duck Software
        </motion.p>
      </div>
    </section>
  );
}