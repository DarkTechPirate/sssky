import React, { useState, useEffect } from "react";
import {
  ShoppingBag,
  User,
  Bell,
  AlertTriangle,
  CheckCircle2,
  Clock,
  BellRing,
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useApp } from "../../context/Appcontext";
import toast from "react-hot-toast";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    type: "order",
    title: "New Order #ORD-992",
    message: "New COD order received from Vetrivel S.",
    time: "2 min ago",
    read: false,
  },
  {
    id: 2,
    type: "alert",
    title: "Low Stock Alert",
    message: "Product 'Urban Street T-Shirt' is below 5 units.",
    time: "1 hour ago",
    read: false,
  },
  {
    id: 3,
    type: "success",
    title: "System Update",
    message: "Maintenance completed successfully.",
    time: "1 day ago",
    read: true,
  },
];

const UserHeader = ({ theme }) => {
  const { user, cart, openModal } = useApp();

  const isStaffOrAdmin = ["admin", "staff"].includes(user?.role);
  const cartCount =
    cart?.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;

  // Logic: Unread Count
  const unreadCount = MOCK_NOTIFICATIONS.filter((n) => !n.read).length;

  // Logic: Profile Image State
  const [imgError, setImgError] = useState(false);
  const [blobLoaded, setBlobLoaded] = useState(false);

  // Logic: Notification Permission State
  const [permissionStatus, setPermissionStatus] = useState(
    "Notification" in window ? Notification.permission : "denied"
  );

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http") || path.startsWith("blob:")) return path;
    return `${API_BASE_URL}${path}`;
  };

  const profileSrc = getImageUrl(user?.profilePicture);
  const isDirectUrl = profileSrc?.startsWith("http");

  useEffect(() => {
    setImgError(false);
    if (!isDirectUrl) setBlobLoaded(false);
  }, [profileSrc, isDirectUrl]);

  // --- HANDLER: Request Browser Permission ---
  const handleRequestPermission = async () => {
    if (!("Notification" in window)) {
      toast.error("This browser does not support notifications");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);

      if (permission === "granted") {
        toast.success("Notifications enabled! You will now receive updates.");

        // TODO: In a real app, verify the service worker is ready and
        // send the subscription object to your backend here.
        // navigator.serviceWorker.ready.then((registration) => { ... });
      } else {
        toast("Notifications blocked. Check browser settings.");
      }
    } catch (error) {
      console.error("Error requesting permission", error);
    }
  };

  // --- TRIGGER HANDLER: Open Modal ---
  const handleShowNotifications = () => {
    if (!openModal) return;

    openModal({
      title: "Notifications",
      description: `You have ${unreadCount} unread messages.`,
      children: (
        <div className="flex flex-col gap-3">
          {/* 1. PERMISSION BANNER (Only if not granted yet) */}
          {permissionStatus === "default" && (
            <div className="p-4 rounded-2xl mb-2 flex items-center justify-between gap-4 border border-blue-500/30 bg-blue-500/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-full text-white">
                  <BellRing size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold">
                    Enable Push Notifications
                  </h4>
                  <p className="text-xs opacity-70">
                    Get real-time updates for orders.
                  </p>
                </div>
              </div>
              <button
                onClick={handleRequestPermission}
                className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors"
              >
                Allow
              </button>
            </div>
          )}

          {/* 2. NOTIFICATION LIST */}
          {MOCK_NOTIFICATIONS.length === 0 ? (
            <div className="text-center py-12 opacity-50 flex flex-col items-center">
              <Bell size={32} className="mb-2 opacity-30" />
              <p className="text-sm">No new notifications</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {MOCK_NOTIFICATIONS.map((note) => {
                // Determine Styles based on Type
                let icon = <ShoppingBag size={18} />;
                let colors = "bg-blue-500/10 text-blue-500 border-blue-500/10"; // Default (Order)

                if (note.type === "alert") {
                  icon = <AlertTriangle size={18} />;
                  colors = "bg-red-500/10 text-red-500 border-red-500/10";
                } else if (note.type === "success") {
                  icon = <CheckCircle2 size={18} />;
                  colors = "bg-green-500/10 text-green-500 border-green-500/10";
                }

                return (
                  <div
                    key={note.id}
                    className={`group p-4 rounded-2xl border transition-all flex gap-4 ${
                      !note.read
                        ? "bg-white/5 border-white/10" // Unread highlight
                        : "bg-transparent border-transparent opacity-60 hover:opacity-100"
                    }`}
                    style={{
                      borderColor: !note.read
                        ? theme.navbar.border
                        : "transparent",
                    }}
                  >
                    {/* Icon Container */}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${colors}`}
                    >
                      {icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-sm truncate pr-2">
                          {note.title}
                        </h4>
                        {!note.read && (
                          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5 shadow-sm shadow-blue-500/50" />
                        )}
                      </div>
                      <p className="text-xs opacity-70 leading-relaxed line-clamp-2">
                        {note.message}
                      </p>
                      <p className="text-[10px] font-mono opacity-40 mt-2 flex items-center gap-1">
                        <Clock size={10} /> {note.time}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 3. FOOTER ACTION */}
          {MOCK_NOTIFICATIONS.length > 0 && (
            <button className="mt-2 w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-black/5 dark:hover:bg-white/5 transition-colors opacity-50 hover:opacity-100">
              Mark all as read
            </button>
          )}
        </div>
      ),
    });
  };

  return (
    <div className="flex items-center gap-2 mr-2">
      {/* 1. BUTTONS (Cart / Notification) */}
      {/* {!isStaffOrAdmin ? (
        // --- ADMIN/STAFF: NOTIFICATION BELL ---
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleShowNotifications}
          style={{
            backgroundColor: theme.navbar.searchBg,
            color: theme.navbar.iconColor,
          }}
          className="relative w-10 h-10 flex items-center justify-center rounded-full transition-colors hover:opacity-80"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-black">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </motion.button>
      ) : ( */}
      {!isStaffOrAdmin && (
        <Link to="/cart">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              backgroundColor: theme.navbar.searchBg,
              color: theme.navbar.iconColor,
            }}
            className="relative w-10 h-10 flex items-center justify-center rounded-full transition-colors hover:opacity-80"
          >
            <ShoppingBag size={20} />
            {cartCount > 0 && (
              <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-black">
                {cartCount > 99 ? "9+" : cartCount}
              </span>
            )}
          </motion.button>
        </Link>
      )}
      {/* 2. PROFILE BUTTON (Common for all) */}
      <Link to={user ? "/profile" : "/login"}>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative w-10 h-10 flex items-center justify-center rounded-full overflow-hidden border transition-colors group"
          style={{
            backgroundColor: theme.navbar.searchBg,
            borderColor: theme.navbar.border,
            color: theme.navbar.iconColor,
          }}
        >
          {!isDirectUrl && !blobLoaded && !imgError && profileSrc && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-gray-200/20 dark:bg-white/10 backdrop-blur-md animate-pulse" />
          )}

          {profileSrc && !imgError ? (
            <img
              key={profileSrc}
              src={profileSrc}
              alt="Profile"
              referrerPolicy="no-referrer"
              className={`w-full h-full object-cover absolute inset-0 z-10 transition-opacity duration-300 ${
                isDirectUrl || blobLoaded ? "opacity-100" : "opacity-0"
              }`}
              onLoad={() => setBlobLoaded(true)}
              onError={() => {
                setImgError(true);
                setBlobLoaded(true);
              }}
            />
          ) : (
            <User
              size={20}
              className={`z-0 ${user ? "opacity-100" : "opacity-80"}`}
            />
          )}
        </motion.button>
      </Link>
    </div>
  );
};

export default UserHeader;
