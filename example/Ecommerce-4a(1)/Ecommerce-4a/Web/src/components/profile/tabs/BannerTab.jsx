import React, { useState, useRef, useEffect, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trash2,
  Plus,
  Edit2,
  Check,
  X,
  ArrowLeft,
  ArrowRight,
  Image as ImageIcon,
  Upload,
  Loader2,
  RefreshCw,
  Type,
  Maximize2,
  UploadCloud,
} from "lucide-react";
import { ThemeContext } from "@/context/ThemeContext";
import toast from "react-hot-toast";
import {
  getBanners,
  createBanner,
  deleteBanner,
  updateBannerDetails,
  reorderBanners,
} from "@/services/api";

const getImageUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("blob")) return path;
  // Append timestamp to prevent caching issues if the same file name is reused
  return `${import.meta.env.VITE_API_URL}${path}?t=${new Date().getTime()}`;
};

// --- Modal Component ---
const Modal = ({ isOpen, onClose, title, children, theme }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]"
        style={{ backgroundColor: theme.modalBg || "#fff", color: theme.text }}
      >
        <div
          className="p-6 border-b flex justify-between items-center"
          style={{ borderColor: theme.navbar?.border }}
        >
          <h2 className="text-2xl font-black uppercase tracking-tight">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-black/5 rounded-full"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar">{children}</div>
      </motion.div>
    </div>
  );
};

export default function BannerTab() {
  const { theme } = useContext(ThemeContext);

  // --- State ---
  const [banners, setBanners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activePage, setActivePage] = useState("home"); // 'home' or 'shop'

  // Edit State
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ title: "", subtitle: "" });

  // Upload Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({ title: "", subtitle: "" });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const fileInputRef = useRef(null);

  // --- Fetch Data ---
  const fetchBanners = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    const res = await getBanners();
    if (res.success) {
      // Sort by order ensuring numeric comparison
      const sorted = res.data.sort((a, b) => (a.order || 0) - (b.order || 0));
      setBanners(sorted);
    }
    if (showLoading) setIsLoading(false);
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  // Filter banners for the current view
  const displayedBanners = banners.filter((b) => b.page === activePage);

  // --- Handlers ---

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return toast.error("Please select an image");

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("title", uploadForm.title);
    formData.append("subtitle", uploadForm.subtitle);
    formData.append("page", activePage); // Upload to the currently active tab
    formData.append("image", selectedFile);

    const res = await createBanner(formData);

    if (res.success) {
      toast.success("Banner uploading... processing image.");
      setIsModalOpen(false);
      // Reset Form
      setUploadForm({ title: "", subtitle: "" });
      setSelectedFile(null);
      setPreviewUrl("");

      // --- CRITICAL: POLL FOR UPDATES ---
      // 1. Immediate fetch (gets record, might have temp or empty image)
      await fetchBanners(false);

      // 2. Fetch again in 1s (Worker usually done by now)
      setTimeout(() => fetchBanners(false), 1000);

      // 3. Fetch again in 3s (Just in case)
      setTimeout(() => fetchBanners(false), 3000);
    } else {
      toast.error(res.message);
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this banner?")) return;

    // Optimistic Delete
    setBanners((prev) => prev.filter((b) => (b._id || b.id) !== id));

    const res = await deleteBanner(id);
    if (res.success) {
      toast.success("Deleted");
      await fetchBanners(false); // Sync to be sure
    } else {
      toast.error(res.message);
      await fetchBanners(false); // Revert on error
    }
  };

  // --- Edit Handlers ---

  const startEdit = (banner) => {
    setEditingId(banner._id || banner.id);
    setEditData({ title: banner.title, subtitle: banner.subtitle });
  };

  const saveEdit = async (id) => {
    // Optimistic Update
    const oldBanners = [...banners];
    setBanners((prev) =>
      prev.map((b) => ((b._id || b.id) === id ? { ...b, ...editData } : b))
    );
    setEditingId(null);

    const res = await updateBannerDetails(id, editData);
    if (res.success) {
      toast.success("Updated");
      await fetchBanners(false); // Silent reload
    } else {
      setBanners(oldBanners); // Revert
      toast.error(res.message);
    }
  };

  // --- Reordering Logic ---

  const moveBanner = async (index, direction) => {
    // 1. Get the current list for this page
    const currentList = [...displayedBanners];

    // 2. Identify indices to swap
    const targetIndex = direction === "left" ? index - 1 : index + 1;

    // Boundary check
    if (targetIndex < 0 || targetIndex >= currentList.length) return;

    // 3. Swap items locally in the filtered list
    const temp = currentList[index];
    currentList[index] = currentList[targetIndex];
    currentList[targetIndex] = temp;

    // 4. Create a new global state
    const reorderedList = currentList.map((item, idx) => ({
      ...item,
      order: idx,
    }));

    // Construct API Payload
    const apiPayload = reorderedList.map((b) => ({
      id: b._id || b.id,
      order: b.order,
    }));

    // Update Local State Optimistically
    const newGlobalBanners = banners.map((b) => {
      const found = reorderedList.find(
        (r) => (r._id || r.id) === (b._id || b.id)
      );
      return found ? found : b;
    });

    // Sort global state immediately so UI doesn't jump
    setBanners(
      newGlobalBanners.sort((a, b) => (a.order || 0) - (b.order || 0))
    );

    // 5. Send to Server
    const res = await reorderBanners(apiPayload);

    // 6. Silent Refresh
    if (res.success) {
      await fetchBanners(false);
    } else {
      toast.error("Reorder failed");
      await fetchBanners(false); // Revert
    }
  };

  return (
    <div className="w-full relative min-h-[50vh]" style={{ color: theme.text }}>
      {/* --- Header & Tabs --- */}
      <div className="sticky top-0 z-40 pb-4 bg-inherit backdrop-blur-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tight flex items-center gap-3">
              Store Banners
              <button
                onClick={() => fetchBanners(true)}
                className="p-2 rounded-full hover:bg-black/5 opacity-50 hover:opacity-100 transition-all"
                title="Refresh Data"
              >
                <RefreshCw
                  size={18}
                  className={isLoading ? "animate-spin" : ""}
                />
              </button>
            </h2>
            <p className="opacity-60 text-sm mt-1">
              Manage Hero Carousel & Shop Featured images.
            </p>
          </div>
          <button
            onClick={() => {
              setUploadForm({ title: "", subtitle: "" });
              setPreviewUrl("");
              setSelectedFile(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm text-white shadow-xl hover:scale-105 transition-transform"
            style={{ backgroundColor: theme.text, color: theme.bg }}
          >
            <Plus size={18} /> Add Banner
          </button>
        </div>

        {/* Page Tabs */}
        <div
          className="flex gap-8 border-b"
          style={{ borderColor: theme.navbar?.border }}
        >
          {["home", "shop"].map((page) => (
            <button
              key={page}
              onClick={() => setActivePage(page)}
              className={`pb-4 text-sm font-bold uppercase tracking-widest transition-all border-b-2 ${
                activePage === page
                  ? "border-current opacity-100"
                  : "border-transparent opacity-40 hover:opacity-70"
              }`}
            >
              {page} Page
            </button>
          ))}
        </div>
      </div>

      {/* --- Banner Grid --- */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin opacity-50" size={40} />
        </div>
      ) : displayedBanners.length === 0 ? (
        <div
          className="text-center py-24 opacity-50 border-2 border-dashed rounded-3xl mt-4"
          style={{ borderColor: theme.navbar?.border }}
        >
          <ImageIcon size={48} className="mx-auto mb-2" />
          <p>No banners for {activePage} page.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mt-6">
          <AnimatePresence>
            {displayedBanners.map((banner, index) => {
              const isEditing = editingId === (banner._id || banner.id);

              return (
                <motion.div
                  layout
                  key={banner._id || banner.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="relative group rounded-3xl overflow-hidden shadow-lg border bg-white dark:bg-white/5"
                  style={{ borderColor: theme.navbar?.border }}
                >
                  {/* Image Area */}
                  <div className="aspect-video relative overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <img
                      src={getImageUrl(banner.image)}
                      alt={banner.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />

                    {/* Ordering Controls (Overlay) */}
                    {!isEditing && (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                        <button
                          onClick={() => moveBanner(index, "left")}
                          disabled={index === 0}
                          className="p-3 bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-white/40 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ArrowLeft size={20} />
                        </button>
                        <span className="text-white font-mono font-bold text-xl drop-shadow-md">
                          {index + 1}
                        </span>
                        <button
                          onClick={() => moveBanner(index, "right")}
                          disabled={index === displayedBanners.length - 1}
                          className="p-3 bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-white/40 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ArrowRight size={20} />
                        </button>
                      </div>
                    )}

                    {/* Delete Button */}
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleDelete(banner._id || banner.id)}
                        className="p-2 bg-white text-red-500 rounded-full shadow-lg hover:scale-110 transition-transform"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Content / Edit Area */}
                  <div
                    className="p-5 border-t relative"
                    style={{ borderColor: theme.navbar?.border }}
                  >
                    {isEditing ? (
                      <div className="space-y-3">
                        <input
                          value={editData.title}
                          onChange={(e) =>
                            setEditData({ ...editData, title: e.target.value })
                          }
                          placeholder="Title"
                          className="w-full bg-transparent border-b border-current/30 p-1 font-bold outline-none"
                          autoFocus
                        />
                        <input
                          value={editData.subtitle}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              subtitle: e.target.value,
                            })
                          }
                          placeholder="Subtitle"
                          className="w-full bg-transparent border-b border-current/30 p-1 text-sm outline-none"
                        />
                        <div className="flex gap-2 justify-end mt-2">
                          <button
                            onClick={() => saveEdit(banner._id || banner.id)}
                            className="p-2 bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500/20"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-lg leading-tight">
                            {banner.title || (
                              <span className="opacity-30 italic">
                                No Title
                              </span>
                            )}
                          </h3>
                          <p className="text-sm opacity-60 mt-1">
                            {banner.subtitle || (
                              <span className="opacity-30 italic">
                                No Subtitle
                              </span>
                            )}
                          </p>
                        </div>
                        <button
                          onClick={() => startEdit(banner)}
                          className="p-2 hover:bg-black/5 rounded-lg opacity-50 hover:opacity-100"
                        >
                          <Edit2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* --- Upload Modal --- */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Upload Banner"
        theme={theme}
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase opacity-60">
              Image ({activePage})
            </label>
            <label
              className="w-full aspect-video flex flex-col items-center justify-center border-2 border-dashed rounded-2xl cursor-pointer hover:bg-black/5 transition-colors overflow-hidden relative"
              style={{ borderColor: theme.navbar?.border }}
            >
              {previewUrl ? (
                <img
                  src={previewUrl}
                  className="w-full h-full object-cover"
                  alt="Preview"
                />
              ) : (
                <>
                  <UploadCloud size={32} className="opacity-40 mb-2" />
                  <span className="text-xs font-bold opacity-60">
                    Click to Upload
                  </span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                ref={fileInputRef}
              />
            </label>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase opacity-60">
                Title
              </label>
              <div className="relative">
                <Type
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40"
                />
                <input
                  value={uploadForm.title}
                  onChange={(e) =>
                    setUploadForm({ ...uploadForm, title: e.target.value })
                  }
                  className="w-full pl-10 pr-4 py-3 rounded-xl border bg-transparent outline-none focus:ring-2 focus:ring-current"
                  placeholder="e.g. SUMMER SALE"
                  style={{ borderColor: theme.navbar?.border }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase opacity-60">
                Subtitle
              </label>
              <div className="relative">
                <Maximize2
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40"
                />
                <input
                  value={uploadForm.subtitle}
                  onChange={(e) =>
                    setUploadForm({ ...uploadForm, subtitle: e.target.value })
                  }
                  className="w-full pl-10 pr-4 py-3 rounded-xl border bg-transparent outline-none focus:ring-2 focus:ring-current"
                  placeholder="e.g. Up to 50% Off"
                  style={{ borderColor: theme.navbar?.border }}
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleUpload}
            disabled={isSubmitting}
            className="w-full py-4 rounded-xl font-bold uppercase tracking-widest text-white shadow-lg hover:opacity-90 transition-opacity mt-4 flex justify-center items-center gap-2"
            style={{ backgroundColor: theme.text, color: theme.bg }}
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Upload size={20} />
            )}
            {isSubmitting ? "Uploading..." : "Save Banner"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
