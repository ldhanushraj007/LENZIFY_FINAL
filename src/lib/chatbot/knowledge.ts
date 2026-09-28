import { CONTACT_CONFIG } from "@/config/contact";

export interface KnowledgeEntry {
  id: string;
  category:
    | "index"
    | "lens_types"
    | "coatings"
    | "prescription"
    | "frames"
    | "contact_lenses"
    | "reading_glasses"
    | "orders_support"
    | "smalltalk";
  title: string;
  questions: string[];
  keywords: { word: string; weight: number }[];
  answer: string;
  links?: { label: string; url: string }[];
  followUps?: string[];
}

export const KNOWLEDGE_BASE: KnowledgeEntry[] = [
  // =========================================================================
  // A) LENS INDEX (THICKNESS) GUIDE
  // =========================================================================
  {
    id: "index_overview",
    category: "index",
    title: "Lens Index Guide & Thickness Overview",
    questions: [
      "what is lens index",
      "lens index guide",
      "which lens index should i choose",
      "how to choose lens thickness",
      "what does 1.56 or 1.60 mean",
      "thickness of lenses explained",
      "lens motai index kya hota hai",
      "which index is best for me",
    ],
    keywords: [
      { word: "index", weight: 3 },
      { word: "thickness", weight: 3 },
      { word: "thin", weight: 2 },
      { word: "heavy", weight: 1 },
      { word: "motai", weight: 3 },
      { word: "number", weight: 1 },
      { word: "refractive", weight: 3 },
    ],
    answer: `**Lens Index** measures how efficiently a lens bends light. A **higher index = thinner, lighter, and more aesthetic lens** for the exact same prescription!

Here is our quick guide:
• **1.50 Index (Standard CR-39):** Best for low power (0 to ±2.00). Economical with crystal-clear optics.
• **1.56 Index (Thin):** Great for ±2.00 to ±3.00. ~15% thinner than standard.
• **1.59 Polycarbonate:** Extremely impact-resistant & light. **Mandatory for all Rimless frames** on Lenzify!
• **1.60 Index (High Index):** Recommended for ±3.00 to ±5.00. Noticeably slim and durable.
• **1.67 Index (Ultra Thin):** Ideal for ±5.00 to ±7.00. Up to 40% thinner than standard lenses.
• **1.74 Index (Super Thin):** For high powers above ±7.00 or strong cylinder. The ultimate slim profile.

Tip: Type your exact power (e.g. "-4.50" or "+3.00") and I'll calculate the best index for you!`,
    links: [{ label: "Browse All Lenses", url: "/lenses" }],
    followUps: ["1.56 vs 1.60", "1.67 vs 1.74", "Rimless frames index", "Main Menu"],
  },
  {
    id: "index_150",
    category: "index",
    title: "1.50 Standard Index (CR-39)",
    questions: [
      "what is 1.50 lens",
      "is 1.50 index good",
      "standard lens index 1.5",
      "cr39 lens meaning",
      "cheapest lens index",
    ],
    keywords: [
      { word: "1.50", weight: 4 },
      { word: "cr39", weight: 4 },
      { word: "standard", weight: 2 },
      { word: "cheap", weight: 2 },
    ],
    answer: `**1.50 Index (CR-39 Optical Resin)** is the traditional optical lens standard:
• **Best for:** Low power prescriptions up to **±2.00 SPH**.
• **Benefits:** Excellent optical clarity, low chromatic aberration, and the most budget-friendly option.
• **Limitations:** Becomes noticeably thick and heavy if power exceeds ±2.50. Not recommended for rimless or semi-rimless frames.`,
    followUps: ["What is 1.56 index", "Lens index guide", "Main Menu"],
  },
  {
    id: "index_156",
    category: "index",
    title: "1.56 Thin Index Lenses",
    questions: [
      "what is 1.56 lens",
      "is 1.56 good for my power",
      "1.56 index meaning",
      "should i choose 1.56 index",
    ],
    keywords: [
      { word: "1.56", weight: 4 },
      { word: "mid", weight: 1 },
      { word: "thin", weight: 2 },
    ],
    answer: `**1.56 Index (Mid-Index)** is our most popular everyday choice for low-to-moderate powers:
• **Best for:** Powers between **±2.00 to ±3.00 SPH**.
• **Benefits:** ~15% thinner and lighter than standard 1.50 lenses. Pairs seamlessly with our Blue Cut and Photochromic treatments.
• **Frame Match:** Ideal for Full-Rim metal and acetate frames.`,
    followUps: ["1.56 vs 1.60", "Blue cut lenses", "Main Menu"],
  },
  {
    id: "index_159_polycarbonate",
    category: "index",
    title: "1.59 Polycarbonate & Rimless Frame Rule",
    questions: [
      "what is 1.59 polycarbonate",
      "polycarbonate lens meaning",
      "which lens for rimless frames",
      "rimless me konsa lens lagega",
      "drill mount frame lens",
      "shatterproof lenses",
      "sports glasses lens",
    ],
    keywords: [
      { word: "1.59", weight: 4 },
      { word: "polycarbonate", weight: 4 },
      { word: "rimless", weight: 4 },
      { word: "drill", weight: 3 },
      { word: "shatterproof", weight: 3 },
      { word: "safety", weight: 2 },
    ],
    answer: `**1.59 Polycarbonate Lenses:**
• **Lenzify Site Rule:** For all **Rimless (drill-mount) frames**, 1.59 Polycarbonate is **mandatory** because regular resin chips or cracks at drill holes under screw tension. Polycarbonate flexes and will not crack!
• **Features:** 10x more impact-resistant than standard plastic, lightweight, with built-in 100% UV400 blocking.
• **Best for:** Rimless glasses, kids, sports enthusiasts, and safety-conscious wearers.`,
    links: [{ label: "View Spectacles", url: "/spectacles" }],
    followUps: ["Rimless frame guide", "Lens index guide", "Main Menu"],
  },
  {
    id: "index_160",
    category: "index",
    title: "1.60 High Index Lenses",
    questions: [
      "what is 1.60 lens",
      "when to use 1.60 index",
      "is 1.60 high index",
      "1.60 lens for power 4",
      "difference between 1.56 and 1.60",
    ],
    keywords: [
      { word: "1.60", weight: 4 },
      { word: "mr8", weight: 3 },
      { word: "1.6", weight: 3 },
      { word: "high", weight: 1 },
    ],
    answer: `**1.60 High Index (MR-8 material):**
• **Best for:** Moderate powers between **±3.00 to ±5.00 SPH**.
• **Benefits:** ~20% to 25% thinner and lighter than standard lenses, with superior optical Abbe value and tensile strength.
• **Frame Match:** Excellent for metal full rims, acetate shells, and half-rim (semi-rimless) designs.`,
    followUps: ["1.60 vs 1.67", "Lens index guide", "Main Menu"],
  },
  {
    id: "index_161_explained",
    category: "index",
    title: "What is 1.61 Index?",
    questions: [
      "what is 1.61 lens",
      "difference between 1.60 and 1.61",
      "is 1.61 index available",
    ],
    keywords: [
      { word: "1.61", weight: 4 },
      { word: "difference", weight: 2 },
    ],
    answer: `**1.61 Index:**
In optical manufacturing, "1.61" is simply an alternate commercial naming for **1.60 high-index resin** (often based on Mitsui MR-8 monomer with a true refractive index ~1.597–1.605).

At Lenzify, we use genuine premium high-tensile 1.60 material which delivers the exact slim profile, crystal optics, and durable edge strength you expect from this category.`,
    followUps: ["1.60 High Index", "Lens index guide", "Main Menu"],
  },
  {
    id: "index_167",
    category: "index",
    title: "1.67 Ultra-Thin High Index",
    questions: [
      "what is 1.67 lens",
      "which lens for minus 6",
      "thin lens for high power",
      "high minus lens thickness",
      "1.67 index recommendation",
    ],
    keywords: [
      { word: "1.67", weight: 4 },
      { word: "ultra", weight: 2 },
      { word: "high", weight: 2 },
      { word: "minus 5", weight: 3 },
      { word: "minus 6", weight: 3 },
    ],
    answer: `**1.67 Ultra-Thin High Index:**
• **Best for:** Strong prescriptions from **±5.00 to ±7.00 SPH** or high cylinder astigmatism.
• **Benefits:** Up to **35%–40% thinner** than standard lenses. Drastically reduces the heavy "coke bottle" edge thickness in minus powers and center magnification in plus powers.
• **Frame Tip:** Pair with a compact full-rim acetate or titanium frame for the cleanest look!`,
    followUps: ["1.67 vs 1.74", "Frames for high power", "Main Menu"],
  },
  {
    id: "index_174",
    category: "index",
    title: "1.74 Super-Thin Maximum Index",
    questions: [
      "what is 1.74 lens",
      "thinnest lens in the world",
      "lens for minus 8 or minus 10",
      "highest index lens",
      "1.74 super thin",
    ],
    keywords: [
      { word: "1.74", weight: 4 },
      { word: "thinnest", weight: 4 },
      { word: "super", weight: 2 },
      { word: "minus 8", weight: 3 },
      { word: "high power", weight: 3 },
    ],
    answer: `**1.74 Super-Thin Lens:**
• **The highest optical plastic index available globally.**
• **Best for:** Heavy prescriptions **above ±7.00 SPH** or high cylinder values (CYL > -2.00).
• **Benefits:** The absolute slimmest edge profile and lightest weight possible. Makes even severe myopia look discreet and natural.
• **Recommendation:** Always include Anti-Reflective coating with 1.74, as higher index materials reflect slightly more surface light.`,
    followUps: ["Anti-glare coating", "Frames for high power", "Main Menu"],
  },
  {
    id: "index_plus_powers",
    category: "index",
    title: "Lens Index for Plus (+) Powers / Hyperopia",
    questions: [
      "index for plus power",
      "plus lens thickness",
      "why are plus lenses thick in center",
      "hyperopia lens index",
      "best lens for +3 or +4",
    ],
    keywords: [
      { word: "plus", weight: 4 },
      { word: "hyperopia", weight: 3 },
      { word: "center", weight: 2 },
      { word: "bulge", weight: 2 },
      { word: "magnify", weight: 2 },
    ],
    answer: `**Plus (+) lenses (for farsightedness / reading):**
Unlike minus lenses which are thick at the outer edge, **plus lenses are thickest at the dead center**.

• **Why higher index matters for Plus:** A 1.60 or 1.67 index significantly flattens the front curve, cutting both center weight and the "bug-eye" eye magnification effect.
• **Quick Guide:**
  - Up to +2.00: 1.50 or 1.56
  - +2.00 to +4.00: 1.60
  - +4.00 and above: 1.67 or 1.74 (aspheric design recommended).`,
    followUps: ["Understand my power", "Lens index guide", "Main Menu"],
  },
  {
    id: "index_comparison_156_160",
    category: "index",
    title: "Comparison: 1.56 vs 1.60 Index",
    questions: [
      "1.56 vs 1.60",
      "difference between 1.56 and 1.60",
      "is 1.60 worth it over 1.56",
      "should i upgrade to 1.60",
    ],
    keywords: [
      { word: "1.56", weight: 3 },
      { word: "1.60", weight: 3 },
      { word: "versus", weight: 2 },
      { word: "vs", weight: 2 },
      { word: "compare", weight: 2 },
    ],
    answer: `**1.56 vs 1.60 Comparison:**
• **Thickness:** 1.60 is about 15% thinner and 10% lighter than 1.56.
• **Strength:** 1.60 is made from MR-8 resin which is considerably more shatter-resistant and flexible than 1.56.
• **Recommendation:** If your power is below ±2.50, 1.56 is great value. If your power is **±3.00 or higher**, or if you have a half-rim frame, upgrade to 1.60 for visibly thinner edges and stronger durability.`,
    followUps: ["1.60 vs 1.67", "Lens index guide", "Main Menu"],
  },
  {
    id: "index_comparison_160_167",
    category: "index",
    title: "Comparison: 1.60 vs 1.67 Index",
    questions: [
      "1.60 vs 1.67",
      "difference between 1.60 and 1.67",
      "should i get 1.67 or 1.60",
    ],
    keywords: [
      { word: "1.60", weight: 3 },
      { word: "1.67", weight: 3 },
      { word: "versus", weight: 2 },
      { word: "vs", weight: 2 },
    ],
    answer: `**1.60 vs 1.67 Comparison:**
• **Thickness:** 1.67 is ~20% thinner than 1.60 (and up to 40% thinner than standard 1.50).
• **When to choose 1.60:** Ideal for powers between ±3.00 and ±4.75.
• **When to choose 1.67:** Essential once your power crosses **±5.00 SPH** or if you have a cylinder power above -1.50, preventing heavy protruding lens edges.`,
    followUps: ["1.67 vs 1.74", "Lens index guide", "Main Menu"],
  },
  {
    id: "index_high_cylinder",
    category: "index",
    title: "Lens Index for High Cylinder / Astigmatism",
    questions: [
      "index for cylinder power",
      "which lens for astigmatism",
      "high cyl lens thickness",
      "cylinder number thin lens",
    ],
    keywords: [
      { word: "cylinder", weight: 4 },
      { word: "cyl", weight: 4 },
      { word: "astigmatism", weight: 4 },
      { word: "axis", weight: 2 },
    ],
    answer: `**Cylinder (Astigmatism) & Lens Thickness:**
Cylinder power is shaped unevenly (toric curve), meaning your lens will be thicker along one specific meridian or axis.

• If your **CYL is above ±1.50 or ±2.00**, the effective edge thickness increases beyond what your SPH alone suggests.
• **Our Advice:** Step up one index level (e.g. choose 1.60 instead of 1.56, or 1.67 instead of 1.60) to keep the lens balanced, lightweight, and cosmetically sleek!`,
    followUps: ["What is cylinder power", "Power Recommender", "Main Menu"],
  },

  // =========================================================================
  // B) LENS TYPES
  // =========================================================================
  {
    id: "lens_type_single_vision",
    category: "lens_types",
    title: "Single Vision Lenses",
    questions: [
      "what is single vision lens",
      "single vision meaning",
      "who needs single vision",
      "single vision glasses",
    ],
    keywords: [
      { word: "single", weight: 4 },
      { word: "vision", weight: 3 },
      { word: "distance", weight: 2 },
    ],
    answer: `**Single Vision Lenses:**
• **What they are:** One single optical focal power across the entire lens surface.
• **Used for:** Either **Distance vision** (driving, TV, classroom, walking) OR dedicated **Near vision** (reading, detailed hobby work).
• **Who needs them:** Anyone with myopia, hyperopia, or astigmatism who doesn't require separate reading addition (usually under age 40, or those wanting dedicated reading glasses).
• **On Lenzify:** Available across all frame styles in 1.50, 1.56, 1.59 poly (rimless), 1.60, 1.67, and 1.74.`,
    links: [{ label: "Explore Spectacles", url: "/spectacles" }],
    followUps: ["Progressive lenses", "Bifocal lenses", "Main Menu"],
  },
  {
    id: "lens_type_bifocal",
    category: "lens_types",
    title: "Bifocal Lenses",
    questions: [
      "what is bifocal lens",
      "bifocal glasses meaning",
      "visible line on lens",
      "d shape bifocal",
      "kryptok bifocal",
    ],
    keywords: [
      { word: "bifocal", weight: 5 },
      { word: "line", weight: 3 },
      { word: "segment", weight: 3 },
      { word: "two", weight: 2 },
    ],
    answer: `**Bifocal Lenses:**
• **What they are:** Lenses containing **two distinct zones** separated by a visible line or D-segment:
  1. Top zone for Distance vision
  2. Bottom reading window for Near vision
• **Pros:** Instant adaptation, wide near reading zone, very economical.
• **Cons:** A visible line across the lens, "image jump" when shifting gaze, and no intermediate zone for computer/desktop viewing.`,
    followUps: ["Bifocal vs Progressive", "Progressive lenses", "Main Menu"],
  },
  {
    id: "lens_type_progressive",
    category: "lens_types",
    title: "Progressive / Multifocal Lenses",
    questions: [
      "what is progressive lens",
      "multifocal glasses meaning",
      "no line bifocals",
      "how do progressives work",
      "progressive lens guide",
    ],
    keywords: [
      { word: "progressive", weight: 5 },
      { word: "multifocal", weight: 4 },
      { word: "corridor", weight: 2 },
      { word: "varifocal", weight: 4 },
    ],
    answer: `**Progressive Lenses (No-Line Multifocals):**
• **What they are:** Advanced digital lenses providing a seamless, invisible gradient of vision:
  - **Top:** Distance (driving, outdoors)
  - **Middle:** Intermediate (computer monitors, car dashboard)
  - **Bottom:** Near (smartphones, reading books)
• **Key Advantage:** Completely smooth with **NO visible line**. You look younger and enjoy natural vision at every distance.
• **Adaptation:** First-time wearers typically take between 2 to 10 days to train their eyes to move naturally through the corridor.`,
    followUps: ["Progressive tiers", "Adapting to progressives", "Main Menu"],
  },
  {
    id: "lens_progressive_vs_bifocal",
    category: "lens_types",
    title: "Progressive vs Bifocal: Which Should You Choose?",
    questions: [
      "progressive vs bifocal",
      "difference between progressive and bifocal",
      "which is better progressive or bifocal",
      "should i choose progressive or bifocal",
    ],
    keywords: [
      { word: "progressive", weight: 3 },
      { word: "bifocal", weight: 3 },
      { word: "versus", weight: 2 },
      { word: "vs", weight: 2 },
      { word: "better", weight: 2 },
    ],
    answer: `**Progressive vs Bifocal Comparison:**

| Feature | Bifocal | Progressive |
|---|---|---|
| **Cosmetics** | Visible dividing line | Smooth & invisible (no line) |
| **Intermediate Zone** | ❌ No computer distance | ✅ Clear computer/dashboard zone |
| **Image Jump** | Yes, abrupt transition | No, gradual transition |
| **Adaptation** | Instant | Takes a few days to 2 weeks |
| **Best For** | Budget / Traditional wearers | Active lifestyles, computer users, modern look |

If you use computers, tablets, or drive regularly, **Progressive is strongly recommended**!`,
    followUps: ["Progressive tiers", "Bifocal lenses", "Main Menu"],
  },
  {
    id: "lens_progressive_tiers",
    category: "lens_types",
    title: "Lenzify Progressive Tiers: Silver, Gold, Platinum",
    questions: [
      "what are progressive tiers",
      "silver vs gold vs platinum progressive",
      "lenzify progressive options",
      "which progressive tier is best",
    ],
    keywords: [
      { word: "tier", weight: 3 },
      { word: "silver", weight: 3 },
      { word: "gold", weight: 3 },
      { word: "platinum", weight: 3 },
      { word: "progressive", weight: 2 },
    ],
    answer: `**Lenzify Progressive Tiers:**
All our progressives use modern digital back-surface freeform technology:

• **Silver Tier:** Standard digital corridor. Great entry point with dependable distance and reading clarity.
• **Gold Tier:** Wider viewing corridor with reduced peripheral distortion ("swim effect"). Ideal for daily multi-taskers and frequent computer users.
• **Platinum Tier:** Ultra-wide panoramic corridor custom-optimized for your frame and posture. Minimal swim effect and the easiest adaptation period.`,
    links: [{ label: "View Lenses Guide", url: "/lenses" }],
    followUps: ["Adapting to progressives", "Progressive vs Bifocal", "Main Menu"],
  },
  {
    id: "lens_progressive_adaptation",
    category: "lens_types",
    title: "How to Adapt to First-Time Progressive Lenses",
    questions: [
      "how to adapt to progressive glasses",
      "progressive glasses feeling dizzy",
      "adaptation time for progressives",
      "first time progressive tips",
    ],
    keywords: [
      { word: "adapt", weight: 4 },
      { word: "dizzy", weight: 3 },
      { word: "swim", weight: 3 },
      { word: "headache", weight: 2 },
      { word: "first time", weight: 3 },
    ],
    answer: `**Tips for First-Time Progressive Wearers:**
1. **Move your nose, not just your eyes:** Turn your head directly toward what you want to see.
2. **Look straight ahead** for distance, **drop your eyes (not your head)** for reading a phone or book.
3. **Wear them full-time from day one:** Do not switch back and forth to your old glasses, which resets your brain's adaptation clock!
4. **Be patient:** Mild blurriness on the far outer edges is normal for the first few days while your brain learns the zones. Most people feel completely natural in 3 to 10 days.`,
    followUps: ["Talk on WhatsApp", "Progressive lenses", "Main Menu"],
  },
  {
    id: "lens_add_power_rule",
    category: "lens_types",
    title: "Lenzify ADD Power Rule",
    questions: [
      "what is add power rule",
      "why cannot select single vision with add",
      "add power in prescription",
      "why progressive mandatory with add",
    ],
    keywords: [
      { word: "add", weight: 4 },
      { word: "mandatory", weight: 3 },
      { word: "reading addition", weight: 3 },
      { word: "rule", weight: 2 },
    ],
    answer: `**Lenzify Prescription Flow Rule:**
• If your prescription has **no ADD power (or ADD is 0)**, our system automatically filters to **Single Vision** lenses.
• If your prescription has an **ADD value** (e.g. +1.50, +2.00 for reading addition), our system opens **Bifocal and Progressive** lens options so your glasses correctly cover both distance and near vision!`,
    followUps: ["Understand my power", "Progressive vs Bifocal", "Main Menu"],
  },

  // =========================================================================
  // C) LENS COATINGS & TREATMENTS
  // =========================================================================
  {
    id: "coating_blue_cut",
    category: "coatings",
    title: "Blue Cut Lenses (Digital Protection)",
    questions: [
      "what is blue cut lens",
      "do i need blue cut glasses",
      "computer glasses meaning",
      "blue light filter benefits",
      "is blue cut good for screen time",
    ],
    keywords: [
      { word: "blue", weight: 4 },
      { word: "cut", weight: 4 },
      { word: "screen", weight: 3 },
      { word: "computer", weight: 3 },
      { word: "digital", weight: 2 },
      { word: "strain", weight: 2 },
    ],
    answer: `**Blue Cut (Blue Block) Lenses:**
• **What they do:** Specifically filter out harsh high-energy blue-violet light (380–450 nm) emitted by smartphones, laptops, LED screens, and artificial lighting.
• **Benefits:** Reduces digital eye strain, reduces night-time screen glare, and helps maintain natural melatonin levels for better sleep.
• **Myth Buster:** Blue cut lenses are not a cure-all for tired eyes—always follow the **20-20-20 rule** (every 20 minutes, look 20 feet away for 20 seconds).
• **Zero-Power Available:** Yes! You can order non-prescription Blue Cut lenses on any Lenzify frame for office or coding use.`,
    links: [{ label: "View Coatings", url: "/coatings" }],
    followUps: ["Anti-glare vs Blue cut", "Photochromic lenses", "Main Menu"],
  },
  {
    id: "coating_anti_glare",
    category: "coatings",
    title: "Anti-Glare / Anti-Reflective (AR) Coating",
    questions: [
      "what is anti glare coating",
      "anti reflective coating benefits",
      "why do i need anti glare",
      "glasses reflections in photos",
      "night driving glare",
    ],
    keywords: [
      { word: "glare", weight: 4 },
      { word: "anti", weight: 3 },
      { word: "reflection", weight: 4 },
      { word: "ar", weight: 3 },
      { word: "driving", weight: 2 },
    ],
    answer: `**Anti-Reflective (Anti-Glare / AR) Coating:**
• **What it does:** Eliminates internal and external light reflections bouncing off your lenses.
• **Key Benefits:**
  1. **Crisper Vision:** Allows up to 99.5% of visible light through the lens to your eyes.
  2. **Safer Night Driving:** Cuts blinding halos and starbursts around oncoming headlights and street lamps.
  3. **Better Aesthetics:** People see your eyes instead of a mirror reflection, and you look sharp in Zoom calls and photos!`,
    followUps: ["Blue cut lenses", "Photochromic lenses", "Main Menu"],
  },
  {
    id: "coating_photochromic",
    category: "coatings",
    title: "Photochromic (Transition) Lenses",
    questions: [
      "what is photochromic lens",
      "transition glasses meaning",
      "lenses that change color in sun",
      "clear indoor dark outdoor glasses",
      "do photochromics work inside car",
    ],
    keywords: [
      { word: "photochromic", weight: 5 },
      { word: "transition", weight: 4 },
      { word: "sunlight", weight: 3 },
      { word: "dark", weight: 2 },
      { word: "color", weight: 2 },
      { word: "car", weight: 2 },
    ],
    answer: `**Photochromic (Smart Auto-Tint) Lenses:**
• **How they work:** Billions of micro-molecules react to outdoor ultraviolet (UV) light, darkening from crystal-clear indoors to rich sunglass tint outdoors in 30–60 seconds!
• **Convenience:** One pair of glasses for both indoor office work and outdoor sunny protection.
• **Car Note:** Most car windshields have built-in UV-blocking glass, so standard photochromic lenses darken only moderately inside cars.
• **Lenzify Package:** We also offer **Photochromic + Blue Cut combo** lenses for the ultimate all-in-one protection!`,
    links: [{ label: "View Lens Packages", url: "/lenses" }],
    followUps: ["Blue cut vs Photochromic", "Polarized lenses", "Main Menu"],
  },
  {
    id: "coating_comparison_trio",
    category: "coatings",
    title: "Blue Cut vs Photochromic vs Anti-Glare: Which to Pick?",
    questions: [
      "blue cut vs photochromic",
      "which coating should i choose",
      "compare blue cut anti glare photochromic",
      "difference between blue cut and photochromic",
    ],
    keywords: [
      { word: "compare", weight: 3 },
      { word: "blue cut", weight: 3 },
      { word: "photochromic", weight: 3 },
      { word: "versus", weight: 2 },
      { word: "which", weight: 2 },
    ],
    answer: `**Which Lens Coating Fits Your Lifestyle?**

• **If you spend 6+ hours on computers / phones:** Choose **Blue Cut with Anti-Glare**.
• **If you step outdoors frequently & want 2-in-1 convenience:** Choose **Photochromic**.
• **If you want maximum protection everywhere:** Choose our **Photochromic + Blue Cut Package** (clear & blue-filtered indoors, dark sunglasses outdoors).
• **For Night Driving:** Ensure premium **Anti-Reflective coating** is equipped to banish headlight glare.`,
    followUps: ["Photochromic lenses", "Blue cut lenses", "Main Menu"],
  },
  {
    id: "coating_polarized",
    category: "coatings",
    title: "Polarized Lenses for Sunglasses",
    questions: [
      "what is polarized lens",
      "difference between tinted and polarized",
      "are polarized glasses good for driving",
      "water glare sunglasses",
    ],
    keywords: [
      { word: "polarized", weight: 5 },
      { word: "sunglasses", weight: 3 },
      { word: "glare", weight: 2 },
      { word: "reflection", weight: 2 },
      { word: "driving", weight: 2 },
    ],
    answer: `**Polarized Lenses:**
• **What they do:** Contain a microscopic vertical chemical filter that completely blocks horizontal glare bouncing off wet roads, puddles, car hoods, snow, and water surfaces.
• **Ideal For:** Daytime driving, beach trips, fishing, and outdoor sports.
• **Note:** Polarized filters can sometimes make certain phone or ATM LCD screens look darkened when tilted.`,
    links: [{ label: "Shop Sunglasses", url: "/sunglasses" }],
    followUps: ["Photochromic lenses", "Anti-glare coating", "Main Menu"],
  },
  {
    id: "coating_uv_protection",
    category: "coatings",
    title: "UV400 Protection",
    questions: [
      "what is uv400",
      "do lenzify lenses have uv protection",
      "why is uv protection important for eyes",
    ],
    keywords: [
      { word: "uv400", weight: 4 },
      { word: "uv", weight: 4 },
      { word: "ultraviolet", weight: 3 },
    ],
    answer: `**UV400 Protection:**
• Blocks 99% to 100% of all harmful UVA and UVB radiation up to 400 nanometers.
• Critical for preventing long-term photokeratitis, cataracts, and retinal damage caused by direct sun exposure.
• **At Lenzify:** All our Polycarbonate 1.59, High Index, and Sunglasses lenses come with built-in UV400 standard.`,
    followUps: ["Polarized lenses", "Photochromic lenses", "Main Menu"],
  },

  // =========================================================================
  // D) UNDERSTANDING YOUR PRESCRIPTION / POWER
  // =========================================================================
  {
    id: "rx_terms_explained",
    category: "prescription",
    title: "How to Read Your Prescription (SPH, CYL, AXIS, ADD, PD)",
    questions: [
      "how to read my eye prescription",
      "what does sph mean",
      "what does cyl mean",
      "what does axis mean",
      "what is pd pupillary distance",
      "what is od and os",
      "eyeglass prescription numbers explained",
    ],
    keywords: [
      { word: "sph", weight: 4 },
      { word: "cyl", weight: 4 },
      { word: "axis", weight: 4 },
      { word: "add", weight: 4 },
      { word: "pd", weight: 4 },
      { word: "od", weight: 3 },
      { word: "os", weight: 3 },
      { word: "prescription", weight: 3 },
    ],
    answer: `**Prescription Terms Demystified:**

• **OD (Oculus Dexter) / RE:** Right Eye
• **OS (Oculus Sinister) / LE:** Left Eye
• **SPH (Sphere):** The main power correction.
  - **Minus (-):** Nearsightedness / Myopia (trouble seeing far)
  - **Plus (+):** Farsightedness / Hyperopia (trouble seeing near)
• **CYL (Cylinder):** Correction for astigmatism (irregular cornea curvature). Can be minus or plus.
• **AXIS:** The orientation angle (1 to 180 degrees) of the cylinder correction.
• **ADD:** Reading addition power for bifocal or progressive lenses (usually +0.75 to +3.00).
• **PD (Pupillary Distance):** The distance between your pupil centers in millimeters (typically 58–68 mm). Ensures the optical center of the lens aligns exactly with your pupils.`,
    followUps: ["How to measure PD", "Minus vs Plus power", "Main Menu"],
  },
  {
    id: "rx_minus_vs_plus",
    category: "prescription",
    title: "Minus (-) vs Plus (+) Power Meaning",
    questions: [
      "what does minus power mean",
      "what does plus power mean",
      "difference between minus and plus glasses",
      "is minus power myopia",
      "is plus power hyperopia",
    ],
    keywords: [
      { word: "minus", weight: 4 },
      { word: "plus", weight: 4 },
      { word: "myopia", weight: 3 },
      { word: "hyperopia", weight: 3 },
      { word: "nearsighted", weight: 3 },
      { word: "farsighted", weight: 3 },
    ],
    answer: `**Minus (-) vs Plus (+) Power:**

• **Minus (-) Power (Myopia / Nearsightedness):**
  - You see close objects clearly, but distant objects (road signs, TV, classroom board) appear blurry.
  - Corrected with concave lenses (thinner at the center, thicker at edges).

• **Plus (+) Power (Hyperopia / Farsightedness):**
  - You struggle to focus on close objects (reading, texting, sewing).
  - Corrected with convex lenses (thicker at the center, thinner at edges).

Got your numbers? Type them here (e.g. "-3.50") to see your ideal lens index!`,
    followUps: ["Power Recommender", "Lens index guide", "Main Menu"],
  },
  {
    id: "rx_astigmatism_explained",
    category: "prescription",
    title: "What is Astigmatism / Cylindrical Power?",
    questions: [
      "what is astigmatism",
      "why do i have cylinder power",
      "cylindrical power meaning",
      "curved cornea meaning",
      "blurry vision at all distances",
    ],
    keywords: [
      { word: "astigmatism", weight: 5 },
      { word: "cylinder", weight: 4 },
      { word: "cyl", weight: 4 },
      { word: "cornea", weight: 2 },
    ],
    answer: `**Astigmatism Explained:**
Normally, your cornea is round like a football. In astigmatism, it is curved more like an oval rugby ball. Light focuses at two different points instead of one, causing blurred or stretched vision at **both near and far distances**.

• It is completely common and corrected with **Cylinder (CYL)** and an **Axis angle**.
• It does NOT mean weak eye health; it's simply an optical shape variation.
• Tip: If CYL is high (-2.00 or above), pick a higher lens index for thinner edges!`,
    followUps: ["Lens index for cylinder", "Understand my power", "Main Menu"],
  },
  {
    id: "rx_how_to_measure_pd",
    category: "prescription",
    title: "What is PD and How is it Measured?",
    questions: [
      "how to measure pd",
      "pupillary distance measurement",
      "what if pd is not on prescription",
      "can i use standard pd",
    ],
    keywords: [
      { word: "pd", weight: 5 },
      { word: "pupillary", weight: 4 },
      { word: "measure", weight: 3 },
      { word: "ruler", weight: 2 },
    ],
    answer: `**Pupillary Distance (PD):**
PD is the millimeter distance between the centers of your two pupils. Average adult PD is **62–64 mm** (range 58–68 mm).

• **If missing on your doctor's slip:**
  1. Hold a millimeter ruler flat against your forehead just above your eyes.
  2. Look straight into a mirror (or have a friend assist).
  3. Align the 0 mm mark over the center of your right pupil, and read the millimeter mark over your left pupil.
• On Lenzify, if you leave PD blank, our optical lab uses the clinically standard average (63 mm) tailored to your frame width.`,
    followUps: ["How to enter prescription", "Main Menu"],
  },
  {
    id: "rx_upload_flow",
    category: "prescription",
    title: "How to Upload or Enter Prescription on Lenzify",
    questions: [
      "how to upload prescription",
      "where to enter my power on lenzify",
      "step by step prescription entry",
      "can i send prescription on whatsapp",
    ],
    keywords: [
      { word: "upload", weight: 4 },
      { word: "enter", weight: 3 },
      { word: "flow", weight: 2 },
      { word: "doctor", weight: 2 },
      { word: "slip", weight: 3 },
    ],
    answer: `**Entering Your Prescription on Lenzify is Easy & Mandatory:**

1. Navigate to any frame you like and click **"Select Lenses"**.
2. **Step 1 is Prescription Entry:**
   - Either type your numbers: **Right Eye (OD)** and **Left Eye (OS)** for SPH, CYL, AXIS, and ADD.
   - OR simply click **"Upload Prescription"** to attach a clear photo/PDF of your doctor's slip!
3. Our certified opticians verify every prescription before lab surfacing.
4. Need help reading your slip? You can also send a photo directly to our team on **WhatsApp at +91 9886266611**!`,
    links: [{ label: "Upload on WhatsApp", url: "https://wa.me/919886266611?text=Hi%20Lenzify!%20Please%20help%20me%20read%20my%20prescription." }],
    followUps: ["Talk on WhatsApp", "Prescription terms", "Main Menu"],
  },
  {
    id: "rx_power_limits",
    category: "prescription",
    title: "Power Range Lab Limits",
    questions: [
      "what is max power supported",
      "do you make high minus lenses",
      "can you make minus 10 or plus 6",
      "supported power range",
    ],
    keywords: [
      { word: "range", weight: 3 },
      { word: "limit", weight: 3 },
      { word: "maximum", weight: 3 },
      { word: "max", weight: 3 },
      { word: "high power", weight: 3 },
    ],
    answer: `**Power Availability at Lenzify:**
${CONTACT_CONFIG.POWER_RANGE_AVAILABILITY}

If you have a complex prescription (e.g. Prism correction or extreme cylinder), please connect with us on WhatsApp for specialized laboratory surfacing!`,
    followUps: ["Talk on WhatsApp", "1.74 Super Thin", "Main Menu"],
  },

  // =========================================================================
  // E) FRAME TYPES, MATERIALS & FIT
  // =========================================================================
  {
    id: "frames_types_overview",
    category: "frames",
    title: "Frame Types: Full Rim vs Half Rim vs Rimless vs Shell",
    questions: [
      "what are the types of frames",
      "full rim vs rimless",
      "what is half rim frame",
      "what is shell frame",
      "which frame type is most durable",
    ],
    keywords: [
      { word: "full rim", weight: 4 },
      { word: "half rim", weight: 4 },
      { word: "rimless", weight: 4 },
      { word: "shell", weight: 3 },
      { word: "types", weight: 2 },
    ],
    answer: `**Lenzify Frame Types Guide:**

• **Full Rim (Metal):** Classic full metal rim encircling the lenses. Sturdy, versatile, and professional.
• **Shell (Acetate Full Frame):** Premium bold acetate or TR90 plastic. **Best for hiding thick lens edges** in higher powers!
• **Half Rim (Semi-Rimless / Supra):** Solid top rim with nylon suspension thread along the bottom. Light and sophisticated.
• **Rimless (Drill-Mount):** Zero frame border; temples and bridge drill directly into the lens. Ultra-light and minimalistic.
  *(Site rule: Rimless requires 1.59 Polycarbonate lenses).*`,
    links: [{ label: "Browse Spectacles", url: "/spectacles" }],
    followUps: ["Rimless frame guide", "Best frame for high power", "Main Menu"],
  },
  {
    id: "frames_face_shape",
    category: "frames",
    title: "Face Shape Guide: Find Your Perfect Match",
    questions: [
      "which glasses suit my face shape",
      "glasses for round face",
      "glasses for square face",
      "glasses for oval face",
      "glasses for heart face",
      "face shape guide",
    ],
    keywords: [
      { word: "face", weight: 5 },
      { word: "shape", weight: 5 },
      { word: "round", weight: 3 },
      { word: "square", weight: 3 },
      { word: "oval", weight: 3 },
      { word: "heart", weight: 3 },
    ],
    answer: `**Find the Perfect Frame for Your Face Shape:**

• **Round Face:** Choose **Rectangular, Square, or Wayfarer** frames. Sharp angles add structure and balance round cheeks.
• **Square Face:** Choose **Round, Oval, or Curved Browline** frames. Soft curves soften a strong jawline.
• **Oval Face:** Lucky you! Almost all frame shapes look fantastic—especially **Aviators, Cat-Eyes, and Geometric** frames.
• **Heart Face (Broad forehead, pointed chin):** Choose **Light metal wire, Bottom-heavy, or Rimless** frames.
• **Oblong / Long Face:** Choose **Tall, Oversized, or Thick-temple** frames to visually break vertical length.`,
    links: [{ label: "Explore Spectacles", url: "/spectacles" }],
    followUps: ["How to know my frame size", "Frame materials", "Main Menu"],
  },
  {
    id: "frames_size_guide",
    category: "frames",
    title: "How to Find Your Frame Size (e.g. 52-18-140)",
    questions: [
      "how to know my frame size",
      "glasses size guide",
      "what does 52 18 140 mean",
      "how to measure my face for glasses",
      "small medium large glasses",
    ],
    keywords: [
      { word: "size", weight: 5 },
      { word: "width", weight: 3 },
      { word: "bridge", weight: 3 },
      { word: "temple", weight: 3 },
      { word: "small", weight: 2 },
      { word: "medium", weight: 2 },
    ],
    answer: `**Understanding Eyewear Sizing:**
Look inside the temple (arm) of your existing comfortable glasses. You'll spot numbers like **52 ▢ 18 - 140**:
• **52 mm (Lens Width):** Horizontal width of one lens.
• **18 mm (Bridge Width):** Space between lenses sitting over your nose.
• **140 mm (Temple Length):** Total length of the arm curving behind your ear.

**General Total Width Rule:**
• Small: < 130 mm total width
• Medium (Fits 80% of adults): 131–138 mm
• Large / Wide: > 139 mm`,
    followUps: ["Face shape guide", "Frame materials", "Main Menu"],
  },
  {
    id: "frames_materials_guide",
    category: "frames",
    title: "Frame Materials: Acetate vs TR90 vs Titanium vs Metal",
    questions: [
      "what is acetate frame",
      "what is tr90 frame",
      "titanium glasses benefits",
      "best frame material",
      "hypoallergenic glasses",
      "lightest frame material",
    ],
    keywords: [
      { word: "material", weight: 4 },
      { word: "acetate", weight: 4 },
      { word: "tr90", weight: 4 },
      { word: "titanium", weight: 4 },
      { word: "metal", weight: 3 },
      { word: "hypoallergenic", weight: 3 },
    ],
    answer: `**Eyewear Materials Compared:**

• **Cellulose Acetate:** High-gloss, premium plant-derived organic plastic. Deep rich colors, easily adjustable by hand when warmed, and highly durable.
• **TR90 Memory Plastic:** Ultra-flexible thermoplastic with shape memory. Featherlight, sweat-resistant, and ideal for sports or all-day wear.
• **Titanium:** Aerospace-grade metal. Extremely light, rust-proof, incredibly strong, and 100% hypoallergenic (nickel-free).
• **Stainless Steel / Monel:** Sleek, structural, resistant to corrosion, with clean minimalist lines.`,
    followUps: ["Face shape guide", "Best frame for high power", "Main Menu"],
  },
  {
    id: "frames_high_minus_tip",
    category: "frames",
    title: "Best Frames for High Minus Power",
    questions: [
      "best frame for high power",
      "how to hide thick lens edges",
      "which glasses for minus 5 or 6",
      "glasses to prevent thick lens look",
    ],
    keywords: [
      { word: "high power", weight: 4 },
      { word: "thick", weight: 4 },
      { word: "hide", weight: 3 },
      { word: "edge", weight: 3 },
    ],
    answer: `**3 Golden Rules for High Minus Prescriptions:**

1. **Pick Smaller, Rounder Lenses:** Minus lenses get thicker toward the outer edges. A smaller lens diameter (e.g. 48–50 mm) cuts away the thickest outer perimeter!
2. **Choose Thick Acetate / Shell Frames:** The acetate rim acts like a bezel, hiding the lens edge within the frame profile.
3. **Avoid Rimless Frames:** Rimless exposes the full naked edge of the lens, making high powers much more noticeable.`,
    followUps: ["1.67 Ultra-Thin", "1.74 Super Thin", "Main Menu"],
  },

  // =========================================================================
  // F) CONTACT LENSES
  // =========================================================================
  {
    id: "cl_types_overview",
    category: "contact_lenses",
    title: "Contact Lens Types (Daily, Monthly, Toric, Colored)",
    questions: [
      "what contact lenses do you have",
      "daily vs monthly contact lenses",
      "toric contact lenses for astigmatism",
      "colored contact lenses",
      "contact lens options",
    ],
    keywords: [
      { word: "contact", weight: 4 },
      { word: "daily", weight: 3 },
      { word: "monthly", weight: 3 },
      { word: "toric", weight: 3 },
      { word: "colored", weight: 3 },
      { word: "lenses", weight: 2 },
    ],
    answer: `**Contact Lens Varieties on Lenzify:**

• **Daily Disposables:** Open a fresh, sterile pair every morning and discard at night. Zero cleaning hassle, highest hygiene.
• **Monthly Disposables:** Worn daily for 30 days, cleaned and stored in multi-purpose solution every evening. Excellent monthly cost efficiency.
• **Toric Lenses:** Specially weighted lenses designed to correct astigmatism (cylinder & axis).
• **Colored / Cosmetic Lenses:** Stunning natural tints available in powered and zero-power options.
• **GST Included:** All contact lens prices on Lenzify include GST!`,
    links: [{ label: "Shop Contact Lenses", url: "/contact-lenses" }],
    followUps: ["Contact lens power flow", "Contact lens care", "Main Menu"],
  },
  {
    id: "cl_power_customization_flow",
    category: "contact_lenses",
    title: "How to Customize Contact Lens Power on Lenzify",
    questions: [
      "how to order contact lenses with power",
      "contact lens power customization flow",
      "is entering contact lens power mandatory",
      "can i have different powers for both eyes",
    ],
    keywords: [
      { word: "customize", weight: 3 },
      { word: "contact power", weight: 4 },
      { word: "mandatory", weight: 3 },
      { word: "both eyes", weight: 3 },
      { word: "cart", weight: 2 },
    ],
    answer: `**Customizing Contact Lens Power on Lenzify:**

• **Mandatory Power Selection:** Before adding any contact lens pack to your cart, our system requires you to enter the **Right Eye (OD)** and **Left Eye (OS)** powers.
• **Different Powers per Eye:** Perfectly supported! Select the exact sphere, cylinder, and axis for each eye.
• **Saved with Order:** Your custom prescription is securely attached directly to your order item so our fulfillment team picks the exact blister packs!`,
    links: [{ label: "Explore Contact Lenses", url: "/contact-lenses" }],
    followUps: ["Contact lens vs glasses power", "Contact lens care", "Main Menu"],
  },
  {
    id: "cl_vs_spectacle_power",
    category: "contact_lenses",
    title: "Contact Lens Power vs Glasses Power (Vertex Distance)",
    questions: [
      "is contact lens power same as glasses power",
      "why is contact lens power different",
      "vertex distance explained",
      "can i use my spectacle prescription for contacts",
    ],
    keywords: [
      { word: "contact power", weight: 4 },
      { word: "glasses power", weight: 4 },
      { word: "vertex", weight: 4 },
      { word: "different", weight: 3 },
      { word: "same", weight: 2 },
    ],
    answer: `**Are Contact Lens and Glasses Powers the Same?**

• **For low powers (under ±3.50):** They are typically identical or very close.
• **For higher powers (above ±4.00):** Contact lenses sit directly on your cornea (0 mm distance), whereas spectacles sit ~12 mm away from your eyes. Because of this **vertex distance**:
  - Minus power contact lenses are usually **slightly lower** than your glasses (e.g. -5.00 glasses might be -4.50 contacts).
  - Plus power contact lenses are usually **slightly higher**.
• **Recommendation:** Always refer to an optometrist's contact lens prescription for the best vision and fit!`,
    followUps: ["Contact lens care", "Contact lens options", "Main Menu"],
  },
  {
    id: "cl_care_and_hygiene",
    category: "contact_lenses",
    title: "Contact Lens Care, Hygiene & Safety Rules",
    questions: [
      "how to clean contact lenses",
      "can i sleep with contact lenses",
      "can i wash contacts with water",
      "contact lens safety rules",
      "red eye from contact lens",
    ],
    keywords: [
      { word: "care", weight: 4 },
      { word: "clean", weight: 4 },
      { word: "solution", weight: 4 },
      { word: "sleep", weight: 3 },
      { word: "water", weight: 3 },
      { word: "saliva", weight: 3 },
      { word: "hygiene", weight: 3 },
    ],
    answer: `**Essential Contact Lens Safety Rules:**

1. **Clean Hands:** Always wash hands with plain soap and lint-free towel before touching lenses.
2. **Never Use Water or Saliva:** Only rinse and store lenses in approved multi-purpose contact lens solution. Tap water contains dangerous amoebas (*Acanthamoeba*) that cause severe corneal infections!
3. **Never Sleep in Lenses:** Unless specifically prescribed for extended overnight wear, sleeping in contacts deprives the cornea of oxygen.
4. **Replace on Schedule:** Discard dailies every night and monthlies every 30 days.
5. **Red Flag:** If you experience redness, pain, or blurred vision, remove lenses immediately and consult an eye specialist.`,
    followUps: ["Contact lens options", "Main Menu"],
  },

  // =========================================================================
  // G) READING GLASSES
  // =========================================================================
  {
    id: "reading_glasses_overview",
    category: "reading_glasses",
    title: "Reading Glasses Guide & Presbyopia",
    questions: [
      "what are reading glasses",
      "who needs reading glasses",
      "what is presbyopia",
      "reading glasses power by age",
      "ready made reading glasses",
    ],
    keywords: [
      { word: "reading", weight: 5 },
      { word: "presbyopia", weight: 4 },
      { word: "age", weight: 3 },
      { word: "books", weight: 2 },
      { word: "phone", weight: 2 },
    ],
    answer: `**Reading Glasses & Presbyopia:**
Around age 40, the eye's natural crystalline lens gradually loses flexibility, making small text on books, menus, and smartphones harder to focus on up close. This natural process is called **Presbyopia**.

• **Rough Power Guide by Age:**
  - Age 40–44: +0.75 to +1.00
  - Age 45–49: +1.25 to +1.50
  - Age 50–54: +1.75 to +2.00
  - Age 55–59: +2.25 to +2.50
  - Age 60+: +2.50 to +3.50

Explore our curated ready-to-wear and custom prescription reading glasses online!`,
    links: [{ label: "Shop Reading Glasses", url: "/reading-glasses" }],
    followUps: ["Computer glasses", "Progressive lenses", "Main Menu"],
  },

  // =========================================================================
  // H) ORDERS, DELIVERY, PAYMENTS, RETURNS, WARRANTY & SUPPORT
  // =========================================================================
  {
    id: "orders_how_to_order",
    category: "orders_support",
    title: "How to Place an Order on Lenzify",
    questions: [
      "how to order glasses on lenzify",
      "how to buy spectacles online",
      "ordering process step by step",
    ],
    keywords: [
      { word: "order", weight: 4 },
      { word: "buy", weight: 3 },
      { word: "place", weight: 3 },
      { word: "process", weight: 2 },
    ],
    answer: `**Placing an Order on Lenzify in 4 Simple Steps:**

1. **Pick Your Frame:** Browse our Spectacles, Sunglasses, or Reading Glasses.
2. **Select Lenses:** Choose Single Vision, Bifocal, or Progressive, and select your preferred index and blue-cut/photochromic coating.
3. **Provide Prescription:** Enter your powers manually or upload a quick photo of your doctor's slip.
4. **Checkout:** Enter delivery address and pay securely via UPI, Cards, Net Banking, or Wallets!`,
    links: [{ label: "Start Shopping", url: "/products" }],
    followUps: ["Order tracking", "Delivery time", "Main Menu"],
  },
  {
    id: "orders_track_status",
    category: "orders_support",
    title: "How to Track Your Order",
    questions: [
      "where is my order",
      "how to track order",
      "order status check",
      "track my spectacles",
      "track shipment",
    ],
    keywords: [
      { word: "track", weight: 5 },
      { word: "status", weight: 4 },
      { word: "where", weight: 2 },
      { word: "shipment", weight: 3 },
      { word: "courier", weight: 3 },
    ],
    answer: `**Tracking Your Lenzify Order:**

• **Online:** Log into your account and navigate to **My Orders** to view real-time updates and courier tracking numbers.
• **Order Lifecycle:**
  1. *Confirmed:* Prescription reviewed by our lab team.
  2. *Lens Surfacing:* Custom optical lenses cut and fitted into your frame.
  3. *Quality Check:* Laser verified against your prescription parameters.
  4. *Dispatched:* Handed over to our premium courier partner with active tracking SMS/email!`,
    links: [{ label: "View My Orders", url: "/orders" }],
    followUps: ["Delivery time", "Talk on WhatsApp", "Main Menu"],
  },
  {
    id: "orders_delivery_time",
    category: "orders_support",
    title: "Delivery Time & Shipping Speed",
    questions: [
      "how long does delivery take",
      "when will my glasses arrive",
      "delivery time lenzify",
      "how many days to deliver",
      "kab aayega chashma",
    ],
    keywords: [
      { word: "delivery", weight: 5 },
      { word: "time", weight: 4 },
      { word: "days", weight: 3 },
      { word: "shipping", weight: 3 },
      { word: "arrive", weight: 2 },
    ],
    answer: `**Delivery Timeframe:**
• Standard Delivery: **${CONTACT_CONFIG.DELIVERY_TIME}**.
• Ready-to-ship frames / non-prescription sunglasses dispatch within 24 hours.
• Custom surfaced high-index or progressive lenses undergo 48 hours of precision lab cutting and multi-stage alignment before dispatch.
• All shipments are securely packed in shock-absorbing hardshell cases.`,
    followUps: ["Shipping charges", "Order tracking", "Main Menu"],
  },
  {
    id: "orders_shipping_charges",
    category: "orders_support",
    title: "Shipping Charges",
    questions: [
      "is shipping free",
      "delivery charges",
      "shipping cost",
      "kitna delivery charge lagega",
    ],
    keywords: [
      { word: "shipping", weight: 4 },
      { word: "free", weight: 3 },
      { word: "charge", weight: 3 },
      { word: "cost", weight: 3 },
    ],
    answer: `**Shipping Charges at Lenzify:**
${CONTACT_CONFIG.SHIPPING_CHARGES}.

No hidden fees or unexpected surcharges at checkout!`,
    links: [{ label: "Shipping Policy", url: "/shipping-policy" }],
    followUps: ["Payment methods", "Delivery time", "Main Menu"],
  },
  {
    id: "orders_payment_methods",
    category: "orders_support",
    title: "Payment Methods & COD",
    questions: [
      "what payment methods do you accept",
      "is cod available",
      "can i pay cash on delivery",
      "upi payment",
      "credit card payment",
    ],
    keywords: [
      { word: "payment", weight: 4 },
      { word: "cod", weight: 4 },
      { word: "cash", weight: 3 },
      { word: "upi", weight: 3 },
      { word: "razorpay", weight: 3 },
    ],
    answer: `**Payment Options:**
We accept 100% secure, encrypted digital payments powered by Razorpay:
• **UPI:** Google Pay, PhonePe, Paytm, BHIM, Cred
• **Cards:** All Visa, MasterCard, RuPay, and American Express Debit/Credit Cards
• **Net Banking:** 50+ major Indian banks
• **Wallets:** Paytm, Mobikwik, etc.

*COD Status:* ${CONTACT_CONFIG.COD_POLICY_NOTE}`,
    followUps: ["Shipping charges", "Order tracking", "Main Menu"],
  },
  {
    id: "orders_lens_replacement",
    category: "orders_support",
    title: "Lens Replacement Service (Put New Lenses in Old Frames)",
    questions: [
      "can i change lenses in my old frame",
      "lens replacement service",
      "replace lenses only",
      "old frame new lens",
      "chashma lens badalna",
    ],
    keywords: [
      { word: "replacement", weight: 5 },
      { word: "replace", weight: 4 },
      { word: "old", weight: 3 },
      { word: "change", weight: 2 },
    ],
    answer: `**Lenzify Lens Replacement Service:**
Love your current frame but your power has changed? We can fit brand new optical lenses into your existing frame!

1. Select your preferred new lenses and submit your prescription online.
2. Ship your frame to our optical atelier (or opt for doorstep pickup where available).
3. Our master opticians inspect the frame, precision-edge your new lenses, and ship your refreshed glasses back!
Starting from just **${CONTACT_CONFIG.LENS_REPLACEMENT_STARTING_PRICE}**.`,
    links: [{ label: "Book Lens Replacement", url: "/replace-lenses" }],
    followUps: ["Lens index guide", "Talk on WhatsApp", "Main Menu"],
  },
  {
    id: "orders_try_at_home",
    category: "orders_support",
    title: "Try-At-Home Service",
    questions: [
      "can i try frames at home",
      "try at home service",
      "home trial of glasses",
      "test frames at home",
    ],
    keywords: [
      { word: "try", weight: 4 },
      { word: "home", weight: 4 },
      { word: "trial", weight: 4 },
    ],
    answer: `**Lenzify Try-At-Home:**
We bring the optical atelier experience to your living room! Pick your favorite styles online, try them on in the comfort of your home, and choose the look that fits your style best.`,
    links: [{ label: "Learn About Try At Home", url: "/try-at-home" }],
    followUps: ["Face shape guide", "Main Menu"],
  },
  {
    id: "orders_returns_warranty",
    category: "orders_support",
    title: "Returns, Exchange & Warranty Policy",
    questions: [
      "what is return policy",
      "can i return my glasses",
      "warranty on frames and lenses",
      "exchange policy",
      "defective product replacement",
    ],
    keywords: [
      { word: "return", weight: 4 },
      { word: "refund", weight: 4 },
      { word: "warranty", weight: 4 },
      { word: "exchange", weight: 3 },
      { word: "policy", weight: 2 },
    ],
    answer: `**Returns & Warranty at Lenzify:**

• **Returns:** ${CONTACT_CONFIG.RETURN_POLICY_SUMMARY} (Within ${CONTACT_CONFIG.RETURN_WINDOW_DAYS}).
• **Warranty:** ${CONTACT_CONFIG.WARRANTY_POLICY_SUMMARY} (Duration: ${CONTACT_CONFIG.WARRANTY_MONTHS}).
• **Prescription Guarantee:** If you feel the vision power was cut incorrectly compared to the prescription slip you uploaded, our team will re-fit or adjust your lenses for free!`,
    links: [
      { label: "Returns Policy", url: "/returns-and-refunds" },
      { label: "Warranty Details", url: "/warranty" },
    ],
    followUps: ["Talk on WhatsApp", "Order tracking", "Main Menu"],
  },
  {
    id: "orders_cleaning_care",
    category: "orders_support",
    title: "How to Clean & Care for Your Eyewear",
    questions: [
      "how to clean glasses",
      "best way to clean lenses",
      "how to remove scratches",
      "cleaning cloth for glasses",
      "can i use soap on glasses",
    ],
    keywords: [
      { word: "clean", weight: 4 },
      { word: "wash", weight: 3 },
      { word: "microfiber", weight: 3 },
      { word: "scratches", weight: 3 },
      { word: "cloth", weight: 2 },
    ],
    answer: `**Pro Tips for Crystal-Clear, Scratch-Free Lenses:**

1. **Rinse with Lukewarm Water first:** Removes microscopic dust grit that causes hairline scratches when rubbed.
2. **Use Mild Dish Soap or Lens Spray:** Gently rub with fingertips, then rinse.
3. **Always dry with a Microfiber Cloth:** Never use tissues, napkins, t-shirts, or towels—their wood pulp fibers create micro-scratches on delicate anti-glare coatings!
4. **Never Leave in Hot Cars:** Excessive heat damages the multi-layer AR coating. Always store in your Lenzify protective hardshell case.`,
    links: [{ label: "Eyewear Care Guide", url: "/care" }],
    followUps: ["Main Menu"],
  },
  {
    id: "orders_contact_support",
    category: "orders_support",
    title: "Contact Customer Support & Store Information",
    questions: [
      "how to contact customer care",
      "customer support phone number",
      "lenzify email address",
      "store address and hours",
      "talk to human",
    ],
    keywords: [
      { word: "contact", weight: 4 },
      { word: "support", weight: 4 },
      { word: "phone", weight: 3 },
      { word: "email", weight: 3 },
      { word: "hours", weight: 2 },
      { word: "help", weight: 2 },
    ],
    answer: `**Lenzify Customer Care:**

• **WhatsApp:** +${CONTACT_CONFIG.WHATSAPP_NUMBER} (Fastest response)
• **Phone:** ${CONTACT_CONFIG.STORE_PHONE}
• **Email:** ${CONTACT_CONFIG.STORE_EMAIL}
• **Hours:** ${CONTACT_CONFIG.STORE_HOURS}
• **Location:** ${CONTACT_CONFIG.STORE_LOCATION}`,
    links: [
      { label: "Contact Us Page", url: "/contact" },
      { label: "Chat on WhatsApp", url: `https://wa.me/${CONTACT_CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(CONTACT_CONFIG.WHATSAPP_DEFAULT_MESSAGE)}` },
    ],
    followUps: ["Talk on WhatsApp", "Order tracking", "Main Menu"],
  },

  // =========================================================================
  // I) SMALL TALK & GREETINGS
  // =========================================================================
  {
    id: "smalltalk_hello",
    category: "smalltalk",
    title: "Greetings & Hello",
    questions: [
      "hello",
      "hi",
      "hey",
      "namaste",
      "good morning",
      "good afternoon",
      "good evening",
      "kya haal hai",
    ],
    keywords: [
      { word: "hello", weight: 4 },
      { word: "hi", weight: 4 },
      { word: "hey", weight: 3 },
      { word: "namaste", weight: 4 },
    ],
    answer: `Hello! 👋 I'm **Lenzi**, your personal optical assistant at Lenzify! 👓

How can I help you today? You can ask me about **lens thickness, your power numbers, frame styling, contact lenses, or order tracking**!`,
    followUps: ["Which lens is right for me?", "Lens index guide", "Understand my power", "Orders & delivery"],
  },
  {
    id: "smalltalk_who_are_you",
    category: "smalltalk",
    title: "Who are you / Are you human?",
    questions: [
      "who are you",
      "are you human",
      "what is your name",
      "are you a robot",
      "koun ho tum",
    ],
    keywords: [
      { word: "who", weight: 3 },
      { word: "human", weight: 4 },
      { word: "robot", weight: 4 },
      { word: "name", weight: 2 },
      { word: "bot", weight: 3 },
    ],
    answer: `I'm **Lenzi** 👓, Lenzify's automated optical assistant! I'm here 24/7 to help you pick the perfect lenses, explain prescriptions, and guide you through our collections.

If you ever prefer to speak with our human opticians and styling experts, you can switch to **WhatsApp at +91 9886266611** anytime!`,
    links: [{ label: "Chat with a Human on WhatsApp", url: `https://wa.me/${CONTACT_CONFIG.WHATSAPP_NUMBER}?text=Hi%20Lenzify!%20I%20would%20like%20to%20speak%20with%20an%20optician.` }],
    followUps: ["Talk on WhatsApp", "Lens index guide", "Main Menu"],
  },
  {
    id: "smalltalk_thanks",
    category: "smalltalk",
    title: "Thank You / Gratitude",
    questions: [
      "thank you",
      "thanks",
      "dhanyawad",
      "shukriya",
      "great help",
      "awesome thanks",
    ],
    keywords: [
      { word: "thank", weight: 4 },
      { word: "thanks", weight: 4 },
      { word: "dhanyawad", weight: 4 },
      { word: "shukriya", weight: 4 },
    ],
    answer: `You're very welcome! 😊 Helping you find clear, comfortable vision and stylish frames is what I'm here for!

Let me know if you need anything else, or enjoy exploring our collections. 👓✨`,
    links: [{ label: "Explore New Arrivals", url: "/products" }],
    followUps: ["Main Menu", "Talk on WhatsApp"],
  },
  {
    id: "smalltalk_bye",
    category: "smalltalk",
    title: "Goodbye & Farewell",
    questions: [
      "bye",
      "goodbye",
      "see you",
      "alvida",
      "cya",
    ],
    keywords: [
      { word: "bye", weight: 5 },
      { word: "goodbye", weight: 5 },
      { word: "see you", weight: 3 },
    ],
    answer: `Goodbye! Have a fantastic day ahead! If you have any more optical questions later, just tap my launcher icon. 👓👋`,
    followUps: ["Main Menu"],
  },
];
