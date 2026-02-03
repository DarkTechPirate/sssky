import React, { useContext, useState } from "react";
import { ShoppingBag, Heart, Eye, Loader2, Check } from "lucide-react";
import { ThemeContext } from "@/context/ThemeContext";
import { useApp } from "@/context/Appcontext"; // Import Global Context
import { addToCart } from "@/services/api"; // Import API
import { useNavigate } from "react-router-dom"; // Added for navigation

// Helper to construct image URL
const getImageUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("blob")) return path;
  return `${import.meta.env.VITE_API_URL}${path}`;
};

const ProductCard = (props) => {
  const { theme } = useContext(ThemeContext);
  const { refreshCart, cart } = useApp(); // Access cart to check status
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);

  // --- 1. ROBUST ID EXTRACTION ---
  const productId = props._id || props.id || props.product?._id;

  // --- 2. ROBUST DATA EXTRACTION ---
  const title = props.title || props.product?.title;
  const price = props.price || props.product?.price;
  const category = props.category || props.product?.category;

  // Images
  const visuals = props.visuals || props.product?.visuals || [];
  const image1 = props.image1 || visuals?.[0]?.images?.[0];
  const image2 = props.image2 || visuals?.[0]?.images?.[1] || image1;
  const badge = props.badge || props.product?.badge;

  // --- 3. STRICT COLOR SELECTION ---
  // Aggressively choose the FIRST color if visuals exist.
  // This prevents sending "Standard" when the product actually has colors like "gay".
  const colorToSend = props.defaultColor
    ? props.defaultColor
    : visuals.length > 0
    ? visuals[0].colorName
    : "Standard";

  // --- 4. CHECK IF IN CART ---
  // Check if this specific product ID is in the cart (regardless of color variant for the card view)
  const isInCart = cart?.items?.some((item) => {
    const itemProdId =
      typeof item.product === "object" ? item.product._id : item.product;
    return itemProdId === productId;
  });

  const handleAction = async (e) => {
    e.stopPropagation(); // Stop click from navigating to details page
    e.preventDefault();

    // If already in cart, navigate there instead of adding again
    if (isInCart) {
      navigate("/cart");
      return;
    }

    if (!productId) {
      console.error("CRITICAL ERROR: Product ID is missing for item:", title);
      return;
    }

    setAdding(true);
    try {
      // Send the resolved color (colorToSend)
      const res = await addToCart(productId, colorToSend, "M", 1);
      if (res.success) {
        await refreshCart(); // Update header badge immediately
      }
    } catch (error) {
      console.error("Card Add Error:", error);
    } finally {
      setAdding(false);
    }
  };

  const getBadgeStyle = (badgeText) => {
    if (!badgeText) return {};
    const key = badgeText.toLowerCase();
    const style = theme.badges?.[key] || theme.badges?.default || {};
    return { backgroundColor: style.bg, color: style.text };
  };

  const badgeStyle = getBadgeStyle(badge);

  return (
    <div className="group relative w-full max-w-sm mx-auto select-none">
      {/* --- IMAGE CONTAINER --- */}
      <div
        className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl transition-colors duration-300"
        style={{
          backgroundColor: theme.card?.imgBg || "#f3f4f6",
          border: `1px solid ${theme.card?.border || "transparent"}`,
        }}
      >
        {badge && (
          <div
            className="absolute top-3 left-3 z-20 text-xs font-bold px-3 py-1 uppercase tracking-widest rounded-sm shadow-sm"
            style={badgeStyle}
          >
            {badge}
          </div>
        )}

        <div className="absolute top-3 right-3 z-20 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            className="p-2 backdrop-blur-md rounded-full transition-colors hover:scale-110"
            style={{
              backgroundColor: theme.card?.iconBtnBg || "rgba(255,255,255,0.8)",
              color: theme.card?.iconBtnColor || "#000",
            }}
          >
            <Heart size={18} />
          </button>
          <button
            className="p-2 backdrop-blur-md rounded-full transition-colors hover:scale-110"
            style={{
              backgroundColor: theme.card?.iconBtnBg || "rgba(255,255,255,0.8)",
              color: theme.card?.iconBtnColor || "#000",
            }}
          >
            <Eye size={18} />
          </button>
        </div>

        <div className="w-full h-full cursor-pointer">
          <img
            src={getImageUrl(image1)}
            alt={title}
            draggable={false}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:opacity-0 group-hover:scale-110 opacity-90"
          />
          <img
            src={getImageUrl(image2)}
            alt={title}
            draggable={false}
            className="absolute inset-0 w-full h-full object-cover transition-all duration-700 opacity-0 group-hover:opacity-90 group-hover:scale-110"
          />
        </div>

        {/* --- DYNAMIC ACTION BUTTON --- */}
        {/* <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[0.19,1,0.22,1]">
          <button
            onClick={handleAction}
            disabled={adding}
            className={`w-full font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:opacity-90 transition-opacity disabled:opacity-75 disabled:cursor-not-allowed ${
              isInCart ? "bg-green-600 text-white" : ""
            }`}
            style={
              isInCart
                ? {} // Use tailwind class above if in cart
                : {
                    backgroundColor: theme.card?.btnBg || "#000",
                    color: theme.card?.btnText || "#fff",
                  }
            }
          >
            {adding ? (
              <Loader2 size={18} className="animate-spin" />
            ) : isInCart ? (
              <>
                <Check size={18} />
                In Cart
              </>
            ) : (
              <>
                <ShoppingBag size={18} />
                Add to Cart
              </>
            )}
          </button>
        </div> */}
      </div>

      <div className="mt-4 flex justify-between items-start">
        <div>
          <p
            className="text-xs uppercase tracking-wider mb-1"
            style={{ color: theme.card?.textSecondary || "#666" }}
          >
            {category}
          </p>
          <h3
            className="text-lg font-medium transition-colors cursor-pointer"
            style={{ color: theme.card?.textPrimary || "#000" }}
          >
            {title}
          </h3>
        </div>
        <p
          className="text-lg font-semibold"
          style={{ color: theme.card?.textPrimary || "#000" }}
        >
          ${price}
        </p>
      </div>
    </div>
  );
};

export default ProductCard;
