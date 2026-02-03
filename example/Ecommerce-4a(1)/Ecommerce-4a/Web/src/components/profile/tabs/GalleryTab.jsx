import React, { useState, useRef, useEffect } from "react";
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
  AlertCircle,
  Upload,
  FileImage,
  Loader2,
  RefreshCw,
  AlertTriangle,
  CheckSquare,
  Square,
} from "lucide-react";

// Import API functions
import {
  getGallery,
  uploadGalleryImages,
  deleteGalleryImages,
  reorderGalleryImages,
  updateGalleryImageDetails,
} from "@/services/api";

// Constants
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// --- Helper: Format Image URL ---
const getImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http") || url.startsWith("blob:")) return url;
  return `${API_BASE_URL}${url}`;
};

// --- Modal Component ---
const CloseIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const Modal = ({ isOpen, onClose, title, description, children, theme }) => {
  useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e) => {
        if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            backgroundColor: theme.navbar?.modalOverlay || "rgba(0,0,0,0.5)",
          }}
          className="fixed inset-0 z-[60] backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: theme.navbar?.modalBg || "#fff",
              borderColor: theme.navbar?.border || "#eee",
              boxShadow: theme.navbar?.shadow || "0 10px 30px rgba(0,0,0,0.1)",
              color: theme.text || "inherit",
            }}
            className="w-full max-w-lg border rounded-3xl overflow-hidden relative flex flex-col max-h-[90vh]"
          >
            <div className="p-6 pb-2 shrink-0">
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-2xl font-bold leading-tight pr-8">
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  style={{
                    backgroundColor:
                      theme.navbar?.searchBg || "rgba(0,0,0,0.05)",
                  }}
                  className="p-2 rounded-full transition-opacity hover:opacity-70 absolute top-5 right-5"
                >
                  <CloseIcon />
                </button>
              </div>
              {description && (
                <p className="text-sm opacity-70 leading-relaxed">
                  {description}
                </p>
              )}
            </div>
            <div className="p-6 pt-4 overflow-y-auto custom-scrollbar">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default function GalleryTab({ theme }) {
  // --- State ---
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedIds, setSelectedIds] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [failedImages, setFailedImages] = useState(new Set());

  // Modal States
  const [pendingImages, setPendingImages] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fileInputRef = useRef(null);

  // --- Styles ---
  const cardStyle = {
    backgroundColor: theme?.card?.bg || "rgba(255,255,255,0.02)",
    borderColor: theme?.navbar?.border || "rgba(255,255,255,0.1)",
    color: theme?.text || "inherit",
  };

  // --- Fetch & Poll ---
  const fetchImages = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    const res = await getGallery();
    if (res.success) {
      setImages(res.data);
    }
    if (showLoading) setIsLoading(false);
  };

  useEffect(() => {
    fetchImages(true);
  }, []);

  useEffect(() => {
    const processingImages = images.filter(
      (img) => img.status === "processing"
    );
    let intervalId;
    if (processingImages.length > 0) {
      intervalId = setInterval(() => {
        fetchImages(false);
      }, 3000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [images]);

  // --- Handlers ---
  const handleSelectAll = () => {
    if (selectedIds.length === images.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(images.map((img) => img._id));
    }
  };

  const toggleSelection = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  const handleAddClick = () => fileInputRef.current.click();

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const newItems = files.map((file) => ({
        id: Date.now() + Math.random(),
        url: URL.createObjectURL(file),
        title: file.name,
        fileObject: file,
        key: `${file.name}-${file.size}`,
      }));

      const currentKeys = new Set(pendingImages.map((img) => img.key));
      const uniqueNewItems = newItems.filter(
        (item) => !currentKeys.has(item.key)
      );

      if (uniqueNewItems.length > 0) {
        setPendingImages((prev) => [...prev, ...uniqueNewItems]);
        setShowAddModal(true);
      } else if (pendingImages.length === 0) {
        alert("Files already selected.");
      }
    }
    e.target.value = "";
  };

  const removePendingImage = (id) => {
    const updated = pendingImages.filter((img) => img.id !== id);
    setPendingImages(updated);
    if (updated.length === 0) cancelAdd();
  };

  const cancelAdd = () => {
    setShowAddModal(false);
    setTimeout(() => {
      setPendingImages([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }, 300);
  };

  const confirmAddImages = async () => {
    setIsSubmitting(true);
    const formData = new FormData();
    pendingImages.forEach((img) => {
      formData.append("images", img.fileObject);
    });

    const res = await uploadGalleryImages(formData);

    if (res.success) {
      setImages((prev) => [...prev, ...res.data]);
      setPendingImages([]);
      setShowAddModal(false);
    }
    setIsSubmitting(false);
  };

  const requestDelete = (id) => {
    setDeleteTarget(id);
    setShowDeleteModal(true);
  };
  const requestBulkDelete = () => {
    setDeleteTarget("bulk");
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setIsSubmitting(true);
    const idsToDelete = deleteTarget === "bulk" ? selectedIds : [deleteTarget];

    const res = await deleteGalleryImages(idsToDelete);

    if (res.success) {
      setImages((prev) => prev.filter((img) => !idsToDelete.includes(img._id)));
      setSelectedIds([]);
      setShowDeleteModal(false);
      setDeleteTarget(null);
    }
    setIsSubmitting(false);
  };

  const startEdit = (img) => {
    setEditingId(img._id);
    setEditTitle(img.title);
  };

  const saveEdit = async (id) => {
    const originalImages = [...images];
    setImages((prev) =>
      prev.map((img) => (img._id === id ? { ...img, title: editTitle } : img))
    );
    setEditingId(null);
    const res = await updateGalleryImageDetails(id, editTitle);
    if (!res.success) setImages(originalImages);
  };

  const moveImage = async (index, direction) => {
    const newImages = [...images];
    const targetIndex = direction === "left" ? index - 1 : index + 1;

    if (targetIndex >= 0 && targetIndex < newImages.length) {
      [newImages[index], newImages[targetIndex]] = [
        newImages[targetIndex],
        newImages[index],
      ];
      setImages(newImages);

      const reorderItems = newImages.map((img, idx) => ({
        id: img._id,
        order: idx,
      }));
      await reorderGalleryImages(reorderItems);
    }
  };

  // --- Render Helpers ---
  const handleImageError = (id) =>
    setFailedImages((prev) => new Set(prev).add(id));

  const RenderImage = ({ img, className }) => {
    if (img.status === "failed") {
      return (
        <div
          className={`flex flex-col items-center justify-center bg-red-50 dark:bg-red-900/10 p-4 ${className}`}
        >
          <AlertTriangle className="w-8 h-8 text-red-400 mb-2" />
          <span className="text-[10px] font-bold text-red-400 uppercase text-center">
            Failed
          </span>
        </div>
      );
    }
    if (failedImages.has(img.id || img._id)) {
      return (
        <div
          className={`flex flex-col items-center justify-center bg-gray-100 dark:bg-zinc-800 p-4 ${className}`}
        >
          <FileImage className="w-8 h-8 opacity-40 mb-2" />
          <span className="text-[10px] font-bold opacity-50 uppercase text-center break-all px-2">
            Preview Unavailable
          </span>
        </div>
      );
    }
    const src = img.fileObject ? img.url : getImageUrl(img.url);
    return (
      <img
        src={src}
        alt={img.title}
        className={className}
        onError={() => handleImageError(img.id || img._id)}
        loading="lazy"
      />
    );
  };

  return (
    <div className="w-full relative min-h-[50vh]">
      <input
        type="file"
        multiple
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />

      {/* --- Sticky Header --- */}
      <div className="sticky top-0 z-40 pb-4 bg-inherit backdrop-blur-xl transition-all duration-300">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold uppercase tracking-tight flex items-center gap-2">
              Gallery
              <button
                onClick={() => fetchImages(true)}
                className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors opacity-50 hover:opacity-100"
                title="Refresh"
              >
                <RefreshCw
                  size={16}
                  className={isLoading ? "animate-spin" : ""}
                />
              </button>
            </h2>
            <p className="text-xs font-bold opacity-40 uppercase tracking-wide mt-1">
              {images.length} Items • {selectedIds.length} Selected
            </p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            {images.length > 0 && (
              <button
                onClick={handleSelectAll}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-xs font-bold uppercase tracking-wider"
              >
                {selectedIds.length === images.length ? (
                  <CheckSquare size={16} />
                ) : (
                  <Square size={16} />
                )}
                <span className="hidden sm:inline">Select All</span>
              </button>
            )}
            {selectedIds.length > 0 && (
              <button
                onClick={requestBulkDelete}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors text-xs font-bold uppercase tracking-wider"
              >
                <Trash2 size={16} />
                <span className="hidden sm:inline">Delete</span> (
                {selectedIds.length})
              </button>
            )}
            <button
              onClick={handleAddClick}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl transition-all shadow-lg hover:opacity-90 text-xs font-bold uppercase tracking-wider ml-auto"
              style={{
                backgroundColor: theme?.text || "#000",
                color: theme?.bg || "#fff",
              }}
            >
              <Plus size={16} />
              Add Images
            </button>
          </div>
        </div>
      </div>

      {/* --- Grid --- */}
      {isLoading && images.length === 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-3xl animate-pulse bg-gray-200 dark:bg-zinc-800"
            />
          ))}
        </div>
      ) : images.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-24 rounded-3xl border border-dashed transition-colors"
          style={cardStyle}
        >
          <ImageIcon className="h-16 w-16 opacity-20 mb-4" />
          <h3 className="text-sm font-bold uppercase opacity-60">
            No images found
          </h3>
          <p className="text-xs opacity-40 mt-1">
            Upload some photos to get started
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {images.map((img, index) => {
            const isSelected = selectedIds.includes(img._id);
            const isEditing = editingId === img._id;
            const isProcessing = img.status === "processing";

            return (
              <motion.div
                key={img._id}
                layout // Smooth layout transitions
                initial={false}
                animate={{
                  scale: isSelected ? 0.98 : 1, // Slight shrink on select
                  opacity: isSelected ? 1 : 1,
                }}
                className={`group relative rounded-3xl overflow-hidden transition-all duration-200 border`}
                style={{
                  ...cardStyle,
                  // If selected, use a glow effect instead of a harsh border
                  borderColor: isSelected
                    ? theme?.text
                    : theme?.navbar?.border || "rgba(255,255,255,0.1)",
                  boxShadow: isSelected
                    ? `0 0 0 2px ${theme?.text}10, 0 10px 20px -5px ${theme?.text}20`
                    : "none",
                }}
              >
                {/* MODERN SELECTION GRADIENT OVERLAY (Bottom)
                   Adds a subtle color tint at the bottom when selected 
                */}
                <div
                  className={`absolute inset-0 pointer-events-none transition-opacity duration-300 z-0 ${
                    isSelected ? "opacity-100" : "opacity-0"
                  }`}
                  style={{
                    background: `linear-gradient(to top, ${theme?.text}10 0%, transparent 40%)`,
                  }}
                />

                {/* CLICKABLE CHECKBOX AREA */}
                <div
                  className="absolute top-0 left-0 p-4 z-20 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelection(img._id);
                  }}
                >
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-200 ${
                      isSelected
                        ? "bg-current text-white shadow-lg scale-110"
                        : "bg-black/20 dark:bg-white/20 backdrop-blur-md border border-white/30 hover:bg-black/40 dark:hover:bg-white/40"
                    }`}
                    style={{
                      color: isSelected ? theme?.text : "inherit",
                      backgroundColor: isSelected ? theme?.text : undefined,
                    }}
                  >
                    {isSelected && (
                      <Check
                        size={14}
                        strokeWidth={4}
                        className="text-white dark:text-black"
                      />
                    )}
                  </div>
                </div>

                {/* PROCESSING OVERLAY */}
                {isProcessing && (
                  <div className="absolute inset-0 z-10 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 text-white animate-spin mb-2" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                      Processing...
                    </span>
                  </div>
                )}

                {/* Image */}
                <div className="aspect-square w-full overflow-hidden bg-gray-100/5 relative z-0">
                  <RenderImage
                    img={img}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />

                  {/* Move Controls */}
                  {!isEditing && !isProcessing && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 z-10 pointer-events-none md:pointer-events-auto">
                      <button
                        onClick={() => moveImage(index, "left")}
                        disabled={index === 0}
                        className="pointer-events-auto p-2 bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-white/40 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ArrowLeft size={18} />
                      </button>
                      <button
                        onClick={() => moveImage(index, "right")}
                        disabled={index === images.length - 1}
                        className="pointer-events-auto p-2 bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-white/40 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ArrowRight size={18} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div
                  className="p-3 sm:p-4 border-t relative z-10 bg-inherit"
                  style={{
                    borderColor:
                      theme?.navbar?.border || "rgba(255,255,255,0.1)",
                  }}
                >
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="flex-1 min-w-0 bg-transparent border-b border-current/30 px-1 py-1 text-sm font-bold outline-none focus:border-current"
                        autoFocus
                      />
                      <button
                        onClick={() => saveEdit(img._id)}
                        className="shrink-0 p-1 hover:text-green-500"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="shrink-0 p-1 text-red-500"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3
                          className="font-bold text-sm truncate"
                          title={img.title}
                        >
                          {img.title || "Untitled"}
                        </h3>
                        <p className="text-[10px] font-bold uppercase tracking-wider opacity-50 mt-0.5 truncate">
                          {img.fileType
                            ? img.fileType.split("/")[1].toUpperCase()
                            : img.category}
                        </p>
                      </div>

                      {!isProcessing && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => startEdit(img)}
                            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 opacity-70 hover:opacity-100"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => requestDelete(img._id)}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 hover:text-red-500 opacity-70 hover:opacity-100"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* --- Modals (Upload / Delete) --- */}
      {/* ... (Upload & Delete Modals remain same as previous version) ... */}
      <Modal
        isOpen={showAddModal}
        onClose={isSubmitting ? undefined : cancelAdd}
        title="Upload Images"
        description={`Selected ${pendingImages.length} image(s).`}
        theme={theme}
      >
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-3 max-h-64 overflow-y-auto p-1 custom-scrollbar">
            {pendingImages.map((img) => (
              <div
                key={img.id}
                className="relative aspect-square rounded-xl overflow-hidden border group"
                style={{ borderColor: theme?.navbar?.border }}
              >
                <RenderImage img={img} className="w-full h-full object-cover" />
                <button
                  onClick={() => removePendingImage(img.id)}
                  disabled={isSubmitting}
                  className="absolute top-1 right-1 p-1 bg-black/50 hover:bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm disabled:opacity-0"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            {!isSubmitting && (
              <div
                className="aspect-square rounded-xl border border-dashed flex flex-col items-center justify-center cursor-pointer hover:opacity-70 transition-opacity bg-black/5 dark:bg-white/5"
                style={{ borderColor: theme?.navbar?.border }}
                onClick={handleAddClick}
              >
                <Plus className="opacity-40 mb-1" />
                <span className="text-[10px] font-bold uppercase opacity-60">
                  Add
                </span>
              </div>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={cancelAdd}
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-xl text-sm font-bold uppercase tracking-wide opacity-70 hover:opacity-100 transition-opacity disabled:opacity-40"
              style={{ backgroundColor: theme?.navbar?.searchBg }}
            >
              Cancel
            </button>
            <button
              onClick={confirmAddImages}
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-xl text-sm font-bold uppercase tracking-wide text-white shadow-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              style={{
                backgroundColor: theme?.text || "#000",
                color: theme?.bg,
              }}
            >
              {isSubmitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Upload size={16} />
              )}
              {isSubmitting ? "Uploading..." : "Confirm Upload"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showDeleteModal}
        onClose={isSubmitting ? undefined : () => setShowDeleteModal(false)}
        title="Confirm Deletion"
        description="This action cannot be undone."
        theme={theme}
      >
        <div className="space-y-6">
          <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-red-500/5 border border-red-500/10">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full mb-3">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-center font-medium">
              {deleteTarget === "bulk"
                ? `Delete ${selectedIds.length} images?`
                : "Delete 1 image?"}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowDeleteModal(false)}
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-xl text-sm font-bold uppercase tracking-wide opacity-70 hover:opacity-100 transition-opacity disabled:opacity-40"
              style={{ backgroundColor: theme?.navbar?.searchBg }}
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-xl text-sm font-bold uppercase tracking-wide text-white bg-red-500 shadow-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isSubmitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Trash2 size={16} />
              )}
              {isSubmitting ? "Deleting..." : "Yes, Delete"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
