"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Terminal } from "lucide-react";
import GithubIcon from "@/components/icons/GithubIcon";
import { Button } from "@/components/ui/button";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Architecture", href: "#architecture" },
  { label: "Comparison", href: "#comparison" },
  { label: "Roadmap", href: "#roadmap" },
  { label: "Community", href: "#community" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      data-design-id="navbar-root"
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-border/50"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="#" data-design-id="navbar-logo" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center group-hover:shadow-[0_0_20px_hsl(155_80%_50%/0.4)] transition-shadow">
            <Terminal className="w-4.5 h-4.5 text-black" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            Nexus<span className="text-emerald-400">Forge</span>
          </span>
        </a>

        <nav data-design-id="navbar-links" className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              data-design-id={`navbar-link-${link.label.toLowerCase()}`}
              className="px-3.5 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-secondary/50"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div data-design-id="navbar-actions" className="hidden md:flex items-center gap-3">
          <a
            href="https://github.com/0xgetz/nexusforge"
            target="_blank"
            rel="noopener noreferrer"
            data-design-id="navbar-github-btn"
            className="flex items-center gap-2 px-3.5 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <GithubIcon className="w-4 h-4" />
            <span>GitHub</span>
          </a>
          <Button
            data-design-id="navbar-cta"
            size="sm"
            className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-5"
          >
            Get Started
          </Button>
        </div>

        <button
          data-design-id="navbar-mobile-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 text-muted-foreground hover:text-foreground"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            data-design-id="navbar-mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background/95 backdrop-blur-xl border-b border-border"
          >
            <div className="px-6 py-4 space-y-2">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground rounded-md hover:bg-secondary/50"
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-3 border-t border-border">
                <Button className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold">
                  Get Started
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}