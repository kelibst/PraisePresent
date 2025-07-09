import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  FiBook,
  FiMusic,
  FiImage,
  FiMonitor,
  FiList,
  FiChevronLeft,
  FiChevronRight,
  FiSun,
  FiMoon,
  FiVideo,
  FiSettings,
} from "react-icons/fi";
/* @ts-ignore */
import logoLight from "@/assets/logo-white.png";
import { useTheme } from "@/lib/theme";

import { useDispatch } from "react-redux";
import { AppDispatch } from "@/lib/store";
import { useSelector } from "react-redux";

const menu = [
  {
    label: "PraisePresent",
    icon: (
      <img
        src={logoLight}
        alt="Church Logo"
        className="w-20 h-15 rounded-full my-10"
      />
    ),
    path: "/",
  },
  // { label: "Scripture", icon: <FiBook />, path: "/scripture" },
  // { label: 'Songs', icon: <FiMusic />, path: '/Songs' },
  // { label: 'Media', icon: <FiImage />, path: '/media' },
  // { label: 'Presentations', icon: <FiMonitor />, path: '/presentations' },
  // { label: 'Services', icon: <FiList />, path: '/services' },
  { label: "Live Presentation", icon: <FiVideo />, path: "/service" },
  { label: "Settings", icon: <FiSettings />, path: "/settings" },
];

const AnimatedSidebar: React.FC<{ open: boolean; onToggle: () => void }> = ({
  open,
  onToggle,
}) => {


  const location = useLocation();


  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape' && open) {
      onToggle();
    }
  };

  // Show scripture list on scripture and live pages
  const showScriptureList =
    location.pathname === "/scripture" || location.pathname === "/live";

  return (
    <aside
      className={`fixed top-0 left-0 h-full z-30 bg-secondary justify-between border-r shadow-lg flex flex-col gap-2 transition-all duration-500 ease-in-out
        ${open ? "translate-x-0" : "-translate-x-full"} w-64`}
      onKeyDown={handleKeyDown}
      role="navigation"
      aria-label="Main navigation"
    >
      <button
        className="absolute -right-5 top-4 bg-background border rounded-full shadow p-1 z-40 
                   hover:bg-accent hover:scale-110 hover:shadow-md
                   focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background
                   focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                   active:scale-95 active:bg-accent/80
                   transition-all duration-200"
        onClick={onToggle}
        aria-label={open ? "Retract sidebar" : "Expand sidebar"}
      >
        {open ? <FiChevronLeft size={24} /> : <FiChevronRight size={24} />}
      </button>

      {/* Navigation Menu */}
      <nav className="flex flex-col gap-2 mt-2 px-2">
        {menu.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded transition-all duration-200 font-medium 
              hover:bg-accent hover:text-primary hover:scale-[1.02] hover:shadow-sm
              focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-secondary
              focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
              active:scale-[0.98] active:bg-accent/80
              ${isActive
                ? "bg-accent text-primary shadow-sm border border-primary/20"
                : "text-foreground"
              }`
            }
            end={item.path === "/"}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>  

      {/* <AsideThemeToggler /> */}
    </aside>
  );
};

export default AnimatedSidebar;