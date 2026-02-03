import React, { useContext, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ThemeContext } from "@/context/ThemeContext";
import { Truck, Headphones, Layers, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

// --- DATA ---
const FEATURES = [
  {
    id: 1,
    title: "Bulk Orders Available",
    description:
      "Scale your vision. Exclusive wholesale pricing for teams, retailers, and corporate events.",
    icon: Layers,
    image:
      "https://images.unsplash.com/photo-1556740758-90de2929450a?q=80&w=1000&auto=format&fit=crop",
  },
  {
    id: 2,
    title: "24/7 Global Support",
    description:
      "We never sleep. Our dedicated styling and support team is available around the clock.",
    icon: Headphones,
    image:
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1000&auto=format&fit=crop",
  },
  {
    id: 3,
    title: "Perfect Delivery",
    description:
      "Insured, tracked, and pristine. We guarantee your package arrives on time, every time.",
    icon: Truck,
    image:
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1000&auto=format&fit=crop",
  },
];

const STATS = [
  { label: "Years Active", value: "05+" },
  { label: "Countries Served", value: "42" },
  { label: "Happy Clients", value: "10k+" },
];

export default function About() {
  const { theme } = useContext(ThemeContext);
  const containerRef = useRef(null);

  // Scroll Progress for Parallax
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -150]);

  return (
    <div
      ref={containerRef}
      className="relative w-full -mt-[90px] overflow-hidden"
      style={{
        backgroundColor: theme.bg,
        color: theme.text,
      }}
    >
      {/* --- SECTION 1: PARALLAX HERO --- */}
      <section className="relative h-screen w-full flex items-center justify-center overflow-hidden">
        <motion.div style={{ y: y1 }} className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=1920&auto=format&fit=crop"
            alt="About Background"
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80" />
        </motion.div>

        <div className="relative z-10 text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <h1 className="text-6xl md:text-9xl font-black uppercase tracking-tighter mb-4 mix-blend-overlay">
              Beyond
              <br />
              Fabric.
            </h1>
            <p className="text-xl md:text-2xl font-mono opacity-80 max-w-2xl mx-auto">
              [ Redefining the intersection of utility and luxury since 2024 ]
            </p>
          </motion.div>
        </div>
      </section>

      {/* --- SECTION 2: SCROLLING MARQUEE --- */}
      <div className="py-12 overflow-hidden bg-current opacity-10 whitespace-nowrap">
        <motion.div
          initial={{ x: "0%" }}
          animate={{ x: "-100%" }}
          transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
          className="flex gap-10 text-6xl md:text-8xl font-bold uppercase select-none"
          style={{ color: theme.bg }} // Inverted text color
        >
          <span>Premium Quality</span> • <span>Global Shipping</span> •{" "}
          <span>Sustainable Sourcing</span> • <span>Premium Quality</span> •{" "}
          <span>Global Shipping</span>
        </motion.div>
      </div>

      {/* --- SECTION 3: CORE SERVICES (Bento Grid) --- */}
      <section className="py-24 px-6 md:px-12 max-w-[1400px] mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2 className="text-4xl md:text-6xl font-black uppercase mb-4">
            Our Promise
          </h2>
          <div className="h-1 w-24 bg-current" />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {FEATURES.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2, duration: 0.6 }}
              viewport={{ once: true }}
              style={{
                backgroundColor: theme.card?.bg || "rgba(255,255,255,0.05)",
                borderColor: theme.card?.border || "rgba(255,255,255,0.1)",
              }}
              className="group relative h-[500px] rounded-3xl border overflow-hidden flex flex-col justify-end p-8"
            >
              {/* Background Image (Reveals on Hover) */}
              <div className="absolute inset-0 z-0">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-40 group-hover:opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
              </div>

              {/* Content */}
              <div className="relative z-10 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                <div className="mb-4 p-3 bg-white/10 w-fit rounded-full backdrop-blur-md">
                  <item.icon size={32} className="text-white" />
                </div>
                <h3 className="text-3xl font-bold uppercase mb-3 text-white">
                  {item.title}
                </h3>
                <p className="text-white/70 text-lg leading-relaxed max-w-sm">
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* --- SECTION 4: THE STORY (Split Layout) --- */}
      <section className="py-24 px-6 md:px-12 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center max-w-[1400px] mx-auto">
          <motion.div
            style={{ y: y2 }}
            className="relative h-[600px] rounded-3xl overflow-hidden"
          >
            <img
              src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=1000&auto=format&fit=crop"
              alt="Fashion Warehouse"
              className="w-full h-full object-cover"
            />
            {/* Stats Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-8 bg-black/60 backdrop-blur-md flex justify-between border-t border-white/10">
              {STATS.map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-3xl font-black text-white">
                    {stat.value}
                  </div>
                  <div className="text-xs uppercase tracking-widest text-white/60">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <div className="space-y-8">
            <h2 className="text-5xl md:text-7xl font-black uppercase leading-tight">
              Crafted for <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                The Obsessed.
              </span>
            </h2>
            <p className="text-xl opacity-80 leading-relaxed font-light">
              We started with a simple idea: perfection isn't a goal, it's a
              standard. Whether you are a solo creator or a global enterprise,
              our supply chain is optimized to deliver excellence. We don't just
              sell products; we engineer experiences.
            </p>

            <div className="flex gap-4">
              <Link to="/contact">
                <button
                  className="px-8 py-4 border rounded-full font-bold uppercase tracking-wider hover:bg-current hover:text-white dark:hover:text-black transition-colors"
                  style={{ borderColor: theme.text }}
                >
                  Contact Us
                </button>
              </Link>
              <Link to="/shop">
                <button
                  className="px-8 py-4 bg-current text-white dark:text-black rounded-full font-bold uppercase tracking-wider flex items-center gap-2 hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: theme.text, color: theme.bg }}
                >
                  Start Shopping <ArrowRight size={20} />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
