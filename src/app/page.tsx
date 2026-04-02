"use client";

import Navbar from "@/components/sections/Navbar";
import Hero from "@/components/sections/Hero";
import CrisisStats from "@/components/sections/CrisisStats";
import Features from "@/components/sections/Features";
import Philosophy from "@/components/sections/Philosophy";
import Architecture from "@/components/sections/Architecture";
import Comparison from "@/components/sections/Comparison";
import Roadmap from "@/components/sections/Roadmap";
import Community from "@/components/sections/Community";
import Footer from "@/components/sections/Footer";

export default function Home() {
  return (
    <main data-design-id="home-page">
      <Navbar />
      <Hero />
      <CrisisStats />
      <Features />
      <Philosophy />
      <Architecture />
      <Comparison />
      <Roadmap />
      <Community />
      <Footer />
    </main>
  );
}