import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "../components/NavBar";
import API from "../services/api";
import { useTheme } from "../useTheme";
import "./Profile.css";
import "./DashBoard.css";
import { toast } from "react-hot-toast";

function Profile() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({ name: "", email: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", weeklyGoalHours: 10 });
  const [notifPermission, setNotifPermission] = useState(() => "Notification" in window ? Notification.permission : "unsupported");
  const [isUploading, setIsUploading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  useTheme(); // Initialize theme

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    } else {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUserData(parsedUser || { name: "", email: "" });
          setFormData({ name: parsedUser?.name || "", email: parsedUser?.email || "", weeklyGoalHours: parsedUser?.weeklyGoalHours || 10 });
        } catch (err) {
          console.warn("Failed to parse user data", err);
        }
      }
    }

    const handleThemeUpdate = () => {
      setTheme(localStorage.getItem("theme") || "light");
    };


    window.addEventListener("theme-updated", handleThemeUpdate);
    window.addEventListener("storage", handleThemeUpdate);
    return () => {
      window.removeEventListener("theme-updated", handleThemeUpdate);
      window.removeEventListener("storage", handleThemeUpdate);
    };
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    try {
      const res = await API.put("/auth/profile", {
        userId: userData._id,
        ...formData
      });
      
      const updatedUser = { ...userData, ...formData, ...res.data.user };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUserData(updatedUser);
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error.response?.data?.message || "Failed to update profile.");
    }
  };

  const handleUploadCertificate = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB. Please compress your file.");
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const newCert = {
        id: Date.now().toString(),
        name: file.name,
        type: file.type,
        data: reader.result,
        uploadDate: new Date().toISOString()
      };
      
      const updatedCerts = [...(userData.certificates || []), newCert];
      
      try {
        await API.put("/auth/profile", {
          userId: userData._id,
          certificates: updatedCerts
        });
        
        const updatedUser = { ...userData, certificates: updatedCerts };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUserData(updatedUser);
      } catch (err) {
        console.error("Upload error", err);
        toast.error("Failed to upload certificate.");
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteCertificate = async (certId) => {
    if (!window.confirm("Are you sure you want to delete this certificate?")) return;
    
    const updatedCerts = (userData.certificates || []).filter(c => c.id !== certId);
    try {
        await API.put("/auth/profile", {
          userId: userData._id,
          certificates: updatedCerts
        });
        
        const updatedUser = { ...userData, certificates: updatedCerts };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUserData(updatedUser);
    } catch {
      toast.error("Failed to delete certificate.");
    }
  };

  const handleDownloadCertificate = (cert) => {
    const link = document.createElement("a");
    link.href = cert.data;
    link.download = cert.name || "certificate";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const stripHtml = (html) => {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const res = await API.get("/courses");
      const courses = Array.isArray(res.data) ? res.data : [];

      let csvContent = "Date,Course,Duration (mins),Notes\n";
      courses.forEach(course => {
        if (Array.isArray(course.studyLogs)) {
          course.studyLogs.forEach(log => {
            const date = new Date(log.date).toISOString().split('T')[0];
            const title = `"${course.title.replace(/"/g, '""')}"`;
            const notesText = stripHtml(log.notes || "").replace(/"/g, '""').replace(/\n/g, ' ');
            csvContent += `${date},${title},${log.duration},"${notesText}"\n`;
          });
        }
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "My_Study_Logs.csv";
      link.click();
    } catch (err) {
      console.error("Export error", err);
      toast.error("Failed to export CSV data.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportMarkdown = async () => {
    setIsExporting(true);
    try {
      const res = await API.get("/courses");
      const courses = Array.isArray(res.data) ? res.data : [];
      
      let mdContent = `# My Learning Data Export\n\n## Course Progress\n\n`;
      courses.forEach(c => { mdContent += `- **${c.title}** (${c.platform}): ${c.progress || 0}% Complete\n`; });
      
      mdContent += `\n## Study Logs & Notes\n\n`;
      courses.forEach(c => {
        if (Array.isArray(c.studyLogs) && c.studyLogs.length > 0) {
          mdContent += `### ${c.title}\n\n`;
          c.studyLogs.forEach(log => {
            const date = new Date(log.date).toISOString().split('T')[0];
            mdContent += `- **${date}** (${log.duration} mins)\n`;
            if (log.notes) mdContent += `  > ${stripHtml(log.notes).replace(/\n/g, '\n  > ')}\n`;
          });
          mdContent += `\n`;
        }
      });

      const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([mdContent], { type: 'text/markdown;charset=utf-8;' })); link.download = "My_Learning_Data.md"; link.click();
    } catch {
      toast.error("Failed to export Markdown data.");
    } finally { setIsExporting(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logged Out");
    navigate("/");
  };

  const isAdmin = userData?.isAdmin || userData?.role === "admin" || userData?.email === "admin@gmail.com";
  const initials = userData?.name ? userData.name.charAt(0).toUpperCase() : "U";

  // Calculate effective streak to gracefully handle resetting if they missed a day
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  let displayStreak = userData?.studyStreak || 0;

  if (userData?.lastStudyDate) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (userData.lastStudyDate !== todayStr && userData.lastStudyDate !== yesterdayStr) {
      displayStreak = 0;
    }
  }

  const BADGES = [
    { title: "Spark", description: "3 Day Streak", icon: "🔥", requiredStreak: 3 },
    { title: "Habit Builder", description: "7 Day Streak", icon: "🚀", requiredStreak: 7 },
    { title: "Unstoppable", description: "30 Day Streak", icon: "💎", requiredStreak: 30 },
    { title: "Scholar", description: "100 Day Streak", icon: "👑", requiredStreak: 100 },
  ];

  const toggleTheme = async () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    window.dispatchEvent(new Event("theme-updated"));
    
    try {
      await API.put("/auth/profile", {
        userId: userData._id,
        theme: newTheme
      });
      
      const updatedUser = { ...userData, theme: newTheme };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUserData(updatedUser);
    } catch (err) {
      console.error("Failed to save theme preference.", err);
    }
  };

  return (
    <div className="dashboard-page-wrapper" style={{ color: "var(--text-main)" }}>
      <Navbar />
      <style>{`
        .profile-layout-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 24px; margin-bottom: 32px; }
        .export-section-premium { display: flex; gap: 16px; }
        
        /* Tablet Layout: Balanced spacing & 2-column sections */
        @media (min-width: 769px) and (max-width: 1024px) {
          .profile-layout-grid { grid-template-columns: 1fr 1.5fr; }
        }
        
        /* Mobile Layout: Stack elements vertically */
        @media (max-width: 768px) {
          .profile-layout-grid { grid-template-columns: 1fr; display: flex; flex-direction: column; }
          .badges-grid-premium { grid-template-columns: repeat(2, 1fr) !important; }
          .certificates-grid-premium { grid-template-columns: 1fr !important; }
          .export-section-premium { flex-direction: column; }
        }
        @media (max-width: 480px) {
          .badges-grid-premium { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <motion.div 
        className="profile-header-premium"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ maxWidth: "1200px", margin: "0 auto" }}
      >
        <h1>My Profile</h1>
        <p style={{ margin: "8px 0 0 0", fontSize: "15px", color: "var(--text-muted)" }}>Manage your account settings, achievements, and certificates</p>
      </motion.div>

      <div style={{ padding: "0 20px", maxWidth: "1200px", margin: "0 auto" }}>
        {/* Profile Info & Settings Section */}
        <div className="profile-layout-grid">
          {/* Left Column: Profile Card */}
          <motion.div 
            className="profile-card-premium"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
          >
            <div className="profile-avatar-premium">{initials}</div>
            <h2 style={{ margin: "0 0 12px 0", fontSize: "24px", fontWeight: "700", textAlign: "center" }}>{userData.name || "Loading..."}</h2>
            <div className={`role-badge-premium ${isAdmin ? "admin" : ""}`}>
              {isAdmin ? "Administrator" : "Student"}
            </div>
            <div style={{ width: "100%", borderTop: "1px solid var(--border-color)", paddingTop: "20px", marginTop: "12px" }}>
              <p style={{ margin: "0 0 4px 0", color: "var(--text-muted)", fontSize: "12px", fontWeight: "bold", textTransform: "uppercase" }}>Account ID</p>
              <p style={{ margin: 0, color: "var(--text-main)", fontSize: "13px", fontFamily: "monospace", wordBreak: "break-all" }}>{userData._id || "N/A"}</p>
            </div>
          </motion.div>

          {/* Right Column: Account Settings */}
          <motion.div 
            className="profile-card-premium"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <h3 style={{ marginTop: 0, fontSize: "20px", fontWeight: "700", marginBottom: "24px" }}>Account Information</h3>
            
            {isEditing ? (
              <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <label className="form-label-premium">Full Name</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} required className="form-input-premium" />
                </div>
                
                <div>
                  <label className="form-label-premium">Email Address</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required className="form-input-premium" />
                </div>

                {!isAdmin && (
                  <div>
                    <label className="form-label-premium">Weekly Study Goal (Hours)</label>
                    <input type="number" name="weeklyGoalHours" value={formData.weeklyGoalHours} onChange={handleChange} min="1" required className="form-input-premium" />
                  </div>
                )}

                <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                  <motion.button 
                    type="submit" 
                    className="btn-premium btn-premium-primary"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Save Changes
                  </motion.button>
                  <motion.button 
                    type="button" 
                    className="btn-premium btn-premium-secondary"
                    onClick={() => { setIsEditing(false); setFormData({ name: userData.name || "", email: userData.email || "", weeklyGoalHours: userData.weeklyGoalHours || 10 }); }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                </div>
              </form>
            ) : (
              <>
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  <div>
                    <label className="form-label-premium">Full Name</label>
                    <input type="text" value={userData.name || "N/A"} disabled className="form-input-premium" />
                  </div>
                  
                  <div>
                    <label className="form-label-premium">Email Address</label>
                    <input type="email" value={userData.email || "N/A"} disabled className="form-input-premium" />
                  </div>

                  {!isAdmin && (
                    <div>
                      <label className="form-label-premium">Weekly Study Goal (Hours)</label>
                      <input type="text" value={`${userData.weeklyGoalHours || 10} hours`} disabled className="form-input-premium" />
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                  <motion.button 
                    className="btn-premium btn-premium-primary"
                    onClick={() => setIsEditing(true)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Edit Profile
                  </motion.button>
                  <motion.button 
                    className="btn-premium btn-premium-danger"
                    onClick={handleLogout}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Logout
                  </motion.button>
                </div>
              </>
            )}

            {/* Notification Settings */}
            {!isAdmin && (
              <div className="settings-section-premium">
                <h3>Notification Settings</h3>
                <div className="setting-item-premium">
                  <div className="setting-item-label-premium">
                    <p>Study Reminders</p>
                    <p>Get browser notifications if you haven't studied for 3+ days.</p>
                  </div>
                  <motion.button
                    className={`btn-premium ${notifPermission === "granted" ? "btn-premium-primary" : "btn-premium-secondary"}`}
                    onClick={async () => {
                      if (notifPermission === "unsupported") {
                        toast.error("This browser does not support desktop notifications.");
                        return;
                      }
                      const permission = await Notification.requestPermission();
                      setNotifPermission(permission);
                      if (permission === "granted") {
                        toast.success("Notifications enabled! You'll receive study reminders.");
                      } else {
                        toast.error("Notifications disabled. Change this in browser settings.");
                      }
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {notifPermission === "granted" ? "✅ Enabled" : "Enable"}
                  </motion.button>
                </div>
              </div>
            )}

            {/* Appearance Settings */}
            <div className="settings-section-premium">
              <h3>Appearance Settings</h3>
              <div className="setting-item-premium">
                <div className="setting-item-label-premium">
                  <p>Dark Mode</p>
                  <p>Toggle dark mode for better viewing at night.</p>
                </div>
                <motion.button
                  className={`btn-premium ${theme === "dark" ? "btn-premium-primary" : "btn-premium-secondary"}`}
                  onClick={toggleTheme}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {theme === "dark" ? "✅ Dark Mode" : "Light Mode"}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* My Achievements Section */}
        {!isAdmin && (
          <motion.div 
            className="profile-card-premium"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{ marginBottom: "32px" }}
          >
            <h3 style={{ margin: "0 0 24px 0", fontSize: "20px", fontWeight: "700" }}>My Achievements</h3>
            <div className="badges-grid-premium">
              {BADGES.map((badge, idx) => {
                const unlocked = displayStreak >= badge.requiredStreak;
                return (
                  <motion.div 
                    key={idx} 
                    className={`badge-card-premium ${unlocked ? "unlocked" : ""}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: idx * 0.1 }}
                    whileHover={{ y: -8 }}
                  >
                    <div className="badge-icon-premium">{badge.icon}</div>
                    <h4 className="badge-title-premium">{badge.title}</h4>
                    <p className="badge-description-premium">{badge.description}</p>
                    {!unlocked && <p style={{ margin: "8px 0 0 0", fontSize: "11px", color: "var(--text-muted)" }}>Streak: {displayStreak}/{badge.requiredStreak}</p>}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* My Certificates Section */}
        {!isAdmin && (
          <motion.div 
            className="profile-card-premium"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            style={{ marginBottom: "32px" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
              <h3 style={{ margin: 0, fontSize: "20px", fontWeight: "700" }}>My Certificates</h3>
              <div style={{ position: "relative", overflow: "hidden", display: "inline-block" }}>
                <motion.button 
                  className="btn-premium btn-premium-primary"
                  disabled={isUploading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isUploading ? "Uploading..." : "+ Upload Certificate"}
                </motion.button>
                <input 
                  type="file" 
                  accept="image/*,application/pdf"
                  onChange={handleUploadCertificate}
                  disabled={isUploading}
                  title="Upload a new certificate"
                  style={{ position: "absolute", top: 0, left: 0, opacity: 0, width: "100%", height: "100%", cursor: isUploading ? "not-allowed" : "pointer" }}
                />
              </div>
            </div>

            <div className="certificates-grid-premium">
              {(Array.isArray(userData.certificates) && userData.certificates.length > 0) ? (
                userData.certificates.map((cert, idx) => (
                  <motion.div 
                    key={cert.id} 
                    className="certificate-card-premium"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    {cert.type?.includes("pdf") ? (
                      <div className="certificate-pdf-icon-premium">📄</div>
                    ) : (
                      <img src={cert.data} alt={cert.name} className="certificate-thumbnail-premium" />
                    )}
                    <p className="certificate-name-premium" title={cert.name}>{cert.name}</p>
                    <div className="certificate-actions-premium">
                      <motion.button 
                        className="certificate-btn-premium certificate-btn-view-premium"
                        onClick={() => { 
                          if (cert.type?.includes("pdf")) { 
                            const pdfWindow = window.open(""); 
                            pdfWindow.document.write(`<iframe width='100%' height='100%' style='border:none;margin:0;padding:0;' src='${cert.data}'></iframe>`); 
                            pdfWindow.document.body.style.margin = "0"; 
                          } else { 
                            const imgWindow = window.open(""); 
                            imgWindow.document.write(`<img src='${cert.data}' style='max-width:100%; display:block; margin:0 auto;'/>`); 
                            imgWindow.document.body.style.margin = "0"; 
                            imgWindow.document.body.style.backgroundColor = "#222"; 
                          } 
                        }}
                        whileHover={{ y: -2 }}
                        whileTap={{ y: 0 }}
                      >
                        View
                      </motion.button>
                      <motion.button 
                        className="certificate-btn-premium certificate-btn-download-premium"
                        onClick={() => handleDownloadCertificate(cert)}
                        whileHover={{ y: -2 }}
                        whileTap={{ y: 0 }}
                      >
                        Download
                      </motion.button>
                      <motion.button 
                        className="certificate-btn-premium certificate-btn-delete-premium"
                        onClick={() => handleDeleteCertificate(cert.id)}
                        whileHover={{ y: -2 }}
                        whileTap={{ y: 0 }}
                      >
                        Delete
                      </motion.button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="empty-state-premium">
                  <p>No certificates uploaded yet.</p>
                  <p>Upload PDFs or images to keep track of your achievements.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Data Export Section */}
        {!isAdmin && (
          <motion.div 
            className="profile-card-premium"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            style={{ marginBottom: "40px" }}
          >
            <h3 style={{ margin: "0 0 12px 0", fontSize: "20px", fontWeight: "700" }}>Data Export</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "20px", marginTop: 0 }}>Download your learning history and study notes for backup or analysis.</p>
            <div className="export-section-premium">
              <motion.button 
                className="export-btn-premium"
                onClick={handleExportCSV} 
                disabled={isExporting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isExporting ? "Exporting..." : "📊 Download CSV (Logs)"}
              </motion.button>
              <motion.button 
                className="export-btn-premium"
                onClick={handleExportMarkdown} 
                disabled={isExporting}
                style={{ background: "var(--bg-main)", color: "var(--text-main)", borderColor: "var(--border-color)" }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isExporting ? "Exporting..." : "📝 Download Markdown (Notes)"}
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default Profile;
