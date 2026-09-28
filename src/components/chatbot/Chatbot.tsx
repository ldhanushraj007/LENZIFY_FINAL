"use client";

import { useState, useEffect, useRef } from "react";
import ChatMessage, { Message } from "./ChatMessage";
import QuickReplies from "./QuickReplies";
import { matchQuery } from "@/lib/chatbot/matcher";
import { CONTACT_CONFIG } from "@/config/contact";

const INITIAL_QUICK_REPLIES = [
  "Which lens is right for me?",
  "Lens index guide",
  "Understand my power",
  "Frame types",
  "Contact lenses",
  "Reading glasses",
  "Orders & delivery",
  "Returns & warranty",
  "Talk on WhatsApp",
];

const SESSION_STORAGE_KEY = "lenzify_chat_history_v1";
const NUDGE_STORAGE_KEY = "lenzify_chat_nudged";

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnreadNudge, setHasUnreadNudge] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [quickReplies, setQuickReplies] = useState<string[]>(INITIAL_QUICK_REPLIES);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize messages from sessionStorage or default welcome
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (e) {
        // Storage disabled or error
      }
    }
    return [
      {
        id: "msg-welcome",
        sender: "bot",
        text: "Hi! I'm **Lenzi** 👓, your personal Lenzify assistant.\n\nAsk me anything about **lens index, power calculations, frame styles, contact lenses, orders or delivery**!",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        links: [
          { label: "Lens Index Guide", url: "/lenses" },
          { label: "Track Orders", url: "/orders" },
        ],
      },
    ];
  });

  // Persist messages to sessionStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(messages));
      } catch (e) {
        // Ignore quota/access errors
      }
    }
  }, [messages]);

  // Nudge badge timer (~8s once per session)
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const alreadyNudged = sessionStorage.getItem(NUDGE_STORAGE_KEY);
        if (!alreadyNudged && !isOpen) {
          const timer = setTimeout(() => {
            setHasUnreadNudge(true);
            sessionStorage.setItem(NUDGE_STORAGE_KEY, "true");
          }, 8000);
          return () => clearTimeout(timer);
        }
      } catch (e) {
        // Ignore
      }
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Auto-scroll on new message or typing state
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setHasUnreadNudge(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleSend = (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isTyping) return;

    // Direct WhatsApp intent check
    if (
      query.toLowerCase() === "talk on whatsapp" ||
      query.toLowerCase() === "chat on whatsapp" ||
      query.toLowerCase() === "whatsapp"
    ) {
      const whatsappUrl = `https://wa.me/${CONTACT_CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(
        CONTACT_CONFIG.WHATSAPP_DEFAULT_MESSAGE
      )}`;
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      return;
    }

    // Reset to Main Menu check
    if (query.toLowerCase() === "main menu" || query.toLowerCase() === "back to menu") {
      const botMsg: Message = {
        id: `msg-${Date.now()}`,
        sender: "bot",
        text: "Here are the main optical topics I can help you with! 👓",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMsg]);
      setQuickReplies(INITIAL_QUICK_REPLIES);
      setInputText("");
      return;
    }

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);

    // Natural 400-650ms delay
    const delay = Math.floor(Math.random() * 250) + 400;

    setTimeout(() => {
      const result = matchQuery(query);

      const botReply: Message = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: result.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        links: result.links,
      };

      setMessages((prev) => [...prev, botReply]);
      setIsTyping(false);

      if (result.followUps && result.followUps.length > 0) {
        setQuickReplies(result.followUps);
      } else {
        setQuickReplies(INITIAL_QUICK_REPLIES);
      }
    }, delay);
  };

  const handleClearChat = () => {
    const welcomeMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: "bot",
      text: "Chat cleared! How else can I assist you with your eyewear today? 👓",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages([welcomeMsg]);
    setQuickReplies(INITIAL_QUICK_REPLIES);
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
      } catch (e) {
        // Ignore
      }
    }
  };

  return (
    <div className="relative">
      {/* ========================================================================= */}
      {/* CHATBOT LAUNCHER BUTTON */}
      {/* ========================================================================= */}
      {!isOpen && (
        <div className="relative group">
          {/* Desktop Tooltip */}
          <span
            role="tooltip"
            className="pointer-events-none absolute right-full top-1/2 -translate-y-1/2 mr-3 px-3 py-1.5 bg-[#03173D] text-white text-[11px] font-medium tracking-wide rounded-lg whitespace-nowrap shadow-xl opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 group-focus-within:opacity-100 group-focus-within:translate-x-0 transition-all duration-200 hidden md:block z-50"
          >
            Ask Lenzi · Eyewear Assistant
            <span className="absolute left-full top-1/2 -translate-y-1/2 -ml-1 border-4 border-transparent border-l-[#03173D]" />
          </span>

          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label="Open Lenzi Eyewear Assistant chat"
            aria-expanded={isOpen}
            className="relative flex items-center gap-2.5 px-3.5 h-12 md:h-14 rounded-full bg-gradient-to-r from-[#03173D] to-[#004AAD] text-white shadow-[0_4px_22px_rgba(3,23,61,0.4)] hover:shadow-[0_6px_28px_rgba(0,74,173,0.55)] hover:scale-105 active:scale-95 transition-all duration-200 outline-none focus-visible:ring-4 focus-visible:ring-[#00AEEF]/50"
          >
            {/* Glasses Icon inline SVG */}
            <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white" aria-hidden="true">
                <path d="M5 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm14 0a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM1 12a5 5 0 0 1 8.8-3.2A4.97 4.97 0 0 1 12 10a4.97 4.97 0 0 1 2.2-1.2A5 5 0 1 1 23 12a5 5 0 0 1-5 5h-1a5 5 0 0 1-4.8-3.6 2.98 2.98 0 0 0-2.4 0A5 5 0 0 1 5 17H4a5 5 0 0 1-3-5z" />
              </svg>
            </div>

            {/* Label on Desktop */}
            <span className="text-[12px] font-semibold tracking-wider uppercase pr-1 hidden md:inline-block">
              Ask Lenzi
            </span>

            {/* Unread Nudge Notification Badge */}
            {hasUnreadNudge && (
              <span
                aria-label="New assistant notification"
                className="absolute -top-1 -right-1 flex h-4 w-4"
              >
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00AEEF] opacity-75 motion-reduce:hidden" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-[#00AEEF] border-2 border-white" />
              </span>
            )}
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CHATBOT DIALOG PANEL */}
      {/* ========================================================================= */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Lenzi · Lenzify Optical Assistant"
          data-lenis-prevent
          onWheel={(e) => e.stopPropagation()}
          className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-[60] w-full sm:w-[390px] h-[90vh] sm:h-[580px] max-h-[100dvh] sm:max-h-[85vh] bg-white sm:rounded-3xl shadow-[0_12px_50px_rgba(3,23,61,0.28)] border border-[#E8EAF2] flex flex-col min-h-0 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#03173D] via-[#003885] to-[#004AAD] text-white p-4 flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="relative w-9 h-9 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                {/* Glasses Icon */}
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#00AEEF]" aria-hidden="true">
                  <path d="M5 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm14 0a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM1 12a5 5 0 0 1 8.8-3.2A4.97 4.97 0 0 1 12 10a4.97 4.97 0 0 1 2.2-1.2A5 5 0 1 1 23 12a5 5 0 0 1-5 5h-1a5 5 0 0 1-4.8-3.6 2.98 2.98 0 0 0-2.4 0A5 5 0 0 1 5 17H4a5 5 0 0 1-3-5z" />
                </svg>
                {/* Online pulse dot */}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#25D366] border border-[#03173D]" />
              </div>

              <div>
                <h3 className="text-[13px] font-bold tracking-wider uppercase flex items-center gap-1.5 font-['Noto_Serif',serif] italic">
                  Lenzi <span className="text-[#00AEEF] not-italic text-[10px]">· Assistant</span>
                </h3>
                <p className="text-[10px] text-white/75 font-medium flex items-center gap-1">
                  <span>Lenzify Optical Guide</span>
                  <span className="w-1 h-1 rounded-full bg-white/40" />
                  <span className="text-[#25D366]">Online</span>
                </p>
              </div>
            </div>

            {/* Header Action Buttons */}
            <div className="flex items-center gap-1">
              {/* Clear chat button */}
              <button
                type="button"
                onClick={handleClearChat}
                title="Clear chat history"
                aria-label="Clear chat history"
                className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current stroke-2">
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>

              {/* Minimize / Close */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close chat (Esc)"
                aria-label="Close assistant"
                className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current stroke-2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages Area - Smooth & fully scrollable */}
          <div
            role="log"
            aria-live="polite"
            data-lenis-prevent
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            className="flex-1 min-h-0 p-4 overflow-y-auto overscroll-contain touch-pan-y custom-scrollbar bg-white space-y-1 divide-y-0"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}

            {isTyping && (
              <ChatMessage
                message={{
                  id: "typing",
                  sender: "bot",
                  text: "",
                  timestamp: "",
                  isTyping: true,
                }}
              />
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies Tray */}
          {quickReplies.length > 0 && !isTyping && (
            <div
              data-lenis-prevent
              onWheel={(e) => e.stopPropagation()}
              className="border-t border-[#E8EAF2] bg-[#FAFBFE] px-3 py-1.5 shrink-0 max-h-24 overflow-y-auto overscroll-contain custom-scrollbar"
            >
              <p className="text-[9px] font-bold text-[#666666] uppercase tracking-wider mb-1">
                Suggested topics
              </p>
              <QuickReplies
                options={quickReplies}
                onSelect={(opt) => handleSend(opt)}
                disabled={isTyping}
              />
            </div>
          )}

          {/* Input Box Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white border-t border-[#E8EAF2] flex items-center gap-2 shrink-0"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask about lenses, power, index, or orders..."
              aria-label="Type your message"
              className="flex-1 bg-[#F8F9FC] border border-[#E8EAF2] rounded-xl px-3.5 py-2.5 text-[12px] text-[#111111] placeholder:text-[#888888] outline-none focus:border-[#004AAD] focus:bg-white transition-all"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || isTyping}
              aria-label="Send message"
              className="w-10 h-10 rounded-xl bg-[#03173D] text-white flex items-center justify-center hover:bg-[#004AAD] active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all duration-150 shrink-0 shadow-sm"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current stroke-2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
