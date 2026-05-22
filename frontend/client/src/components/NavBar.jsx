import { Link } from "react-router-dom";
import { useState, useEffect, useLayoutEffect, useRef } from "react";

function Navbar() {
  const [user, setUser] = useState(null);
  const [, setTheme] = useState(() => localStorage.getItem("theme") || "dark");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  useLayoutEffect(() => {
    const applyTheme = (currentTheme) => {
      if (currentTheme === "dark") {
        document.documentElement.classList.add("dark");
        document.documentElement.style.setProperty("--bg-main", "#0F172A");
        document.documentElement.style.setProperty("--bg-card", "#1E293B");
        document.documentElement.style.setProperty("--bg-card-rgb", "30, 41, 59");
        document.documentElement.style.setProperty("--text-main", "#F8FAFC");
        document.documentElement.style.setProperty("--text-muted", "#CBD5E1");
        document.documentElement.style.setProperty("--border-color", "rgba(255, 255, 255, 0.08)");
        document.documentElement.style.setProperty("--primary", "#3B82F6");
        document.documentElement.style.setProperty("--primary-dark", "#2563EB");
        document.documentElement.style.setProperty("--primary-light", "rgba(59, 130, 246, 0.15)");
        document.documentElement.style.setProperty("--primary-disabled", "rgba(59, 130, 246, 0.5)");
        document.documentElement.style.setProperty("--success", "#10B981");
        document.documentElement.style.setProperty("--success-light", "rgba(16, 185, 129, 0.15)");
        document.documentElement.style.setProperty("--danger", "#EF4444");
        document.documentElement.style.setProperty("--danger-light", "rgba(239, 68, 68, 0.15)");
      } else {
        document.documentElement.classList.remove("dark");
        document.documentElement.style.setProperty("--bg-main", "#F8FAFC");
        document.documentElement.style.setProperty("--bg-card", "#FFFFFF");
        document.documentElement.style.setProperty("--bg-card-rgb", "255, 255, 255");
        document.documentElement.style.setProperty("--text-main", "#0F172A");
        document.documentElement.style.setProperty("--text-muted", "#64748B");
        document.documentElement.style.setProperty("--border-color", "rgba(15, 23, 42, 0.08)");
        document.documentElement.style.setProperty("--primary", "#3B82F6");
        document.documentElement.style.setProperty("--primary-dark", "#2563EB");
        document.documentElement.style.setProperty("--primary-light", "rgba(59, 130, 246, 0.1)");
        document.documentElement.style.setProperty("--primary-disabled", "rgba(59, 130, 246, 0.5)");
        document.documentElement.style.setProperty("--success", "#10B981");
        document.documentElement.style.setProperty("--success-light", "rgba(16, 185, 129, 0.1)");
        document.documentElement.style.setProperty("--danger", "#EF4444");
        document.documentElement.style.setProperty("--danger-light", "rgba(239, 68, 68, 0.1)");
      }
      document.documentElement.style.setProperty("--btn-text", "#FFFFFF");
      document.documentElement.style.setProperty("--shadow-sm", "0 1px 2px 0 rgba(0, 0, 0, 0.05)");
      document.documentElement.style.setProperty("--shadow-md", "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)");
    };

    const loadUser = () => {
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          if (parsedUser.theme && parsedUser.theme !== localStorage.getItem("theme")) {
            localStorage.setItem("theme", parsedUser.theme);
            setTheme(parsedUser.theme);
          }
        } else {
          setUser(null);
        }
      } catch {
        // gracefully handle parsing error
        setUser(null);
      }
      const currentTheme = localStorage.getItem("theme") || "dark";
      setTheme(currentTheme);
      applyTheme(currentTheme);
    };
    
    loadUser();

    // Listen for storage changes (cross-tab) or custom update events (same-tab)
    window.addEventListener("storage", loadUser);
    window.addEventListener("user-updated", loadUser);
    window.addEventListener("theme-updated", loadUser);
    return () => {
      window.removeEventListener("storage", loadUser);
      window.removeEventListener("user-updated", loadUser);
      window.removeEventListener("theme-updated", loadUser);
    };
  }, []);

  useEffect(() => {
    // Click outside listener for the profile dropdown
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isAdmin = user?.isAdmin || user?.role === "admin" || user?.email === "admin@gmail.com";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <nav
      className="nav-container"
      style={{
        background: "rgba(var(--bg-card-rgb, 30, 30, 30), 0.85)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        color: "var(--text-main)",
        padding: "12px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: "0 4px 30px rgba(0, 0, 0, 0.05)",
        position: "sticky",
        top: 0,
        zIndex: 100,
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        flexWrap: "wrap",
        gap: "15px",
        borderBottom: "1px solid var(--border-color)",
        transition: "all 0.3s ease"
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        html { scroll-behavior: smooth; }
        ::selection { background: var(--primary); color: white; }

        body {
          font-family: 'Inter', sans-serif !important;
          margin: 0;
          padding: 0;
          background-color: var(--bg-main);
          color: var(--text-main);
          -webkit-font-smoothing: antialiased;
          transition: background-color 0.3s ease, color 0.3s ease;
          animation: fadeInPage 0.5s ease-out;
        }

        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.3);
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.5);
        }

        @keyframes fadeInPage { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        @keyframes slideInDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .nav-link { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); position: relative; }
        .nav-link::after { content: ''; position: absolute; bottom: -4px; left: 0; width: 0; height: 2px; background: linear-gradient(90deg, var(--primary), transparent); transition: width 0.3s ease; }
        .nav-link:hover::after { width: 100%; }
        .nav-link:hover { color: var(--primary) !important; transform: translateY(-2px); }
        .nav-link:active { transform: translateY(0); }
        .dropdown-menu { animation: slideInDown 0.3s ease-out; }
        
        /* Sidebar Navigation Styles */
        .sidebar {
          position: fixed;
          top: 0;
          left: 0;
          width: min(85vw, 320px);
          max-width: 320px;
          height: 100vh;
          background: rgba(15, 23, 42, 0.95);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-right: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 4px 0 30px rgba(0,0,0,0.5);
          transform: translateX(-100%);
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 1000;
          padding: 24px 18px;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
        }
        .sidebar.open { transform: translateX(0); }
        .sidebar-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
          z-index: 999; opacity: 0; pointer-events: none; transition: opacity 0.3s ease-in-out;
        }
        .sidebar-overlay.open { opacity: 1; pointer-events: auto; }
        .sidebar-link {
          color: var(--text-main); text-decoration: none; font-size: 16px; font-weight: 600;
          padding: 12px 16px; border-radius: 10px; transition: all 0.2s ease; display: flex; align-items: center; gap: 12px;
        }
        .sidebar-link:hover { background: rgba(59, 130, 246, 0.1); color: var(--primary); transform: translateX(4px); }
        .sidebar-link.danger:hover { background: rgba(239, 68, 68, 0.1); color: var(--danger); transform: translateX(4px); }

        /* Mobile menu button styles */
        .mobile-menu-btn {
          display: none;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--border-color);
          color: var(--text-main);
          font-size: 26px;
          cursor: pointer;
          padding: 8px;
          border-radius: 10px;
          transition: transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;
          will-change: transform;
          line-height: 1;
        }
        .mobile-menu-btn:hover { transform: translateY(-2px) scale(1.03); box-shadow: 0 6px 18px rgba(59, 130, 246, 0.2); }
        .mobile-menu-btn:active { transform: translateY(0) scale(0.99); }

        /* Premium Profile Section */
        .desktop-profile-section { position: relative; z-index: 105; }
        .profile-trigger {
          display: flex; align-items: center; gap: 10px; cursor: pointer;
          padding: 6px 14px 6px 6px; border-radius: 30px;
          background: rgba(30, 41, 59, 0.5); border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease; backdrop-filter: blur(10px);
        }
        .profile-trigger:hover {
          background: rgba(30, 41, 59, 0.85); border-color: rgba(59, 130, 246, 0.4);
          box-shadow: 0 0 15px rgba(59, 130, 246, 0.15);
          transform: translateY(-1px);
        }
        .profile-avatar-container { position: relative; display: flex; }
        .profile-avatar {
          display: flex; align-items: center; justify-content: center;
          width: 36px; height: 36px; border-radius: 50%;
          background: linear-gradient(135deg, var(--primary), var(--primary-dark));
          color: #ffffff; font-weight: 700; font-size: 15px;
          border: 2px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 4px 10px rgba(59, 130, 246, 0.3);
          transition: transform 0.3s ease;
        }
        .profile-trigger:hover .profile-avatar { transform: scale(1.05); }
        .status-indicator {
          position: absolute; bottom: -2px; right: -2px; width: 12px; height: 12px;
          background: #10B981; border: 2px solid var(--bg-card); border-radius: 50%;
        }
        .profile-info { display: flex; flex-direction: column; align-items: flex-start; }
        .profile-name { font-size: 14px; font-weight: 600; color: var(--text-main); line-height: 1.1; max-width: 110px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .profile-subtitle { font-size: 11px; color: var(--text-muted); font-weight: 500; margin-top: 2px; }
        .dropdown-arrow { transition: transform 0.3s ease; color: var(--text-muted); }
        .dropdown-arrow.open { transform: rotate(180deg); color: var(--primary); }
        
        .profile-dropdown {
          position: absolute; top: calc(100% + 12px); right: 0;
          width: 240px; background: rgba(30, 41, 59, 0.95); backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(59, 130, 246, 0.1);
          padding: 8px; z-index: 200;
          opacity: 0; visibility: hidden; transform: translateY(-10px);
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .profile-dropdown.open { opacity: 1; visibility: visible; transform: translateY(0); }
        
        .dropdown-header { padding: 12px; border-bottom: 1px solid rgba(255, 255, 255, 0.08); margin-bottom: 8px; }
        .dropdown-header-name { margin: 0; font-size: 15px; font-weight: 600; color: var(--text-main); }
        .dropdown-header-email { margin: 4px 0 0 0; font-size: 12px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        
        .dropdown-item {
          display: flex; align-items: center; gap: 12px; width: 100%; padding: 10px 12px;
          border-radius: 10px; border: none; background: transparent; color: var(--text-main);
          font-size: 14px; font-weight: 500; cursor: pointer; text-align: left;
          transition: all 0.2s ease; text-decoration: none; box-sizing: border-box; font-family: inherit;
        }
        .dropdown-item:hover { background: rgba(59, 130, 246, 0.1); color: var(--primary); transform: translateX(4px); }
        .dropdown-item.danger:hover { background: rgba(239, 68, 68, 0.1); color: var(--danger); transform: translateX(4px); }

        /* Default state */
        .nav-links { display: flex; }
        .mobile-menu-btn { display: none; }

        /* Breakpoints */
        @media (max-width: 1024px) {
          .nav-container { flex-direction: row; gap: 12px; padding: 12px 16px !important; }
          .nav-links { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
        @media (max-width: 768px) {
          .profile-info, .dropdown-arrow { display: none !important; }
          .profile-trigger { padding: 0 !important; background: transparent !important; border: none !important; }
          .profile-trigger:hover { background: transparent !important; box-shadow: none !important; transform: none !important; }
          .profile-dropdown { width: 220px; right: -40px; }
        }
      `}</style>

      {/* LEFT SECTION: LOGO */}
      <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "12px" }}>
        {/* LOGO */}
        <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "linear-gradient(135deg, #6366F1, #0EA5E9)", display: "flex", justifyContent: "center", alignItems: "center", color: "white", fontSize: "18px", fontWeight: "bold", boxShadow: "0 4px 15px rgba(14, 165, 233, 0.4)", border: "1px solid rgba(255,255,255,0.2)" }}>
            S
          </div>
          <div style={{ fontSize: "24px", fontWeight: "900", letterSpacing: "-0.5px" }}>
            <span style={{ color: "var(--text-main)" }}>SkillUp</span>
            <span style={{ background: "linear-gradient(135deg, #0EA5E9, #6366F1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Hub</span>
          </div>
        </Link>
      </div>

      {/* DESKTOP NAV LINKS */}
      <div className="nav-links" style={{ display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap" }}>
        
        {!isAdmin && (
          <Link to="/dashboard" className="nav-link" style={{ color: "var(--text-main)", textDecoration: "none", fontWeight: "600", fontSize: "15px" }}>
            📊 Dashboard
          </Link>
        )}

        <Link to="/courses" className="nav-link" style={{ color: "var(--text-main)", textDecoration: "none", fontWeight: "600", fontSize: "15px" }}>
          🎓 Courses
        </Link>

        {!isAdmin && (
          <Link to="/study-logs" className="nav-link" style={{ color: "var(--text-main)", textDecoration: "none", fontWeight: "600", fontSize: "15px" }}>
            📝 Study Logs
          </Link>
        )}

        <Link to="/games" className="nav-link" style={{ color: "var(--text-main)", textDecoration: "none", fontWeight: "600", fontSize: "15px" }}>
          🎮 Games
        </Link>

        <Link to="/coding-puzzle" className="nav-link" style={{ color: "var(--text-main)", textDecoration: "none", fontWeight: "600", fontSize: "15px" }}>
          💻 Coding Puzzles
        </Link>

        {isAdmin && (
          <Link to="/admin" className="nav-link" style={{ color: "var(--danger)", textDecoration: "none", fontWeight: "600", fontSize: "15px" }}>
            ⚙️ Admin
          </Link>
        )}
      </div>

      {/* RIGHT SECTION: hamburger on right */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "nowrap" }} ref={dropdownRef}>
        {user && (
          <div className="desktop-profile-section">
            <button 
              className="profile-trigger" 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <div className="profile-avatar-container">
                <div className="profile-avatar">
                  {user.name ? user.name.charAt(0).toUpperCase() : "👤"}
                </div>
                <div className="status-indicator"></div>
              </div>
              <div className="profile-info">
                <span className="profile-name">{user.name || "User"}</span>
                <span className="profile-subtitle">My Account</span>
              </div>
              <svg className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </button>

            <div className={`profile-dropdown ${isDropdownOpen ? 'open' : ''}`}>
               <div className="dropdown-header">
                 <p className="dropdown-header-name">{user.name}</p>
                 <p className="dropdown-header-email">{user.email}</p>
               </div>
               <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                 <Link to="/profile" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                   My Profile
                 </Link>
                 <Link to="/profile" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                   Account Settings
                 </Link>
                 <div style={{ height: "1px", background: "rgba(255, 255, 255, 0.08)", margin: "4px 0" }}></div>
                 <button className="dropdown-item danger" onClick={() => { setIsDropdownOpen(false); handleLogout(); }}>
                   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                   Sign Out
                 </button>
               </div>
            </div>
          </div>
        )}
        <button
          className="mobile-menu-btn"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Open navigation"
          title="Open menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </button>
      </div>

      {/* MOBILE SIDEBAR & OVERLAY */}
      <div className={`sidebar-overlay ${isMobileMenuOpen ? 'open' : ''}`} onClick={() => setIsMobileMenuOpen(false)}></div>
      <div className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
          <div style={{ fontSize: "22px", fontWeight: "800" }}>
            SkillUp Hub
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "24px", cursor: "pointer", display: "flex", alignItems: "center" }}>
            ✕
          </button>
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="sidebar-link">📊 Dashboard</Link>
          <Link to="/courses" onClick={() => setIsMobileMenuOpen(false)} className="sidebar-link">🎓 Courses</Link>
          {!isAdmin && <Link to="/study-logs" onClick={() => setIsMobileMenuOpen(false)} className="sidebar-link">📝 Study Logs</Link>}
          <Link to="/games" onClick={() => setIsMobileMenuOpen(false)} className="sidebar-link">🎮 Games</Link>
          <Link to="/coding-puzzle" onClick={() => setIsMobileMenuOpen(false)} className="sidebar-link">💻 Coding Puzzles</Link>
          <hr style={{ borderColor: "var(--border-color)", opacity: 0.5, margin: "10px 0" }} />
          <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="sidebar-link">👤 Profile</Link>
          <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="sidebar-link">⚙️ Settings</Link>
          {isAdmin && <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className="sidebar-link" style={{ color: "var(--danger)" }}>⚙️ Admin</Link>}
          <button onClick={handleLogout} className="sidebar-link danger" style={{ background: "transparent", border: "none", cursor: "pointer", width: "100%", textAlign: "left", fontSize: "16px" }}>🚪 Sign Out</button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
