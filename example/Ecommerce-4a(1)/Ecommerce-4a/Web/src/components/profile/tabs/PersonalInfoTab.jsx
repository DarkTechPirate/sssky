import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Loader2,
  AlertCircle,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Phone,
} from "lucide-react";
import GoogleIcon from "../../GoogleIcon";
import Modal from "@/components/layout/Modal";
import { UpdatePersonalInfo } from "../../../services/api";

export default function PersonalInfoTab({ theme, user, setUser }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Change Detection & Password Strength State
  const [hasChanges, setHasChanges] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingChanges, setPendingChanges] = useState({});

  // ---------------------------------------------------------
  // 1. DATA EXTRACTION LOGIC (Indian Context Only)
  // ---------------------------------------------------------
  const initialData = useMemo(() => {
    const rawPhone = user?.phone || "";
    let extractedNumber = "";

    // If phone exists, strip +91, spaces, and non-digits to get the raw 10 digits
    if (rawPhone) {
      // Remove +91 if present at start
      let clean = rawPhone.replace(/^\+91/, "").trim();
      // Remove any remaining spaces or non-digits
      extractedNumber = clean.replace(/\D/g, "");
    }

    return {
      fullName: user?.fullname || "",
      email: user?.email,
      phone: extractedNumber,
    };
  }, [user]);

  const [formData, setFormData] = useState({
    ...initialData,
    password: "",
  });

  // --- Password Strength Logic ---
  const checkStrength = (pass) => {
    let score = 0;
    if (!pass) return 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const getStrengthColor = () => {
    switch (passwordStrength) {
      case 0:
        return "bg-gray-500/20";
      case 1:
        return "bg-red-500";
      case 2:
        return "bg-orange-500";
      case 3:
        return "bg-yellow-400";
      case 4:
        return "bg-green-500";
      default:
        return "bg-gray-500/20";
    }
  };

  // --- Change Detection Effect ---
  useEffect(() => {
    const isNameChanged = formData.fullName !== initialData.fullName;
    const isPhoneChanged = formData.phone !== initialData.phone;
    const isPasswordChanged = formData.password.length > 0;

    setHasChanges(isNameChanged || isPhoneChanged || isPasswordChanged);
  }, [formData, initialData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (error) setError("");

    // Number validation: Only allow digits
    if (name === "phone" && !/^\d*$/.test(value)) return;

    // Password Strength Calc
    if (name === "password") {
      setPasswordStrength(checkStrength(value));
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 2. Pre-Save: Validate Indian Number & Password
  const handlePreSave = (e) => {
    e.preventDefault();
    setError("");

    if (!hasChanges) return;

    // --- Validation ---
    if (!formData.fullName.trim()) {
      setError("Full Name cannot be empty.");
      return;
    }

    // Indian Phone Validation: 10 digits, starts with 6-9
    if (formData.phone) {
      const indianPhoneRegex = /^[6-9]\d{9}$/;
      if (!indianPhoneRegex.test(formData.phone)) {
        setError(
          "Invalid Number: Must be a valid 10-digit Indian mobile number."
        );
        return;
      }
    }

    // --- Calculate Specific Changes for Modal ---
    const changes = {};
    if (formData.fullName !== initialData.fullName) {
      changes["Full Name"] = formData.fullName;
    }

    if (formData.phone !== initialData.phone) {
      changes["Mobile Number"] = `+91 ${formData.phone}`;
    }

    if (formData.password.length > 0) {
      if (passwordStrength < 3) {
        setError("Password is too weak. Must meet at least 3 criteria.");
        return;
      }
      changes["Password"] = "******** (Hidden)";
    }

    setPendingChanges(changes);
    setIsModalOpen(true);
  };

  // 3. Final Save (Triggered from Modal)
  const handleFinalConfirm = async () => {
    setIsLoading(true);

    try {
      // 1. Prepare Payload
      // Note: We send only the 10 digit phone. Backend adds/validates +91 if needed or stores as is.
      // Based on previous backend code, we just send 'phone' as the 10 digit string.
      const payload = {
        fullName: formData.fullName,
        phone: formData.phone,
      };

      // Only include password if it was changed
      if (formData.password && formData.password.length > 0) {
        payload.password = formData.password;
      }

      // 2. Call API
      const response = await UpdatePersonalInfo(payload);

      // 3. Handle Response
      if (response.success) {
        if (setUser) {
          if (response.user) {
            setUser(response.user);
          } else {
            // Fallback optimistic update
            setUser((prev) => ({
              ...prev,
              fullname: formData.fullName,
              phone: `+91 ${formData.phone}`,
            }));
          }
        }

        // Success Cleanup
        setIsModalOpen(false);
        setIsEditing(false);
        setError("");
        setFormData((prev) => ({ ...prev, password: "" }));
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleEdit = () => {
    if (isEditing) {
      setFormData({ ...initialData, password: "" });
      setError("");
    }
    setIsEditing(!isEditing);
  };

  return (
    <div className="max-w-2xl">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold uppercase tracking-tight">
          Personal Details
        </h2>
        <button
          onClick={toggleEdit}
          disabled={isLoading}
          className="text-xs font-bold uppercase tracking-widest underline opacity-60 hover:opacity-100 disabled:opacity-30"
        >
          {isEditing ? "Cancel" : "Edit Details"}
        </button>
      </div>

      <form onSubmit={handlePreSave} className="space-y-8">
        {/* --- Full Name --- */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-1 opacity-50">
            <User size={14} />
            <label className="text-[10px] font-bold uppercase tracking-widest">
              Full Name
            </label>
          </div>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleInputChange}
            disabled={!isEditing}
            className="w-full bg-transparent border-b py-3 text-lg focus:outline-none focus:border-current transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            style={{ borderColor: theme.navbar?.border }}
          />
        </div>

        {/* --- Email (Read Only) --- */}
        <div className="space-y-2">
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center gap-2 opacity-50">
              <Mail size={14} />
              <label className="text-[10px] font-bold uppercase tracking-widest">
                Email Address
              </label>
            </div>
            {(user?.googleId || user?.emailVerified) && (
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-green-500 bg-green-500/10 px-2 py-0.5 rounded">
                <CheckCircle2 size={12} /> Verified
              </span>
            )}
          </div>
          <div className="relative">
            <input
              type="email"
              value={formData.email}
              disabled={true}
              className="w-full bg-transparent border-b py-3 text-lg focus:outline-none focus:border-current transition-colors opacity-60 cursor-not-allowed pr-8"
              style={{ borderColor: theme.navbar?.border }}
            />
            {user?.googleId && (
              <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none opacity-80">
                <GoogleIcon />
              </div>
            )}
          </div>
        </div>

        {/* --- Password (New Field) --- */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-1 opacity-50">
            <Lock size={14} />
            <label className="text-[10px] font-bold uppercase tracking-widest">
              New Password
            </label>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              disabled={!isEditing}
              placeholder={
                isEditing ? "Enter new password to change" : "••••••••••••"
              }
              className="w-full bg-transparent border-b py-3 text-lg focus:outline-none focus:border-current transition-colors disabled:opacity-70 disabled:cursor-not-allowed pr-10"
              style={{ borderColor: theme.navbar?.border }}
            />
            {isEditing && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 p-2"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            )}
          </div>

          {/* Password Strength Meter */}
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{
              height: isEditing && formData.password.length > 0 ? "auto" : 0,
              opacity: isEditing && formData.password.length > 0 ? 1 : 0,
            }}
            className="overflow-hidden"
          >
            <div className="flex gap-1 h-1 mt-3">
              {[1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={`h-full flex-1 rounded-full transition-all duration-500 ${
                    passwordStrength >= level
                      ? getStrengthColor()
                      : "bg-gray-500/20"
                  }`}
                />
              ))}
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-[9px] uppercase font-bold tracking-wider opacity-50">
                Password Strength
              </span>
              {passwordStrength < 3 && (
                <span className="text-[9px] text-orange-500 font-bold">
                  Weak
                </span>
              )}
              {passwordStrength >= 3 && (
                <span className="text-[9px] text-green-500 font-bold">
                  Strong
                </span>
              )}
            </div>
          </motion.div>
        </div>

        {/* --- Phone Number (India Only) --- */}
        <div className="space-y-2">
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center gap-2 opacity-50">
              <Phone size={14} />
              <label className="text-[10px] font-bold uppercase tracking-widest">
                Mobile Number
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-4">
              {/* Static Country Code */}
              <div
                className="py-3 text-lg font-bold opacity-50 border-b w-16 text-center select-none cursor-not-allowed"
                style={{ borderColor: theme.navbar?.border }}
              >
                +91
              </div>

              {/* Number Input */}
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="9876543210"
                maxLength={10}
                className="flex-1 bg-transparent border-b py-3 text-lg focus:outline-none focus:border-current transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                style={{
                  borderColor: error ? "#ef4444" : theme.navbar?.border,
                  color: error ? "#ef4444" : "inherit",
                }}
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-red-500 text-xs font-bold uppercase tracking-wide mt-1"
              >
                <AlertCircle size={12} />
                {error}
              </motion.div>
            )}
          </div>
        </div>

        {/* --- Save Button --- */}
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="pt-6 flex flex-col md:flex-row md:justify-end"
          >
            <button
              type="submit"
              disabled={!hasChanges}
              className="px-8 py-4 rounded-full font-bold uppercase tracking-wider transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: hasChanges
                  ? theme.text
                  : "rgba(150,150,150,0.1)",
                color: hasChanges ? theme.bg : "rgba(150,150,150,0.5)",
              }}
            >
              {hasChanges ? "Review Changes" : "No Changes Detected"}
            </button>
          </motion.div>
        )}
      </form>

      {/* --- CONFIRMATION MODAL --- */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        theme={theme}
        title="Confirm Updates"
        description="The following details will be updated on your profile. Are you sure you want to proceed?"
      >
        <div className="mt-4 space-y-4">
          <div className="bg-black/5 dark:bg-white/5 rounded-2xl p-4 space-y-3">
            {Object.entries(pendingChanges).map(([key, value]) => (
              <div
                key={key}
                className="flex justify-between items-center text-sm"
              >
                <span className="opacity-60 font-medium uppercase tracking-wide text-xs">
                  {key}
                </span>
                <span className="font-bold">{value}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleFinalConfirm}
              disabled={isLoading}
              className="flex-1 py-3 px-6 rounded-xl font-bold text-sm uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2"
              style={{
                backgroundColor: theme.text,
                color: theme.bg,
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Saving...
                </>
              ) : (
                "Confirm & Save"
              )}
            </button>

            <button
              onClick={() => setIsModalOpen(false)}
              disabled={isLoading}
              className="flex-1 py-3 px-6 rounded-xl font-bold text-sm uppercase tracking-wider transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              style={{
                border: `1px solid ${theme.navbar?.border}`,
                color: theme.navbar?.textIdle || theme.text,
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
