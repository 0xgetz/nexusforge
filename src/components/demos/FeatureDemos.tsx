"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CliDemo from "./CliDemo";
import ScannerDemo from "./ScannerDemo";
import HealerDemo from "./HealerDemo";

export default function FeatureDemos() {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <Tabs defaultValue="cli" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6 bg-secondary/30">
          <TabsTrigger
            value="cli"
            className="data-[state=active]:bg-emerald-500 data-[state=active]:text-black"
          >
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              AI Coding
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="scanner"
            className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black"
          >
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              Security Scanner
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="healer"
            className="data-[state=active]:bg-purple-500 data-[state=active]:text-black"
          >
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              Self-Healing
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cli" className="mt-0">
          <CliDemo />
        </TabsContent>

        <TabsContent value="scanner" className="mt-0">
          <ScannerDemo />
        </TabsContent>

        <TabsContent value="healer" className="mt-0">
          <HealerDemo />
        </TabsContent>
      </Tabs>
    </div>
  );
}
