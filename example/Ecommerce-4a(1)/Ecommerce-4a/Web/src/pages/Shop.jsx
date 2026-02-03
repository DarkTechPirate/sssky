import React, { useState, useContext, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  SlidersHorizontal,
  ChevronDown,
  DollarSign,
  Loader2,
} from "lucide-react";
import { ThemeContext } from "../context/ThemeContext";
import ProductCard from "../components/ProductCard";
import HeroCarousel from "@/components/home/HeroCarousel";
import { Link, useLocation } from "react-router-dom";
import { getAllProducts, getBanners } from "@/services/api";

const CATEGORIES = [
  "All",
  "Running",
  "Lifestyle",
  "Basketball",
  "Accessories",
  "Vintage",
  "Exclusive",
  "Outdoor",
  "Training",
  "Limited",
];

const getImageUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("blob")) return path;
  return `${import.meta.env.VITE_API_URL}${path}`;
};

// ... Internal HeroCarousel/ProductCard components (imported) ...

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 100 },
  },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } },
};

const Shop = () => {
  const { theme } = useContext(ThemeContext);
  const location = useLocation();
  const fromZoom = location.state?.fromZoom ?? true;

  const [isIntroSequence, setIsIntroSequence] = useState(fromZoom);

  // --- API DATA STATE ---
  const [products, setProducts] = useState([]);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- FILTER STATE ---
  const [isMobile, setIsMobile] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isPriceOpen, setIsPriceOpen] = useState(false);
  const [sortOption, setSortOption] = useState("Newest");
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100000 });

  const productSectionRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (isIntroSequence) {
      const timer = setTimeout(() => {
        setIsIntroSequence(false);
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [isIntroSequence]);

  useEffect(() => {
    const fetchBannersAndProducts = async () => {
      setLoading(true);

      try {
        // Fetch SHOP Banners
        const bannerRes = await getBanners("shop");
        if (bannerRes.success) {
          const formattedBanners = bannerRes.data.map((b) => ({
            id: b._id || b.id,
            desktopSrc: getImageUrl(b.image),
            tabletSrc: getImageUrl(b.image),
            mobileSrc: getImageUrl(b.image),
            title: b.title,
            subtitle: b.subtitle,
          }));
          setBanners(formattedBanners);
        }

        // Fetch Products
        const filters = {
          category: activeCategory,
          search: searchQuery,
          minPrice: priceRange.min,
          maxPrice: priceRange.max,
          sort: sortOption,
        };

        const res = await getAllProducts(filters);
        if (res.success) setProducts(res.data);
        else setProducts([]);
      } catch (err) {
        console.error("Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      fetchBannersAndProducts();
    }, 400);

    return () => clearTimeout(debounceTimer);
  }, [activeCategory, searchQuery, priceRange, sortOption]);

  const groupedProducts = useMemo(() => {
    if (!products.length) return {};
    const groups = {};
    products.forEach((product) => {
      const groupKey =
        product.subCategory || product.category || "General Collection";
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(product);
    });
    return Object.keys(groups)
      .sort()
      .reduce((acc, key) => {
        acc[key] = groups[key];
        return acc;
      }, {});
  }, [products]);

  // Handlers (Drag, Filters)
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };
  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };
  const handlePriceChange = (e, type) => {
    const value = Math.min(Math.max(Number(e.target.value), 0), 1000);
    if (type === "min") {
      if (value <= priceRange.max)
        setPriceRange((prev) => ({ ...prev, min: value }));
    } else {
      if (value >= priceRange.min)
        setPriceRange((prev) => ({ ...prev, max: value }));
    }
  };

  const SHRINK_DELAY = fromZoom ? 0.5 : 0;
  const TEXT_DELAY = fromZoom ? 1.2 : 0;
  const CONTROLS_DELAY = fromZoom ? 1.2 : 0;
  const CONTENT_DELAY = fromZoom ? 1.5 : 0.2;

  return (
    <div
      className="min-h-screen w-full transition-colors duration-500"
      style={{ backgroundColor: theme.bg, color: theme.text }}
    >
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .range-slider { position: relative; height: 6px; border-radius: 10px; background: ${theme.navbar.border}; }
        .range-progress { position: absolute; height: 100%; border-radius: 10px; background: ${theme.text}; }
        .range-input { position: absolute; top: -7px; height: 20px; width: 100%; background: none; pointer-events: none; -webkit-appearance: none; appearance: none; }
        .range-input::-webkit-slider-thumb { height: 20px; width: 20px; border-radius: 50%; background: ${theme.text}; border: 2px solid ${theme.bg}; pointer-events: auto; -webkit-appearance: none; box-shadow: 0 0 6px rgba(0,0,0,0.2); cursor: pointer; }
        .range-input::-moz-range-thumb { height: 20px; width: 20px; border: none; border-radius: 50%; background: ${theme.text}; pointer-events: auto; -moz-appearance: none; box-shadow: 0 0 6px rgba(0,0,0,0.2); cursor: pointer; }
      `}</style>

      {/* --- CAROUSEL (Uses SHOP Banners) --- */}
      <motion.div
        initial={fromZoom ? { height: "100vh" } : false}
        animate={{ height: isMobile ? "60vh" : "70vh" }}
        transition={{
          delay: SHRINK_DELAY,
          duration: 1.2,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="w-full overflow-hidden -mt-[90px]"
        style={!fromZoom ? { height: isMobile ? "60vh" : "70vh" } : {}}
      >
        <div className="w-full h-full">
          {banners.length > 0 ? (
            <HeroCarousel
              slides={banners}
              textDelay={TEXT_DELAY}
              controlsDelay={CONTROLS_DELAY}
              isIntro={isIntroSequence}
            />
          ) : (
            <div className="w-full h-full bg-black flex items-center justify-center">
              <Loader2 className="animate-spin text-white opacity-50" />
            </div>
          )}
        </div>
      </motion.div>

      {/* --- CONTENT --- */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: CONTENT_DELAY, duration: 0.8, ease: "easeOut" }}
      >
        {/* Filter Bar */}
        <div
          ref={productSectionRef}
          className="w-full px-6 md:px-12 py-6 border-y transition-colors duration-300"
          style={{
            backgroundColor: theme.navbar.bg.replace("0.85", "0.7"),
            borderColor: theme.navbar.border,
          }}
        >
          <div className="max-w-[1600px] mx-auto flex flex-col xl:flex-row gap-6 items-center justify-between">
            <div className="flex-1 min-w-0 w-full xl:w-auto relative">
              <div
                ref={scrollContainerRef}
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                className="no-scrollbar flex items-center gap-3 overflow-x-auto w-full pb-2 md:pb-0 cursor-grab active:cursor-grabbing select-none px-6"
              >
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      if (!isDragging) setActiveCategory(cat);
                    }}
                    className={`px-6 py-2.5 rounded-full text-sm font-bold uppercase tracking-wide transition-all duration-300 whitespace-nowrap ${
                      activeCategory === cat
                        ? "scale-105 shadow-lg"
                        : "hover:opacity-60"
                    }`}
                    style={{
                      backgroundColor:
                        activeCategory === cat
                          ? theme.text
                          : theme.navbar.activePill,
                      color: activeCategory === cat ? theme.bg : theme.text,
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-none w-full xl:w-auto flex flex-wrap lg:flex-nowrap items-center gap-4 justify-between xl:justify-end">
              <div className="relative group w-full sm:w-auto flex-1 md:w-72">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50"
                />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl outline-none border transition-all duration-300"
                  style={{
                    backgroundColor: theme.navbar.searchBg,
                    color: theme.text,
                    borderColor: "transparent",
                  }}
                />
              </div>

              <div className="flex gap-3 w-full sm:w-auto">
                <div className="relative w-1/2 sm:w-auto">
                  <button
                    onClick={() => {
                      setIsPriceOpen(!isPriceOpen);
                      setIsSortOpen(false);
                    }}
                    className="w-full flex items-center justify-between gap-2 px-5 py-2.5 rounded-xl font-medium text-sm border transition-all hover:opacity-80 whitespace-nowrap"
                    style={{
                      backgroundColor: theme.navbar.searchBg,
                      borderColor: theme.navbar.border,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <DollarSign size={16} />
                      <span>Price</span>
                    </div>
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-300 ${
                        isPriceOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <AnimatePresence>
                    {isPriceOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 top-full mt-2 w-72 rounded-2xl shadow-2xl overflow-hidden border p-5 z-50"
                        style={{
                          backgroundColor: theme.navbar.modalBg,
                          borderColor: theme.navbar.border,
                        }}
                      >
                        <div className="flex flex-col gap-6">
                          <div
                            className="flex justify-between items-center border-b pb-3"
                            style={{ borderColor: theme.navbar.border }}
                          >
                            <span className="font-bold text-sm">
                              Price Range
                            </span>
                            <button
                              onClick={() =>
                                setPriceRange({ min: 0, max: 1000 })
                              }
                              className="text-xs font-semibold opacity-50 hover:opacity-100 transition-opacity"
                            >
                              Reset
                            </button>
                          </div>
                          <div className="py-2 px-1">
                            <div className="range-slider">
                              <div
                                className="range-progress"
                                style={{
                                  left: `${(priceRange.min / 1000) * 100}%`,
                                  right: `${
                                    100 - (priceRange.max / 1000) * 100
                                  }%`,
                                }}
                              ></div>
                              <input
                                type="range"
                                className="range-input"
                                min="0"
                                max="1000"
                                value={priceRange.min}
                                onChange={(e) => handlePriceChange(e, "min")}
                              />
                              <input
                                type="range"
                                className="range-input"
                                min="0"
                                max="1000"
                                value={priceRange.max}
                                onChange={(e) => handlePriceChange(e, "max")}
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div
                              className="flex-1 p-2 rounded-lg border text-center"
                              style={{ borderColor: theme.navbar.border }}
                            >
                              <span className="text-[10px] uppercase opacity-50 block mb-1">
                                Min Price
                              </span>
                              <span className="font-mono text-sm">
                                ${priceRange.min}
                              </span>
                            </div>
                            <span className="opacity-30">-</span>
                            <div
                              className="flex-1 p-2 rounded-lg border text-center"
                              style={{ borderColor: theme.navbar.border }}
                            >
                              <span className="text-[10px] uppercase opacity-50 block mb-1">
                                Max Price
                              </span>
                              <span className="font-mono text-sm">
                                ${priceRange.max}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="relative w-1/2 sm:w-auto">
                  <button
                    onClick={() => {
                      setIsSortOpen(!isSortOpen);
                      setIsPriceOpen(false);
                    }}
                    className="w-full flex items-center justify-between gap-2 px-5 py-2.5 rounded-xl font-medium text-sm border transition-all hover:opacity-80 whitespace-nowrap"
                    style={{
                      backgroundColor: theme.navbar.searchBg,
                      borderColor: theme.navbar.border,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal size={16} />
                      <span className="hidden sm:inline">Sort</span>
                      <span className="sm:hidden">Sort</span>
                    </div>
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-300 ${
                        isSortOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <AnimatePresence>
                    {isSortOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 top-full mt-2 w-56 rounded-2xl shadow-2xl overflow-hidden border p-2 z-50"
                        style={{
                          backgroundColor: theme.navbar.modalBg,
                          borderColor: theme.navbar.border,
                        }}
                      >
                        {[
                          "Newest",
                          "Price: Low to High",
                          "Price: High to Low",
                        ].map((opt) => (
                          <button
                            key={opt}
                            onClick={() => {
                              setSortOption(opt);
                              setIsSortOpen(false);
                            }}
                            className="w-full text-left px-4 py-3 text-sm font-medium rounded-xl transition-colors"
                            style={{
                              backgroundColor:
                                sortOption === opt
                                  ? theme.navbar.activePill
                                  : "transparent",
                              color: theme.text,
                            }}
                          >
                            {opt}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="max-w-[1600px] mx-auto px-6 md:px-12 py-12 min-h-[500px]">
          <AnimatePresence mode="popLayout">
            {loading ? (
              <motion.div
                key="loader"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20"
              >
                <Loader2
                  size={48}
                  className="animate-spin text-current opacity-50 mb-4"
                />
                <p className="font-bold uppercase tracking-widest text-sm opacity-60">
                  Loading Collection...
                </p>
              </motion.div>
            ) : products.length > 0 ? (
              <div className="space-y-24">
                {Object.keys(groupedProducts).map((groupTitle) => (
                  <motion.div
                    key={groupTitle}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="relative"
                  >
                    <div
                      className="w-full py-10 rounded-3xl mb-10 flex flex-col items-center justify-center shadow-lg transition-transform hover:scale-[1.01]"
                      style={{ backgroundColor: theme.text, color: theme.bg }}
                    >
                      <h2 className="text-2xl md:text-4xl font-black uppercase tracking-[0.3em] text-center z-10">
                        {groupTitle}
                      </h2>
                      <div className="h-1 w-12 bg-current mt-4 opacity-50 rounded-full" />
                      <span className="absolute bottom-4 right-6 text-[10px] md:text-xs font-mono opacity-30">
                        ({groupedProducts[groupTitle].length})
                      </span>
                    </div>
                    <motion.div
                      layout
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12"
                    >
                      {groupedProducts[groupTitle].map((product) => (
                        <motion.div
                          layout
                          key={product._id || product.id}
                          variants={itemVariants}
                          exit="exit"
                          className="w-full"
                        >
                          <Link
                            to={`/shop/${product._id || product.id}`}
                            onDragStart={(e) => e.preventDefault()}
                          >
                            <ProductCard
                              _id={product._id || product.id}
                              title={product.title}
                              price={product.price}
                              category={product.category}
                              image1={
                                product.visuals?.[0]?.images?.[0] ||
                                product.image1
                              }
                              image2={
                                product.visuals?.[0]?.images?.[1] ||
                                product.image2
                              }
                              badge={product.badge}
                              visuals={product.visuals}
                            />
                          </Link>
                        </motion.div>
                      ))}
                    </motion.div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-24 text-center"
              >
                <div
                  className="p-6 rounded-full mb-4 opacity-50"
                  style={{ backgroundColor: theme.navbar.activePill }}
                >
                  <Search size={48} />
                </div>
                <h3 className="text-2xl font-bold mb-2">No products found</h3>
                <p className="opacity-60">
                  Try adjusting your filters or search query.
                </p>
                <button
                  onClick={() => {
                    setActiveCategory("All");
                    setSearchQuery("");
                    setPriceRange({ min: 0, max: 10000 });
                  }}
                  className="mt-6 px-6 py-2 rounded-full font-bold border transition-all hover:scale-105"
                  style={{ borderColor: theme.navbar.border }}
                >
                  Clear Filters
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default Shop;
