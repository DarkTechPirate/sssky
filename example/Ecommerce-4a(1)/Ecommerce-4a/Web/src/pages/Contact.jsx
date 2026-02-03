import React, { useContext, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ThemeContext } from "@/context/ThemeContext";
import {
  Send,
  MapPin,
  Mail,
  Phone,
  ArrowRight,
  MessageSquare,
  Clock,
} from "lucide-react";

// --- ANIMATION VARIANTS ---
const fadeInUp = {
  hidden: { opacity: 0, y: 60 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

export default function Contact() {
  const { theme } = useContext(ThemeContext);
  const containerRef = useRef(null);

  // Parallax Logic
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const yHero = useTransform(scrollYProgress, [0, 1], [0, 300]);
  const opacityHero = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  // Form State
  const [formStatus, setFormStatus] = useState("idle"); // idle, submitting, success

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormStatus("submitting");
    setTimeout(() => setFormStatus("success"), 2000);
  };

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen w-full -mt-[90px] overflow-hidden"
      style={{ backgroundColor: theme.bg, color: theme.text }}
    >
      {/* --- 1. HERO SECTION --- */}
      <section className="relative h-[80vh]  flex flex-col justify-center px-6 md:px-12 pt-20">
        <div className="max-w-[1400px] mx-auto w-full z-10">
          <motion.div style={{ y: yHero, opacity: opacityHero }}>
            <motion.h1
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="text-6xl md:text-9xl font-black uppercase tracking-tighter leading-[0.9]"
            >
              Let's Start <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600">
                A Conversation.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              transition={{ delay: 0.5, duration: 1 }}
              className="mt-8 text-xl md:text-2xl font-mono max-w-2xl"
            >
              Have a project in mind? Looking for bulk details? Or just want to
              say hi? We are listening.
            </motion.p>
          </motion.div>
        </div>

        {/* Decorative Background Element */}
        <div className="absolute right-0 top-0 w-1/2 h-full opacity-30 pointer-events-none">
          <div
            className="absolute inset-0 bg-gradient-to-l from-transparent to-black/80 z-10"
            style={{
              background: `linear-gradient(to left, transparent, ${theme.bg})`,
            }}
          />
          <img
            src="https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=1000&auto=format&fit=crop"
            className="w-full h-full object-cover grayscale"
            alt="Office"
          />
        </div>
      </section>

      {/* --- 2. INFO GRID (BENTO STYLE) --- */}
      <section className="py-24 px-6 md:px-12">
        <motion.div
          className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-6"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {/* Card 1: Email */}
          <motion.div
            variants={fadeInUp}
            className="p-8 rounded-3xl border flex flex-col justify-between h-[300px] group transition-colors hover:border-current"
            style={{
              borderColor: theme.navbar?.border || "rgba(255,255,255,0.1)",
              backgroundColor: theme.card?.bg || "rgba(255,255,255,0.03)",
            }}
          >
            <div className="flex justify-between items-start">
              <div className="p-4 rounded-full bg-blue-500/20 text-blue-500">
                <Mail size={32} />
              </div>
              <ArrowRight className="opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest opacity-60 mb-2">
                Email Us
              </h3>
              <a
                href="mailto:hello@brand.com"
                className="text-2xl md:text-3xl font-bold hover:underline"
              >
                hello@brand.com
              </a>
            </div>
          </motion.div>

          {/* Card 2: Location */}
          <motion.div
            variants={fadeInUp}
            className="p-8 rounded-3xl border flex flex-col justify-between h-[300px] group transition-colors hover:border-current"
            style={{
              borderColor: theme.navbar?.border || "rgba(255,255,255,0.1)",
              backgroundColor: theme.card?.bg || "rgba(255,255,255,0.03)",
            }}
          >
            <div className="flex justify-between items-start">
              <div className="p-4 rounded-full bg-purple-500/20 text-purple-500">
                <MapPin size={32} />
              </div>
              <ArrowRight className="opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest opacity-60 mb-2">
                Visit HQ
              </h3>
              <p className="text-xl font-medium leading-relaxed">
                124 Urban District,
                <br />
                Fashion Avenue, NY 10012
              </p>
            </div>
          </motion.div>

          {/* Card 3: Support */}
          <motion.div
            variants={fadeInUp}
            className="p-8 rounded-3xl border flex flex-col justify-between h-[300px] group transition-colors hover:border-current"
            style={{
              borderColor: theme.navbar?.border || "rgba(255,255,255,0.1)",
              backgroundColor: theme.card?.bg || "rgba(255,255,255,0.03)",
            }}
          >
            <div className="flex justify-between items-start">
              <div className="p-4 rounded-full bg-green-500/20 text-green-500">
                <Phone size={32} />
              </div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase bg-green-500 text-white px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />{" "}
                Online
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest opacity-60 mb-2">
                Support Line
              </h3>
              <p className="text-2xl md:text-3xl font-bold">
                +1 (800) 555-0199
              </p>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* --- 3. FORM SECTION --- */}
      <section
        className="py-24 px-6 md:px-12 border-t"
        style={{ borderColor: theme.navbar?.border || "rgba(255,255,255,0.1)" }}
      >
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20">
          {/* Left Text */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl md:text-7xl font-black uppercase mb-8">
              Got an
              <br />
              Idea?
            </h2>
            <p className="text-lg opacity-70 leading-relaxed mb-10 max-w-md">
              Whether you need a custom bulk order or just want to collaborate,
              drop your details. We usually respond within 2 hours during
              business days.
            </p>

            <div className="space-y-6">
              <div className="flex items-center gap-4 opacity-80">
                <Clock className="text-blue-500" />
                <span>Mon - Fri, 9am - 6pm EST</span>
              </div>
              <div className="flex items-center gap-4 opacity-80">
                <MessageSquare className="text-purple-500" />
                <span>Live Chat Available</span>
              </div>
            </div>
          </motion.div>

          {/* Right Form */}
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest opacity-60">
                  First Name
                </label>
                <input
                  type="text"
                  placeholder="John"
                  className="w-full bg-transparent border-b py-4 focus:outline-none focus:border-blue-500 transition-colors text-lg"
                  style={{
                    borderColor:
                      theme.navbar?.border || "rgba(255,255,255,0.2)",
                  }}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest opacity-60">
                  Last Name
                </label>
                <input
                  type="text"
                  placeholder="Doe"
                  className="w-full bg-transparent border-b py-4 focus:outline-none focus:border-blue-500 transition-colors text-lg"
                  style={{
                    borderColor:
                      theme.navbar?.border || "rgba(255,255,255,0.2)",
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest opacity-60">
                Email Address
              </label>
              <input
                type="email"
                placeholder="john@example.com"
                className="w-full bg-transparent border-b py-4 focus:outline-none focus:border-blue-500 transition-colors text-lg"
                style={{
                  borderColor: theme.navbar?.border || "rgba(255,255,255,0.2)",
                }}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest opacity-60">
                Topic
              </label>
              <select
                className="w-full bg-transparent border-b py-4 focus:outline-none focus:border-blue-500 transition-colors text-lg appearance-none"
                style={{
                  borderColor: theme.navbar?.border || "rgba(255,255,255,0.2)",
                  color: theme.text,
                }}
              >
                <option className="bg-black text-white">General Inquiry</option>
                <option className="bg-black text-white">Bulk Order</option>
                <option className="bg-black text-white">Support</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest opacity-60">
                Message
              </label>
              <textarea
                rows="4"
                placeholder="Tell us about your needs..."
                className="w-full bg-transparent border-b py-4 focus:outline-none focus:border-blue-500 transition-colors text-lg resize-none"
                style={{
                  borderColor: theme.navbar?.border || "rgba(255,255,255,0.2)",
                }}
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={formStatus !== "idle"}
                className="group relative inline-flex h-14 w-full md:w-auto items-center justify-center overflow-hidden rounded-full bg-current px-8 font-medium text-neutral-900 transition-all duration-300 hover:w-full hover:bg-blue-600 disabled:opacity-70"
                style={{ backgroundColor: theme.text, color: theme.bg }}
              >
                <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-12deg)_translateX(-100%)] group-hover:duration-1000 group-hover:[transform:skew(-12deg)_translateX(100%)]">
                  <div className="relative h-full w-8 bg-white/20" />
                </div>
                <span className="flex items-center gap-2">
                  {formStatus === "idle" && (
                    <>
                      Send Message <Send size={18} />
                    </>
                  )}
                  {formStatus === "submitting" && "Sending..."}
                  {formStatus === "success" && "Message Sent!"}
                </span>
              </button>
            </div>
          </motion.form>
        </div>
      </section>

      {/* --- 4. MAP / FOOTER TEASER --- */}
      <section className="h-[50vh] w-full relative grayscale overflow-hidden">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d193595.15830869428!2d-74.119763973046!3d40.69766374874431!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c24fa5d33f083b%3A0xc80b8f06e177fe62!2sNew%20York%2C%20NY%2C%20USA!5e0!3m2!1sen!2sin!4v1647913342082!5m2!1sen!2sin"
          width="100%"
          height="100%"
          style={{ border: 0, filter: "invert(90%) hue-rotate(180deg)" }}
          allowFullScreen=""
          loading="lazy"
          title="Map"
        />
        <div
          className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black via-transparent to-transparent opacity-80"
          style={{
            background: `linear-gradient(to top, ${theme.bg} 10%, transparent)`,
          }}
        />

        <div className="absolute bottom-10 left-6 md:left-12">
          <h2 className="text-4xl font-black uppercase">Find Us</h2>
        </div>
      </section>
    </div>
  );
}
