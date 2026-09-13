const { jsPDF } = require("jspdf");
const fs = require("fs");
const path = require("path");

const doc = new jsPDF({
  orientation: "portrait",
  unit: "mm",
  format: "a4",
});

const pageWidth = doc.internal.pageSize.getWidth();
const pageHeight = doc.internal.pageSize.getHeight();
const margin = 16;
const contentWidth = pageWidth - margin * 2;

let y = 18;

function checkPageBreak(neededHeight) {
  if (y + neededHeight > pageHeight - 18) {
    doc.addPage();
    y = 18;
    drawHeaderFooter();
  }
}

function drawHeaderFooter() {
  const currentY = y;
  // Header accent line
  doc.setDrawColor(0, 74, 173); // #004AAD
  doc.setLineWidth(0.8);
  doc.line(margin, 10, pageWidth - margin, 10);

  // Footer
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(140, 140, 140);
  doc.text("Lenzify QA & Testing Guide — http://localhost:8000", margin, pageHeight - 8);
  const pageStr = `Page ${doc.internal.getNumberOfPages()}`;
  doc.text(pageStr, pageWidth - margin - doc.getTextWidth(pageStr), pageHeight - 8);
  y = currentY;
}

// ---------------- HEADER ----------------
drawHeaderFooter();

// Title
doc.setFont("helvetica", "bold");
doc.setFontSize(20);
doc.setTextColor(0, 74, 173);
doc.text("Lenzify — Production Testing Checklist", margin, y);
y += 7;

// Subtitle
doc.setFont("helvetica", "normal");
doc.setFontSize(10);
doc.setTextColor(100, 100, 100);
doc.text(
  "Step-by-Step Verification Guide for Admin Panel, Storefront, Mobile Experience & Database",
  margin,
  y
);
y += 9;

// Divider
doc.setDrawColor(226, 232, 240);
doc.setLineWidth(0.5);
doc.line(margin, y, pageWidth - margin, y);
y += 7;

function renderSectionHeader(title, color = [0, 74, 173]) {
  checkPageBreak(12);
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, contentWidth, 8, 1.5, 1.5, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...color);
  doc.text(title, margin + 4, y + 5.5);
  y += 12;
}

function renderStep(stepNum, title, route, actions, verifications) {
  const estHeight = 12 + actions.length * 5 + verifications.length * 5;
  checkPageBreak(estHeight);

  // Checkbox box
  doc.setDrawColor(0, 74, 173);
  doc.setLineWidth(0.6);
  doc.rect(margin, y, 4, 4);

  // Step Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(17, 24, 39);
  doc.text(`Step ${stepNum}: ${title}`, margin + 7, y + 3.2);

  // Route pill
  if (route) {
    const routeText = `URL: ${route}`;
    doc.setFont("courier", "bold");
    doc.setFontSize(8);
    const pillWidth = doc.getTextWidth(routeText) + 4;
    const pillX = pageWidth - margin - pillWidth;
    doc.setFillColor(238, 242, 255);
    doc.roundedRect(pillX, y - 1, pillWidth, 5, 1, 1, "F");
    doc.setTextColor(67, 56, 202);
    doc.text(routeText, pillX + 2, y + 2.6);
  }

  y += 7;

  // Actions
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text("Action:", margin + 7, y);
  y += 4.5;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 65, 85);
  actions.forEach((act) => {
    checkPageBreak(6);
    doc.text(`• ${act}`, margin + 9, y);
    y += 4.5;
  });

  // Verifications
  doc.setFont("helvetica", "bold");
  doc.setTextColor(16, 185, 129); // emerald
  doc.text("Expected / What to Verify:", margin + 7, y);
  y += 4.5;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  verifications.forEach((ver) => {
    checkPageBreak(6);
    doc.text(`✓ ${ver}`, margin + 9, y);
    y += 4.5;
  });

  y += 4;
}

// ---------------- SECTION A: ADMIN PANEL ----------------
renderSectionHeader("SECTION A: ADMIN PANEL VERIFICATION");

renderStep(
  "1",
  "Admin Dashboard & Network Health",
  "http://localhost:8000/admin/dashboard",
  [
    "Open terminal and browser developer console (F12).",
    "Navigate to the admin dashboard and reload the page.",
  ],
  [
    "KPI cards (Total Sales, Total Orders, Total Customers, Low Stock, Abandoned Carts) show real numbers.",
    "Zero console errors: 'TypeError: fetch failed' and empty '{}' errors are completely gone.",
  ]
);

renderStep(
  "2",
  "Prescription Lenses Management",
  "http://localhost:8000/admin/lenses",
  [
    "Navigate to /admin/lenses from the sidebar menu.",
    "Inspect the page title, sidebar label, and listed items.",
  ],
  [
    "Sidebar link is named 'Prescription Lenses' (clarified from generic optical).",
    "Page title reads 'Prescription Lenses (for Frames)'.",
    "All lenses (Single Vision, Bifocal, Blue Cut, Photochromic) display with Active status badges.",
  ]
);

renderStep(
  "3",
  "Edit Lens, Schema Cache & Power Tiers",
  "http://localhost:8000/admin/lenses/[id]/edit",
  [
    "Click 'Edit' on any active lens (e.g., Blue Cut or Photochromic).",
    "Change the price (e.g. ₹1,299) and modify features.",
    "In 'Power Range Pricing' table, click 'Load Standard Presets' or add custom row (-4.25 to -8.00: ₹500).",
    "Click 'Save Changes'.",
  ],
  [
    "Lens updates cleanly with green success notification toast.",
    "NO 'Could not find sub_category column' schema error.",
    "Power range tiers are saved successfully.",
  ]
);

renderStep(
  "4",
  "Soft Deactivate Lens",
  "http://localhost:8000/admin/lenses/[id]/edit",
  [
    "On any lens edit screen, click the red 'Deactivate Lens' button and confirm.",
  ],
  [
    "Lens is marked inactive without breaking foreign keys or existing customer order history.",
  ]
);

renderStep(
  "5",
  "Contact Lenses (Standalone Products)",
  "http://localhost:8000/admin/products/new",
  [
    "Navigate to 'Add Product' (/admin/products/new).",
    "Click the 'Product Type' dropdown.",
  ],
  [
    "Option displays 'Contact Lenses' (product type 'contact-lens') instead of ambiguous 'Lens'.",
  ]
);

renderStep(
  "6",
  "Customer Directory & Profiles",
  "http://localhost:8000/admin/customers",
  [
    "Navigate to /admin/customers from the sidebar.",
  ],
  [
    "Customers table loads registered user profiles cleanly without RLS errors.",
  ]
);

// ---------------- SECTION B: STOREFRONT & MOBILE ----------------
renderSectionHeader("SECTION B: STOREFRONT & MOBILE CUSTOMER JOURNEY");

renderStep(
  "7",
  "Mobile Touch & Guest Add to Cart",
  "http://localhost:8000/",
  [
    "Open Chrome DevTools (F12) and toggle Device Toolbar (Ctrl+Shift+M) to simulate mobile view.",
    "Open an unauthenticated Incognito window.",
    "Browse catalog cards on mobile, then click into a frame product.",
    "Click 'Add to Cart' (Frame only).",
  ],
  [
    "Quick Add and Wishlist buttons on cards are directly visible without requiring mouse hover.",
    "Guest is NOT redirected to /auth/login. Item adds directly to persistent cart.",
    "Header cart badge updates immediately with item count.",
  ]
);

renderStep(
  "8",
  "Prescription Lens Customization & Surcharge",
  "http://localhost:8000/product/[id]",
  [
    "On a frame product page, click 'Select Lenses'.",
    "Choose a lens type (e.g. Blue Cut) and proceed to prescription step.",
    "Enter high power values: Right Eye (OD) SPH: -5.00, Left Eye (OS) SPH: -2.00.",
    "Review the pricing summary step, then click 'Add to Cart'.",
  ],
  [
    "Prescription step displays dynamic surcharge badge (e.g. '+₹500 High Power Adjustment').",
    "Summary step itemizes: Frame Price + Base Lens Price + Power Surcharge = Total Price.",
    "Cart stores customized power values and adjusted pricing accurately.",
  ]
);

renderStep(
  "9",
  "Cart Page & Image Audit",
  "http://localhost:8000/cart",
  [
    "Navigate to /cart while remaining in guest mode.",
    "Inspect product images, prices, and refresh the browser page.",
  ],
  [
    "Both products (frame-only and prescription-customized) display with proper primary images.",
    "No gray placeholder boxes appear.",
    "Refreshing the page DOES NOT wipe the guest cart.",
  ]
);

renderStep(
  "10",
  "Login & Seamless Cart Sync",
  "http://localhost:8000/auth/login",
  [
    "Click 'Proceed to Checkout' or log in with an existing user account.",
  ],
  [
    "Guest cart items automatically migrate into the user's database cart session upon login.",
  ]
);

// ---------------- SECTION C: DATABASE ----------------
renderSectionHeader("SECTION C: DATABASE ONE-TIME MIGRATION");

renderStep(
  "11",
  "Supabase SQL Migration",
  "https://supabase.com/dashboard/project/ehrtrbfadqhgfruseidf/sql",
  [
    "Open Supabase Dashboard -> SQL Editor.",
    "Run: ALTER TABLE lenses ADD COLUMN IF NOT EXISTS power_ranges jsonb DEFAULT '[]'::jsonb;",
    "Run: NOTIFY pgrst, 'reload schema';",
  ],
  [
    "Query executes successfully (Success. No rows returned).",
    "PostgreSQL schema is refreshed and power ranges persist permanently.",
  ]
);

// Save PDF
const outputPath = path.join(__dirname, "..", "Lenzify_Testing_Checklist.pdf");
const pdfData = doc.output("arraybuffer");
fs.writeFileSync(outputPath, Buffer.from(pdfData));
console.log("PDF generated successfully at:", outputPath);
