"use client";

import { Terminal, Heart } from "lucide-react";
import GithubIcon from "@/components/icons/GithubIcon";

export default function Footer() {
  return (
    <footer data-design-id="footer-section" className="border-t border-border/30 bg-card/20">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div data-design-id="footer-content" className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div data-design-id="footer-brand" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
              <Terminal className="w-3.5 h-3.5 text-black" />
            </div>
            <span className="text-sm font-bold">
              Nexus<span className="text-emerald-400">Forge</span>
            </span>
          </div>

          <div data-design-id="footer-links" className="flex items-center gap-6 text-xs text-muted-foreground">
            <a href="https://github.com/0xgetz/nexusforge" className="hover:text-foreground transition-colors flex items-center gap-1.5">
              <GithubIcon className="w-3.5 h-3.5" /> GitHub
            </a>
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#roadmap" className="hover:text-foreground transition-colors">Roadmap</a>
            <a href="#" className="hover:text-foreground transition-colors">Docs</a>
          </div>

          <div data-design-id="footer-copyright" className="text-xs text-muted-foreground flex items-center gap-1">
            Built with <Heart className="w-3 h-3 text-red-400 inline" /> by{" "}
            <a href="https://github.com/0xgetz" className="text-emerald-400 hover:text-emerald-300">
              0xgetz
            </a>{" "}
            &middot; MIT License &middot; 2026
          </div>
        </div>
      </div>
    </footer>
  );
}