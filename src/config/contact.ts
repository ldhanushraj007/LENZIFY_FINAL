/**
 * Central Contact & Policy Configuration for Lenzify
 * 
 * Update your official support phone, WhatsApp numbers, email, hours,
 * and operational policies here. The Chatbot and WhatsApp button read
 * directly from this file.
 */

export const CONTACT_CONFIG = {
  // Official WhatsApp Support
  WHATSAPP_NUMBER: "919886266611",
  WHATSAPP_DEFAULT_MESSAGE: "Hi Lenzify! I need help with my order/eyewear enquiry.",

  // Store & Atelier Details
  STORE_NAME: "Lenzify Eyewear",
  STORE_EMAIL: "lenzify.in@gmail.com",
  STORE_PHONE: "+91 72047 70688", // From Contact page
  STORE_HOURS: "Open All Day, Every Day",
  STORE_LOCATION: "Bengaluru, India",

  // Operational Policy Placeholders
  // [OWNER TODO: Verify or update these values to match your exact operations]
  DELIVERY_TIME: "4 to 7 business days across India (custom prescription fitting takes 2-3 days prior to dispatch)",
  EXPRESS_DELIVERY_AVAILABLE: false,
  SHIPPING_CHARGES: "Free standard shipping on all prepaid orders across India",
  COD_AVAILABLE: false, // [OWNER TODO: Set to true if Cash On Delivery is supported]
  COD_POLICY_NOTE: "We currently accept all major UPI, Cards, Net Banking, and Wallets via Razorpay.",
  
  RETURN_WINDOW_DAYS: "7 days", // [OWNER TODO: Verify return policy window]
  RETURN_POLICY_SUMMARY: "Easy returns or lens adjustments within 7 days of delivery for prescription accuracy or manufacturing issues.",
  
  WARRANTY_MONTHS: "12 months", // [OWNER TODO: Verify warranty period]
  WARRANTY_POLICY_SUMMARY: "1-year warranty against manufacturing defects on frames and lens coatings (excludes accidental drops and deep scratches).",
  
  POWER_RANGE_AVAILABILITY: "Single Vision: SPH up to -12.00 to +8.00, CYL up to -4.00. For high or complex powers beyond this range, please WhatsApp us directly for custom surfacing.", // [OWNER TODO: Adjust supported power lab limits]
  
  LENS_REPLACEMENT_STARTING_PRICE: "₹499", // From Lenzify Lens Replacement pricing
} as const;

export type ContactConfig = typeof CONTACT_CONFIG;
