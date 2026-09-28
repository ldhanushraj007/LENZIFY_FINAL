import { KNOWLEDGE_BASE, KnowledgeEntry } from "./knowledge";
import { CONTACT_CONFIG } from "@/config/contact";

export interface MatchResult {
  matched: boolean;
  entry?: KnowledgeEntry;
  answer: string;
  links?: { label: string; url: string }[];
  followUps?: string[];
  suggestions?: string[];
  isPowerRecommendation?: boolean;
  whatsappHandoffUrl?: string;
}

// ============================================================================
// 1. TEXT NORMALIZATION & HINGLISH SYNONYMS
// ============================================================================

const HINGLISH_SYNONYMS: Record<string, string> = {
  chashma: "glasses",
  chasma: "glasses",
  aankh: "eye",
  aankho: "eye",
  nazar: "vision",
  motai: "thickness",
  mota: "thick",
  patla: "thin",
  patli: "thin",
  number: "power",
  numbar: "power",
  kitna: "price",
  keemat: "price",
  kya: "what",
  kaunsa: "which",
  konsa: "which",
  chahiye: "need",
  dhoop: "sun",
  dhup: "sun",
  dur: "distance",
  paas: "reading",
  padhna: "reading",
  kab: "delivery",
  bina: "rimless",
};

export function normalizeText(raw: string): string {
  if (!raw) return "";
  let text = raw.toLowerCase();

  // Strip punctuation except plus/minus and decimals for power parsing
  text = text.replace(/[^a-z0-9\s\+\-\.]/g, " ");

  // Collapse multiple whitespaces
  text = text.replace(/\s+/g, " ").trim();

  // Replace common Hinglish tokens with standard equivalents
  const tokens = text.split(" ").map((token) => {
    return HINGLISH_SYNONYMS[token] || token;
  });

  return tokens.join(" ");
}

// Levenshtein distance for fuzzy typo matching on words >= 5 characters
export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

export function isFuzzyMatch(word1: string, word2: string): boolean {
  if (word1 === word2) return true;
  if (word1.length >= 5 && word2.length >= 5) {
    return levenshteinDistance(word1, word2) <= 1;
  }
  return false;
}

// ============================================================================
// 2. POWER RECOMMENDER ENGINE (Deterministic Optical Logic)
// ============================================================================

export interface PowerExtraction {
  sph: number | null;
  cyl: number | null;
  add: number | null;
  isRimless: boolean;
}

export function extractPower(input: string): PowerExtraction {
  const norm = input.toLowerCase();
  const isRimless =
    norm.includes("rimless") ||
    norm.includes("drill") ||
    norm.includes("frameless") ||
    norm.includes("bina frame");

  let sph: number | null = null;
  let cyl: number | null = null;
  let add: number | null = null;

  // 1. Look for explicit CYL / cylinder pattern: e.g. "cyl -1.5", "cylinder 2.0"
  const cylMatch = norm.match(/(?:cyl|cylinder|astigmatism)\s*(?:is|:|=)?\s*([+\-]?\d+(?:\.\d{1,2})?)/i);
  if (cylMatch) {
    cyl = parseFloat(cylMatch[1]);
  }

  // 2. Look for explicit ADD pattern: e.g. "add +1.50", "addition 2"
  const addMatch = norm.match(/(?:add|addition|reading)\s*(?:is|:|=)?\s*([+]?\d+(?:\.\d{1,2})?)/i);
  if (addMatch) {
    add = parseFloat(addMatch[1]);
  }

  // 3. Look for explicit SPH / sphere pattern: e.g. "sph -4.50"
  const sphExplicit = norm.match(/(?:sph|sphere|number|power)\s*(?:is|:|=)?\s*([+\-]?\d+(?:\.\d{1,2})?)/i);
  if (sphExplicit) {
    sph = parseFloat(sphExplicit[1]);
  }

  // 4. Look for "minus X" or "plus X" pattern: e.g. "minus 4.5", "plus 3"
  if (sph === null) {
    const wordPattern = norm.match(/(minus|plus)\s*(\d+(?:\.\d{1,2})?)/i);
    if (wordPattern) {
      const sign = wordPattern[1].toLowerCase() === "minus" ? -1 : 1;
      sph = sign * parseFloat(wordPattern[2]);
    }
  }

  // 5. Look for standalone signed decimal numbers e.g. "-4.5", "+2.25", "-7.00"
  if (sph === null) {
    const signedNumberMatch = norm.match(/([+\-]\d+(?:\.\d{1,2})?)/);
    if (signedNumberMatch) {
      sph = parseFloat(signedNumberMatch[1]);
    }
  }

  // 6. Look for "number 5" or "power 4" if unsigned
  if (sph === null) {
    const unsignedContext = norm.match(/(?:number|power|lens)\s*(\d+(?:\.\d{1,2})?)/i);
    if (unsignedContext) {
      // Default to minus as myopia is 80%+ of common queries
      sph = -1 * parseFloat(unsignedContext[1]);
    }
  }

  return { sph, cyl, add, isRimless };
}

export function generatePowerRecommendation(extraction: PowerExtraction, originalQuery: string): MatchResult | null {
  const { sph, cyl, add, isRimless } = extraction;

  // We only run power recommendation if a spherical power was detected
  if (sph === null || isNaN(sph)) {
    return null;
  }

  const absSph = Math.abs(sph);
  const isPlus = sph > 0;
  const absCyl = cyl !== null ? Math.abs(cyl) : 0;

  let recommendation = "";
  let recommendedIndex = "1.56";
  const notes: string[] = [];

  // 1. Mandatory Rimless rule check
  if (isRimless) {
    recommendedIndex = "1.59 Polycarbonate";
    recommendation = `### 👓 Recommendation for Rimless Frames:
Because you selected or mentioned a **Rimless (drill-mount) frame**, our laboratory requires **1.59 Polycarbonate** lenses.
• **Lenzify Site Rule:** Standard resin lenses crack at drill tension points. 1.59 Polycarbonate flexes and is shatterproof, providing the required structural security regardless of your power (${sph > 0 ? "+" : ""}${sph.toFixed(2)}).`;
  } else {
    // 2. Standard frame thickness hierarchy
    if (absSph <= 2.00) {
      recommendedIndex = "1.50 or 1.56";
      recommendation = `### 👓 Recommended Lens: **1.50 Standard or 1.56 Thin Index**
For a mild power of **${sph > 0 ? "+" : ""}${sph.toFixed(2)} D**, standard **1.50 CR-39** gives superb optical clarity. Upgrading to **1.56 Mid-Index** makes it ~15% lighter and pairs seamlessly with our Blue Cut filter.`;
    } else if (absSph > 2.00 && absSph <= 3.00) {
      recommendedIndex = "1.56 Thin Index";
      recommendation = `### 👓 Recommended Lens: **1.56 Thin Index**
For your power of **${sph > 0 ? "+" : ""}${sph.toFixed(2)} D**, **1.56 Mid-Index** is the ideal sweet spot—lightweight, thin, and very economical. (If choosing a thin metal frame, 1.60 is also a great upgrade).`;
    } else if (absSph > 3.00 && absSph <= 5.00) {
      recommendedIndex = "1.60 High Index";
      recommendation = `### 👓 Recommended Lens: **1.60 High Index (MR-8)**
For your power of **${sph > 0 ? "+" : ""}${sph.toFixed(2)} D**, we recommend **1.60 High Index**.
• It is ~20%–25% thinner than standard lenses.
• Prevents heavy edge protrusions and keeps your glasses feeling comfortable all day.`;
    } else if (absSph > 5.00 && absSph <= 7.00) {
      recommendedIndex = "1.67 Ultra-Thin Index";
      recommendation = `### 👓 Recommended Lens: **1.67 Ultra-Thin Index**
For a strong prescription of **${sph > 0 ? "+" : ""}${sph.toFixed(2)} D**, **1.67 Ultra-Thin** is strongly recommended!
• Up to **35%–40% thinner** than standard lenses.
• Significantly reduces outer edge thickness and eye miniaturization.
• *Frame Tip:* Pair with a compact full-rim acetate frame to hide the remaining edge!`;
    } else {
      recommendedIndex = "1.74 Super-Thin Maximum Index";
      recommendation = `### 👓 Recommended Lens: **1.74 Super-Thin Index**
For a high prescription of **${sph > 0 ? "+" : ""}${sph.toFixed(2)} D**, **1.74 Super-Thin** is the finest optical material available globally.
• Gives the flattest, slimmest profile possible.
• Always pair with Anti-Reflective coating for optimal light transmission.`;
    }
  }

  // 3. Plus power specifics
  if (isPlus && !isRimless) {
    notes.push(
      `• **Hyperopia Note:** As a Plus (+) power, your lens is thickest in the **center**. Higher index flattens the front curve and cuts the "bug-eye" magnifying effect.`
    );
  }

  // 4. Astigmatism / Cylinder check
  if (absCyl >= 1.50) {
    notes.push(
      `• **Astigmatism Note:** With a cylinder power of **${cyl} D**, effective edge thickness is higher along one meridian. Choosing a higher index keeps your lenses well-balanced.`
    );
  }

  // 5. ADD power / Progressive check
  if (add !== null && add > 0) {
    notes.push(
      `• **Reading Addition (+${add.toFixed(2)}):** Because you have an ADD power, we recommend **Progressive lenses** so you enjoy smooth distance, intermediate computer, and reading vision in one pair.`
    );
  }

  const extraNotes = notes.length > 0 ? "\n\n" + notes.join("\n") : "";
  const disclaimer = `\n\n*Note: This is a general optical guide. Final lens choice depends on your full prescription slip and chosen frame. Our optical team can confirm details on WhatsApp.*`;

  const fullAnswer = `${recommendation}${extraNotes}${disclaimer}`;

  const whatsappText = `Hi Lenzify! I asked Lenzi for lens advice: My power is SPH ${sph}${cyl ? `, CYL ${cyl}` : ""}${isRimless ? " (Rimless frame)" : ""}. Can you confirm the best lens?`;
  const whatsappUrl = `https://wa.me/${CONTACT_CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappText)}`;

  return {
    matched: true,
    answer: fullAnswer,
    links: [
      { label: "Browse Lenses Guide", url: "/lenses" },
      { label: "Confirm on WhatsApp", url: whatsappUrl },
    ],
    followUps: ["Talk on WhatsApp", "Lens index guide", "Rimless frames index", "Main Menu"],
    isPowerRecommendation: true,
    whatsappHandoffUrl: whatsappUrl,
  };
}

// ============================================================================
// 3. INTENT MATCHING ENGINE (Scored Keyword & Token Overlap)
// ============================================================================

export function matchQuery(userInput: string): MatchResult {
  const rawInput = userInput.trim();
  if (!rawInput) {
    return {
      matched: false,
      answer: "Please type a question or choose from the topics below! 👓",
      followUps: ["Which lens is right for me?", "Lens index guide", "Understand my power", "Orders & delivery"],
    };
  }

  // 1. Try Power Recommender first (handles numeric power queries)
  const extraction = extractPower(rawInput);
  const powerRec = generatePowerRecommendation(extraction, rawInput);
  if (powerRec) {
    return powerRec;
  }

  // 2. Normalize user text
  const normalizedUser = normalizeText(rawInput);
  const userTokens = normalizedUser.split(" ").filter((t) => t.length > 1);

  let bestEntry: KnowledgeEntry | null = null;
  let secondBestEntry: KnowledgeEntry | null = null;
  let highestScore = 0;
  let secondHighestScore = 0;

  for (const entry of KNOWLEDGE_BASE) {
    let score = 0;

    // A) Keyword scoring with exact and fuzzy matching
    for (const kw of entry.keywords) {
      const kwNorm = kw.word.toLowerCase();

      // Check if keyword is a multi-word phrase in the normalized query
      if (kwNorm.includes(" ") && normalizedUser.includes(kwNorm)) {
        score += kw.weight * 2.5;
        continue;
      }

      // Check single token matches
      for (const uToken of userTokens) {
        if (uToken === kwNorm) {
          score += kw.weight * 1.5;
        } else if (isFuzzyMatch(uToken, kwNorm)) {
          score += kw.weight * 1.0;
        }
      }
    }

    // B) Sample questions similarity (Token Jaccard & Substring overlap)
    for (const sampleQ of entry.questions) {
      const normSample = normalizeText(sampleQ);
      const sampleTokens = normSample.split(" ");

      // Substring check
      if (normalizedUser.includes(normSample) || normSample.includes(normalizedUser)) {
        score += 4.0;
      }

      // Token overlap
      let sharedCount = 0;
      for (const st of sampleTokens) {
        if (userTokens.some((ut) => ut === st || isFuzzyMatch(ut, st))) {
          sharedCount++;
        }
      }

      const jaccard = sharedCount / Math.max(userTokens.length, sampleTokens.length);
      score += jaccard * 3.5;
    }

    // Track top 2 entries for close score "Did you mean?" suggestions
    if (score > highestScore) {
      secondHighestScore = highestScore;
      secondBestEntry = bestEntry;
      highestScore = score;
      bestEntry = entry;
    } else if (score > secondHighestScore) {
      secondHighestScore = score;
      secondBestEntry = entry;
    }
  }

  // 3. Match threshold evaluation
  const MATCH_THRESHOLD = 2.5;

  if (bestEntry && highestScore >= MATCH_THRESHOLD) {
    const suggestions: string[] = [];
    // If the second best entry is close to the top match, offer it
    if (secondBestEntry && secondHighestScore >= MATCH_THRESHOLD && secondHighestScore >= highestScore * 0.75) {
      suggestions.push(secondBestEntry.title);
    }

    return {
      matched: true,
      entry: bestEntry,
      answer: bestEntry.answer,
      links: bestEntry.links,
      followUps: bestEntry.followUps || ["Main Menu", "Talk on WhatsApp"],
      suggestions: suggestions.length > 0 ? suggestions : undefined,
    };
  }

  // 4. Fallback (No match): friendly, helpful handoff to WhatsApp with prefilled message
  const fallbackWhatsAppText = `Hi Lenzify! I asked your bot: "${rawInput}". Can someone help me with this?`;
  const fallbackWhatsAppUrl = `https://wa.me/${CONTACT_CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(fallbackWhatsAppText)}`;

  return {
    matched: false,
    answer: `I'm not completely certain about that specific question, but our optical team would love to help! 👓

You can ask me about lens index, power calculations, frame styles, or contact lenses. Or tap below to chat with a real human on WhatsApp!`,
    links: [
      {
        label: "Chat with Us on WhatsApp",
        url: fallbackWhatsAppUrl,
      },
    ],
    followUps: [
      "Which lens is right for me?",
      "Lens index guide",
      "Understand my power",
      "Orders & delivery",
      "Talk on WhatsApp",
    ],
    whatsappHandoffUrl: fallbackWhatsAppUrl,
  };
}
