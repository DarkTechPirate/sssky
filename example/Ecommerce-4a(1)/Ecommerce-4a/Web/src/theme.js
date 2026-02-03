export const Theme = {
  name: "light",
  bg: "#EFF6FF", // Blue-50: Modern, airy light blue
  text: "#334155", // Slate-700: High contrast text
  arrowBg: "#354f87ce", // Soft Golden White (Champagne) accent
  rememberMe: "#94A3B8", // Slate-400

  // UI elements
  ui: {
    barBg: "#1E293B", // Deep Slate for Filter Bar
    barText: "#FFFFFF", // White text
  },

  navbar: {
    // Dark Slate Glass (Inverted)
    bg: "rgba(30, 41, 59, 0.95)",
    border: "rgba(255, 255, 255, 0.1)",
    shadow: "0 4px 20px -5px rgba(0, 0, 0, 0.2)",

    // Text Colors
    textIdle: "#7f9fcaff", // Slate-200
    textHover: "#FFFFFF", // White
    activePill: "#354f87ce", // Golden White Pill (Replaces Peach)

    // Logo
    logoBg: "#FFFFFF", // White Box
    logoText: "#1E293B", // Dark Slate Text

    // Search Bar
    searchBg: "#334155", // Slate-700
    searchHoverBg: "#475569", // Slate-600
    searchText: "#FFFFFF",
    searchBorder: "rgba(255, 255, 255, 0.1)",

    iconColor: "#FFFFFF",
    modalBg: "#1E293B",
    modalOverlay: "rgba(0, 0, 0, 0.5)",
  },

  card: {
    imgBg: "#DBEAFE", // Blue-100

    // White/Blue Glass Card
    bg: "rgba(255, 255, 255, 0.6)",
    border: "rgba(191, 219, 254, 0.6)", // Blue-200

    textPrimary: "#1E293B", // Dark Slate
    textSecondary: "#64748B", // Light Slate

    // Buttons
    btnBg: "#475569", // Slate Blue
    btnText: "#EFF6FF", // Light Blue Text

    iconBtnBg: "#FFFFFF",
    iconBtnColor: "#475569",
  },

  badges: {
    new: { bg: "#475569", text: "#EFF6FF" },
    sale: { bg: "#FF9F80", text: "#FFFFFF" }, // Coral is standard for sale, kept as pop
    hot: { bg: "#FEF08A", text: "#1E293B" }, // Golden White with Dark Text
    default: { bg: "#DBEAFE", text: "#1E3A8A" },
  },

  scrollbar: {
    track: "#EFF6FF",
    border: "#DBEAFE",
    teeth: "#FEF08A", // Golden White details
    handleBody: "#93C5FD",
    handleStroke: "#FFFFFF",
    handleGradientStart: "#FEF08A", // Golden White Gradient
    handleGradientEnd: "#FCD34D", // Slightly deeper gold
  },
};
