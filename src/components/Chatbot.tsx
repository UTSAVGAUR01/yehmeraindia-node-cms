"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  Send,
  Bot,
  UserCircle,
  Sparkles,
  Minimize2,
  Flame,
} from "lucide-react";
import { useLocation } from "react-router";

/* ─── Types ─── */
interface Message {
  id: string;
  role: "user" | "bot";
  text: string;
  timestamp: Date;
}

/* ─── Simulated AI Response Engine ─── */
function generateBotResponse(userMessage: string, isOnArticlePage: boolean): string {
  const lower = userMessage.toLowerCase();

  // Check for keywords
  if (lower.includes("politics") || lower.includes("modi") || lower.includes("bjp") || lower.includes("election") || lower.includes("lok sabha") || lower.includes("congress")) {
    return "Indian politics is buzzing with activity! The Lok Sabha elections see massive participation with 97 crore voters. PM Modi's policies continue to drive national development across infrastructure, digital transformation, and social welfare. The INDIA Alliance has formed a grand coalition for 2025. Would you like details on specific political developments?";
  }

  if (lower.includes("cricket") || lower.includes("ipl") || lower.includes("sports") || lower.includes("match") || lower.includes("world cup") || lower.includes("player")) {
    return "Indian sports are on fire! 🏏 IPL 2025 playoffs are underway with CSK reaching the final, and Virat Kohli scored a blazing century. Neeraj Chopra won gold at World Athletics Championships with an 89.94m throw. The Indian women's cricket team also clinched the T20 World Cup! PV Sindhu and Srikanth Kidambi have brought glory in badminton too. Which sport would you like to know more about?";
  }

  if (lower.includes("bollywood") || lower.includes("movie") || lower.includes("film") || lower.includes("actor") || lower.includes("actress") || lower.includes("box office")) {
    return "Bollywood is shining bright! 🎬 SS Rajamouli unveiled 'Mahishmati: The Origin' with Ram Charan and Jr NTR. Aamir Khan announced the ambitious Mahabharata trilogy. Salman Khan's 'Tiger 4' smashed records with an 85 crore opening day. Karan Johar also launched the Dharma+ streaming platform. Which movie or star are you interested in?";
  }

  if (lower.includes("economy") || lower.includes("stock") || lower.includes("rbi") || lower.includes("gdp") || lower.includes("business") || lower.includes("trade") || lower.includes("market")) {
    return "India's economy is the world's fastest-growing at 8.2% GDP growth! 📈 The RBI recently cut the repo rate to 6.25%, boosting markets. The India-UK FTA is expected to grow trade by 30%. India is moving toward becoming a $4 trillion economy in 2025. The semiconductor plant in Gujarat marks a major milestone in manufacturing. Would you like specific business news?";
  }

  if (lower.includes("isro") || lower.includes("space") || lower.includes("science") || lower.includes("tech") || lower.includes("ai") || lower.includes("missile") || lower.includes("satellite")) {
    return "India's scientific achievements are incredible! 🚀 ISRO successfully completed the Gaganyaan crew module drop test and deployed the Chandrayaan-4 rover at the lunar south pole. DRDO tested the hypersonic 'Kali-2' missile at Mach 7. The world's longest rail-road bridge 'Brahma Setu' has been approved. In tech, Sarvam AI raised $150M and Jio showcased 6G trials. What scientific topic interests you?";
  }

  if (lower.includes("health") || lower.includes("medical") || lower.includes("hospital") || lower.includes("vaccine") || lower.includes("doctor")) {
    return "Healthcare in India is making remarkable strides! 🏥 AIIMS Delhi achieved a breakthrough in cancer immunotherapy with 70% tumor reduction. ICMR approved the indigenous malaria vaccine 'Bharat-Vax'. Ayushman Bharat 2.0 doubled health cover to 10 lakh per family. IIT Bombay developed an AI model for early Alzheimer prediction with 92% accuracy. What health topic would you like to explore?";
  }

  if (lower.includes("hello") || lower.includes("hi") || lower.includes("namaste") || lower.includes("hey")) {
    return "Namaste! 🙏 I'm your Yeh Mera India assistant. I can help you with news about Indian politics, sports, Bollywood, economy, science, health, and more. What would you like to know today?";
  }

  if (lower.includes("thank")) {
    return "You're very welcome! 😊 It's my pleasure to help. India has so many incredible stories to share. Feel free to ask me anything else — I'm here to celebrate the spirit of India with you!";
  }

  // Article page specific
  if (isOnArticlePage && (lower.includes("article") || lower.includes("this") || lower.includes("read more"))) {
    return "This article highlights one of India's many remarkable achievements! India has been making great strides across multiple sectors. Would you like me to find related news articles for you, or is there a specific aspect of this story you'd like to explore further?";
  }

  // Default response
  return "That's an interesting topic! India has been making great strides in many areas. 🇮🇳 From becoming the world's fastest-growing economy to pioneering space missions and technological innovations, there's so much to celebrate. Would you like me to find related news for you? Try asking about politics, sports, Bollywood, economy, science, or health!";
}

/* ─── Typing Indicator ─── */
function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-3">
      <div className="w-7 h-7 rounded-full bg-indigo/10 flex items-center justify-center shrink-0">
        <Bot size={14} className="text-indigo" />
      </div>
      <div className="bg-white border border-gold/20 rounded-2xl rounded-bl-md px-4 py-3 shadow-warm">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-indigo/40 animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-2 h-2 rounded-full bg-indigo/40 animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-2 h-2 rounded-full bg-indigo/40 animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}

/* ─── Main Chatbot Component ─── */
export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();

  const isOnArticlePage = location.pathname.startsWith("/article/");

  /* Auto-scroll to bottom */
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  /* Welcome message when first opened */
  useEffect(() => {
    if (isOpen && !hasGreeted) {
      setHasGreeted(true);
      const welcomeMsg: Message = {
        id: `welcome-${Date.now()}`,
        role: "bot",
        text: isOnArticlePage
          ? "Namaste! I'm your Yeh Mera India assistant. Ask me about this article or anything about Indian news!"
          : "Namaste! I'm your Yeh Mera India assistant. Ask me anything about Indian news!",
        timestamp: new Date(),
      };
      setMessages([welcomeMsg]);
    }
  }, [isOpen, hasGreeted, isOnArticlePage]);

  /* Send message handler */
  const handleSend = useCallback(() => {
    const trimmed = inputText.trim();
    if (!trimmed || isTyping) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      text: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);

    /* Simulate AI response delay */
    const delay = 800 + Math.random() * 1200;
    setTimeout(() => {
      const response = generateBotResponse(trimmed, isOnArticlePage);
      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        role: "bot",
        text: response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, delay);
  }, [inputText, isTyping, isOnArticlePage]);

  /* Enter key handler */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  /* Quick question chips */
  const quickQuestions = [
    "Tell me about ISRO",
    "IPL 2025 updates",
    "Indian economy",
    "Bollywood news",
  ];

  return (
    <>
      {/* ── Floating Trigger Button ── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-[100] w-14 h-14 rounded-full bg-saffron text-white shadow-warm-lg flex items-center justify-center cursor-pointer hover:bg-saffron-light hover:scale-110 transition-all duration-250 group"
            aria-label="Open chat"
          >
            <MessageCircle size={24} className="group-hover:rotate-12 transition-transform duration-300" />
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-full bg-saffron/30 animate-ping" style={{ animationDuration: "2s" }} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Chat Panel ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="fixed bottom-6 right-6 z-[100] w-[380px] h-[520px] bg-cream rounded-2xl shadow-warm-xl border border-gold/20 flex flex-col overflow-hidden"
          >
            {/* ── Header ── */}
            <div className="bg-indigo px-5 py-4 flex items-center gap-3 shrink-0">
              {/* Decorative pattern overlay */}
              <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='10' cy='10' r='1' fill='white'/%3E%3C/svg%3E")`,
                backgroundSize: '12px 12px'
              }} />
              <div className="relative z-10 flex items-center gap-3 flex-1">
                <div className="w-9 h-9 rounded-full bg-saffron/20 flex items-center justify-center">
                  <Flame size={18} className="text-saffron-light" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-white text-sm flex items-center gap-1.5">
                    <Sparkles size={13} className="text-saffron-light" />
                    YMI Assistant
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
                    <span className="font-mono text-[10px] text-white/60">Online</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="relative z-10 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors duration-200 cursor-pointer"
              >
                <Minimize2 size={14} />
              </button>
            </div>

            {/* ── Messages Area ── */}
            <div className="flex-1 overflow-y-auto px-4 py-4 scroll-smooth">
              {messages.length === 0 && !hasGreeted && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-charcoal-light">
                    <Bot size={32} className="mx-auto mb-2 text-indigo/30" />
                    <p className="font-body text-sm">Loading...</p>
                  </div>
                </div>
              )}

              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex items-end gap-2 mb-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                      msg.role === "user"
                        ? "bg-saffron/10"
                        : "bg-indigo/10"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <UserCircle size={14} className="text-saffron" />
                    ) : (
                      <Bot size={14} className="text-indigo" />
                    )}
                  </div>

                  {/* Bubble */}
                  <div
                    className={`max-w-[75%] px-4 py-2.5 text-sm leading-relaxed shadow-warm ${
                      msg.role === "user"
                        ? "bg-saffron text-white rounded-2xl rounded-br-md"
                        : "bg-white text-charcoal border border-gold/15 rounded-2xl rounded-bl-md"
                    }`}
                  >
                    <p className="font-body">{msg.text}</p>
                    <span
                      className={`text-[10px] mt-1 block ${
                        msg.role === "user" ? "text-white/60" : "text-charcoal-light/60"
                      }`}
                    >
                      {msg.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </motion.div>
              ))}

              {isTyping && <TypingIndicator />}

              {/* Quick questions (only show when few messages) */}
              {messages.length <= 2 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex flex-wrap gap-2 mt-3"
                >
                  {quickQuestions.map((q) => (
                    <button
                      key={q}
                      onClick={() => {
                        setInputText(q);
                        inputRef.current?.focus();
                      }}
                      className="px-3 py-1.5 rounded-full bg-white border border-gold/20 text-xs font-body text-charcoal-light hover:border-saffron/40 hover:text-saffron transition-all duration-200 cursor-pointer"
                    >
                      {q}
                    </button>
                  ))}
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* ── Input Area ── */}
            <div className="px-4 py-3 bg-white border-t border-gold/15 shrink-0">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything about India..."
                  className="flex-1 bg-cream border border-gold/20 rounded-full px-4 py-2.5 text-sm font-body text-charcoal placeholder:text-charcoal-light outline-none transition-all duration-200 focus:border-saffron/40 focus:shadow-warm"
                />
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleSend}
                  disabled={!inputText.trim() || isTyping}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${
                    inputText.trim() && !isTyping
                      ? "bg-saffron text-white hover:bg-saffron-light shadow-warm"
                      : "bg-cream-dark text-charcoal-light cursor-not-allowed"
                  }`}
                >
                  <Send size={16} />
                </motion.button>
              </div>
              <p className="text-[10px] text-center text-charcoal-light/50 mt-2 font-mono">
                Powered by YMI AI &middot; Responses are simulated
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
