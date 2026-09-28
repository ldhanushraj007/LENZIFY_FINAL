"use client";

interface QuickRepliesProps {
  options: string[];
  onSelect: (option: string) => void;
  disabled?: boolean;
}

export default function QuickReplies({
  options,
  onSelect,
  disabled = false,
}: QuickRepliesProps) {
  if (!options || options.length === 0) return null;

  return (
    <div
      role="group"
      aria-label="Suggested quick replies"
      className="flex flex-wrap gap-1.5 py-2 px-1"
    >
      {options.map((option, idx) => {
        const isWhatsApp = option.toLowerCase().includes("whatsapp");

        return (
          <button
            key={idx}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(option)}
            className={`text-[11px] font-medium px-3 py-1.5 rounded-full border transition-all duration-150 outline-none focus-visible:ring-2 disabled:opacity-50 disabled:cursor-not-allowed ${
              isWhatsApp
                ? "bg-[#EAFBF0] border-[#25D366]/40 text-[#128C7E] hover:bg-[#25D366] hover:text-white focus-visible:ring-[#25D366]"
                : "bg-white border-[#E8EAF2] text-[#03173D] hover:border-[#004AAD] hover:bg-[#F0F5FF] hover:text-[#004AAD] focus-visible:ring-[#004AAD]/40"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
