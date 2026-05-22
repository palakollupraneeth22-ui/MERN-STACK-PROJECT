import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/NavBar";
import API from "../services/api";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { useTheme } from "../useTheme";
import { motion } from "framer-motion";

export default function AddCourse() {
  useTheme();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [formData, setFormData] = useState({
    title: "",
    platform: "",
    category: "",
    difficulty: "Beginner",
    totalHours: "",
    thumbnail: "",
    description: "",
  });
  const [modules, setModules] = useState([]);
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [newLessons, setNewLessons] = useState({});
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [activeTab, setActiveTab] = useState("info");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token || !storedUser) {
      navigate("/login");
      return;
    }

    try {
      const user = JSON.parse(storedUser);
      const isAdmin = user?.isAdmin || user?.role === "admin" || user?.email === "admin@gmail.com";
      if (!isAdmin) {
        alert("Access Denied: Only administrators can add custom courses.");
        navigate("/dashboard");
      }
    } catch {
      navigate("/login");
    }
  }, [navigate]);

  const validateField = (name, value) => {
    const errors = { ...fieldErrors };
    
    if (name === "title") {
      if (!value.trim()) {
        errors.title = "Course title is required";
      } else if (value.trim().length < 3) {
        errors.title = "Title must be at least 3 characters";
      } else {
        delete errors.title;
      }
    }
    
    if (name === "platform") {
      if (!value.trim()) {
        errors.platform = "Platform is required";
      } else {
        delete errors.platform;
      }
    }
    
    if (name === "totalHours") {
      if (value && Number(value) <= 0) {
        errors.totalHours = "Hours must be greater than 0";
      } else {
        delete errors.totalHours;
      }
    }
    
    setFieldErrors(errors);
    return errors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    validateField(name, value);
    if (error) setError("");
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setFieldErrors({ ...fieldErrors, thumbnail: "Image must be less than 2MB" });
        return;
      }
      if (!file.type.startsWith("image/")) {
        setFieldErrors({ ...fieldErrors, thumbnail: "Please upload a valid image" });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, thumbnail: reader.result });
        setFieldErrors({ ...fieldErrors, thumbnail: "" });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddModule = () => {
    if (!newModuleTitle.trim()) return;
    setModules([
      ...modules,
      { id: `mod-${Date.now()}`, title: newModuleTitle.trim(), lessons: [] },
    ]);
    setNewModuleTitle("");
  };

  const handleRemoveModule = (modId) => {
    setModules(modules.filter((m) => m.id !== modId));
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const reordered = Array.from(modules);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setModules(reordered);
  };

  const handleLessonChange = (modId, field, value) => {
    setNewLessons({
      ...newLessons,
      [modId]: { ...newLessons[modId], [field]: value },
    });
  };

  const handleAddLesson = (modId) => {
    const lessonData = newLessons[modId];
    if (!lessonData || !lessonData.title?.trim() || !lessonData.duration) return;

    const videoUrl = lessonData.videoUrl?.trim() || "";
    if (videoUrl && !videoUrl.match(/youtube\.com|youtu\.be/)) {
      alert("Please enter a valid working YouTube URL for the lesson video.");
      return;
    }

    const updatedModules = modules.map((mod) => {
      if (mod.id === modId) {
        return {
          ...mod,
          lessons: [
            ...mod.lessons,
            {
              title: lessonData.title.trim(),
              duration: Number(lessonData.duration),
              videoUrl: videoUrl,
              completed: false,
            },
          ],
        };
      }
      return mod;
    });
    setModules(updatedModules);
    setNewLessons({ ...newLessons, [modId]: { title: "", duration: "", videoUrl: "" } });
  };

  const handleRemoveLesson = (modId, lessonIndex) => {
    setModules(modules.map((mod) => {
      if (mod.id === modId) {
        const updatedLessons = [...mod.lessons];
        updatedLessons.splice(lessonIndex, 1);
        return { ...mod, lessons: updatedLessons };
      }
      return mod;
    }));
  };

  const handleYoutubeImport = async (e) => {
    e.preventDefault();
    if (!youtubeUrl.trim()) return;

    setIsImporting(true);
    setError("");
    try {
      const res = await API.post(
        "/courses/import-youtube",
        { youtubeUrl }
      );

      setModules([...modules, ...res.data.modules]);
      setFormData((prev) => ({
        ...prev,
        title: prev.title || res.data.title,
        platform: prev.platform || res.data.platform,
      }));
      setYoutubeUrl("");
      setSuccess("✅ YouTube playlist imported successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to import YouTube playlist");
    } finally {
      setIsImporting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const errors = {};
    if (!formData.title.trim()) errors.title = "Course title is required";
    if (!formData.platform.trim()) errors.platform = "Platform is required";
    if (!formData.totalHours && !modules.some((mod) => mod.lessons.length > 0)) {
      errors.totalHours = "Please enter expected hours or add lessons";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Please fix the errors above before submitting");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication failed. Please log in again.");
        navigate("/login");
        return;
      }

      await API.post("/courses", { ...formData, modules });

      setSuccess("✅ Course created successfully! Redirecting...");
      setTimeout(() => navigate("/dashboard"), 2000);
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || "Failed to create course";
      setError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ backgroundColor: "var(--bg-main)", minHeight: "100vh", color: "var(--text-main)", paddingBottom: "50px" }}>
      <style>{`
        .add-course-container { padding: 40px 20px; max-width: 1000px; margin: 0 auto; }
        .course-form-card { background: var(--bg-card); border-radius: 16px; border: 1px solid var(--border-color); box-shadow: var(--shadow-md); overflow: hidden; }
        .form-header { background: linear-gradient(135deg, var(--primary), var(--primary-dark)); padding: 40px; color: white; }
        .form-body { padding: 40px; }
        .form-label { display: block; margin-bottom: 8px; font-weight: 600; font-size: 14px; color: var(--text-main); }
        .form-input { width: 100%; padding: 12px; border-radius: 8px; border: 1px solid var(--border-color); background-color: var(--bg-main); color: var(--text-main); font-size: 14px; outline: none; box-sizing: border-box; transition: all 0.3s ease; }
        .form-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(187, 134, 252, 0.1); }
        .action-btn { padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 14px; cursor: pointer; transition: all 0.3s ease; border: none; display: inline-flex; align-items: center; justify-content: center; gap: 8px; }
        .action-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
        .action-btn:active:not(:disabled) { transform: translateY(0); }
        .btn-primary { background: var(--primary); color: white; }
        .btn-secondary { background: var(--bg-main); color: var(--text-main); border: 1px solid var(--border-color); }
        .tab-btn { padding: 12px 24px; background: transparent; border: none; color: var(--text-muted); cursor: pointer; font-weight: 600; font-size: 15px; border-bottom: 3px solid transparent; transition: all 0.3s ease; margin-bottom: -1px; }
        .tab-btn.active { color: var(--primary); border-bottom-color: var(--primary); }
        .tab-btn:hover:not(.active) { color: var(--text-main); }
        .module-card { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; padding: 20px; margin-bottom: 16px; transition: all 0.2s ease; }
        .grid-2 { display: grid; grid-template-columns: repeat(2, minmax(220px, 1fr)); gap: 24px; }
        @media (max-width: 768px) {
          .add-course-container { padding: 20px 12px; }
          .form-header, .form-body { padding: 24px; }
          .grid-2 { grid-template-columns: 1fr !important; }
          .tab-btn { padding: 12px 16px; font-size: 14px; }
        }
      `}</style>
      <Navbar />

      <div className="add-course-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="course-form-card"
        >
          {/* Header */}
          <div className="form-header">
            <h1 style={{ margin: 0, fontSize: "32px", fontWeight: "800" }}>📚 Add Your First Course</h1>
            <p style={{ margin: "10px 0 0 0", color: "rgba(255,255,255,0.9)", fontSize: "16px" }}>Create a personalized learning track and start tracking your progress</p>
          </div>

          <div className="form-body">
            {/* Alerts */}
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ padding: "16px", backgroundColor: "var(--danger-light)", borderLeft: "4px solid var(--danger)", color: "var(--danger)", borderRadius: "0 8px 8px 0", marginBottom: "24px", fontWeight: "500", fontSize: "14px" }}
              >
                ⚠️ {error}
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ padding: "16px", backgroundColor: "var(--success-light)", borderLeft: "4px solid var(--success)", color: "var(--success)", borderRadius: "0 8px 8px 0", marginBottom: "24px", fontWeight: "500", fontSize: "14px" }}
              >
                {success}
              </motion.div>
            )}

            {/* Tab Navigation */}
            <div style={{ display: "flex", gap: "10px", borderBottom: "1px solid var(--border-color)", marginBottom: "30px", overflowX: "auto" }}>
              <button type="button" onClick={() => setActiveTab("info")} className={`tab-btn ${activeTab === "info" ? "active" : ""}`}>📋 Course Info</button>
              <button type="button" onClick={() => setActiveTab("syllabus")} className={`tab-btn ${activeTab === "syllabus" ? "active" : ""}`}>📖 Syllabus</button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
              {/* Info Tab */}
              {activeTab === "info" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  style={{ display: "flex", flexDirection: "column", gap: "24px" }}
                >
                  <div className="grid-2">
                    {/* Title */}
                    <div style={{ gridColumn: "1 / -1" }}>
                      <label className="form-label">Course Title <span style={{ color: "var(--danger)" }}>*</span></label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        className="form-input"
                        style={{ borderColor: fieldErrors.title ? "var(--danger)" : "var(--border-color)" }}
                        placeholder="e.g., Advanced React & Next.js Patterns"
                      />
                      {fieldErrors.title && <p style={{ color: "var(--danger)", fontSize: "13px", margin: "4px 0 0 0", fontWeight: "500" }}>✗ {fieldErrors.title}</p>}
                    </div>

                    {/* Platform */}
                    <div>
                      <label className="form-label">Platform <span style={{ color: "var(--danger)" }}>*</span></label>
                      <input
                        type="text"
                        name="platform"
                        value={formData.platform}
                        onChange={handleChange}
                        className="form-input"
                        style={{ borderColor: fieldErrors.platform ? "var(--danger)" : "var(--border-color)" }}
                        placeholder="Udemy, Coursera, YouTube, etc."
                      />
                      {fieldErrors.platform && <p style={{ color: "var(--danger)", fontSize: "13px", margin: "4px 0 0 0", fontWeight: "500" }}>✗ {fieldErrors.platform}</p>}
                    </div>

                    {/* Hours */}
                    <div>
                      <label className="form-label">Expected Hours <span style={{ color: "var(--danger)" }}>*</span></label>
                      <input
                        type="number"
                        name="totalHours"
                        min="1"
                        value={formData.totalHours}
                        onChange={handleChange}
                        className="form-input"
                        style={{ borderColor: fieldErrors.totalHours ? "var(--danger)" : "var(--border-color)" }}
                        placeholder="15"
                      />
                      {fieldErrors.totalHours && <p style={{ color: "var(--danger)", fontSize: "13px", margin: "4px 0 0 0", fontWeight: "500" }}>✗ {fieldErrors.totalHours}</p>}
                    </div>

                    {/* Category */}
                    <div>
                      <label className="form-label">Category</label>
                      <input
                        type="text"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="form-input"
                        placeholder="Web Development, Design, etc."
                      />
                    </div>

                    {/* Difficulty */}
                    <div>
                      <label className="form-label">Difficulty</label>
                      <select
                        name="difficulty"
                        value={formData.difficulty}
                        onChange={handleChange}
                        className="form-input"
                      >
                        <option value="Beginner">🌱 Beginner</option>
                        <option value="Intermediate">📈 Intermediate</option>
                        <option value="Advanced">🚀 Advanced</option>
                      </select>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="form-label">Course Description</label>
                    <textarea
                      name="description"
                      rows="4"
                      value={formData.description}
                      onChange={handleChange}
                      className="form-input"
                      style={{ resize: "vertical" }}
                      placeholder="What will you learn? Key topics and skills..."
                    ></textarea>
                  </div>

                  {/* Thumbnail */}
                  <div>
                    <label className="form-label">Course Thumbnail (Optional)</label>
                    <div style={{ display: "flex", gap: "16px", alignItems: "flex-start", flexWrap: "wrap" }}>
                      <div style={{ flex: 1, minWidth: "250px" }}>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="form-input"
                          style={{ padding: "8px" }}
                        />
                        {fieldErrors.thumbnail && <p style={{ color: "var(--danger)", fontSize: "13px", margin: "4px 0 0 0", fontWeight: "500" }}>✗ {fieldErrors.thumbnail}</p>}
                      </div>
                      {formData.thumbnail && (
                        <div style={{ width: "160px", height: "120px", borderRadius: "8px", overflow: "hidden", border: "2px solid var(--primary-light)", flexShrink: 0 }}>
                          <img src={formData.thumbnail} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* YouTube Import */}
                  <div style={{ background: "var(--primary-light)", padding: "24px", borderRadius: "12px", border: "1px solid var(--primary)", marginTop: "10px" }}>
                    <h3 style={{ margin: "0 0 10px 0", color: "var(--primary-dark)", fontSize: "18px", display: "flex", alignItems: "center", gap: "8px" }}>🎥 Quick Import from YouTube</h3>
                    <p style={{ margin: "0 0 16px 0", color: "var(--primary)", fontSize: "14px" }}>Import a YouTube playlist to auto-generate modules and lessons</p>
                    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                      <input
                        type="text"
                        placeholder="https://youtube.com/playlist?list=..."
                        value={youtubeUrl}
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                        className="form-input"
                        style={{ flex: 1, minWidth: "250px" }}
                      />
                      <button
                        type="button"
                        onClick={handleYoutubeImport}
                        disabled={isImporting || !youtubeUrl}
                        className="action-btn btn-primary"
                        style={{ backgroundColor: isImporting || !youtubeUrl ? "var(--primary-disabled)" : "var(--primary)", cursor: isImporting || !youtubeUrl ? "not-allowed" : "pointer" }}
                      >
                        {isImporting ? "🔄 Importing..." : "📥 Import Playlist"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Syllabus Tab */}
              {activeTab === "syllabus" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  style={{ display: "flex", flexDirection: "column", gap: "24px" }}
                >
                  <div style={{ background: "var(--bg-main)", border: "1px solid var(--border-color)", padding: "24px", borderRadius: "12px" }}>
                    <h3 style={{ margin: "0 0 10px 0", fontSize: "18px", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
                      📖 Build Your Syllabus <span style={{ fontSize: "12px", background: "var(--primary-light)", color: "var(--primary-dark)", padding: "2px 8px", borderRadius: "12px", fontWeight: "normal" }}>(Optional)</span>
                    </h3>
                    <p style={{ margin: "0 0 20px 0", color: "var(--text-muted)", fontSize: "14px" }}>Organize your course into modules and lessons. Drag to reorder.</p>
                    
                    <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
                      <input
                        type="text"
                        placeholder="Module title (e.g., Section 1: React Basics)"
                        value={newModuleTitle}
                        onChange={(e) => setNewModuleTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddModule();
                          }
                        }}
                        className="form-input"
                        style={{ flex: 1, minWidth: "250px" }}
                      />
                      <button
                        type="button"
                        onClick={handleAddModule}
                         className="action-btn btn-primary"
                      >
                        ➕ Add Module
                      </button>
                    </div>

                    {/* Modules List */}
                    {modules.length > 0 ? (
                      <DragDropContext onDragEnd={onDragEnd}>
                        <Droppable droppableId="modules-list">
                          {(provided) => (
                            <div
                              {...provided.droppableProps}
                              ref={provided.innerRef}
                              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
                            >
                              {modules.map((mod, index) => (
                                <Draggable key={mod.id} draggableId={mod.id} index={index}>
                                  {(provided, snapshot) => (
                                    <motion.div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      className="module-card"
                                      style={{ border: snapshot.isDragging ? "2px solid var(--primary)" : "1px solid var(--border-color)", transform: snapshot.isDragging ? "scale(1.02)" : "scale(1)" }}
                                    >
                                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid var(--border-color)" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, flexWrap: "wrap" }}>
                                          <div {...provided.dragHandleProps} style={{ color: "var(--text-muted)", cursor: "grab", fontSize: "18px" }}>☰</div>
                                          <h4 style={{ margin: 0, fontWeight: "bold", fontSize: "16px", color: "var(--text-main)" }}>{mod.title}</h4>
                                          <span style={{ fontSize: "12px", background: "var(--bg-main)", color: "var(--text-muted)", padding: "4px 10px", borderRadius: "12px", border: "1px solid var(--border-color)" }}>{mod.lessons.length} lessons</span>
                                        </div>
                                        <button type="button" onClick={() => handleRemoveModule(mod.id)} style={{ background: "transparent", border: "none", color: "var(--danger)", cursor: "pointer", fontSize: "18px" }}>🗑️</button>
                                      </div>

                                      {/* Lessons */}
                                      {Array.isArray(mod.lessons) && mod.lessons.length > 0 && (
                                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginLeft: "28px", marginBottom: "16px" }}>
                                          {mod.lessons.map((lesson, lIdx) => (
                                            <div key={lIdx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-main)", border: "1px solid var(--border-color)", padding: "10px 16px", borderRadius: "8px" }}>
                                              <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", flex: 1 }}>
                                                <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--primary)" }}></span>
                                                <span style={{ fontSize: "14px", fontWeight: "500", color: "var(--text-main)" }}>{lesson.title}</span>
                                                <span style={{ fontSize: "12px", backgroundColor: "var(--bg-card)", color: "var(--text-muted)", padding: "2px 8px", borderRadius: "4px", border: "1px solid var(--border-color)" }}>{lesson.duration}m</span>
                                                {lesson.videoUrl && (
                                                  <span style={{ fontSize: "12px", backgroundColor: "var(--primary-light)", color: "var(--primary-dark)", padding: "2px 8px", borderRadius: "4px", display: "flex", alignItems: "center", gap: "4px" }}>▶️ Video</span>
                                                )}
                                              </div>
                                              <button
                                                type="button"
                                                onClick={() => handleRemoveLesson(mod.id, lIdx)}
                                                style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "16px" }}
                                                onMouseEnter={(e) => e.target.style.color="var(--danger)"}
                                                onMouseLeave={(e) => e.target.style.color="var(--text-muted)"}
                                              >
                                                ✕
                                              </button>
                                            </div>
                                          ))}
                                        </div>
                                      )}

                                      {/* Add Lesson Form */}
                                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginLeft: "28px", background: "var(--bg-main)", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                                        <input
                                          type="text"
                                          placeholder="Lesson title"
                                          value={newLessons[mod.id]?.title || ""}
                                          onChange={(e) =>
                                            handleLessonChange(mod.id, "title", e.target.value)
                                          }
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                              e.preventDefault();
                                              handleAddLesson(mod.id);
                                            }
                                          }}
                                          className="form-input"
                                          style={{ flex: 1, minWidth: "150px" }}
                                        />
                                        <input
                                          type="number"
                                          placeholder="Minutes"
                                          value={newLessons[mod.id]?.duration || ""}
                                          onChange={(e) =>
                                            handleLessonChange(mod.id, "duration", e.target.value)
                                          }
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                              e.preventDefault();
                                              handleAddLesson(mod.id);
                                            }
                                          }}
                                          min="1"
                                          className="form-input"
                                          style={{ width: "80px" }}
                                        />
                                        <input
                                          type="text"
                                          placeholder="YouTube Video URL (opt)"
                                          value={newLessons[mod.id]?.videoUrl || ""}
                                          onChange={(e) =>
                                            handleLessonChange(mod.id, "videoUrl", e.target.value)
                                          }
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                              e.preventDefault();
                                              handleAddLesson(mod.id);
                                            }
                                          }}
                                          className="form-input"
                                          style={{ flex: 1, minWidth: "150px" }}
                                        />
                                        <button
                                          type="button"
                                          onClick={() => handleAddLesson(mod.id)}
                                          className="action-btn"
                                          style={{ background: "var(--primary-light)", color: "var(--primary-dark)", border: "none" }}
                                        >
                                          ➕
                                        </button>
                                      </div>
                                    </motion.div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </DragDropContext>
                    ) : (
                      <div style={{ textAlign: "center", padding: "40px", backgroundColor: "var(--bg-main)", borderRadius: "12px", border: "2px dashed var(--border-color)" }}>
                        <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "14px" }}>No modules yet. Create one above to get started!</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Submit Buttons */}
              <div style={{ marginTop: "40px", paddingTop: "24px", borderTop: "1px solid var(--border-color)", display: "flex", justifyContent: "flex-end", gap: "16px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => navigate("/dashboard")}
                  className="action-btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="action-btn btn-primary"
                  style={{ backgroundColor: isSubmitting ? "var(--primary-disabled)" : "var(--primary)", cursor: isSubmitting ? "not-allowed" : "pointer" }}
                >
                  {isSubmitting ? "💾 Saving..." : "✅ Create Course"}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
