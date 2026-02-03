import React, { useState, useEffect, useContext, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Truck,
  Package,
  ChevronRight,
  MapPin,
  Calendar,
  DollarSign,
  Save,
  Loader2,
  Clock,
  User,
} from "lucide-react";
import { ThemeContext } from "@/context/ThemeContext";
import { getAllOrdersAdmin, updateOrderStatus } from "@/services/api";
import Modal from "../../layout/Modal"; // Importing your specific Modal
import toast from "react-hot-toast";

// --- IMAGE HELPER ---
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const getImageUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("blob:")) return path;
  return `${API_BASE_URL}${path}`;
};

// --- HELPERS ---
const formatDate = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const STATUS_TABS = [
  { id: "All", label: "All Orders" },
  {
    id: "Pending",
    label: "Pending",
    color: "text-yellow-600 bg-yellow-500/10",
  },
  {
    id: "Processing",
    label: "Processing",
    color: "text-blue-600 bg-blue-500/10",
  },
  {
    id: "Shipped",
    label: "Shipped",
    color: "text-purple-600 bg-purple-500/10",
  },
  {
    id: "Delivered",
    label: "Delivered",
    color: "text-green-600 bg-green-500/10",
  },
  { id: "Cancelled", label: "Cancelled", color: "text-red-600 bg-red-500/10" },
];

export default function ProcessingTab() {
  const { theme } = useContext(ThemeContext);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);

  // --- FETCH ORDERS ---
  const fetchOrders = async () => {
    setLoading(true);
    const res = await getAllOrdersAdmin();
    if (res.success) {
      setOrders(res.orders || []);
    } else {
      toast.error(res.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // --- FILTER LOGIC ---
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (activeStatus !== "All" && order.status !== activeStatus) return false;
      const query = searchQuery.toLowerCase();
      const matchesId = order.orderId?.toLowerCase().includes(query);
      const matchesName = order.shippingAddress?.name
        ?.toLowerCase()
        .includes(query);
      return matchesId || matchesName;
    });
  }, [orders, activeStatus, searchQuery]);

  // --- HANDLER: Update State locally after API success ---
  const handleUpdateSuccess = (updatedOrder) => {
    setOrders((prev) =>
      prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o))
    );
    setSelectedOrder(null);
    toast.success(`Order updated to ${updatedOrder.status}`);
  };

  return (
    <div className="w-full min-h-screen pb-32" style={{ color: theme.text }}>
      <header className="mb-8 px-2">
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight">
          Order Processing
        </h1>
        <p className="opacity-60 text-sm mt-1">
          Manage fulfillment, track shipments, and update statuses.
        </p>
      </header>

      {/* --- CONTROLS --- */}
      <div className="sticky top-4 z-20 space-y-4 mb-8">
        <div
          className="p-3 md:p-4 rounded-[2rem] border backdrop-blur-xl bg-opacity-90 shadow-sm flex items-center"
          style={{
            backgroundColor: theme.navbar.bg,
            borderColor: theme.navbar.border,
          }}
        >
          <div className="relative w-full">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40"
            />
            <input
              type="text"
              placeholder="Search by Order ID or Customer Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-transparent border outline-none focus:ring-2 focus:ring-current transition-all"
              style={{
                borderColor: theme.navbar.border,
                backgroundColor: theme.navbar.searchBg,
              }}
            />
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveStatus(tab.id)}
              className={`
                px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap border transition-all
                ${
                  activeStatus === tab.id
                    ? "bg-black/5 dark:bg-white/10 border-current"
                    : "border-transparent opacity-60 hover:opacity-100"
                }
              `}
              style={{
                borderColor:
                  activeStatus === tab.id ? theme.navbar.border : "transparent",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* --- ORDERS LIST --- */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin opacity-50" size={48} />
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {filteredOrders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 opacity-40 flex flex-col items-center gap-4"
            >
              <Package size={48} strokeWidth={1} />
              <p>No orders found matching your criteria.</p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <OrderCard
                  key={order._id}
                  order={order}
                  theme={theme}
                  onClick={() => setSelectedOrder(order)}
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      )}

      {/* --- MODAL --- */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title="Manage Order"
        description={`ID: ${selectedOrder?.orderId}`}
        theme={theme}
      >
        {selectedOrder && (
          <EditOrderContent
            order={selectedOrder}
            theme={theme}
            onUpdate={handleUpdateSuccess}
          />
        )}
      </Modal>
    </div>
  );
}

// --- SUB-COMPONENTS ---

const OrderCard = ({ order, theme, onClick }) => {
  const statusConfig = STATUS_TABS.find((s) => s.id === order.status) || {};
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="group relative p-6 rounded-[2rem] border bg-opacity-40 hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer flex flex-col md:flex-row gap-6 items-start md:items-center justify-between"
      style={{
        borderColor: theme.navbar.border,
        backgroundColor: theme.card.bg,
      }}
    >
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <span className="font-mono text-xs opacity-50">
            #{order.orderId.slice(-6)}
          </span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${statusConfig.color}`}
          >
            {order.status}
          </span>
        </div>
        <h3 className="font-bold text-lg mb-1">
          {order.shippingAddress?.name}
        </h3>
        <div className="flex items-center gap-4 opacity-60 text-xs font-medium">
          <span className="flex items-center gap-1">
            <Package size={12} /> {order.items?.length} items
          </span>
          <span className="flex items-center gap-1">
            <DollarSign size={12} /> ₹{order.totalAmount}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex -space-x-3 overflow-hidden">
          {order.items.slice(0, 3).map((item, i) => (
            <div
              key={i}
              className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-900 overflow-hidden bg-gray-200"
            >
              <img
                src={getImageUrl(item.image)}
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => (e.target.style.display = "none")}
              />
            </div>
          ))}
        </div>
        <ChevronRight
          size={20}
          className="opacity-50 group-hover:opacity-100"
        />
      </div>
    </motion.div>
  );
};

// --- MODAL CONTENT ---
const EditOrderContent = ({ order, theme, onUpdate }) => {
  const [status, setStatus] = useState(order.status);
  const [trackingNumber, setTrackingNumber] = useState(
    order.trackingNumber || ""
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    const res = await updateOrderStatus(order._id, { status, trackingNumber });
    setIsSaving(false);
    if (res.success) {
      onUpdate(res.order);
    } else {
      toast.error(res.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Status Controls */}
      <div className="space-y-4 p-4 rounded-2xl bg-black/5 dark:bg-white/5">
        <div>
          <label className="text-xs font-bold uppercase opacity-50 mb-1 block">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full p-3 rounded-xl border bg-transparent font-bold outline-none cursor-pointer"
            style={{ borderColor: theme.navbar.border, color: theme.text }}
          >
            {STATUS_TABS.filter((t) => t.id !== "All").map((t) => (
              <option key={t.id} value={t.id} className="text-black">
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {(status === "Shipped" || status === "Delivered") && (
          <div>
            <label className="text-xs font-bold uppercase opacity-50 mb-1 block">
              Tracking #
            </label>
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Carrier Tracking ID"
              className="w-full p-3 rounded-xl border bg-transparent outline-none"
              style={{ borderColor: theme.navbar.border, color: theme.text }}
            />
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={
            isSaving ||
            (status === order.status &&
              trackingNumber === (order.trackingNumber || ""))
          }
          className="w-full py-3 rounded-xl font-bold uppercase text-xs tracking-widest bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <Save size={16} />
          )}
          Update Order
        </button>
      </div>

      {/* 2. Timeline Visualization */}
      <div>
        <h3 className="text-xs font-bold uppercase opacity-50 mb-4 tracking-widest flex items-center gap-2">
          <Clock size={14} /> Timeline
        </h3>
        <div
          className="pl-2 space-y-6 relative border-l-2 border-dashed ml-2"
          style={{ borderColor: theme.navbar.border }}
        >
          {order.steps?.map((step, index) => {
            const isLast = index === order.steps.length - 1;
            return (
              <div key={index} className="relative pl-6">
                <div
                  className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white dark:border-gray-900 ${
                    isLast ? "bg-blue-500" : "bg-green-500"
                  }`}
                />
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-sm">{step.status}</span>
                  <span className="text-xs opacity-70 leading-tight">
                    {step.description}
                  </span>
                  <div className="flex items-center gap-2 mt-1 text-[9px] font-mono opacity-50 uppercase">
                    <span>{formatDate(step.date)}</span>
                    {step.processedBy && (
                      <span className="flex items-center gap-1 bg-gray-500/10 px-1 rounded">
                        <User size={8} /> {step.processedBy}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Address Snippet */}
      <div
        className="p-4 rounded-2xl border"
        style={{ borderColor: theme.navbar.border }}
      >
        <div className="flex items-center gap-2 mb-2 opacity-50">
          <MapPin size={14} />
          <span className="text-xs font-bold uppercase">Shipping To</span>
        </div>
        <p className="font-bold text-sm">{order.shippingAddress?.name}</p>
        <p className="text-xs opacity-70">
          {order.shippingAddress?.door}, {order.shippingAddress?.street},{" "}
          {order.shippingAddress?.city}
        </p>
      </div>
    </div>
  );
};
