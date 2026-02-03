// src/pages/Profile.jsx
import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ThemeContext } from "@/context/ThemeContext";
import { useApp } from "../context/Appcontext";
import { logout, uploadProfileImage, checkAuth } from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import Modal from "../components/layout/Modal";
import toast from "react-hot-toast";

// Import Components
import ProfileHeader from "../components/profile/ProfileHeader";
import ProfileSidebar from "../components/profile/ProfileSidebar";

// Import Tabs (Your specific tabs)
import PersonalInfoTab from "../components/profile/tabs/PersonalInfoTab";
import OrdersTab from "../components/profile/tabs/OrdersTab";
import AddressesTab from "../components/profile/tabs/AddressesTab";
import GalleryTab from "../components/profile/tabs/GalleryTab";
import ProductsTab from "../components/profile/tabs/ProductsTab";

import { PROFILE_TABS } from "../components/profile/constants";
import UsersTab from "../components/profile/tabs/UsersTab";
import ProcessingTab from "../components/profile/tabs/ProcessingTab";
import BannerTab from "../components/profile/tabs/BannerTab";

// Map IDs to Component Objects
const TAB_COMPONENTS = {
  personal: PersonalInfoTab,
  orders: OrdersTab,
  addresses: AddressesTab,
  gallery: GalleryTab,
  products: ProductsTab,
  users: UsersTab,
  processing: ProcessingTab,
  banner: BannerTab,
};

export default function Profile() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useContext(ThemeContext);

  // get setters from App context
  const { setUser, user } = useApp();

  const [activeTabId, setActiveTabId] = useState("personal");
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // local syncing state for the Profile page's initial validation
  const [isSyncingAuth, setIsSyncingAuth] = useState(false);

  const isStrictProfilePage =
    location.pathname === "/profile" || location.pathname === "/profile/";

  // --- INITIAL MOUNT: call checkAuth and update all states ---
  useEffect(() => {
    let mounted = true;
    const verifyAndSync = async () => {
      try {
        setIsSyncingAuth(true);
        const res = await checkAuth();
        if (!mounted) return;

        if (res?.isAuthenticated) {
          if (res.user) setUser(res.user);
        } else {
          // Not authenticated -> clear state and redirect to login
          setUser(null);
          navigate("/login", { replace: true });
        }
      } catch (err) {
        console.error("Profile initial auth check failed:", err);
        toast.error("Failed to sync profile. Try refreshing.");
      } finally {
        if (mounted) setIsSyncingAuth(false);
      }
    };

    verifyAndSync();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- profile image update handler ---
  const handleProfileImageUpdate = async (file) => {
    if (!file) return;
    const localImageUrl = URL.createObjectURL(file);

    // Optimistic update
    setUser((prev) =>
      prev ? { ...prev, profilePicture: localImageUrl } : prev
    );

    try {
      setIsUploading(true);
      const res = await uploadProfileImage(file);
      if (res.success) {
        // Wait briefly then sync to get the processed URL from server
        setTimeout(async () => {
          try {
            const authRes = await checkAuth();
            if (authRes?.isAuthenticated) {
              setUser(authRes.user);
            }
          } catch (err) {
            console.error("Failed to sync after upload", err);
          } finally {
            setIsUploading(false);
          }
        }, 2000);
      } else {
        setIsUploading(false);
        toast.error("Failed to upload profile image");
      }
    } catch (error) {
      console.error("Upload failed", error);
      toast.error("Failed to upload image");
      setIsUploading(false);
    }
  };

  // --- logout confirm ---
  const handleLogoutConfirm = async () => {
    const res = await logout();
    if (res.success) {
      setIsLogoutModalOpen(false);
      setUser(null);
      navigate("/login", { replace: true });
    } else {
      toast.error("Failed to sign out");
    }
  };

  // --- handler passed to ProfileHeader so manual refresh updates central state ---
  const handleHeaderRefresh = (data) => {
    if (data?.isAuthenticated) {
      if (data.user) setUser(data.user);
    } else {
      setUser(null);
      navigate("/login", { replace: true });
    }
  };

  const ActiveComponent = TAB_COMPONENTS[activeTabId];

  // Loading Skeleton (shown while syncing auth on mount)
  if (!user && isSyncingAuth) {
    return (
      <div
        className="w-full h-screen flex items-center justify-center p-6"
        style={{ backgroundColor: theme.bg, color: theme.text }}
      >
        <div className="space-y-3 w-full max-w-lg">
          <div className="h-8 w-2/3 rounded-md animate-pulse bg-gray-300/30" />
          <div className="h-64 rounded-md animate-pulse bg-gray-300/30" />
          <div className="h-10 w-1/2 rounded-md animate-pulse bg-gray-300/30" />
        </div>
      </div>
    );
  }

  // If no user after sync, redirect
  if (!user && !isSyncingAuth) {
    navigate("/login", { replace: true });
    return null;
  }

  // Dynamic Padding based on route (from Example)
  const outerPadding = isStrictProfilePage ? "px-6 md:px-10 lg:px-16" : "px-0";
  const mainPadding = isStrictProfilePage ? "p-6 md:p-12" : "p-4 md:p-10";

  return (
    <div
      className={`w-full flex flex-col overflow-auto md:overflow-hidden transition-colors duration-500 ${outerPadding} ${"h-full"}`}
      style={{ backgroundColor: theme.bg, color: theme.text }}
    >
      <ProfileHeader
        user={user}
        theme={theme}
        onLogoutClick={() => setIsLogoutModalOpen(true)}
        onUpdateProfileImage={handleProfileImageUpdate}
        onRefresh={handleHeaderRefresh}
        isLoading={isUploading}
      />

      <div className="flex flex-col lg:flex-row flex-1 overflow-visible md:overflow-hidden w-full mx-auto max-w-[1600px]">
        {/* Sidebar */}
        <ProfileSidebar
          tabs={PROFILE_TABS}
          activeTabId={activeTabId}
          onTabChange={setActiveTabId}
          theme={theme}
          isAdmin={user?.role === "admin"}
          isStaff={user?.role === "staff"}
        />

        {/* Main Content Area */}
        <main className={`flex-1 overflow-y-auto ${mainPadding} scroll-smooth`}>
          <AnimatePresence mode="wait">
            {ActiveComponent && (
              <motion.div
                key={activeTabId}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.3 }}
              >
                <ActiveComponent theme={theme} user={user} setUser={setUser} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      <Modal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        theme={theme}
        title="Sign Out"
        description="Are you sure you want to sign out?"
      >
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <button
            onClick={handleLogoutConfirm}
            className="flex-1 py-3 px-6 rounded-xl font-bold text-sm uppercase tracking-wider bg-red-600 text-white hover:bg-red-700 transition-colors"
          >
            Yes, Sign Out
          </button>
          <button
            onClick={() => setIsLogoutModalOpen(false)}
            className="flex-1 py-3 px-6 rounded-xl font-bold text-sm uppercase tracking-wider border hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            style={{
              borderColor: theme.navbar?.border,
              color: theme.navbar?.textIdle || theme.text,
            }}
          >
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  );
}
