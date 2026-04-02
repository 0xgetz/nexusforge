"use client";

import { motion } from "framer-motion";
import { Check, X, Minus } from "lucide-react";

type CellValue = "yes" | "no" | "partial" | "free" | string;

interface Feature {
  name: string;
  nexusforge: CellValue;
  claude: CellValue;
  cursor: CellValue;
  aider: CellValue;
}

const features: Feature[] = [
  { name: "AI Coding Assistant", nexusforge: "yes", claude: "yes", cursor: "yes", aider: "partial" },
  { name: "Multi-Model Support", nexusforge: "yes", claude: "no", cursor: "no", aider: "yes" },
  { name: "Security Scanning", nexusforge: "yes", claude: "no", cursor: "no", aider: "no" },
  { name: "Self-Healing Engine", nexusforge: "yes", claude: "no", cursor: "no", aider: "no" },
  { name: "Privacy-First / Local", nexusforge: "yes", claude: "no", cursor: "no", aider: "yes" },
  { name: "100% Free", nexusforge: "free", claude: "$20/mo", cursor: "$20/mo", aider: "free" },
  { name: "Plugin Ecosystem", nexusforge: "yes", claude: "partial", cursor: "partial", aider: "no" },
  { name: "Multi-Agent System", nexusforge: "yes", claude: "no", cursor: "no", aider: "no" },
];

function CellIcon({ value }: { value: CellValue }) {
  if (value === "yes" || value === "free") {
    return (
      <div className="flex items-center justify-center gap-1.5">
        <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <Check className="w-3 h-3 text-emerald-400" />
        </span>
        {value === "free" && <span className="text-[10px] text-emerald-400 font-semibold">FREE</span>}
      </div>
    );
  }
  if (value === "no") {
    return (
      <span className="w-5 h-5 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
        <X className="w-3 h-3 text-red-400/60" />
      </span>
    );
  }
  if (value === "partial") {
    return (
      <span className="w-5 h-5 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto">
        <Minus className="w-3 h-3 text-amber-400/60" />
      </span>
    );
  }
  return <span className="text-xs text-muted-foreground">{value}</span>;
}

export default function Comparison() {
  return (
    <section data-design-id="comparison-section" id="comparison" className="relative py-28 overflow-hidden">
      <div className="relative max-w-5xl mx-auto px-6">
        <motion.div
          data-design-id="comparison-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span data-design-id="comparison-label" className="text-xs font-semibold uppercase tracking-widest text-cyan-400 mb-4 block">
            How We Compare
          </span>
          <h2 data-design-id="comparison-title" className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
            Why Choose{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              NexusForge?
            </span>
          </h2>
          <p data-design-id="comparison-desc" className="text-muted-foreground max-w-xl mx-auto text-base">
            The only platform that combines all three pillars — and it&apos;s completely free.
          </p>
        </motion.div>

        <motion.div
          data-design-id="comparison-table"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="overflow-x-auto"
        >
          <table className="w-full text-sm">
            <thead>
              <tr data-design-id="comparison-table-head" className="border-b border-border/50">
                <th className="text-left py-4 px-4 text-muted-foreground font-medium text-xs">Feature</th>
                <th className="py-4 px-4 text-center">
                  <span className="text-emerald-400 font-bold text-sm">NexusForge</span>
                </th>
                <th className="py-4 px-4 text-center text-muted-foreground font-medium text-xs">Claude Code</th>
                <th className="py-4 px-4 text-center text-muted-foreground font-medium text-xs">Cursor</th>
                <th className="py-4 px-4 text-center text-muted-foreground font-medium text-xs">Aider</th>
              </tr>
            </thead>
            <tbody>
              {features.map((feat, idx) => (
                <tr
                  key={feat.name}
                  data-design-id={`comparison-row-${idx}`}
                  className="border-b border-border/20 hover:bg-secondary/20 transition-colors"
                >
                  <td className="py-3.5 px-4 text-sm font-medium">{feat.name}</td>
                  <td className="py-3.5 px-4 text-center bg-emerald-500/[0.03]">
                    <CellIcon value={feat.nexusforge} />
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <CellIcon value={feat.claude} />
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <CellIcon value={feat.cursor} />
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <CellIcon value={feat.aider} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
    </section>
  );
}