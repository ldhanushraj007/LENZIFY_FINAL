"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Mail } from "lucide-react";

const faqs = [
  {
    category: "Lens Replacement Service",
    questions: [
      {
        q: "How does the 'Pick up & Fix' service work?",
        a: "Once you place a lens replacement order, we schedule a secure pickup of your existing frames from your doorstep. We take them to our lab, fit them with new precision lenses, and deliver them back to you. It's the ultimate rejuvenation for your favorite frames."
      },
      {
        q: "Can you replace lenses in any frame?",
        a: "Yes, our master opticians can fit new lenses into almost any frame, including those purchased from other retailers, as long as the frame is in stable structural condition."
      }
    ]
  },
  {
    category: "Orders & Prescriptions",
    questions: [
      {
        q: "How do I provide my prescription?",
        a: "You can manually enter your prescription values during the checkout process or upload a photo/PDF of your medical script. If you're unsure, you can also email it to us after placing the order."
      },
      {
        q: "What is PD (Pupillary Distance) and why do I need it?",
        a: "PD is the distance between your pupils in millimeters. It ensures the optical center of the lenses is aligned perfectly with your eyes for maximum clarity and comfort."
      },
      {
        q: "Can I change my prescription after ordering?",
        a: "Contact us within 2 hours of placing your order and we'll update the prescription at no extra cost. Once manufacturing begins, changes cannot be made."
      }
    ]
  },
  {
    category: "Shipping & Returns",
    questions: [
      {
        q: "How long does delivery take?",
        a: "Standard orders typically take 3-7 business days. Lens replacement orders may take 5-10 business days as they involve a pickup, laboratory processing, and return delivery cycle."
      },
      {
        q: "What is your return policy?",
        a: "We offer a 14-day return window for frames. Custom-made prescription lenses are subject to a laboratory fee as they are uniquely manufactured for your eyes."
      },
      {
        q: "Do you offer free shipping?",
        a: "Yes, we offer complimentary shipping on orders above ₹2,000 across India. For orders below ₹2,000, a standard delivery fee of ₹99 applies."
      }
    ]
  },
  {
    category: "Try At Home",
    questions: [
      {
        q: "How does Try at Home work?",
        a: "Book a slot online, and our certified optician will arrive at your home with 150+ curated frames. Try everything at your comfort, get a free eye checkup, and purchase only what you love."
      },
      {
        q: "Is there a service fee?",
        a: "There is a nominal fee of ₹99, which is fully waived upon any purchase during the session."
      }
    ]
  }
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`bg-white border rounded-2xl mb-3 transition-all duration-300 ${open ? "border-[#004AAD]" : "border-[#E8EAF2] hover:border-[#004AAD]/40"}`}
    >
      <button
        className="w-full flex items-center justify-between p-6 text-left gap-4"
        onClick={() => setOpen(o => !o)}
      >
        <span className="text-[#111111] font-medium text-sm">{q}</span>
        <ChevronDown
          size={18}
          className={`text-[#004AAD] shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-6 text-[#666666] text-sm leading-relaxed border-t border-[#E8EAF2] pt-4">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#03173D] via-[#004AAD] to-[#009DFF] pt-28 md:pt-40 pb-14 md:pb-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-center space-y-5"
          >
            <p className="text-white/70 text-xs font-semibold uppercase tracking-widest">The Knowledge Base</p>
            <h1 className="font-[var(--font-hero)] italic text-white text-5xl md:text-8xl leading-none">
              Frequently Asked Questions
            </h1>
            <p className="text-white/70 text-base leading-relaxed max-w-lg mx-auto">
              Answers to the questions we hear most often from our community of optical enthusiasts.
            </p>
          </motion.div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="space-y-14">
            {faqs.map((section, si) => (
              <motion.section
                key={section.category}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: si * 0.1, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="flex items-center gap-4 mb-6 pb-4 border-b border-[#ECECEC]">
                  <p className="text-[#004AAD] text-xs font-semibold uppercase tracking-widest">{section.category}</p>
                </div>
                <div>
                  {section.questions.map((item, i) => (
                    <FAQItem key={i} q={item.q} a={item.a} />
                  ))}
                </div>
              </motion.section>
            ))}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="bg-[#F8F9FC] rounded-3xl border border-[#ECECEC] p-12 text-center space-y-5"
            >
              <p className="text-[#666666] text-sm">Still have questions?</p>
              <h3 className="text-2xl font-serif italic text-[#111111]">Contact Our Support Team</h3>
              <a
                href="mailto:lenzify.in@gmail.com"
                className="inline-flex items-center gap-3 px-8 py-4 border border-[#004AAD] text-[#004AAD] rounded-full font-semibold hover:bg-[#004AAD] hover:text-white transition-all duration-300"
              >
                <Mail size={14} /> lenzify.in@gmail.com
              </a>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
