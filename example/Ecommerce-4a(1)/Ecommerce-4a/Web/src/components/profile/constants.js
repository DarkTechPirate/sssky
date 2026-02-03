// src/components/profile/constants.js
import {
  User,
  Package,
  MapPin,
  GalleryHorizontal,
  User2,
  BoxesIcon,
  Image,
} from "lucide-react";
import { FiBox } from "react-icons/fi";

// --- TAB CONFIGURATION ---
export const PROFILE_TABS = [
  {
    id: "personal",
    label: "Personal Info",
    icon: User,
    showForUser: true,
    showForAdmin: true,
    showForStaff: true, // ✅ Staff needs their own profile info
  },
  {
    id: "orders",
    label: "My Orders",
    icon: Package,
    showForUser: true,
    showForAdmin: false,
    showForStaff: false, // ❌ Staff dashboard usually separates personal shopping
  },
  {
    id: "addresses",
    label: "Addresses",
    icon: MapPin,
    showForUser: true,
    showForAdmin: false,
    showForStaff: false,
  },
  {
    id: "gallery",
    label: "Gallery",
    icon: GalleryHorizontal,
    showForUser: false,
    showForAdmin: true,
    showForStaff: false, // ✅ Staff often manage content/images
  },
  {
    id: "products",
    label: "Products",
    icon: FiBox,
    showForUser: false,
    showForAdmin: true,
    showForStaff: true, // ✅ Staff manages inventory
  },
  {
    id: "users",
    label: "Users",
    icon: User2,
    showForUser: false,
    showForAdmin: true,
    showForStaff: false, // ❌ Usually only Admins manage other accounts
  },
  {
    id: "processing",
    label: "Orders Processing",
    icon: BoxesIcon,
    showForUser: false,
    showForAdmin: true,
    showForStaff: true, // ✅ Staff handles fulfillment
  },
  {
    id: "banner",
    label: "Banner Images",
    icon: Image,
    showForUser: false,
    showForAdmin: true,
    showForStaff: true, // ✅ Staff handles fulfillment
  },
];
