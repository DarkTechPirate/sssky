import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronRight,
  PackageX,
  Clock,
  CheckCircle2,
  MapPin,
  CreditCard,
  User,
} from "lucide-react";
import { useApp } from "@/context/Appcontext";
import { motion, AnimatePresence } from "framer-motion";
import Modal from "../../layout/Modal"; // Importing your specific Modal

// --- IMAGE HELPER ---
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const getImageUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("blob:")) return path;
  return `${API_BASE_URL}${path}`;
};

// --- FORMATTERS ---
const formatINR = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatTime = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function OrdersTab({ theme }) {
  const { orders } = useApp();
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Sort orders by date (newest first)
  const sortedOrders = [...(orders || [])].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  if (sortedOrders.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-3xl opacity-50"
        style={{ borderColor: theme.navbar?.border }}
      >
        <PackageX size={48} className="mb-4" />
        <h3 className="text-lg font-bold uppercase">No Orders Yet</h3>
        <p className="text-sm">Start shopping to see your history here.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <h2 className="text-2xl font-bold uppercase mb-6">Order History</h2>
        {sortedOrders.map((order) => (
          <div
            key={order._id}
            onClick={() => setSelectedOrder(order)}
            className="group flex flex-col md:flex-row items-start md:items-center justify-between p-6 rounded-3xl border transition-all hover:shadow-lg hover:border-current cursor-pointer"
            style={{
              backgroundColor: theme.card?.bg || "rgba(255,255,255,0.02)",
              borderColor: theme.navbar?.border,
            }}
          >
            <div className="flex gap-4">
              {/* Product Images (Limit to 3) */}
              <div className="flex -space-x-4">
                {order.items.slice(0, 3).map((item, idx) => (
                  <div
                    key={item._id || idx}
                    className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-white dark:border-black bg-gray-100"
                  >
                    <img
                      src={getImageUrl(item.image)}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
                {order.items.length > 3 && (
                  <div className="relative w-16 h-16 rounded-xl border-2 border-white dark:border-black flex items-center justify-center bg-gray-200 text-xs font-bold z-0">
                    +{order.items.length - 3}
                  </div>
                )}
              </div>

              {/* Order Info */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-lg font-mono">
                    #{order.orderId ? order.orderId.slice(-6) : "ID"}
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      order.status === "Delivered"
                        ? "bg-green-500/10 text-green-500"
                        : order.status === "Cancelled"
                        ? "bg-red-500/10 text-red-500"
                        : "bg-yellow-500/10 text-yellow-500"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
                <p className="text-sm opacity-60 max-w-[200px] md:max-w-md truncate">
                  {order.items.map((i) => i.title).join(", ")}
                </p>
                <p className="text-xs opacity-40 font-mono mt-1">
                  {formatDate(order.createdAt)}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between w-full md:w-auto mt-4 md:mt-0 gap-8">
              <div className="text-right">
                <p className="text-[10px] uppercase opacity-50">Total Amount</p>
                <p className="font-bold text-lg">
                  {formatINR(order.totalAmount)}
                </p>
              </div>
              <button
                className="p-2 rounded-full border hover:bg-current hover:text-white dark:hover:text-black transition-colors"
                style={{ borderColor: theme.text }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* --- ORDER TRACKING MODAL --- */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title="Tracking & Details"
        description={`ID: ${selectedOrder?.orderId}`}
        theme={theme}
      >
        {selectedOrder && <OrderContent order={selectedOrder} theme={theme} />}
      </Modal>
    </>
  );
}

// --- MODAL CONTENT COMPONENT ---
const OrderContent = ({ order, theme }) => {
  return (
    <div className="space-y-8">
      {/* 1. TIMELINE / STEPS */}
      <section>
        <h3 className="text-xs font-bold uppercase opacity-50 mb-4 tracking-widest flex items-center gap-2">
          <Clock size={14} /> Order Timeline
        </h3>
        <div
          className="pl-2 space-y-6 relative border-l-2 border-dashed ml-2"
          style={{ borderColor: theme.navbar?.border || "#333" }}
        >
          {order.steps?.map((step, index) => (
            <div key={index} className="relative pl-6">
              {/* Dot */}
              <div
                className="absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white dark:border-gray-900"
                style={{
                  backgroundColor:
                    index === order.steps.length - 1
                      ? "#3b82f6" // Active (Blue)
                      : "#10b981", // Completed (Green)
                }}
              />

              {/* Content */}
              <div className="flex flex-col gap-1">
                <span className="font-bold text-sm">{step.status}</span>
                <span className="text-xs opacity-70">{step.description}</span>

                <div className="flex items-center gap-3 mt-1 text-[10px] font-mono opacity-50 uppercase">
                  <span>
                    {formatDate(step.date)} • {formatTime(step.date)}
                  </span>
                  {step.processedBy && (
                    <span className="flex items-center gap-1 bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded">
                      <User size={8} /> {step.processedBy}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {(!order.steps || order.steps.length === 0) && (
            <p className="pl-6 text-sm opacity-50 italic">
              Processing order...
            </p>
          )}
        </div>
      </section>

      {/* 2. ITEMS LIST (WITH IMAGES) */}
      <section>
        <h3 className="text-xs font-bold uppercase opacity-50 mb-4 tracking-widest flex items-center gap-2">
          <CheckCircle2 size={14} /> Items
        </h3>
        <div className="space-y-3">
          {order.items.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-4 p-3 rounded-2xl border bg-black/5 dark:bg-white/5"
              style={{ borderColor: theme.navbar?.border }}
            >
              <div className="w-14 h-14 rounded-xl bg-white overflow-hidden shrink-0">
                <img
                  src={getImageUrl(item.image)}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm truncate">{item.title}</h4>
                <p className="text-[10px] opacity-60">
                  {item.color} / {item.size}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-sm">{formatINR(item.price)}</p>
                <p className="text-[10px] opacity-60">x{item.quantity}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. INFO GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          className="p-4 rounded-2xl border"
          style={{ borderColor: theme.navbar?.border }}
        >
          <h4 className="text-[10px] font-bold uppercase opacity-50 mb-2 flex items-center gap-1">
            <MapPin size={10} /> Shipping To
          </h4>
          <p className="text-sm font-bold">{order.shippingAddress?.name}</p>
          <p className="text-xs opacity-70 mt-1">
            {order.shippingAddress?.door}, {order.shippingAddress?.street}
            <br />
            {order.shippingAddress?.city} - {order.shippingAddress?.zip}
          </p>
        </div>

        <div
          className="p-4 rounded-2xl border"
          style={{ borderColor: theme.navbar?.border }}
        >
          <h4 className="text-[10px] font-bold uppercase opacity-50 mb-2 flex items-center gap-1">
            <CreditCard size={10} /> Payment
          </h4>
          <div className="flex justify-between text-xs mb-1">
            <span>Method</span>
            <span className="font-bold">{order.paymentMethod}</span>
          </div>
          <div className="flex justify-between text-xs mb-1">
            <span>Status</span>
            <span
              className={
                order.paymentStatus === "Paid"
                  ? "text-green-500 font-bold"
                  : "text-yellow-500 font-bold"
              }
            >
              {order.paymentStatus}
            </span>
          </div>
          <div className="mt-2 pt-2 border-t flex justify-between font-black text-sm">
            <span>TOTAL</span>
            <span>{formatINR(order.totalAmount)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
