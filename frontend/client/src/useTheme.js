import { useEffect } from "react";
import "./theme.css";

export function useTheme() {
  useEffect(() => {
    const initializeTheme = () => {
      const theme = localStorage.getItem("theme") || "dark";
      document.documentElement.setAttribute("data-theme", theme);
      
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
        document.documentElement.classList.remove("light");
        document.documentElement.style.setProperty("--bg-main", "#0f172a");
        document.documentElement.style.setProperty("--bg-card", "#1e293b");
        document.documentElement.style.setProperty("--bg-card-rgb", "30, 41, 59");
        document.documentElement.style.setProperty("--text-main", "#f1f5f9");
        document.documentElement.style.setProperty("--text-muted", "#d1d5db");
        document.documentElement.style.setProperty("--border-color", "#334155");
      } else {
        document.documentElement.classList.remove("dark");
        document.documentElement.classList.add("light");
        document.documentElement.style.setProperty("--bg-main", "#f8fafc");
        document.documentElement.style.setProperty("--bg-card", "#ffffff");
        document.documentElement.style.setProperty("--bg-card-rgb", "255, 255, 255");
        document.documentElement.style.setProperty("--text-main", "#1e293b");
        document.documentElement.style.setProperty("--text-muted", "#64748b");
        document.documentElement.style.setProperty("--border-color", "#e2e8f0");
      }
    };

    initializeTheme();
    
    // Set up listener for storage changes (theme changes from other tabs)
    const handleStorageChange = (e) => {
      if (e.key === "theme") {
        initializeTheme();
      }
    };
    
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);
}