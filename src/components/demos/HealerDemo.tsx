"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wrench, CheckCircle, AlertTriangle, Code, GitPullRequest, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const CODE_EXAMPLES = [
  {
    id: "sql-injection",
    issue: "SQL Injection Vulnerability",
    severity: "critical",
    before: `// VULNERABLE: Direct string concatenation
app.get('/user', (req, res) => {
  const userId = req.query.id;
  const query = "SELECT * FROM users WHERE id = " + userId;
  db.execute(query);
});`,
    after: `// FIXED: Parameterized query
app.get('/user', (req, res) => {
  const userId = req.query.id;
  const query = "SELECT * FROM users WHERE id = ?";
  db.execute(query, [userId]);
});`,
    explanation: "Replaced string concatenation with parameterized query to prevent SQL injection attacks.",
  },
  {
    id: "hardcoded-secret",
    issue: "Hardcoded API Key",
    severity: "high",
    before: `// VULNERABLE: Exposed secret
const API_KEY = "sk-1234567890abcdef";
const config = {
  apiKey: API_KEY,
  endpoint: "https://api.example.com"
};`,
    after: `// FIXED: Environment variable
const API_KEY = process.env.API_KEY;
const config = {
  apiKey: API_KEY,
  endpoint: "https://api.example.com"
};`,
    explanation: "Moved sensitive API key to environment variable to prevent exposure in source code.",
  },
  {
    id: "xss-prevention",
    issue: "XSS Vulnerability",
    severity: "medium",
    before: `// VULNERABLE: Unsanitized output
function renderComment(comment) {
  return '<div class="comment">' + comment + '</div>';
}
document.body.innerHTML += renderComment(userInput);`,
    after: `// FIXED: Proper escaping
function renderComment(comment) {
  const div = document.createElement('div');
  div.className = 'comment';
  div.textContent = comment; // Auto-escapes
  return div;
}
document.body.appendChild(renderComment(userInput));`,
    explanation: "Used textContent instead of innerHTML to automatically escape special characters and prevent XSS.",
  },
];

export default function HealerDemo() {
  const [currentExample, setCurrentExample] = useState(0);
  const [isHealing, setIsHealing] = useState(false);
  const [showFix, setShowFix] = useState(false);
  const [step, setStep] = useState<"idle" | "detecting" | "analyzing" | "fixing" | "complete">("idle");

  const example = CODE_EXAMPLES[currentExample];

  const startHealing = () => {
    setIsHealing(true);
    setShowFix(false);
    setStep("detecting");

    setTimeout(() => setStep("analyzing"), 800);
    setTimeout(() => setStep("fixing"), 1600);
    setTimeout(() => {
      setStep("complete");
      setShowFix(true);
      setIsHealing(false);
    }, 2400);
  };

  const nextExample = () => {
    setCurrentExample((prev) => (prev + 1) % CODE_EXAMPLES.length);
    setShowFix(false);
    setStep("idle");
  };

  const prevExample = () => {
    setCurrentExample((prev) => (prev - 1 + CODE_EXAMPLES.length) % CODE_EXAMPLES.length);
    setShowFix(false);
    setStep("idle");
  };

  return (
    <div className="rounded-xl border border-[hsl(var(--border))]/60 bg-card/80 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[hsl(var(--border))]/40 bg-secondary/30">
        <Wrench className="w-4 h-4 text-purple-400" />
        <span className="text-xs font-medium text-muted-foreground">Self-Healing Engine</span>
        <div className="ml-auto flex items-center gap-2">
          {step !== "idle" && step !== "complete" && (
            <span className="text-[10px] text-purple-400 font-medium animate-pulse">
              {step === "detecting" && "Detecting issues..."}
              {step === "analyzing" && "Analyzing root cause..."}
              {step === "fixing" && "Generating fix..."}
            </span>
          )}
          {step === "complete" && (
            <span className="text-[10px] text-emerald-400 font-medium">Fix Generated</span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 h-64 overflow-hidden flex flex-col">
        {/* Issue Badge */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-medium text-foreground">{example.issue}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              onClick={prevExample}
              variant="outline"
              size="sm"
              className="h-6 px-2 text-xs border-[hsl(var(--border))]/50"
            >
              ←
            </Button>
            <span className="text-[10px] text-muted-foreground w-12 text-center">
              {currentExample + 1}/{CODE_EXAMPLES.length}
            </span>
            <Button
              onClick={nextExample}
              variant="outline"
              size="sm"
              className="h-6 px-2 text-xs border-[hsl(var(--border))]/50"
            >
              →
            </Button>
          </div>
        </div>

        {/* Code Comparison */}
        <div className="flex-1 grid grid-cols-2 gap-3 min-h-0">
          {/* Before */}
          <div className="rounded-lg border border-red-500/30 bg-red-500/5 overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-red-500/20 bg-red-500/10">
              <Code className="w-3.5 h-3.5 text-red-400" />
              <span className="text-[10px] font-medium text-red-400">BEFORE</span>
            </div>
            <div className="flex-1 overflow-auto">
              <pre className="p-3 text-[10px] leading-relaxed font-mono text-red-300/90">
                <code>{example.before}</code>
              </pre>
            </div>
          </div>

          {/* After */}
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-emerald-500/20 bg-emerald-500/10">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] font-medium text-emerald-400">AFTER</span>
            </div>
            <div className="flex-1 overflow-auto relative">
              <AnimatePresence>
                {showFix ? (
                  <motion.pre
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-3 text-[10px] leading-relaxed font-mono text-emerald-300/90"
                  >
                    <code>{example.after}</code>
                  </motion.pre>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    {step === "complete" ? (
                      <Sparkles className="w-6 h-6 text-emerald-400" />
                    ) : isHealing ? (
                      <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                    ) : null}
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Explanation */}
        <AnimatePresence>
          {showFix && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
            >
              <p className="text-[10px] text-emerald-300 leading-relaxed">
                <span className="font-semibold">Fix applied:</span> {example.explanation}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Button */}
        <div className="mt-3 flex justify-center">
          {step === "idle" || step === "complete" ? (
            <Button
              onClick={startHealing}
              className="bg-purple-500 hover:bg-purple-400 text-white font-medium text-xs px-6"
            >
              {step === "complete" ? (
                <>
                  <GitPullRequest className="w-3.5 h-3.5 mr-2" />
                  Create Fix PR
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 mr-2" />
                  Auto-Fix Issue
                </>
              )}
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${
                  step === "detecting" ? "bg-amber-400 animate-pulse" : "bg-purple-500/30"
                }`} />
                <span className="text-[10px] text-muted-foreground">Detect</span>
              </div>
              <div className="w-4 h-px bg-border" />
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${
                  step === "analyzing" ? "bg-amber-400 animate-pulse" : "bg-purple-500/30"
                }`} />
                <span className="text-[10px] text-muted-foreground">Analyze</span>
              </div>
              <div className="w-4 h-px bg-border" />
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${
                  step === "fixing" ? "bg-amber-400 animate-pulse" : "bg-purple-500/30"
                }`} />
                <span className="text-[10px] text-muted-foreground">Fix</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
