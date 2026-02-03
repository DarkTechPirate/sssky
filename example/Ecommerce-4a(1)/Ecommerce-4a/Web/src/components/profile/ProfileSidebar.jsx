import React, { useRef, useEffect } from "react";
import { ChevronRight } from "lucide-react";

export default function ProfileSidebar({
  tabs,
  activeTabId,
  onTabChange,
  theme,
  isAdmin = false,
  isStaff = false, // ✅ Added Staff prop
}) {
  const sidebarRef = useRef(null);

  // Apply overscroll behavior for better UX on touch devices (from Example)
  useEffect(() => {
    const el = sidebarRef.current;
    if (el) {
      el.style.overscrollBehavior = "contain";
    }
  }, []);

  return (
    <nav
      ref={sidebarRef}
      // CONFIGURATION (Applied from Example):
      // Mobile: w-full, overflow-x-auto (Horizontal Scroll pills), border-b.
      // PC: w-64, flex-col, overflow-y-auto (Vertical List), border-r, h-full.
      className="flex lg:flex-col gap-2 p-2 lg:p-6 w-full lg:w-64 lg:h-full shrink-0 overflow-x-auto lg:overflow-y-auto overscroll-contain border-b lg:border-b-0 lg:border-r border-white/5 hide-scrollbar lg:bg-transparent backdrop-blur-sm lg:backdrop-blur-none"
    >
      {tabs.map((tab) => {
        // --- VISIBILITY LOGIC ---
        // ✅ Prioritize Admin, then Staff, then default to User
        let shouldShow = tab.showForUser;

        if (isAdmin) {
          shouldShow = tab.showForAdmin;
        } else if (isStaff) {
          shouldShow = tab.showForStaff;
        }

        if (!shouldShow) {
          return null;
        }

        const isActive = activeTabId === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              relative flex items-center justify-center lg:justify-start gap-2 lg:gap-3 
              px-4 py-2 lg:px-5 lg:py-4 rounded-full lg:rounded-xl 
              transition-all whitespace-nowrap group shrink-0
              ${
                isActive
                  ? "shadow-md"
                  : "opacity-60 hover:opacity-100 hover:bg-white/5"
              }
            `}
            style={{
              backgroundColor: isActive ? theme.text : "transparent",
              color: isActive ? theme.bg : theme.text,
            }}
          >
            <tab.icon
              size={16}
              strokeWidth={2.5}
              className="lg:w-[18px] lg:h-[18px]"
            />

            <span className="text-xs lg:text-sm font-bold tracking-wide">
              {tab.label}
            </span>

            {isActive && (
              <ChevronRight size={16} className="ml-auto hidden lg:block" />
            )}
          </button>
        );
      })}
    </nav>
  );
}
