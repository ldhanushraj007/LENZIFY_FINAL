"use client";

import Link from "next/link";

export interface Message {
  id: string;
  sender: "bot" | "user";
  text: string;
  timestamp: string;
  links?: { label: string; url: string }[];
  isTyping?: boolean;
}

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isBot = message.sender === "bot";

  // Formatter for markdown-like text (bold, bullet points, headers)
  const renderFormattedText = (raw: string) => {
    const lines = raw.split("\n");
    return lines.map((line, idx) => {
      // Empty line -> spacing
      if (!line.trim()) {
        return <div key={idx} className="h-2" />;
      }

      // Header 3 (###)
      if (line.startsWith("### ")) {
        return (
          <h4
            key={idx}
            className="text-[13px] font-bold text-[#03173D] mt-2 mb-1 uppercase tracking-wider"
          >
            {line.replace("### ", "")}
          </h4>
        );
      }

      // Bullet points (• or -)
      const isBullet = line.trim().startsWith("•") || line.trim().startsWith("-");
      const cleanLine = isBullet ? line.trim().replace(/^[•\-]\s*/, "") : line;

      // Parse bold **text**
      const parts = cleanLine.split(/(\*\*[^*]+\*\*)/g);
      const formattedParts = parts.map((part, pIdx) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={pIdx} className="font-semibold text-[#03173D]">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      });

      if (isBullet) {
        return (
          <div key={idx} className="flex items-start gap-1.5 ml-1 my-0.5 text-[12px] leading-relaxed">
            <span className="text-[#004AAD] font-bold shrink-0 mt-0.5">•</span>
            <span>{formattedParts}</span>
          </div>
        );
      }

      return (
        <p key={idx} className="my-0.5 text-[12px] leading-relaxed">
          {formattedParts}
        </p>
      );
    });
  };

  return (
    <div
      className={`flex items-end gap-2 my-2.5 ${
        isBot ? "justify-start" : "justify-end"
      }`}
    >
      {/* Bot Avatar Icon */}
      {isBot && (
        <div
          aria-hidden="true"
          className="w-7 h-7 rounded-full bg-[#03173D] text-[#00AEEF] flex items-center justify-center shrink-0 shadow-sm border border-[#E8EAF2]"
        >
          {/* Glasses glyph inline SVG */}
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
            <path d="M5 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm14 0a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM1 12a5 5 0 0 1 8.8-3.2A4.97 4.97 0 0 1 12 10a4.97 4.97 0 0 1 2.2-1.2A5 5 0 1 1 23 12a5 5 0 0 1-5 5h-1a5 5 0 0 1-4.8-3.6 2.98 2.98 0 0 0-2.4 0A5 5 0 0 1 5 17H4a5 5 0 0 1-3-5z" />
          </svg>
        </div>
      )}

      {/* Bubble Container */}
      <div
        className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-3 sm:p-3.5 shadow-sm transition-all ${
          isBot
            ? "bg-[#F8F9FC] text-[#111111] border border-[#E8EAF2] rounded-bl-sm"
            : "bg-[#03173D] text-white rounded-br-sm"
        }`}
      >
        {/* Typing indicator */}
        {message.isTyping ? (
          <div className="flex items-center gap-1.5 py-1 px-1" aria-label="Lenzi is typing">
            <span className="w-2 h-2 rounded-full bg-[#004AAD] animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-2 h-2 rounded-full bg-[#004AAD] animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-2 h-2 rounded-full bg-[#004AAD] animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        ) : (
          <>
            <div className="space-y-0.5">{renderFormattedText(message.text)}</div>

            {/* Attached Action Links (e.g. site pages or WhatsApp) */}
            {message.links && message.links.length > 0 && (
              <div className="mt-3 pt-2.5 border-t border-[#E8EAF2] flex flex-wrap gap-2">
                {message.links.map((link, idx) => {
                  const isExternal = link.url.startsWith("http");
                  const isWhatsApp = link.url.includes("wa.me");

                  if (isExternal) {
                    return (
                      <a
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold tracking-wide transition-all shadow-sm ${
                          isWhatsApp
                            ? "bg-[#25D366] text-white hover:bg-[#20ba59]"
                            : "bg-white text-[#03173D] border border-[#E8EAF2] hover:border-[#004AAD] hover:text-[#004AAD]"
                        }`}
                      >
                        {isWhatsApp && (
                          <svg viewBox="0 0 32 32" className="w-3.5 h-3.5 fill-current">
                            <path d="M16.01 2.01C8.28 2.01 2 8.29 2 16.01c0 2.58.7 5.09 2.02 7.28L2 30l6.93-1.97a13.93 13.93 0 007.08 1.95h.01c7.72 0 14-6.28 14-14s-6.28-13.97-14.01-13.97zm0 25.59h-.01a11.58 11.58 0 01-5.91-1.62l-.42-.25-4.4 1.25 1.26-4.28-.27-.44a11.59 11.59 0 01-1.85-6.25c0-6.4 5.21-11.61 11.62-11.61 3.1 0 6.02 1.21 8.21 3.41a11.56 11.56 0 013.4 8.2c0 6.4-5.21 11.59-11.63 11.59z" />
                          </svg>
                        )}
                        <span>{link.label}</span>
                        {!isWhatsApp && <span className="text-[10px]">↗</span>}
                      </a>
                    );
                  }

                  return (
                    <Link
                      key={idx}
                      href={link.url}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-white text-[#004AAD] border border-[#E8EAF2] rounded-lg text-[11px] font-semibold tracking-wide hover:border-[#004AAD] hover:bg-[#F0F5FF] transition-all shadow-sm"
                    >
                      <span>{link.label}</span>
                      <span className="text-[10px]">→</span>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Message Timestamp */}
            <div
              className={`text-[9px] mt-1.5 ${
                isBot ? "text-[#888888] text-left" : "text-white/70 text-right"
              }`}
            >
              {message.timestamp}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
