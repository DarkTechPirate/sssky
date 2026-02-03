import React, { useState, useContext, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  Truck,
  Minus,
  Plus,
  Check,
  ArrowLeft,
  Loader2,
  Ruler,
  X,
  User,
  PenLine,
} from "lucide-react";
import { ThemeContext } from "@/context/ThemeContext";
import { useApp } from "@/context/Appcontext";
import {
  getProductById,
  addToCart,
  updateCartItem,
  getProductReviews,
  addReview,
} from "@/services/api";
import toast from "react-hot-toast";

const getImageUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("blob")) return path;
  return `${import.meta.env.VITE_API_URL}${path}`;
};

const formatINR = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

const ProductDisplay = () => {
  const { theme } = useContext(ThemeContext);
  const { refreshCart, cart } = useApp();
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  // Selections
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);

  // UI State
  const [currentImages, setCurrentImages] = useState([]);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartItemMatch, setCartItemMatch] = useState(null);

  // Review State
  const [reviews, setReviews] = useState([]);
  const [showWriteReview, setShowWriteReview] = useState(false);

  // --- 1. Load Data ---
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const res = await getProductById(id);
      if (res.success) {
        setProduct(res.data);

        // Initial Visual Setup
        if (res.data.visuals?.length > 0) {
          const firstColor = res.data.visuals[0];
          setSelectedColor(firstColor);
          setCurrentImages(firstColor.images || []);

          const availableSizes = res.data.stock.filter(
            (s) => s.colorName === firstColor.colorName && s.quantity > 0
          );
          if (availableSizes.length > 0) {
            setSelectedSize(availableSizes[0].size);
          }
        }

        // Load Reviews
        const reviewRes = await getProductReviews(id);
        if (reviewRes.success) {
          setReviews(reviewRes.reviews);
        }
      }
      setLoading(false);
    };
    if (id) loadData();
  }, [id]);

  // --- 2. Sync Logic (Images/Cart) ---
  useEffect(() => {
    if (selectedColor && product) {
      setCurrentImages(selectedColor.images || []);
      setActiveImage(0);
      const isAvailable = product.stock.some(
        (s) =>
          s.colorName === selectedColor.colorName &&
          s.size === selectedSize &&
          s.quantity > 0
      );
      if (!isAvailable) setSelectedSize(null);
    }
  }, [selectedColor]);

  useEffect(() => {
    if (cart && product) {
      const match = cart.items.find((item) => {
        const itemProdId =
          typeof item.product === "object" ? item.product._id : item.product;
        return (
          itemProdId === product._id &&
          (selectedColor ? item.color === selectedColor.colorName : true) &&
          (selectedSize ? item.size === selectedSize : true)
        );
      });
      setCartItemMatch(match);
      if (match) setQuantity(match.quantity);
      else setQuantity(1);
    }
  }, [cart, product, selectedColor, selectedSize]);

  // --- 3. Handlers ---
  const handleCartAction = async () => {
    if (!selectedColor) return toast.error("Please select a color");
    if (!selectedSize) return toast.error("Please select a size");

    setAddingToCart(true);
    try {
      if (cartItemMatch) {
        const res = await updateCartItem(cartItemMatch._id, quantity);
        if (res.success) {
          await refreshCart();
          toast.success("Cart updated");
        }
      } else {
        const res = await addToCart(
          product._id,
          selectedColor.colorName,
          selectedSize,
          quantity
        );
        if (res.success) {
          await refreshCart();
          toast.success("Added to cart");
        }
      }
    } catch (error) {
      toast.error("Failed to update cart");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleReviewSubmit = async (rating, comment) => {
    const res = await addReview(product._id, rating, comment);
    if (res.success) {
      setShowWriteReview(false);
      // Reload reviews and product
      const reviewRes = await getProductReviews(product._id);
      if (reviewRes.success) setReviews(reviewRes.reviews);

      setProduct((prev) => ({
        ...prev,
        rating: res.data.updatedRating,
        reviewsCount: res.data.updatedCount,
      }));
    }
  };

  const getAvailableSizes = () => {
    if (!product || !selectedColor) return [];
    return (
      product.sizeInfo?.chart?.map((sizeKey) => {
        const stockItem = product.stock.find(
          (s) => s.colorName === selectedColor.colorName && s.size === sizeKey
        );
        return {
          size: sizeKey,
          available: stockItem ? stockItem.quantity > 0 : false,
        };
      }) || []
    );
  };

  if (loading)
    return (
      <div className="min-h-screen flex center">
        <Loader2 className="animate-spin" />
      </div>
    );
  if (!product) return <div>Product Not Found</div>;

  return (
    <div
      className="min-h-screen w-full transition-colors duration-500 pt-10 pb-24 relative"
      style={{ backgroundColor: theme.bg, color: theme.text }}
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        <button
          onClick={() => navigate(-1)}
          className="mb-8 flex items-center gap-2 hover:opacity-70"
        >
          <ArrowLeft size={20} />{" "}
          <span className="font-bold text-xs uppercase">Back</span>
        </button>

        {/* --- MAIN GRID: IMAGES & INFO --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 mb-24">
          {/* LEFT: IMAGES */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div
              className="relative aspect-square w-full overflow-hidden rounded-3xl"
              style={{ backgroundColor: theme.card.imgBg }}
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentImages[activeImage] || "def"}
                  src={getImageUrl(currentImages[activeImage])}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full h-full object-cover"
                />
              </AnimatePresence>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {currentImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`relative aspect-square rounded-xl overflow-hidden border-2 ${
                    activeImage === idx
                      ? "border-current"
                      : "border-transparent opacity-60"
                  }`}
                >
                  <img
                    src={getImageUrl(img)}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT: INFO */}
          <div className="lg:col-span-5 relative">
            <div className="sticky top-32 flex flex-col gap-8">
              {/* Header */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold uppercase opacity-60">
                    {product.category}
                  </span>
                  <div className="flex items-center gap-1">
                    <Star size={16} className="text-yellow-500 fill-current" />
                    <span className="font-bold">
                      {product.rating ? product.rating.toFixed(1) : "New"}
                    </span>
                    <span className="opacity-50 text-xs">
                      ({product.reviewsCount} reviews)
                    </span>
                  </div>
                </div>
                <h1 className="text-4xl md:text-5xl font-black uppercase leading-none">
                  {product.title}
                </h1>
                <div className="flex items-center gap-4">
                  <div className="text-3xl font-medium">
                    {formatINR(product.price)}
                  </div>
                  {product.discountPrice > 0 && (
                    <div className="text-xl font-medium opacity-50 line-through">
                      {formatINR(product.discountPrice)}
                    </div>
                  )}
                </div>
              </div>

              <div className="h-px w-full bg-current opacity-10" />

              {/* Color Selection */}
              <div>
                <label className="text-sm font-bold uppercase mb-3 block opacity-80">
                  Color: {selectedColor?.colorName}
                </label>
                <div className="flex gap-3 flex-wrap">
                  {product.visuals.map((c) => (
                    <button
                      key={c.colorName}
                      onClick={() => setSelectedColor(c)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center border transition-transform ${
                        selectedColor?.colorName === c.colorName
                          ? "scale-110 ring-2 ring-offset-2 ring-current"
                          : ""
                      }`}
                      style={{
                        backgroundColor: c.hexCode,
                        borderColor: theme.navbar.border,
                      }}
                    >
                      {selectedColor?.colorName === c.colorName && (
                        <Check
                          size={14}
                          className="text-white mix-blend-difference"
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Size Selection */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-bold uppercase opacity-80">
                    Size: {selectedSize || "Select"}
                  </label>
                  <button className="text-xs font-bold underline opacity-60 hover:opacity-100 flex items-center gap-1">
                    <Ruler size={12} /> Size Guide ({product.sizeInfo?.unit})
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {getAvailableSizes().map(({ size, available }) => (
                    <button
                      key={size}
                      onClick={() => available && setSelectedSize(size)}
                      disabled={!available}
                      className={`py-3 rounded-xl border text-sm font-bold uppercase transition-all ${
                        selectedSize === size
                          ? "bg-current text-white dark:text-black"
                          : available
                          ? "hover:border-current opacity-70 hover:opacity-100"
                          : "opacity-20 cursor-not-allowed decoration-slice line-through"
                      }`}
                      style={
                        selectedSize !== size
                          ? { borderColor: theme.navbar.border }
                          : {}
                      }
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-4">
                <div
                  className="flex items-center border rounded-full px-4 py-3"
                  style={{ borderColor: theme.navbar.border }}
                >
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={addingToCart}
                  >
                    <Minus size={16} />
                  </button>
                  <span className="mx-4 font-bold min-w-[20px] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    disabled={addingToCart}
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <button
                  onClick={handleCartAction}
                  disabled={addingToCart || !selectedSize}
                  className={`flex-1 rounded-full font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                    cartItemMatch ? "bg-green-600 text-white" : ""
                  }`}
                  style={
                    !cartItemMatch
                      ? { backgroundColor: theme.text, color: theme.bg }
                      : {}
                  }
                >
                  {addingToCart ? (
                    <Loader2 className="animate-spin" />
                  ) : cartItemMatch ? (
                    "Update Cart"
                  ) : (
                    "Add to Cart"
                  )}
                </button>
              </div>

              {/* Static Info Sections */}
              <div className="pt-8">
                <h3 className="font-bold uppercase text-sm mb-3 opacity-90">
                  Description
                </h3>
                <div className="text-sm opacity-70 leading-relaxed whitespace-pre-line">
                  {product.description}
                </div>
              </div>

              <div
                className="pt-4 pb-4 border-b"
                style={{ borderColor: theme.navbar.border }}
              >
                <h3 className="font-bold uppercase text-sm mb-3 opacity-90 flex items-center gap-2">
                  <Truck size={16} /> Delivery & Returns
                </h3>
                <ul className="text-sm opacity-70 space-y-2 list-disc list-inside">
                  <li>
                    Estimated:{" "}
                    <strong>{product.deliveryInfo?.estimatedDays}</strong>
                  </li>
                  <li>
                    Shipping Cost:{" "}
                    <strong>
                      {product.deliveryInfo?.shippingCost > 0
                        ? formatINR(product.deliveryInfo.shippingCost)
                        : "Free"}
                    </strong>
                  </li>
                  <li>Policy: {product.deliveryInfo?.returnPolicy}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* --- FULL WIDTH REVIEW SECTION (SPREADED) --- */}
        <div
          className="mt-20 border-t pt-20"
          style={{ borderColor: theme.navbar.border }}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
              <h2 className="text-3xl font-black uppercase mb-2">
                Customer Reviews
              </h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Star size={20} className="text-yellow-500 fill-current" />
                  <span className="text-xl font-bold">
                    {product.rating?.toFixed(1) || "0.0"}
                  </span>
                </div>
                <span className="opacity-50">
                  Based on {product.reviewsCount} reviews
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowWriteReview(true)}
              className="px-8 py-4 rounded-xl font-bold uppercase tracking-wider flex items-center gap-2 transition-transform hover:scale-105"
              style={{ backgroundColor: theme.text, color: theme.bg }}
            >
              <PenLine size={18} /> Write a Review
            </button>
          </div>

          {/* Reviews List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {reviews.length === 0 ? (
              <div
                className="col-span-full py-20 text-center opacity-50 border-2 border-dashed rounded-3xl"
                style={{ borderColor: theme.navbar.border }}
              >
                <Star size={48} className="mx-auto mb-4 opacity-50" />
                <p className="font-medium">
                  No reviews yet. Be the first to share your thoughts!
                </p>
              </div>
            ) : (
              reviews.map((rev) => (
                <div
                  key={rev._id}
                  className="p-8 rounded-3xl border transition-all hover:shadow-lg"
                  style={{
                    borderColor: theme.navbar.border,
                    backgroundColor: theme.card.bg,
                  }}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden border">
                        {rev.user?.profileImage ? (
                          <img
                            src={getImageUrl(rev.user.profileImage)}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User size={20} className="opacity-50" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-lg">
                          {rev.user?.fullname || "Anonymous"}
                        </div>
                        <div className="text-xs opacity-50 uppercase tracking-wide">
                          {new Date(rev.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex text-yellow-500 bg-yellow-500/10 px-3 py-1 rounded-full">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          fill={i < rev.rating ? "currentColor" : "transparent"}
                          className={
                            i >= rev.rating
                              ? "text-gray-300 dark:text-gray-600 opacity-30"
                              : ""
                          }
                        />
                      ))}
                    </div>
                  </div>
                  <p className="opacity-80 leading-relaxed text-sm md:text-base">
                    "{rev.comment}"
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* --- WRITE REVIEW MODAL (Only for input, list is now on page) --- */}
      <AnimatePresence>
        {showWriteReview && (
          <WriteReviewModal
            onClose={() => setShowWriteReview(false)}
            onSubmit={handleReviewSubmit}
            theme={theme}
            productName={product.title}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// --- SUB-COMPONENT ---

const WriteReviewModal = ({ onClose, onSubmit, theme, productName }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return toast.error("Please write a comment");
    setSubmitting(true);
    await onSubmit(rating, comment);
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md rounded-2xl p-6 shadow-2xl relative"
        style={{ backgroundColor: theme.bg, color: theme.text }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 opacity-50 hover:opacity-100"
        >
          <X size={20} />
        </button>

        <h2 className="text-lg font-bold uppercase mb-1">Write a Review</h2>
        <p className="text-xs opacity-60 mb-6 truncate">For {productName}</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="transition-transform hover:scale-110 focus:outline-none"
              >
                <Star
                  size={32}
                  fill={star <= rating ? "#eab308" : "transparent"}
                  className={
                    star <= rating
                      ? "text-yellow-500"
                      : "text-gray-300 dark:text-gray-600"
                  }
                />
              </button>
            ))}
          </div>
          <p className="text-center text-sm font-medium opacity-80">
            {rating === 5
              ? "Excellent!"
              : rating === 4
              ? "Good"
              : rating === 3
              ? "Average"
              : "Poor"}
          </p>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this product..."
            className="w-full h-32 p-4 rounded-xl border bg-transparent resize-none focus:ring-1 ring-current outline-none text-sm"
            style={{ borderColor: theme.navbar.border }}
          ></textarea>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl font-bold uppercase bg-current text-white dark:text-black hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                <PenLine size={16} /> Submit Review
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default ProductDisplay;
