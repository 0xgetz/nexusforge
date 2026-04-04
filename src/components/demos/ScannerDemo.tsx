"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, AlertTriangle, CheckCircle, Scan, FileCode, Database, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Vulnerability {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  type: string;
  file: string;
  line: number;
  description: string;
  cve?: string;
}

const SAMPLE_FILES = [
  { name: "src/auth/login.ts", icon: FileCode },
  { name: "src/api/users.js", icon: FileCode },
  { name: "src/db/connection.py", icon: Database },
  { name: "config/secrets.env", icon: Lock },
];

const VULNERABILITIES: Vulnerability[] = [
  {
    id: "1",
    severity: "critical",
    type: "SQL Injection",
    file: "src/api/users.js",
    line: 42,
    description: "User input concatenated directly into SQL query without sanitization",
    cve: "CVE-2025-1234",
  },
  {
    id: "2",
    severity: "high",
    type: "Hardcoded Secret",
    file: "config/secrets.env",
    line: 5,
    description: "API key 暴露在 source code. Use environment variables instead.",
  },
  {
    id: "3",
    severity: "medium",
    type: "XSS Vulnerability",
    file: "src/auth/login.ts",
    line: 28,
    description: "Unsanitized user input rendered in HTML context",
  },
  {
    id: "4",
    severity: "low",
    type: "Missing Rate Limiting",
    file: "src/auth/login.ts",
    line: 15,
    description: "No rate limiting on authentication endpoint",
  },
];

const severityColors = {
  critical: "bg-red-500 text-white",
  high: "bg-orange-500 text-white",
  medium: "bg-amber-500 text-black",
  low: "bg-blue-500 text-white",
};

const severityBorder = {
  critical: "border-red-500/50",
  high: "border-orange-500/50",
  medium: "border-amber-500/50",
  low: "border-blue-500/50",
};

export default function ScannerDemo() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState("");
  const [foundVulns, setFoundVulns] = useState<Vulnerability[]>([]);
  const [scanComplete, setScanComplete] = useState(false);

  const startScan = () => {
    setIsScanning(true);
    setScanProgress(0);
    setFoundVulns([]);
    setScanComplete(false);
    setCurrentFile("");

    let progress = 0;
    let fileIndex = 0;

    const interval = setInterval(() => {
      progress += 5;
      setScanProgress(progress);

      if (progress % 25 === 0 && fileIndex < SAMPLE_FILES.length) {
        setCurrentFile(SAMPLE_FILES[fileIndex].name);
        fileIndex++;
      }

      if (progress >= 100) {
        clearInterval(interval);
        setIsScanning(false);
        setScanComplete(true);
        setFoundVulns(VULNERABILITIES);
        setCurrentFile("");
      }
    }, 150);
  };

  return (
    <div className="rounded-xl border border-[hsl(var(--border))]/60 bg-card/80 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[hsl(var(--border))]/40 bg-secondary/30">
        <Shield className="w-4 h-4 text-cyan-400" />
        <span className="text-xs font-medium text-muted-foreground">Security Scanner</span>
        <div className="ml-auto flex items-center gap-2">
          {isScanning && (
            <span className="text-[10px] text-cyan-400 font-medium animate-pulse">Scanning...</span>
          )}
          {scanComplete && (
            <span className="text-[10px] text-emerald-400 font-medium">Scan Complete</span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 h-64 overflow-y-auto">
        {!isScanning && !scanComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-full py-8"
          >
            <Scan className="w-12 h-12 text-cyan-400 mb-4" />
            <p className="text-muted-foreground text-sm mb-4 text-center">
              Scan your codebase for vulnerabilities
            </p>
            <Button
              onClick={startScan}
              className="bg-cyan-500 hover:bg-cyan-400 text-black font-medium"
            >
              Start Security Scan
            </Button>
          </motion.div>
        )}

        {isScanning && (
          <div className="space-y-4">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Scanning...</span>
                <span className="text-cyan-400 font-medium">{scanProgress}%</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${scanProgress}%` }}
                />
              </div>
            </div>

            {/* Current File */}
            {currentFile && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/30 rounded-lg px-3 py-2"
              >
                <FileCode className="w-4 h-4 text-cyan-400" />
                <span className="font-mono text-xs">{currentFile}</span>
              </motion.div>
            )}

            {/* Found so far */}
            {foundVulns.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Found {foundVulns.length} vulnerability{foundVulns.length > 1 ? "ies" : ""} so far...
                </p>
              </div>
            )}
          </div>
        )}

        {scanComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            {/* Summary */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-xs text-muted-foreground">
                  {foundVulns.filter((v) => v.severity === "critical").length} Critical
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                <span className="text-xs text-muted-foreground">
                  {foundVulns.filter((v) => v.severity === "high").length} High
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-xs text-muted-foreground">
                  {foundVulns.filter((v) => v.severity === "medium").length} Medium
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-xs text-muted-foreground">
                  {foundVulns.filter((v) => v.severity === "low").length} Low
                </span>
              </div>
            </div>

            {/* Vulnerabilities List */}
            <AnimatePresence>
              {foundVulns.map((vuln, idx) => (
                <motion.div
                  key={vuln.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`rounded-lg border p-3 ${severityBorder[vuln.severity]} bg-secondary/20`}
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className={`w-4 h-4 mt-0.5 ${severityColors[vuln.severity]} rounded-sm p-0.5`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${severityColors[vuln.severity]}`}>
                          {vuln.severity.toUpperCase()}
                        </span>
                        <span className="text-xs font-medium text-foreground">{vuln.type}</span>
                        {vuln.cve && (
                          <span className="text-[10px] text-muted-foreground font-mono">{vuln.cve}</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">{vuln.description}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        {vuln.file}:{vuln.line}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            <Button
              onClick={startScan}
              variant="outline"
              size="sm"
              className="w-full mt-4 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
            >
              Scan Again
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
