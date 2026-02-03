import React, { useState, useEffect, useContext, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  LayoutGrid,
  List as ListIcon,
  Edit2,
  Trash2,
  X,
  UploadCloud,
  Loader2,
  DollarSign,
  Package,
  Check,
  Image as ImageIcon,
  AlertCircle,
  Truck,
  Palette,
  ChevronDown, // Added ChevronDown import
} from "lucide-react";
import { ThemeContext } from "@/context/ThemeContext";
import toast from "react-hot-toast";
import {
  getAlladminProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "@/services/api";

const getImageUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("blob")) return path;
  return `${import.meta.env.VITE_API_URL}${path}`;
};

const INITIAL_PRODUCT_STATE = {
  title: "",
  description: "",
  category: "",
  subCategory: "",
  price: "",
  discountPrice: "",
  badge: "",
  features: [],
  sizeInfo: { unit: "US", chart: [] },
  visuals: [],
  stock: [],
  deliveryInfo: {
    estimatedDays: "3-5 Business Days",
    shippingCost: 0,
    returnPolicy: "7 Days Return Policy",
  },
};

// --- BADGE OPTIONS CONSTANT ---
const BADGE_OPTIONS = [
  { label: "No Badge", value: "" },
  { label: "New Arrival", value: "New" },
  { label: "Trending", value: "Trending" },
  { label: "Hot", value: "Hot" },
  { label: "Sale", value: "Sale" },
  { label: "Limited", value: "Limited" },
];

const ProductsTab = () => {
  const { theme } = useContext(ThemeContext);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const fetchProducts = async () => {
    setLoading(true);
    const res = await getAlladminProducts();
    if (res.success) setProducts(res.data);
    // else toast.error("Failed to load products");
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete product?")) return;
    const res = await deleteProduct(id);
    if (res.success) {
      setProducts((prev) => prev.filter((p) => (p._id || p.id) !== id));
      toast.success("Deleted");
    } else toast.error(res.message);
  };

  const handleFormSubmit = async (formDataPayload) => {
    const tId = toast.loading("Saving...");
    let res;
    if (editingProduct) {
      res = await updateProduct(
        editingProduct._id || editingProduct.id,
        formDataPayload
      );
    } else {
      res = await createProduct(formDataPayload);
    }
    toast.dismiss(tId);

    if (res.success) {
      setIsModalOpen(false);
      fetchProducts();
      toast.success("Success!");
    } else {
      toast.error(res.message);
    }
  };

  const filteredProducts = useMemo(
    () =>
      products.filter(
        (p) =>
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.subCategory &&
            p.subCategory.toLowerCase().includes(searchQuery.toLowerCase()))
      ),
    [products, searchQuery]
  );

  return (
    <div className="w-full min-h-screen pb-32" style={{ color: theme.text }}>
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tight">
            Inventory
          </h1>
          <p className="opacity-60 text-sm mt-1">
            Manage your catalog, stock, and variants.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingProduct(null);
            setIsModalOpen(true);
          }}
          className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-full font-bold text-sm text-white shadow-xl hover:scale-105 transition-transform"
          style={{
            backgroundColor: theme.text,
            color: theme.bg,
          }}
        >
          <Plus size={18} /> Add Product
        </button>
      </div>

      {/* SEARCH BAR */}
      <div
        className="sticky top-4 z-20 p-4 rounded-3xl border mb-8 flex flex-col sm:flex-row gap-4 justify-between items-center backdrop-blur-xl bg-opacity-90 shadow-sm"
        style={{
          backgroundColor: theme.navbar.bg,
          borderColor: theme.navbar.border,
        }}
      >
        <div className="relative w-full sm:w-96">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40"
          />
          <input
            type="text"
            placeholder="Search products or subcategories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-transparent border outline-none focus:ring-2 focus:ring-current transition-all"
            style={{
              borderColor: theme.navbar.border,
              color: theme.text,
              backgroundColor: theme.navbar.searchBg,
            }}
          />
        </div>
        <div
          className="flex bg-opacity-10 p-1 rounded-xl border"
          style={{ borderColor: theme.navbar.border }}
        >
          <button
            onClick={() => setViewMode("list")}
            className={`p-2.5 rounded-lg transition-all ${
              viewMode === "list"
                ? "bg-current text-white shadow"
                : "opacity-50 hover:opacity-100"
            }`}
            style={
              viewMode === "list"
                ? { backgroundColor: theme.text, color: theme.bg }
                : {}
            }
          >
            <ListIcon size={20} />
          </button>
          <button
            onClick={() => setViewMode("tile")}
            className={`p-2.5 rounded-lg transition-all ${
              viewMode === "tile"
                ? "bg-current text-white shadow"
                : "opacity-50 hover:opacity-100"
            }`}
            style={
              viewMode === "tile"
                ? { backgroundColor: theme.text, color: theme.bg }
                : {}
            }
          >
            <LayoutGrid size={20} />
          </button>
        </div>
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 opacity-50 space-y-4">
          <Loader2 className="animate-spin" size={48} />
          <p className="text-sm font-bold tracking-widest uppercase">
            Loading Inventory...
          </p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-32 text-center opacity-60 border-2 border-dashed rounded-3xl"
          style={{ borderColor: theme.navbar.border }}
        >
          <Package size={64} className="mb-4 opacity-50" />
          <h3 className="text-xl font-bold">No Products Found</h3>
          <p className="text-sm mt-2">
            Try adjusting your search or add a new product.
          </p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {viewMode === "list" ? (
            <ListView
              products={filteredProducts}
              onEdit={(p) => {
                setEditingProduct(p);
                setIsModalOpen(true);
              }}
              onDelete={handleDelete}
              theme={theme}
            />
          ) : (
            <TileView
              products={filteredProducts}
              onEdit={(p) => {
                setEditingProduct(p);
                setIsModalOpen(true);
              }}
              onDelete={handleDelete}
              theme={theme}
            />
          )}
        </AnimatePresence>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <ProductFormModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSubmit={handleFormSubmit}
            initialData={editingProduct}
            theme={theme}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// --- VIEWS ---
const ListView = ({ products, onEdit, onDelete, theme }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="w-full overflow-x-auto rounded-3xl border bg-opacity-40 shadow-sm custom-scrollbar"
    style={{ borderColor: theme.navbar.border, backgroundColor: theme.card.bg }}
  >
    <table className="w-full text-left border-collapse min-w-[800px]">
      <thead>
        <tr
          className="border-b text-xs font-bold uppercase tracking-wider opacity-60"
          style={{ borderColor: theme.navbar.border }}
        >
          <th className="p-6">Product</th>
          <th className="p-6">Category / Sub</th>
          <th className="p-6">Price</th>
          <th className="p-6">Variants</th>
          <th className="p-6 text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="text-sm font-medium">
        {products.map((p) => (
          <tr
            key={p._id || p.id}
            className="border-b last:border-0 hover:bg-black/5 transition-colors"
            style={{ borderColor: theme.navbar.border }}
          >
            <td className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden shadow-sm border border-gray-100">
                  <img
                    src={getImageUrl(p.visuals?.[0]?.images?.[0])}
                    className="w-full h-full object-cover"
                    alt=""
                  />
                </div>
                <div>
                  <div className="font-bold text-lg">{p.title}</div>
                  {p.badge && (
                    <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold uppercase">
                      {p.badge}
                    </span>
                  )}
                </div>
              </div>
            </td>
            <td className="p-6 opacity-70">
              <span className="block font-bold">{p.category}</span>
              {p.subCategory && (
                <span className="text-xs opacity-70">{p.subCategory}</span>
              )}
            </td>
            <td className="p-6 font-mono text-lg">₹{p.price}</td>
            <td className="p-6">
              <div className="flex -space-x-2">
                {p.visuals?.slice(0, 5).map((v, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: v.hexCode }}
                    title={v.colorName}
                  />
                ))}
                {p.visuals?.length > 5 && (
                  <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] font-bold">
                    +{p.visuals.length - 5}
                  </div>
                )}
              </div>
            </td>
            <td className="p-6 text-right">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => onEdit(p)}
                  className="p-2.5 rounded-xl hover:bg-blue-50 text-blue-600 transition-colors"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => onDelete(p._id || p.id)}
                  className="p-2.5 rounded-xl hover:bg-red-50 text-red-600 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </motion.div>
);

const TileView = ({ products, onEdit, onDelete, theme }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
  >
    {products.map((p) => (
      <div
        key={p._id || p.id}
        className="group relative rounded-3xl border overflow-hidden hover:shadow-2xl transition-all duration-300 bg-white dark:bg-white/5"
        style={{ borderColor: theme.navbar.border }}
      >
        <div className="absolute top-4 right-4 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
          <button
            onClick={() => onEdit(p)}
            className="p-2.5 bg-white/90 backdrop-blur rounded-full shadow-lg hover:text-blue-600 hover:scale-110 transition-all"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => onDelete(p._id || p.id)}
            className="p-2.5 bg-white/90 backdrop-blur rounded-full shadow-lg hover:text-red-600 hover:scale-110 transition-all"
          >
            <Trash2 size={16} />
          </button>
        </div>

        <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
          <img
            src={getImageUrl(p.visuals?.[0]?.images?.[0])}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            alt=""
          />
          {p.badge && (
            <span className="absolute bottom-3 left-3 px-3 py-1 bg-black/80 backdrop-blur text-white text-[10px] uppercase font-bold tracking-widest rounded-full">
              {p.badge}
            </span>
          )}
        </div>

        <div className="p-5">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-lg truncate pr-4">{p.title}</h3>
            <span className="font-mono text-lg font-medium">₹{p.price}</span>
          </div>
          <div className="flex justify-between items-center text-xs opacity-60 font-medium uppercase tracking-wide">
            <span>
              {p.category} {p.subCategory && `• ${p.subCategory}`}
            </span>
            <span>{p.visuals?.length || 0} Colors</span>
          </div>
        </div>
      </div>
    ))}
  </motion.div>
);

// --- MODAL ---
const ProductFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  theme,
}) => {
  const [formData, setFormData] = useState(
    initialData || INITIAL_PRODUCT_STATE
  );
  const [tab, setTab] = useState("basic");
  const [visualFiles, setVisualFiles] = useState({});

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const handleDelivery = (e) =>
    setFormData((prev) => ({
      ...prev,
      deliveryInfo: { ...prev.deliveryInfo, [e.target.name]: e.target.value },
    }));

  // --- LOGIC ---
  const addVisual = () =>
    setFormData((prev) => ({
      ...prev,
      visuals: [
        ...prev.visuals,
        { colorName: "", hexCode: "#000000", images: [] },
      ],
    }));
  const updateVisual = (idx, field, val) => {
    const v = [...formData.visuals];
    v[idx][field] = val;
    setFormData({ ...formData, visuals: v });
  };
  const removeVisual = (idx) => {
    setFormData((prev) => ({
      ...prev,
      visuals: prev.visuals.filter((_, i) => i !== idx),
    }));
    const newFiles = { ...visualFiles };
    delete newFiles[idx];
    setVisualFiles(newFiles);
  };

  const handleFileChange = (e, idx) => {
    if (!e.target.files.length) return;
    const files = Array.from(e.target.files);
    setVisualFiles((prev) => ({
      ...prev,
      [idx]: [...(prev[idx] || []), ...files],
    }));
    const previewUrls = files.map((f) => URL.createObjectURL(f));
    const newVisuals = [...formData.visuals];
    newVisuals[idx].previewImages = [
      ...(newVisuals[idx].previewImages || []),
      ...previewUrls,
    ];
    setFormData({ ...formData, visuals: newVisuals });
  };

  const removeImage = (visualIdx, imgIdx, isPreview = false) => {
    const newVisuals = [...formData.visuals];
    if (isPreview) {
      newVisuals[visualIdx].previewImages.splice(imgIdx, 1);
      setVisualFiles((prev) => {
        const updated = [...prev[visualIdx]];
        updated.splice(imgIdx, 1);
        return { ...prev, [visualIdx]: updated };
      });
    } else {
      newVisuals[visualIdx].images.splice(imgIdx, 1);
    }
    setFormData({ ...formData, visuals: newVisuals });
  };

  const addSize = () =>
    setFormData((prev) => ({
      ...prev,
      sizeInfo: { ...prev.sizeInfo, chart: [...prev.sizeInfo.chart, ""] },
    }));
  const updateSize = (i, val) => {
    const c = [...formData.sizeInfo.chart];
    c[i] = val;
    setFormData((prev) => ({
      ...prev,
      sizeInfo: { ...prev.sizeInfo, chart: c },
    }));
  };

  const generateStock = () => {
    const newStock = [];
    formData.visuals.forEach((v) => {
      formData.sizeInfo.chart.forEach((s) => {
        const exist = formData.stock.find(
          (st) => st.colorName === v.colorName && st.size === s
        );
        newStock.push({
          colorName: v.colorName,
          size: s,
          quantity: exist ? exist.quantity : 0,
          sku: `${v.colorName}-${s}`.toUpperCase(),
        });
      });
    });
    setFormData((prev) => ({ ...prev, stock: newStock }));
    toast.success("Stock Generated");
  };

  const updateStock = (i, val) => {
    const s = [...formData.stock];
    s[i].quantity = val;
    setFormData({ ...formData, stock: s });
  };

  const prepareSubmit = () => {
    if (!formData.title || !formData.price)
      return toast.error("Title & Price required");
    const data = new FormData();
    const cleanVisuals = formData.visuals.map((v) => {
      const { previewImages, ...rest } = v;
      return rest;
    });
    data.append(
      "productData",
      JSON.stringify({ ...formData, visuals: cleanVisuals })
    );
    Object.keys(visualFiles).forEach((index) => {
      visualFiles[index].forEach((file) =>
        data.append(`images_${index}`, file)
      );
    });
    onSubmit(data);
  };

  // --- ARRAY HANDLERS ---
  const handleFeature = (val, i) => {
    const f = [...formData.features];
    f[i] = val;
    setFormData({ ...formData, features: f });
  };
  const addFeature = () =>
    setFormData({ ...formData, features: [...formData.features, ""] });
  const removeFeature = (i) =>
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, idx) => idx !== i),
    }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-5xl max-h-[90vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl"
        style={{
          backgroundColor: theme.modalBg || theme.bg,
          color: theme.text,
        }}
      >
        {/* MODAL HEADER */}
        <div
          className="p-6 border-b flex justify-between items-center"
          style={{
            borderColor: theme.navbar.border,
            backgroundColor: theme.card.bg,
          }}
        >
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight">
              {initialData ? "Edit Product" : "New Product"}
            </h2>
            <p className="text-xs opacity-60 font-medium mt-1">
              Fill in the details below.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/5 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* TABS */}
        <div
          className="flex border-b px-6 gap-8 text-sm font-bold uppercase tracking-wider overflow-x-auto"
          style={{ borderColor: theme.navbar.border }}
        >
          {["basic", "delivery", "visuals", "stock"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`py-5 border-b-2 transition-all whitespace-nowrap ${
                tab === t
                  ? "border-current opacity-100"
                  : "border-transparent opacity-40 hover:opacity-70"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
          {tab === "basic" && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Input
                  label="Product Title"
                  name="title"
                  val={formData.title}
                  onChange={handleChange}
                  theme={theme}
                  placeholder="e.g. Air Max 90"
                />
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase opacity-60 tracking-wider">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full p-4 rounded-xl border outline-none focus:ring-2 focus:ring-current transition-all appearance-none"
                    style={{
                      borderColor: theme.navbar.border,
                      backgroundColor: theme.bg,
                      color: theme.text,
                    }}
                  >
                    <option
                      value=""
                      style={{
                        backgroundColor: theme.modalBg || theme.bg,
                        color: theme.text,
                      }}
                    >
                      Select Category...
                    </option>
                    <option
                      value="Men's Shoes"
                      style={{
                        backgroundColor: theme.modalBg || theme.bg,
                        color: theme.text,
                      }}
                    >
                      Men's Shoes
                    </option>
                    <option
                      value="Women's Shoes"
                      style={{
                        backgroundColor: theme.modalBg || theme.bg,
                        color: theme.text,
                      }}
                    >
                      Women's Shoes
                    </option>
                    <option
                      value="Accessories"
                      style={{
                        backgroundColor: theme.modalBg || theme.bg,
                        color: theme.text,
                      }}
                    >
                      Accessories
                    </option>
                  </select>
                </div>

                <Input
                  label="Sub Category"
                  name="subCategory"
                  val={formData.subCategory}
                  onChange={handleChange}
                  theme={theme}
                  placeholder="e.g. Running, Lifestyle, Basketball"
                />

                <Input
                  label="Price (₹)"
                  name="price"
                  type="number"
                  val={formData.price}
                  onChange={handleChange}
                  theme={theme}
                  placeholder="0.00"
                />
                <Input
                  label="Discount Price (₹)"
                  name="discountPrice"
                  type="number"
                  val={formData.discountPrice}
                  onChange={handleChange}
                  theme={theme}
                  placeholder="Optional"
                />

                {/* --- NEW BADGE SELECT DROPDOWN --- */}
                <div className="flex flex-col gap-2">
                  <label
                    className="text-xs font-bold uppercase tracking-wider opacity-60"
                    style={{ color: theme.text }}
                  >
                    Badge
                  </label>
                  <div className="relative">
                    <select
                      name="badge"
                      value={formData.badge}
                      onChange={handleChange}
                      className="w-full p-4 rounded-xl border outline-none appearance-none transition-all focus:ring-2 focus:ring-current"
                      style={{
                        backgroundColor: theme.navbar.searchBg || "transparent",
                        color: theme.text,
                        borderColor: theme.navbar.border,
                      }}
                    >
                      {BADGE_OPTIONS.map((option) => (
                        <option
                          key={option.value}
                          value={option.value}
                          style={{
                            backgroundColor: theme.bg,
                            color: theme.text,
                          }}
                        >
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {/* Custom Dropdown Arrow */}
                    <ChevronDown
                      size={18}
                      className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50"
                      style={{ color: theme.text }}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-bold uppercase opacity-60 tracking-wider">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full p-4 rounded-xl border bg-transparent outline-none h-40 focus:ring-2 focus:ring-current transition-all resize-none"
                  style={{
                    borderColor: theme.navbar.border,
                    color: theme.text,
                    backgroundColor: theme.navbar.searchBg,
                  }}
                  placeholder="Describe the product..."
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold uppercase opacity-60 tracking-wider">
                    Features
                  </label>
                  <button
                    onClick={addFeature}
                    className="text-xs text-blue-500 font-bold hover:underline"
                  >
                    + Add Feature
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {formData.features.map((f, i) => (
                    <div key={i} className="flex gap-3">
                      <input
                        value={f}
                        onChange={(e) => handleFeature(e.target.value, i)}
                        className="flex-1 p-3 rounded-xl border bg-transparent focus:ring-1 focus:ring-current"
                        style={{
                          borderColor: theme.navbar.border,
                          color: theme.text,
                          backgroundColor: theme.navbar.searchBg,
                        }}
                        placeholder={`Feature ${i + 1}`}
                      />
                      <button
                        onClick={() => removeFeature(i)}
                        className="text-red-500 p-2 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "delivery" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="col-span-1 md:col-span-2 flex items-center gap-3 p-5 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                <Truck size={24} className="text-blue-500" />
                <div>
                  <p className="font-bold text-blue-600">
                    Shipping Configuration
                  </p>
                  <p className="text-xs opacity-70 text-blue-800">
                    Set default shipping rules for this product.
                  </p>
                </div>
              </div>
              <Input
                label="Estimated Delivery"
                name="estimatedDays"
                val={formData.deliveryInfo?.estimatedDays}
                onChange={handleDelivery}
                theme={theme}
                placeholder="e.g. 3-5 Business Days"
              />
              <Input
                label="Shipping Cost (0 for Free)"
                name="shippingCost"
                type="number"
                val={formData.deliveryInfo?.shippingCost}
                onChange={handleDelivery}
                theme={theme}
              />
              <div className="md:col-span-2">
                <Input
                  label="Return Policy"
                  name="returnPolicy"
                  val={formData.deliveryInfo?.returnPolicy}
                  onChange={handleDelivery}
                  theme={theme}
                  placeholder="e.g. 7 Days Return Policy"
                />
              </div>
            </div>
          )}

          {tab === "visuals" && (
            <div className="space-y-8">
              <button
                onClick={addVisual}
                className="w-full py-4 border-2 border-dashed rounded-2xl font-bold opacity-60 hover:opacity-100 hover:border-blue-500 hover:text-blue-500 transition-all flex items-center justify-center gap-2"
                style={{ borderColor: theme.navbar.border }}
              >
                <Plus size={20} /> Add Color Variant
              </button>

              {formData.visuals.length === 0 && (
                <div className="text-center py-10 opacity-40">
                  <Palette size={48} className="mx-auto mb-2" />
                  <p>No variants added yet.</p>
                </div>
              )}

              {formData.visuals.map((visual, idx) => (
                <div
                  key={idx}
                  className="border p-6 rounded-3xl space-y-6 relative group"
                  style={{
                    borderColor: theme.navbar.border,
                    backgroundColor: theme.card.bg,
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <span
                        className="w-8 h-8 rounded-full shadow-sm border-2 border-white"
                        style={{ backgroundColor: visual.hexCode || "#000" }}
                      ></span>
                      <h3 className="font-bold text-sm uppercase">
                        Variant #{idx + 1}
                      </h3>
                    </div>
                    <button
                      onClick={() => removeVisual(idx)}
                      className="text-red-500 p-2 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Fixed: Explicitly passed 'name' prop to prevent crash */}
                    <Input
                      label="Color Name"
                      name="colorName"
                      val={visual.colorName}
                      onChange={(e) =>
                        updateVisual(idx, "colorName", e.target.value)
                      }
                      theme={theme}
                      placeholder="e.g. Midnight Blue"
                    />

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase opacity-60 tracking-wider">
                        Hex Color
                      </label>
                      <div className="flex items-center gap-3">
                        {/* Enhanced Color Picker Circle */}
                        <div
                          className="relative w-12 h-12 rounded-full overflow-hidden shadow-sm border flex-shrink-0 cursor-pointer hover:scale-105 transition-transform"
                          style={{
                            borderColor: theme.navbar.border,
                            backgroundColor: visual.hexCode || "#000000",
                          }}
                        >
                          <input
                            type="color"
                            value={
                              /^#[0-9A-F]{6}$/i.test(visual.hexCode)
                                ? visual.hexCode
                                : "#000000"
                            }
                            onChange={(e) =>
                              updateVisual(idx, "hexCode", e.target.value)
                            }
                            className="absolute opacity-0 w-full h-full cursor-pointer top-0 left-0"
                          />
                        </div>
                        <input
                          value={visual.hexCode}
                          onChange={(e) =>
                            updateVisual(idx, "hexCode", e.target.value)
                          }
                          className="flex-1 p-3 rounded-xl border bg-transparent uppercase font-mono"
                          style={{
                            borderColor: theme.navbar.border,
                            color: theme.text,
                            backgroundColor: theme.navbar.searchBg,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-bold uppercase opacity-60 tracking-wider block">
                      Product Images
                    </label>
                    <div className="flex flex-wrap gap-4">
                      {/* Existing */}
                      {visual.images?.map((img, i) => (
                        <div
                          key={`ex-${i}`}
                          className="w-24 h-24 rounded-2xl border overflow-hidden relative group/img shadow-sm"
                          style={{ borderColor: theme.navbar.border }}
                        >
                          <img
                            src={getImageUrl(img)}
                            className="w-full h-full object-cover"
                            alt=""
                          />
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                            <button
                              onClick={() => removeImage(idx, i, false)}
                              className="text-white bg-red-500 p-1.5 rounded-full"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                      {/* Previews */}
                      {visual.previewImages?.map((img, i) => (
                        <div
                          key={`pre-${i}`}
                          className="w-24 h-24 rounded-2xl border-2 border-blue-500 overflow-hidden relative group/img shadow-sm"
                        >
                          <img
                            src={img}
                            className="w-full h-full object-cover"
                            alt=""
                          />
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                            <button
                              onClick={() => removeImage(idx, i, true)}
                              className="text-white bg-red-500 p-1.5 rounded-full"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                      {/* Uploader */}
                      <label
                        className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed rounded-2xl cursor-pointer hover:bg-black/5 hover:border-blue-400 hover:text-blue-500 transition-all"
                        style={{ borderColor: theme.navbar.border }}
                      >
                        <UploadCloud size={24} className="opacity-50 mb-1" />
                        <span className="text-[10px] font-bold opacity-60">
                          Upload
                        </span>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, idx)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "stock" && (
            <div className="space-y-8">
              <div
                className="p-6 border rounded-3xl bg-opacity-50"
                style={{
                  borderColor: theme.navbar.border,
                  backgroundColor: theme.card.bg,
                }}
              >
                <div className="flex justify-between items-center mb-6">
                  <label className="text-xs font-bold uppercase opacity-60 tracking-wider">
                    Size Chart ({formData.sizeInfo.unit})
                  </label>
                  <button
                    onClick={addSize}
                    className="text-xs text-blue-500 font-bold hover:underline"
                  >
                    + Add Size
                  </button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {formData.sizeInfo.chart.map((s, i) => (
                    <div
                      key={i}
                      className="flex items-center border rounded-xl overflow-hidden shadow-sm"
                      style={{
                        borderColor: theme.navbar.border,
                        backgroundColor: theme.navbar.searchBg,
                      }}
                    >
                      <input
                        value={s}
                        onChange={(e) => {
                          const c = [...formData.sizeInfo.chart];
                          c[i] = e.target.value;
                          setFormData((p) => ({
                            ...p,
                            sizeInfo: { ...p.sizeInfo, chart: c },
                          }));
                        }}
                        className="w-16 p-3 bg-transparent text-center outline-none font-bold text-sm"
                        placeholder="Size"
                        style={{ color: theme.text }}
                      />
                      <button
                        onClick={() => {
                          const c = [...formData.sizeInfo.chart];
                          c.splice(i, 1);
                          setFormData((p) => ({
                            ...p,
                            sizeInfo: { ...p.sizeInfo, chart: c },
                          }));
                        }}
                        className="px-2 h-full hover:bg-red-50 text-red-500 border-l"
                        style={{ borderColor: theme.navbar.border }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  {formData.sizeInfo.chart.length === 0 && (
                    <p className="text-sm opacity-40 italic">
                      No sizes defined.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={generateStock}
                  className="flex items-center gap-2 px-8 py-3 rounded-full font-bold uppercase text-xs tracking-widest shadow-lg hover:scale-105 transition-transform"
                  style={{ backgroundColor: theme.text, color: theme.bg }}
                >
                  <Package size={16} /> Regenerate Stock Matrix
                </button>
              </div>

              {formData.stock.length > 0 && (
                <div
                  className="border rounded-3xl overflow-hidden shadow-sm"
                  style={{ borderColor: theme.navbar.border }}
                >
                  <table className="w-full text-left text-sm">
                    <thead
                      className="bg-opacity-10 uppercase text-[10px] font-bold tracking-wider"
                      style={{ backgroundColor: theme.navbar.border }}
                    >
                      <tr>
                        <th className="p-4">Variant</th>
                        <th className="p-4">Size</th>
                        <th className="p-4 text-center">SKU</th>
                        <th className="p-4">Qty</th>
                      </tr>
                    </thead>
                    <tbody
                      className="divide-y"
                      style={{ borderColor: theme.navbar.border }}
                    >
                      {formData.stock.map((st, i) => (
                        <tr
                          key={i}
                          className="hover:bg-black/5 transition-colors"
                        >
                          <td className="p-4 font-bold flex items-center gap-3">
                            <span
                              className="w-3 h-3 rounded-full shadow-sm"
                              style={{
                                backgroundColor:
                                  formData.visuals.find(
                                    (v) => v.colorName === st.colorName
                                  )?.hexCode || "#ccc",
                              }}
                            ></span>
                            {st.colorName}
                          </td>
                          <td className="p-4">{st.size}</td>
                          <td className="p-4 text-center opacity-50 font-mono text-xs">
                            {st.sku}
                          </td>
                          <td className="p-4">
                            <input
                              type="number"
                              value={st.quantity}
                              onChange={(e) =>
                                updateStock(i, parseInt(e.target.value))
                              }
                              className="w-24 p-2 border rounded-xl bg-transparent text-center font-bold outline-none focus:ring-1 focus:ring-current"
                              style={{
                                borderColor: theme.navbar.border,
                                color: theme.text,
                              }}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div
          className="p-6 border-t flex justify-end gap-4"
          style={{
            borderColor: theme.navbar.border,
            backgroundColor: theme.card.bg,
          }}
        >
          <button
            onClick={onClose}
            className="px-8 py-3 rounded-full font-bold text-sm border hover:bg-black/5 transition-colors"
            style={{ borderColor: theme.navbar.border }}
          >
            Cancel
          </button>
          <button
            onClick={prepareSubmit}
            className="px-10 py-3 rounded-full font-bold text-sm shadow-xl hover:scale-105 transition-transform flex items-center gap-2"
            style={{ backgroundColor: theme.text, color: theme.bg }}
          >
            <Check size={18} /> Save Changes
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const Input = ({
  label,
  name,
  val,
  onChange,
  type = "text",
  theme,
  placeholder,
}) => {
  // Safe check for price field without crashing if name is undefined
  const isPrice = name && name.toLowerCase().includes("price");

  return (
    <div className="space-y-2">
      <label className="text-xs font-bold uppercase opacity-60 tracking-wider">
        {label}
      </label>
      <div className="relative">
        {type === "number" && isPrice && (
          <DollarSign
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40"
          />
        )}
        <input
          type={type}
          name={name}
          value={val}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full p-4 rounded-xl border bg-transparent outline-none focus:ring-2 focus:ring-current transition-all ${
            isPrice ? "pl-10" : ""
          }`}
          style={{
            borderColor: theme.navbar.border,
            color: theme.text,
            backgroundColor: theme.navbar.searchBg,
          }}
        />
      </div>
    </div>
  );
};

export default ProductsTab;
