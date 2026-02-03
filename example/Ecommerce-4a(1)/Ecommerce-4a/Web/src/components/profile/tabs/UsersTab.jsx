import React, { useState, useEffect, useContext, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  LayoutGrid,
  List as ListIcon,
  Trash2,
  X,
  Loader2,
  Mail,
  Phone,
  Eye,
  ChevronRight,
  Briefcase,
  User as UserIcon,
  ShieldAlert,
  MapPin,
} from "lucide-react";
import { ThemeContext } from "@/context/ThemeContext";
import { useApp } from "@/context/Appcontext";
import {
  getAllUsers,
  updateUserRole,
  deleteUser,
  getUserDetailsForAdmin,
} from "@/services/api";

const UsersTab = () => {
  const { theme } = useContext(ThemeContext);
  const { user: currentUser } = useApp();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [inspectUserId, setInspectUserId] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    const res = await getAllUsers();
    if (res.success) setUsers(res.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    const res = await updateUserRole(userId, { role: newRole });
    if (res.success) {
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
      );
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Permanently delete this user? This cannot be undone."))
      return;
    const res = await deleteUser(userId);
    if (res.success) {
      setUsers((prev) => prev.filter((u) => u._id !== userId));
    }
  };

  const filteredUsers = useMemo(() => {
    let result = users.filter(
      (u) =>
        u.fullname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.username?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (currentUser?._id) {
      result.sort((a, b) => {
        if (a._id === currentUser._id) return -1;
        if (b._id === currentUser._id) return 1;
        return 0;
      });
    }

    return result;
  }, [users, searchQuery, currentUser]);

  return (
    <div className="w-full min-h-screen pb-32" style={{ color: theme.text }}>
      <header className="mb-8 px-2">
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight">
          User Directory
        </h1>
        <p className="opacity-60 text-sm mt-1">
          Audit accounts and inspect activity.
        </p>
      </header>

      {/* STICKY SEARCH & CONTROLS */}
      <div
        className="sticky top-4 z-20 p-3 md:p-4 rounded-[2rem] border mb-8 flex flex-col md:flex-row gap-4 justify-between items-center backdrop-blur-xl bg-opacity-90 shadow-sm"
        style={{
          backgroundColor: theme.navbar.bg,
          borderColor: theme.navbar.border,
        }}
      >
        <div className="relative w-full md:w-96">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40"
          />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-transparent border outline-none focus:ring-2 focus:ring-current transition-all"
            style={{
              borderColor: theme.navbar.border,
              backgroundColor: theme.navbar.searchBg,
            }}
          />
        </div>

        {/* VIEW TOGGLE */}
        <div
          className="hidden sm:flex bg-opacity-10 p-1 rounded-xl border"
          style={{ borderColor: theme.navbar.border }}
        >
          <button
            onClick={() => setViewMode("list")}
            className={`p-2.5 rounded-lg transition-all ${
              viewMode === "list" ? "bg-white text-black shadow" : "opacity-50"
            }`}
          >
            <ListIcon size={20} />
          </button>
          <button
            onClick={() => setViewMode("tile")}
            className={`p-2.5 rounded-lg transition-all ${
              viewMode === "tile" ? "bg-white text-black shadow" : "opacity-50"
            }`}
          >
            <LayoutGrid size={20} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 opacity-50">
          <Loader2 className="animate-spin" size={48} />
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {viewMode === "list" ? (
            <UserListView
              users={filteredUsers}
              currentUser={currentUser}
              theme={theme}
              onRoleChange={handleRoleChange}
              onInspect={setInspectUserId}
              onDelete={handleDelete}
            />
          ) : (
            <UserTileView
              users={filteredUsers}
              currentUser={currentUser}
              theme={theme}
              onRoleChange={handleRoleChange}
              onInspect={setInspectUserId}
              onDelete={handleDelete}
            />
          )}
        </AnimatePresence>
      )}

      <AnimatePresence>
        {inspectUserId && (
          <UserInspectModal
            userId={inspectUserId}
            onClose={() => setInspectUserId(null)}
            theme={theme}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// --- HELPER COMPONENTS ---

// 1. User Avatar
const UserAvatar = ({ user, size = "md" }) => {
  const [imgError, setImgError] = useState(false);

  const getImgUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `${import.meta.env.VITE_API_URL}${path}`;
  };

  const dimensions = size === "lg" ? "w-14 h-14 text-xl" : "w-10 h-10 text-sm";

  if (user.profilePicture && !imgError) {
    return (
      <img
        src={getImgUrl(user.profilePicture)}
        alt={user.fullname}
        onError={() => setImgError(true)}
        className={`${dimensions} rounded-full object-cover border border-white/20 shadow-sm bg-gray-100`}
      />
    );
  }

  return (
    <div
      className={`${dimensions} rounded-full bg-gradient-to-br from-gray-100 to-gray-300 dark:from-white/10 dark:to-white/5 flex flex-shrink-0 items-center justify-center font-bold border border-white/10`}
    >
      {user.fullname?.charAt(0)?.toUpperCase() || "U"}
    </div>
  );
};

// 2. Role Select
const RoleSelect = ({ currentRole, onChange, theme, disabled }) => {
  const assignableRoles = [
    { value: "user", label: "User" },
    { value: "staff", label: "Staff" },
  ];

  if (disabled) {
    return (
      <span className="text-xs font-bold opacity-50 uppercase px-2">
        {currentRole}
      </span>
    );
  }

  return (
    <div className="relative">
      <select
        value={currentRole}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-transparent border rounded-lg pl-3 pr-8 py-1.5 text-xs font-bold uppercase outline-none focus:ring-1 focus:ring-current cursor-pointer hover:bg-black/5 transition-colors"
        style={{ borderColor: theme.navbar.border }}
      >
        {currentRole === "admin" && (
          <option value="admin" disabled className="text-gray-400 bg-gray-100">
            Admin
          </option>
        )}
        {assignableRoles.map((role) => (
          <option
            key={role.value}
            value={role.value}
            style={{ color: "black" }}
          >
            {role.label}
          </option>
        ))}
      </select>
      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
        <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[4px] border-t-current" />
      </div>
    </div>
  );
};

// --- LIST VIEW ---
const UserListView = ({
  users,
  currentUser,
  theme,
  onRoleChange,
  onInspect,
  onDelete,
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="relative rounded-3xl border bg-opacity-40 overflow-hidden"
    style={{ borderColor: theme.navbar.border, backgroundColor: theme.card.bg }}
  >
    <div className="md:hidden flex items-center justify-center gap-2 py-2 opacity-40 text-[10px] font-bold uppercase tracking-widest">
      Swipe left to see more <ChevronRight size={12} />
    </div>

    <div className="overflow-x-auto custom-scrollbar">
      <table className="w-full text-left border-collapse min-w-[700px]">
        <thead
          className="text-[10px] font-bold uppercase opacity-50 border-b"
          style={{ borderColor: theme.navbar.border }}
        >
          <tr>
            <th className="p-6">User Profile</th>
            <th className="p-6">Role</th>
            <th className="p-6">Contact</th>
            <th className="p-6 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {users.map((u) => {
            const isMe = currentUser?._id === u._id;
            return (
              <tr
                key={u._id}
                className={`border-b last:border-0 transition-colors ${
                  isMe ? "bg-blue-500/5" : "hover:bg-black/5"
                }`}
                style={{ borderColor: theme.navbar.border }}
              >
                <td className="p-6">
                  <div className="flex items-center gap-4">
                    <UserAvatar user={u} size="md" />
                    <div className="truncate max-w-[200px]">
                      <div className="font-bold truncate flex items-center gap-2">
                        {u.fullname}
                        {isMe && (
                          <span className="text-[10px] bg-blue-500 text-white px-2 rounded-full">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] opacity-40 font-mono truncate">
                        {u._id}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="p-6">
                  <RoleSelect
                    currentRole={u.role}
                    onChange={(val) => onRoleChange(u._id, val)}
                    theme={theme}
                    disabled={isMe}
                  />
                </td>
                <td className="p-6 opacity-70">
                  <div className="flex flex-col gap-1">
                    <span className="flex items-center gap-2">
                      <Mail size={12} /> {u.email}
                    </span>
                    {u.phone && (
                      <span className="flex items-center gap-2 text-xs">
                        <Phone size={12} /> {u.phone}
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-6 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => onInspect(u._id)}
                      className="p-3 rounded-xl bg-black/5 hover:bg-black/10 transition-all text-blue-500"
                    >
                      <Eye size={18} />
                    </button>
                    {!isMe && (
                      <button
                        onClick={() => onDelete(u._id)}
                        className="p-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 transition-all text-red-500"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </motion.div>
);

// --- TILE VIEW ---
const UserTileView = ({
  users,
  currentUser,
  theme,
  onRoleChange,
  onInspect,
  onDelete,
}) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 px-2">
    {users.map((u) => {
      const isMe = currentUser?._id === u._id;
      return (
        <div
          key={u._id}
          className={`p-6 rounded-[2rem] border relative group flex flex-col justify-between ${
            isMe ? "bg-blue-500/5 ring-1 ring-blue-500/30" : "bg-white/5"
          }`}
          style={{ borderColor: theme.navbar.border }}
        >
          <div>
            <div className="flex justify-between items-start mb-6">
              <UserAvatar user={u} size="lg" />

              <div className="flex flex-col items-end gap-1">
                <span
                  className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase flex items-center gap-1 ${
                    u.role === "admin"
                      ? "bg-purple-500/10 text-purple-600"
                      : u.role === "worker"
                      ? "bg-orange-500/10 text-orange-600"
                      : "bg-blue-500/10 text-blue-600"
                  }`}
                >
                  {u.role === "admin" && <ShieldAlert size={10} />}
                  {u.role === "worker" && <Briefcase size={10} />}
                  {u.role === "user" && <UserIcon size={10} />}
                  {u.role}
                </span>
                {isMe && (
                  <span className="text-[9px] font-black uppercase text-blue-500 tracking-widest">
                    (You)
                  </span>
                )}
              </div>
            </div>

            <h3 className="font-bold truncate text-lg">{u.fullname}</h3>
            <p className="text-xs opacity-50 mb-6 truncate">{u.email}</p>

            <div className="mb-6">
              <label className="text-[10px] font-bold opacity-40 uppercase mb-1 block">
                Change Role
              </label>
              <RoleSelect
                currentRole={u.role}
                onChange={(val) => onRoleChange(u._id, val)}
                theme={theme}
                disabled={isMe}
              />
            </div>
          </div>

          <div className="flex gap-2 mt-auto">
            <button
              onClick={() => onInspect(u._id)}
              className="flex-1 py-3 rounded-2xl bg-black/5 hover:bg-black/10 transition-all font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <Eye size={14} /> Inspect
            </button>
            {!isMe && (
              <button
                onClick={() => onDelete(u._id)}
                className="p-3 rounded-2xl bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white transition-all"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
      );
    })}
  </div>
);

// --- INSPECT MODAL ---
const UserInspectModal = ({ userId, onClose, theme }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("orders");

  useEffect(() => {
    const load = async () => {
      const res = await getUserDetailsForAdmin(userId);
      if (res.success) setData(res.data);
      setLoading(false);
    };
    load();
  }, [userId]);

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="w-full max-w-5xl h-[90vh] md:h-[85vh] rounded-t-[2.5rem] md:rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl"
        style={{ backgroundColor: theme.bg, color: theme.text }}
      >
        <div className="md:hidden flex justify-center py-4">
          <div className="w-12 h-1.5 rounded-full bg-black/20" />
        </div>

        <div
          className="p-6 md:p-8 border-b flex justify-between items-center"
          style={{ borderColor: theme.navbar.border }}
        >
          <div className="flex items-center gap-4">
            {/* Modal Avatar */}
            {data?.profile && <UserAvatar user={data.profile} size="lg" />}
            <div>
              <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter truncate max-w-[200px]">
                {data?.profile?.fullname || "Loading..."}
              </h2>
              <p className="opacity-50 text-[10px] font-mono">{userId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 md:p-3 rounded-full hover:bg-black/5 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div
          className="flex border-b px-6 md:px-8 gap-6 md:gap-10 text-[10px] font-bold uppercase tracking-widest overflow-x-auto no-scrollbar"
          style={{ borderColor: theme.navbar.border }}
        >
          {["orders", "cart", "addresses"].map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`py-5 md:py-6 border-b-2 transition-all whitespace-nowrap ${
                activeTab === t
                  ? "border-current opacity-100"
                  : "border-transparent opacity-30"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin" />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {activeTab === "orders" && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  {data?.orders.length === 0 ? (
                    <p className="text-center opacity-40 py-10 italic">
                      No history.
                    </p>
                  ) : (
                    data.orders.map((o) => (
                      <div
                        key={o._id}
                        className="p-5 rounded-2xl border"
                        style={{ borderColor: theme.navbar.border }}
                      >
                        <div className="flex justify-between text-[10px] font-bold opacity-50 mb-2">
                          <span>{o.orderId}</span>
                          <span>{o.status}</span>
                        </div>
                        <div className="space-y-1">
                          {o.items.map((i, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between text-xs"
                            >
                              <span>
                                {i.title} x{i.quantity}
                              </span>
                              <span>₹{i.price * i.quantity}</span>
                            </div>
                          ))}
                        </div>
                        <div
                          className="mt-3 pt-3 border-t flex justify-between font-black"
                          style={{ borderColor: theme.navbar.border }}
                        >
                          <span>TOTAL</span>
                          <span>₹{o.totalAmount}</span>
                        </div>
                      </div>
                    ))
                  )}
                </motion.div>
              )}
              {activeTab === "cart" && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <div className="p-6 rounded-3xl bg-black/5 flex justify-between items-center mb-4">
                    <span className="font-bold uppercase text-xs">
                      Current Cart Total
                    </span>
                    <span className="text-2xl font-black">
                      ₹{data?.cart?.totalPrice || 0}
                    </span>
                  </div>
                  {data?.cart?.items.length === 0 ? (
                    <p className="text-center opacity-40 py-10">
                      Cart is empty.
                    </p>
                  ) : (
                    data.cart.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-4 p-4 border rounded-2xl"
                        style={{ borderColor: theme.navbar.border }}
                      >
                        <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden">
                          <img
                            src={item.image}
                            className="w-full h-full object-cover"
                            alt=""
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-sm">{item.title}</h4>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">₹{item.price}</p>
                        </div>
                      </div>
                    ))
                  )}
                </motion.div>
              )}
              {activeTab === "addresses" && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  {data?.profile?.addresses.length === 0 ? (
                    <p className="col-span-2 text-center opacity-40">
                      No addresses.
                    </p>
                  ) : (
                    data.profile.addresses.map((addr, idx) => (
                      <div
                        key={idx}
                        className={`p-6 rounded-3xl border ${
                          addr.primary ? "border-blue-500 bg-blue-500/5" : ""
                        }`}
                        style={{
                          borderColor: addr.primary ? "" : theme.navbar.border,
                        }}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <MapPin
                            size={16}
                            className={
                              addr.primary ? "text-blue-500" : "opacity-40"
                            }
                          />
                          <span className="text-xs font-bold uppercase">
                            {addr.primary ? "Primary" : `Address #${idx + 1}`}
                          </span>
                        </div>
                        <p className="text-sm opacity-80 leading-relaxed">
                          {addr.door}, {addr.street}
                          <br />
                          {addr.city} - {addr.zip}
                        </p>
                      </div>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default UsersTab;
