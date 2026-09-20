import type { Metadata } from "next";
import Link from "next/link";
import { HelpCircle, Mail, MessageSquare, ArrowRight, ShieldCheck, Truck, RotateCcw, Eye } from "lucide-react";

export const metadata: Metadata = {
  title: "Help Center",
  description: "Get help with your Lenzify orders, prescriptions, shipping, returns, and more. Browse FAQs or contact our support team.",
};

const helpTopics = [
  {
    icon: Truck,
    title: "Shipping & Delivery",
    description: "Track orders, delivery timelines, and shipping policies",
    href: "/shipping",
  },
  {
    icon: RotateCcw,
    title: "Returns & Refunds",
    description: "Return process, refund timelines, and exchange policies",
    href: "/shipping",
  },
  {
    icon: Eye,
    title: "Prescriptions",
    description: "How to upload prescriptions and understand lens powers",
    href: "/faq",
  },
  {
    icon: ShieldCheck,
    title: "Warranty",
    description: "Frame and lens warranty coverage and claim process",
    href: "/warranty",
  },
];

const commonQuestions = [
  { q: "How do I track my order?", a: "Log in to your account, go to 'My Orders', and click on the order to see tracking details." },
  { q: "Can I change my prescription after ordering?", a: "Contact us within 2 hours of placing your order and we'll update the prescription at no extra cost." },
  { q: "What payment methods do you accept?", a: "We accept UPI, Net Banking, Credit/Debit cards via Razorpay, and Cash on Delivery." },
  { q: "How long does delivery take?", a: "Standard delivery takes 5-7 business days. Prescription eyewear may take 7-10 business days due to lens grinding." },
  { q: "Do you offer free shipping?", a: "Yes, we offer complimentary shipping on all orders above ₹2,000 across India. For orders below ₹2,000, a flat delivery fee of ₹99 applies." },
  { q: "How do I replace my lenses?", a: "Visit our Replace Lenses page, follow the 6-step wizard, and we'll handle the rest with doorstep pickup." },
];

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#03173D] via-[#004AAD] to-[#009DFF] pt-28 md:pt-40 pb-14 md:pb-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center space-y-5">
          <p className="text-white/70 text-xs font-semibold uppercase tracking-widest">Support Center</p>
          <h1 className="font-[var(--font-hero)] italic text-white text-5xl md:text-7xl leading-none">
            How can we help?
          </h1>
          <p className="text-white/70 text-base leading-relaxed max-w-lg mx-auto">
            Find answers to common questions or get in touch with our team.
          </p>
          {/* Search bar */}
          <div className="max-w-xl mx-auto mt-6">
            <div className="bg-white rounded-full shadow-lg border border-[#E8EAF2] flex items-center px-6 py-4 gap-3">
              <HelpCircle size={18} className="text-[#004AAD] shrink-0" />
              <input
                type="text"
                placeholder="Search for help..."
                className="flex-1 text-[#111111] text-sm outline-none placeholder:text-[#AAAAAA] bg-transparent"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Help Topics Grid */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-12 space-y-3">
            <p className="text-[#004AAD] text-xs font-semibold uppercase tracking-widest">Browse Topics</p>
            <h2 className="font-[var(--font-hero)] italic text-[#111111] text-4xl md:text-5xl">Help Categories</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {helpTopics.map((topic) => (
              <Link
                key={topic.title}
                href={topic.href}
                className="group bg-white border border-[#ECECEC] rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] p-6 space-y-4 hover:-translate-y-2 hover:shadow-[0_25px_60px_rgba(0,0,0,0.12)] transition-all duration-300"
              >
                <div className="w-12 h-12 bg-[#F0F5FF] rounded-xl flex items-center justify-center">
                  <topic.icon size={20} className="text-[#004AAD]" />
                </div>
                <h3 className="text-[#111111] font-semibold text-base">
                  {topic.title}
                </h3>
                <p className="text-[#666666] text-sm leading-relaxed">
                  {topic.description}
                </p>
                <div className="flex items-center gap-2 text-xs font-semibold text-[#004AAD] opacity-0 group-hover:opacity-100 transition-opacity">
                  Learn More <ArrowRight size={12} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 md:py-28 bg-[#F8F9FC]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center space-y-4 mb-12">
            <p className="text-[#004AAD] text-xs font-semibold uppercase tracking-widest">Quick Answers</p>
            <h2 className="font-[var(--font-hero)] italic text-[#111111] text-4xl md:text-5xl">
              Common Questions
            </h2>
          </div>
          <div className="max-w-3xl mx-auto space-y-3">
            {commonQuestions.map((item, i) => (
              <details
                key={i}
                className="group bg-white border border-[#ECECEC] rounded-2xl hover:border-[#004AAD]/40 transition-colors shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
              >
                <summary className="p-6 cursor-pointer flex items-center justify-between text-sm font-medium text-[#111111] list-none">
                  <span>{item.q}</span>
                  <HelpCircle size={16} className="text-[#004AAD] shrink-0 ml-4" />
                </summary>
                <div className="px-6 pb-6 text-sm text-[#666666] leading-relaxed border-t border-[#ECECEC] pt-4">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="bg-gradient-to-br from-[#03173D] via-[#004AAD] to-[#009DFF] rounded-3xl p-12 md:p-16 text-center space-y-6">
            <p className="text-white/70 text-xs font-semibold uppercase tracking-widest">Still Need Help?</p>
            <h3 className="font-[var(--font-hero)] italic text-white text-4xl md:text-5xl leading-tight">
              We&apos;re here for you.
            </h3>
            <p className="text-white/70 text-base leading-relaxed max-w-md mx-auto">
              Our support team is available Monday to Saturday, 10 AM to 7 PM IST.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="flex items-center justify-center gap-3 px-8 py-4 bg-white text-[#03173D] rounded-full font-semibold hover:bg-[#F8F9FC] transition-all"
              >
                <Mail size={16} /> Contact Us
              </Link>
              <a
                href="mailto:lenzify.in@gmail.com"
                className="flex items-center justify-center gap-3 px-8 py-4 border border-white text-white rounded-full font-semibold hover:bg-white hover:text-[#03173D] transition-all"
              >
                <MessageSquare size={16} /> Email Support
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
