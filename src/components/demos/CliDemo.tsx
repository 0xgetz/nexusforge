"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Terminal, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED_PROMPTS = [
  "Create a REST API with Express",
  "Build a login page with React",
  "Add database models for users",
];

const SAMPLE_RESPONSES: Record<string, string> = {
  "Create a REST API with Express": `I'll create a REST API with Express.js for you.\n\n**Generated files:**\n• server.js - Main Express server\n• routes/api.js - API endpoints\n• middleware/auth.js - Authentication\n• config/database.js - Database connection\n\n**Features included:**\n✓ JWT authentication\n✓ Input validation\n✓ Error handling\n✓ CORS configuration\n\nShould I proceed with generating these files?`,
  "Build a login page with React": `I'll build a modern login page with React and Tailwind CSS.\n\n**Generated components:**\n• LoginForm.tsx - Main form component\n• Input.tsx - Reusable input field\n• Button.tsx - Styled button\n• login.schema.ts - Zod validation\n\n**Features included:**\n✓ Email/password validation\n✓ Loading states\n✓ Error messages\n✓ Remember me option\n\nWould you like me to add social login buttons?`,
  "Add database models for users": `I'll create database models for user management.\n\n**Generated models:**\n• User.ts - Main user model\n• Profile.ts - Extended user profile\n• Session.ts - Session management\n\n**Schema includes:**\n✓ Email uniqueness constraint\n✓ Password hashing (bcrypt)\n✓ Role-based access\n✓ Timestamps (created/updated)\n\nShould I also add indexes for common queries?`,
};

export default function CliDemo() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [displayedResponse, setDisplayedResponse] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, displayedResponse]);

  const typeResponse = (fullResponse: string) => {
    setIsTyping(true);
    setDisplayedResponse("");
    let index = 0;
    const interval = setInterval(() => {
      setDisplayedResponse(fullResponse.substring(0, index + 1));
      index++;
      if (index >= fullResponse.length) {
        clearInterval(interval);
        setIsTyping(false);
        setMessages((prev) => [...prev, { role: "assistant", content: fullResponse }]);
        setDisplayedResponse("");
      }
    }, 15);
  };

  const handleSendMessage = (prompt?: string) => {
    const message = prompt || inputValue;
    if (!message.trim()) return;

    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setInputValue("");

    const response = SAMPLE_RESPONSES[message] || Object.values(SAMPLE_RESPONSES)[0];
    setTimeout(() => typeResponse(response), 400);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="rounded-xl border border-[hsl(var(--border))]/60 bg-card/80 backdrop-blur-sm overflow-hidden">
      {/* Terminal Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[hsl(var(--border))]/40 bg-secondary/30">
        <Terminal className="w-4 h-4 text-emerald-400" />
        <span className="text-xs font-medium text-muted-foreground">nexusforge</span>
        <div className="ml-auto flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-emerald-400" />
          <span className="text-[10px] text-emerald-400 font-medium">AI Active</span>
        </div>
      </div>

      {/* Chat Area */}
      <div className="h-64 overflow-y-auto p-4 space-y-3 font-mono text-sm">
        <AnimatePresence>
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <p className="text-muted-foreground text-xs mb-3">Try a sample prompt:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTED_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(prompt)}
                    className="px-3 py-1.5 text-xs rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 ${
                  msg.role === "user"
                    ? "bg-emerald-500 text-black"
                    : "bg-secondary/50 text-foreground"
                }`}
              >
                <p className="whitespace-pre-wrap text-xs leading-relaxed">{msg.content}</p>
              </div>
            </motion.div>
          ))}

          {isTyping && displayedResponse && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="max-w-[85%] rounded-lg px-3 py-2 bg-secondary/50 text-foreground">
                <p className="whitespace-pre-wrap text-xs leading-relaxed">
                  {displayedResponse}
                  <span className="animate-blink text-emerald-400">▊</span>
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-[hsl(var(--border))]/40 p-3 bg-secondary/20">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe what you want to build..."
            className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground px-2 py-1.5"
          />
          <Button
            onClick={() => handleSendMessage()}
            size="sm"
            className="bg-emerald-500 hover:bg-emerald-400 text-black h-8 px-3"
            disabled={!inputValue.trim() || isTyping}
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
