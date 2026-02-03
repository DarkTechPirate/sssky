import React, { useState } from "react";
import {
  Plus,
  CheckCircle2,
  Edit3,
  Trash2,
  Loader2,
  X,
  Home,
  MapPin,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  addAddress,
  updateAddress,
  deleteAddress,
  setPrimaryAddress,
} from "@/services/api";
import { useApp } from "@/context/Appcontext";

export default function AddressesTab({ theme }) {
  // Get setUser to update global state instantly without refetching
  const { user, setUser } = useApp();
  const addresses = user?.addresses || [];

  const [actionLoading, setActionLoading] = useState(null);

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form Data
  const [formData, setFormData] = useState({
    door: "",
    street: "",
    area: "",
    landmark: "",
    city: "",
    state: "",
    zip: "",
    country: "India",
  });
  const [initialFormData, setInitialFormData] = useState({});

  // Check if form is dirty
  const isFormChanged =
    JSON.stringify(formData) !== JSON.stringify(initialFormData);

  // --- Handlers ---

  const handleOpenModal = (addressToEdit = null) => {
    if (addressToEdit) {
      setEditingId(addressToEdit._id);
      const data = {
        door: addressToEdit.door || "",
        street: addressToEdit.street || "",
        area: addressToEdit.area || "",
        landmark: addressToEdit.landmark || "",
        city: addressToEdit.city || "",
        state: addressToEdit.state || "",
        zip: addressToEdit.zip || "",
        country: addressToEdit.country || "India",
      };
      setFormData(data);
      setInitialFormData(data);
    } else {
      setEditingId(null);
      const data = {
        door: "",
        street: "",
        area: "",
        landmark: "",
        city: "",
        state: "",
        zip: "",
        country: "India",
      };
      setFormData(data);
      setInitialFormData(data);
    }
    setIsModalOpen(true);
  };

  const handleSetPrimary = async (id) => {
    // Prevent setting already primary address as primary again
    const isAlreadyPrimary = addresses.find((a) => a._id === id)?.primary;
    if (isAlreadyPrimary) return;

    setActionLoading(id);
    try {
      const res = await setPrimaryAddress(id);
      if (res.success && res.addresses) {
        // INSTANT UPDATE: Patch global user object
        setUser((prev) => ({ ...prev, addresses: res.addresses }));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this address?"))
      return;

    setActionLoading(id);
    try {
      const res = await deleteAddress(id);
      if (res.success && res.addresses) {
        // INSTANT UPDATE: Patch global user object
        setUser((prev) => ({ ...prev, addresses: res.addresses }));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent API call if nothing changed during edit
    if (editingId && !isFormChanged) {
      setIsModalOpen(false);
      return;
    }

    setIsSubmitting(true);

    try {
      let res;
      if (editingId) {
        res = await updateAddress(editingId, formData);
      } else {
        res = await addAddress(formData);
      }

      if (res.success && res.addresses) {
        // 1. INSTANT UPDATE: Update Global State directly
        setUser((prev) => ({ ...prev, addresses: res.addresses }));

        // 2. CLOSE MODAL IMMEDIATELY
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold uppercase tracking-tight">
          Saved Addresses
        </h2>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold uppercase tracking-wider hover:bg-current hover:text-white dark:hover:text-black transition-colors"
          style={{ borderColor: theme.text }}
        >
          <Plus size={16} /> Add New
        </button>
      </div>

      {/* Grid */}
      {addresses.length === 0 ? (
        <div
          className="text-center py-20 opacity-50 border-2 border-dashed rounded-3xl"
          style={{ borderColor: theme.navbar.border }}
        >
          <MapPin size={48} className="mx-auto mb-4" />
          <p>No addresses saved yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {addresses.map((addr) => (
            <div
              key={addr._id}
              className="group p-6 rounded-3xl border flex flex-col justify-between min-h-[240px] relative transition-all hover:border-current"
              style={{
                borderColor: theme.navbar?.border || "rgba(255,255,255,0.1)",
                backgroundColor: theme.card?.bg || "transparent",
              }}
            >
              {/* Default Badge */}
              {addr.primary && (
                <span className="absolute top-6 right-6 flex items-center gap-1 text-[10px] font-bold uppercase text-green-500 bg-green-500/10 px-2 py-1 rounded">
                  <CheckCircle2 size={12} /> Default
                </span>
              )}

              {/* Action Loader Overlay */}
              {actionLoading === addr._id && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-3xl">
                  <Loader2 className="animate-spin text-white" />
                </div>
              )}

              {/* Content */}
              <div>
                <div className="flex items-center gap-2 mb-3 opacity-50">
                  <Home size={16} />
                  <span className="text-xs font-bold uppercase tracking-widest">
                    Address #{String(addr._id).slice(-4)}
                  </span>
                </div>

                <h3 className="font-bold text-lg mb-1">
                  {user?.fullname || "User"}
                </h3>
                <p className="text-sm font-medium opacity-80 font-mono">
                  {user?.phone || user?.email}
                </p>

                <div className="mt-4 text-sm opacity-70 leading-relaxed">
                  <p>
                    {addr.door}, {addr.street}
                  </p>
                  {addr.area && <p>{addr.area}</p>}
                  {addr.landmark && (
                    <p className="text-xs opacity-60">Near {addr.landmark}</p>
                  )}
                  <p className="font-bold mt-1">
                    {addr.city}, {addr.state} - {addr.zip}
                  </p>
                </div>
              </div>

              {/* Actions Footer */}
              <div
                className="flex items-center justify-between mt-6 pt-4 border-t border-dashed"
                style={{ borderColor: theme.navbar?.border }}
              >
                <div className="flex gap-4">
                  <button
                    onClick={() => handleOpenModal(addr)}
                    className="flex items-center gap-1 text-xs font-bold uppercase hover:opacity-60 transition-opacity"
                  >
                    <Edit3 size={14} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(addr._id)}
                    className="flex items-center gap-1 text-xs font-bold uppercase text-red-500 hover:opacity-60 transition-opacity"
                  >
                    <Trash2 size={14} /> Remove
                  </button>
                </div>

                {!addr.primary && (
                  <button
                    onClick={() => handleSetPrimary(addr._id)}
                    className="text-[10px] font-bold uppercase tracking-wide opacity-50 hover:opacity-100 hover:underline transition-all"
                  >
                    Set as Default
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- ADD / EDIT MODAL --- */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
              style={{
                backgroundColor: theme.bg || "#111",
                border: `1px solid ${theme.navbar?.border}`,
              }}
            >
              {/* Modal Header */}
              <div
                className="flex items-center justify-between p-6 border-b"
                style={{ borderColor: theme.navbar.border }}
              >
                <h3 className="text-xl font-bold uppercase">
                  {editingId ? "Edit Address" : "Add New Address"}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Scrollable Form Body */}
              <div className="overflow-y-auto p-6 space-y-4">
                <form
                  id="addressForm"
                  onSubmit={handleSubmit}
                  className="grid grid-cols-2 gap-4"
                >
                  {/* Door */}
                  <div className="col-span-1">
                    <label className="text-xs font-bold uppercase opacity-50 ml-1">
                      Door / Flat No *
                    </label>
                    <input
                      required
                      type="text"
                      className="w-full mt-1 p-3 rounded-xl bg-white/5 border focus:outline-none focus:border-current transition-colors"
                      style={{ borderColor: theme.navbar.border }}
                      value={formData.door}
                      onChange={(e) =>
                        setFormData({ ...formData, door: e.target.value })
                      }
                    />
                  </div>

                  {/* Street */}
                  <div className="col-span-1">
                    <label className="text-xs font-bold uppercase opacity-50 ml-1">
                      Street / Road
                    </label>
                    <input
                      type="text"
                      className="w-full mt-1 p-3 rounded-xl bg-white/5 border focus:outline-none focus:border-current transition-colors"
                      style={{ borderColor: theme.navbar.border }}
                      value={formData.street}
                      onChange={(e) =>
                        setFormData({ ...formData, street: e.target.value })
                      }
                    />
                  </div>

                  {/* Area */}
                  <div className="col-span-2">
                    <label className="text-xs font-bold uppercase opacity-50 ml-1">
                      Area / Locality
                    </label>
                    <input
                      type="text"
                      className="w-full mt-1 p-3 rounded-xl bg-white/5 border focus:outline-none focus:border-current transition-colors"
                      style={{ borderColor: theme.navbar.border }}
                      value={formData.area}
                      onChange={(e) =>
                        setFormData({ ...formData, area: e.target.value })
                      }
                    />
                  </div>

                  {/* Landmark */}
                  <div className="col-span-2">
                    <label className="text-xs font-bold uppercase opacity-50 ml-1">
                      Landmark (Optional)
                    </label>
                    <input
                      type="text"
                      className="w-full mt-1 p-3 rounded-xl bg-white/5 border focus:outline-none focus:border-current transition-colors"
                      style={{ borderColor: theme.navbar.border }}
                      value={formData.landmark}
                      onChange={(e) =>
                        setFormData({ ...formData, landmark: e.target.value })
                      }
                    />
                  </div>

                  {/* City */}
                  <div className="col-span-1">
                    <label className="text-xs font-bold uppercase opacity-50 ml-1">
                      City *
                    </label>
                    <input
                      required
                      type="text"
                      className="w-full mt-1 p-3 rounded-xl bg-white/5 border focus:outline-none focus:border-current transition-colors"
                      style={{ borderColor: theme.navbar.border }}
                      value={formData.city}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                    />
                  </div>

                  {/* ZIP */}
                  <div className="col-span-1">
                    <label className="text-xs font-bold uppercase opacity-50 ml-1">
                      ZIP / Pincode *
                    </label>
                    <input
                      required
                      type="number"
                      className="w-full mt-1 p-3 rounded-xl bg-white/5 border focus:outline-none focus:border-current transition-colors"
                      style={{ borderColor: theme.navbar.border }}
                      value={formData.zip}
                      onChange={(e) =>
                        setFormData({ ...formData, zip: e.target.value })
                      }
                    />
                  </div>

                  {/* State */}
                  <div className="col-span-1">
                    <label className="text-xs font-bold uppercase opacity-50 ml-1">
                      State *
                    </label>
                    <input
                      required
                      type="text"
                      className="w-full mt-1 p-3 rounded-xl bg-white/5 border focus:outline-none focus:border-current transition-colors"
                      style={{ borderColor: theme.navbar.border }}
                      value={formData.state}
                      onChange={(e) =>
                        setFormData({ ...formData, state: e.target.value })
                      }
                    />
                  </div>

                  {/* Country */}
                  <div className="col-span-1">
                    <label className="text-xs font-bold uppercase opacity-50 ml-1">
                      Country
                    </label>
                    <input
                      readOnly
                      type="text"
                      className="w-full mt-1 p-3 rounded-xl bg-white/5 border opacity-50 cursor-not-allowed"
                      style={{ borderColor: theme.navbar.border }}
                      value="India"
                    />
                  </div>
                </form>
              </div>

              {/* Modal Footer */}
              <div
                className="p-6 border-t bg-inherit z-10"
                style={{ borderColor: theme.navbar.border }}
              >
                <button
                  type="submit"
                  form="addressForm"
                  // DISABLED LOGIC: If submitting OR (in edit mode AND nothing changed)
                  disabled={isSubmitting || (editingId && !isFormChanged)}
                  className="w-full py-4 rounded-xl font-bold uppercase tracking-wider bg-current text-white dark:text-black hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ backgroundColor: theme.text, color: theme.bg }}
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin" />
                  ) : editingId ? (
                    "Update Address"
                  ) : (
                    "Save Address"
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
