import React, { useState, useEffect, useContext } from "react";
import { replace, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Phone,
  CreditCard,
  CheckCircle2,
  Plus,
  Truck,
  ShieldCheck,
  Loader2,
  ChevronRight,
  ShoppingBag,
  ArrowLeft,
  X,
} from "lucide-react";
import { ThemeContext } from "@/context/ThemeContext";
import { useApp } from "@/context/Appcontext";
import { createOrder, addAddress } from "@/services/api";
import toast from "react-hot-toast";

// Helper for currency formatting
const formatINR = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

const Checkout = () => {
  const { theme } = useContext(ThemeContext);
  const { user, setUser, cart, refreshCart, refreshOrders } = useApp();
  const navigate = useNavigate();

  // Redirect if cart is empty
  useEffect(() => {
    if (!cart || !cart.items || cart.items.length === 0) {
      navigate("/shop", { replace: true });
    }
  }, [cart, navigate]);

  // --- STATE ---
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  // Initialize Address from Context
  useEffect(() => {
    if (user?.addresses?.length > 0) {
      const primary = user.addresses.find((a) => a.primary);
      setSelectedAddressId(
        (prev) => prev || (primary ? primary._id : user.addresses[0]._id)
      );
    }
  }, [user]);

  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Initialize Phone from Global Context
  // This serves as the "Saved Number" if it exists.
  const [phone, setPhone] = useState(user?.phone || user?.mobile || "");

  // Address Modal State
  const [isAddrModalOpen, setIsAddrModalOpen] = useState(false);
  const [isAddingAddr, setIsAddingAddr] = useState(false);
  const [newAddrData, setNewAddrData] = useState({
    door: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    country: "India",
  });

  // --- CALCULATIONS ---
  const subtotal = cart?.totalPrice || 0;
  const shipping = subtotal > 200 || subtotal === 0 ? 0 : 15;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  // --- HANDLERS ---

  // 1. Add New Address
  const handleAddAddress = async (e) => {
    e.preventDefault();
    setIsAddingAddr(true);
    try {
      const res = await addAddress(newAddrData);
      if (res.success && res.addresses) {
        setUser((prev) => ({ ...prev, addresses: res.addresses }));

        // Auto-select the new address
        const newAddr = res.addresses[res.addresses.length - 1];
        if (newAddr) setSelectedAddressId(newAddr._id);

        setIsAddrModalOpen(false);
        setNewAddrData({
          door: "",
          street: "",
          city: "",
          state: "",
          zip: "",
          country: "India",
        });
        toast.success("Address added");
      }
    } catch (error) {
      console.error("Add address failed", error);
      toast.error("Failed to add address");
    } finally {
      setIsAddingAddr(false);
    }
  };

  // 2. Place Order
  const handlePlaceOrder = async () => {
    if (!selectedAddressId) return toast.error("Please select an address");

    // Basic validation for the input field
    if (!phone || phone.length < 10)
      return toast.error("Enter valid phone number");

    setIsPlacingOrder(true);
    try {
      const orderPayload = {
        items: cart.items.map((item) => ({
          product:
            typeof item.product === "object" ? item.product._id : item.product,
          quantity: item.quantity,
          color: item.color,
          size: item.size,
          price: item.price,
        })),
        addressId: selectedAddressId,
        paymentMethod,
        totalAmount: total,
        phone: phone, // Pass whatever is in the input box
      };

      const res = await createOrder(orderPayload);

      if (res.success) {
        // If the user didn't have a phone saved in context previously,
        // update the local context now so the app knows they have a number
        // (The backend has already saved it to the DB)
        if (!user.phone && !user.mobile) {
          setUser((prev) => ({ ...prev, phone: phone }));
        }

        await refreshCart();
        await refreshOrders();
        navigate("/shop", { replace: true });
        // toast.success("Order placed successfully!");
      } else {
        toast.error(res.message || "Failed to place order");
      }
    } catch (error) {
      console.error("Order placement failed", error);
      // toast.error(error.message || "Something went wrong");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (!cart)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );

  return (
    <div
      className="min-h-screen w-full pt-28 pb-24 px-6 transition-colors duration-500"
      style={{ backgroundColor: theme.bg, color: theme.text }}
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* LEFT: FORM */}
        <div className="lg:col-span-8 space-y-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="hover:opacity-60 transition-opacity"
            >
              <ArrowLeft />
            </button>
            <h1 className="text-3xl font-black uppercase tracking-tight">
              Checkout
            </h1>
          </div>

          {/* CONTACT */}
          <div
            className="p-6 md:p-8 rounded-3xl border"
            style={{ borderColor: theme.navbar.border }}
          >
            <h3 className="text-sm font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
              <Phone size={18} /> Contact Information
            </h3>
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <label className="text-xs font-bold opacity-50 block mb-2 ml-1">
                  Phone Number
                </label>
                <input
                  type="number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter 10-digit number"
                  className="w-full p-4 rounded-xl bg-white/5 border focus:outline-none focus:border-current transition-colors"
                  style={{ borderColor: theme.navbar.border }}
                />
              </div>
            </div>
          </div>

          {/* ADDRESS */}
          <div
            className="p-6 md:p-8 rounded-3xl border"
            style={{ borderColor: theme.navbar.border }}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <MapPin size={18} /> Delivery Address
              </h3>
              <button
                onClick={() => setIsAddrModalOpen(true)}
                className="flex items-center gap-1 text-xs font-bold uppercase hover:opacity-60 transition-opacity"
              >
                <Plus size={14} /> Add New
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {user?.addresses?.map((addr) => (
                <div
                  key={addr._id}
                  onClick={() => setSelectedAddressId(addr._id)}
                  className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                    selectedAddressId === addr._id
                      ? "border-green-500 bg-green-500/5 shadow-inner"
                      : "border-transparent bg-white/5 hover:bg-white/10"
                  }`}
                >
                  {selectedAddressId === addr._id && (
                    <div className="absolute top-4 right-4 text-green-500">
                      <CheckCircle2
                        size={20}
                        fill="currentColor"
                        className="text-white dark:text-black"
                      />
                    </div>
                  )}
                  <p className="font-bold text-sm mb-1 pr-8">
                    {addr.door}, {addr.street}
                  </p>
                  <p className="text-xs opacity-60 leading-relaxed">
                    {addr.city}, {addr.state} - {addr.zip}
                  </p>
                  {addr.primary && (
                    <span
                      className="inline-block mt-3 text-[10px] font-bold uppercase tracking-wide opacity-40 border px-2 py-0.5 rounded"
                      style={{ borderColor: "currentColor" }}
                    >
                      Primary
                    </span>
                  )}
                </div>
              ))}
              {(!user?.addresses || user.addresses.length === 0) && (
                <div
                  className="col-span-full py-12 text-center opacity-40 text-sm border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2"
                  style={{ borderColor: theme.navbar.border }}
                >
                  <MapPin size={32} />
                  <span>No addresses saved. Add one.</span>
                </div>
              )}
            </div>
          </div>

          {/* PAYMENT */}
          <div
            className="p-6 md:p-8 rounded-3xl border"
            style={{ borderColor: theme.navbar.border }}
          >
            <h3 className="text-sm font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
              <CreditCard size={18} /> Payment Method
            </h3>
            <div className="space-y-4">
              {["COD"].map((method) => (
                <div
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                    paymentMethod === method
                      ? "border-current bg-white/5"
                      : "border-transparent bg-white/5 opacity-60 hover:opacity-100"
                  }`}
                  style={
                    paymentMethod === method ? { borderColor: theme.text } : {}
                  }
                >
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === method
                        ? "border-current"
                        : "border-gray-500"
                    }`}
                  >
                    {paymentMethod === method && (
                      <div className="w-2.5 h-2.5 rounded-full bg-current" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-sm">
                      {method === "COD"
                        ? "Cash on Delivery"
                        : "Online Payment (UPI/Card)"}
                    </p>
                    <p className="text-xs opacity-50 mt-0.5">
                      {method === "COD"
                        ? "Pay when you receive the order"
                        : "Secure payment via Gateway"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: SUMMARY */}
        <div className="lg:col-span-4">
          <div className="sticky top-32 space-y-6">
            <div
              className="p-6 md:p-8 rounded-3xl border bg-opacity-50 backdrop-blur-md"
              style={{
                backgroundColor: theme.card?.bg || "rgba(255,255,255,0.03)",
                borderColor: theme.navbar?.border,
              }}
            >
              <h3 className="text-lg font-black uppercase mb-6 flex items-center gap-2">
                <ShoppingBag size={20} /> Order Summary
              </h3>
              <div className="space-y-4 max-h-64 overflow-y-auto pr-2 mb-8 custom-scrollbar">
                {cart.items.map((item) => (
                  <div key={item._id} className="flex gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                      <img
                        src={`${import.meta.env.VITE_API_URL}${item.image}`}
                        className="w-full h-full object-cover"
                        alt="Product"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold uppercase truncate mb-1">
                        {item.title}
                      </p>
                      <p className="text-[10px] opacity-60">
                        Qty: {item.quantity} • {item.color}
                      </p>
                    </div>
                    <p className="text-sm font-bold">
                      {formatINR(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="h-px w-full bg-current opacity-10 mb-6" />
              <div className="space-y-3 text-sm font-medium opacity-80">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatINR(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? "Free" : formatINR(shipping)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (8%)</span>
                  <span>{formatINR(tax)}</span>
                </div>
              </div>
              <div className="h-px w-full bg-current opacity-10 my-6" />
              <div className="flex justify-between items-center text-2xl font-black mb-8">
                <span>Total</span>
                <span>{formatINR(total)}</span>
              </div>
              <button
                onClick={handlePlaceOrder}
                disabled={
                  isPlacingOrder || !selectedAddressId || phone.length < 10
                }
                className="w-full py-4 rounded-xl font-bold uppercase tracking-wider bg-current text-white dark:text-black flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: theme.text, color: theme.bg }}
              >
                {isPlacingOrder ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <>
                    Place Order <ChevronRight size={18} />
                  </>
                )}
              </button>
              <div className="mt-4 flex flex-col gap-1 items-center">
                {!selectedAddressId && (
                  <p className="text-[10px] text-red-500 font-medium opacity-80">
                    * Select address
                  </p>
                )}
                {phone.length < 10 && (
                  <p className="text-[10px] text-red-500 font-medium opacity-80">
                    * Enter valid phone
                  </p>
                )}
              </div>
            </div>
            <div className="flex justify-center gap-8 opacity-30 select-none">
              <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest">
                <ShieldCheck size={14} /> Secure Payment
              </div>
              <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest">
                <Truck size={14} /> Fast Delivery
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL */}
      <AnimatePresence>
        {isAddrModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl p-8 flex flex-col"
              style={{
                backgroundColor: theme.bg || "#111",
                border: `1px solid ${theme.navbar.border}`,
              }}
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-bold uppercase">New Address</h3>
                <button
                  onClick={() => setIsAddrModalOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleAddAddress} className="space-y-4">
                <input
                  required
                  placeholder="Door / Flat No"
                  value={newAddrData.door}
                  onChange={(e) =>
                    setNewAddrData({ ...newAddrData, door: e.target.value })
                  }
                  className="w-full p-4 rounded-xl bg-white/5 border focus:outline-none transition-colors"
                  style={{ borderColor: theme.navbar.border }}
                />
                <input
                  required
                  placeholder="Street / Area"
                  value={newAddrData.street}
                  onChange={(e) =>
                    setNewAddrData({ ...newAddrData, street: e.target.value })
                  }
                  className="w-full p-4 rounded-xl bg-white/5 border focus:outline-none transition-colors"
                  style={{ borderColor: theme.navbar.border }}
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    required
                    placeholder="City"
                    value={newAddrData.city}
                    onChange={(e) =>
                      setNewAddrData({ ...newAddrData, city: e.target.value })
                    }
                    className="w-full p-4 rounded-xl bg-white/5 border focus:outline-none transition-colors"
                    style={{ borderColor: theme.navbar.border }}
                  />
                  <input
                    required
                    placeholder="ZIP Code"
                    value={newAddrData.zip}
                    onChange={(e) =>
                      setNewAddrData({ ...newAddrData, zip: e.target.value })
                    }
                    className="w-full p-4 rounded-xl bg-white/5 border focus:outline-none transition-colors"
                    style={{ borderColor: theme.navbar.border }}
                  />
                </div>
                <input
                  required
                  placeholder="State"
                  value={newAddrData.state}
                  onChange={(e) =>
                    setNewAddrData({ ...newAddrData, state: e.target.value })
                  }
                  className="w-full p-4 rounded-xl bg-white/5 border focus:outline-none transition-colors"
                  style={{ borderColor: theme.navbar.border }}
                />
                <button
                  type="submit"
                  disabled={isAddingAddr}
                  className="w-full py-4 rounded-xl font-bold uppercase tracking-wider bg-current text-white dark:text-black mt-6 flex justify-center hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: theme.text, color: theme.bg }}
                >
                  {isAddingAddr ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    "Save & Select"
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Checkout;
