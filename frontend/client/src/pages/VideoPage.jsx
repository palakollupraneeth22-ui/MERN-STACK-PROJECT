import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import VideoPlayer from "../components/VideoPlayer";
import API from "../services/api";
import Navbar from "../components/NavBar";
import { useTheme } from "../useTheme";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Play,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Sparkles,
  FileText,
} from "lucide-react";
import "./DashBoard.css";

export default function VideoPage() {
  useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const courseId = searchParams.get("courseId");
  const mIndex = Number(searchParams.get("mIndex") || 0);
  const lIndex = Number(searchParams.get("lIndex") || 0);

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notes, setNotes] = useState("");
  const [notesSaved, setNotesSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentMIndex, setCurrentMIndex] = useState(mIndex);
  const [currentLIndex, setCurrentLIndex] = useState(lIndex);
  const [startTime] = useState(Date.now());

  // Fetch the course data
  useEffect(() => {
    if (!courseId) {
      setError("No course specified.");
      setLoading(false);
      return;
    }
    const fetchCourse = async () => {
      try {
        const res = await API.get(`/courses/${courseId}`);
        const c = res.data.course || res.data;
        setCourse(c);
        setNotes(c.notes || "");
      } catch (err) {
        console.error("Failed to load course:", err);
        setError("Failed to load course. Please go back and try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [courseId]);

  // Current lesson data
  const currentModule = course?.modules?.[currentMIndex];
  const currentLesson = currentModule?.lessons?.[currentLIndex];
  const videoUrl = currentLesson?.videoUrl || "";
  const lessonTitle = currentLesson?.title || "Lesson";

  // Total lessons count
  const totalLessons = course?.modules?.reduce(
    (acc, mod) => acc + (mod.lessons?.length || 0),
    0
  ) || 0;
  const completedLessons = course?.modules?.reduce(
    (acc, mod) =>
      acc + (mod.lessons?.filter((l) => l.completed)?.length || 0),
    0
  ) || 0;

  // Flatten lessons for prev/next navigation
  const flatLessons = [];
  if (course?.modules) {
    course.modules.forEach((mod, mi) => {
      if (mod.lessons) {
        mod.lessons.forEach((lesson, li) => {
          flatLessons.push({ mIndex: mi, lIndex: li, lesson, moduleTitle: mod.title });
        });
      }
    });
  }
  const currentFlatIndex = flatLessons.findIndex(
    (fl) => fl.mIndex === currentMIndex && fl.lIndex === currentLIndex
  );
  const hasPrev = currentFlatIndex > 0;
  const hasNext = currentFlatIndex < flatLessons.length - 1;

  const goToLesson = (flatIdx) => {
    const target = flatLessons[flatIdx];
    if (target) {
      setCurrentMIndex(target.mIndex);
      setCurrentLIndex(target.lIndex);
    }
  };

  // Update course on server
  const updateCourse = useCallback(
    async (updateData) => {
      try {
        const res = await API.put(`/courses/${courseId}`, updateData);
        const updated = res.data.course || res.data;
        setCourse(updated);
        return updated;
      } catch (err) {
        console.error("Failed to update course:", err);
      }
    },
    [courseId]
  );

  // Mark lesson completed
  const handleMarkComplete = async (completed) => {
    if (!course?.modules) return;
    const copyModules = JSON.parse(JSON.stringify(course.modules));
    const lesson = copyModules[currentMIndex]?.lessons?.[currentLIndex];
    if (!lesson) return;

    lesson.completed = completed;
    lesson.completedAt = completed ? new Date().toISOString() : null;

    let totalDuration = 0;
    let completedDuration = 0;
    let totalL = 0;
    let completedL = 0;
    copyModules.forEach((m) => {
      if (Array.isArray(m.lessons)) {
        m.lessons.forEach((l) => {
          totalL++;
          const d = Number(l.duration) || 0;
          totalDuration += d;
          if (l.completed) {
            completedL++;
            completedDuration += d;
          }
        });
      }
    });

    const calcProgress =
      totalDuration > 0
        ? Math.round((completedDuration / totalDuration) * 100)
        : totalL > 0
        ? Math.round((completedL / totalL) * 100)
        : course.progress || 0;

    const updates = { modules: copyModules, progress: calcProgress };
    if (calcProgress === 100) updates.status = "Completed";
    else if (calcProgress > 0 && calcProgress < 100) updates.status = "In Progress";
    else if (calcProgress === 0) updates.status = "Not Started";

    await updateCourse(updates);
  };

  // Save notes
  const handleSaveNotes = async () => {
    setIsSaving(true);
    try {
      await updateCourse({ notes });
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  // Add timestamp to notes
  const handleAddTimestamp = () => {
    const dStr = new Date().toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
    const header = `\n--- 📝 Session: ${dStr} ---\n`;
    setNotes((prev) => (!prev ? header.trimStart() : prev + header));
  };

  // Auto-log study time when navigating away
  useEffect(() => {
    return () => {
      if (!courseId) return;
      const secs = Math.floor((Date.now() - startTime) / 1000);
      if (secs >= 15) {
        const mins = Math.max(1, Math.round(secs / 60));
        API.put(`/courses/${courseId}`, {
          timeSpent: (course?.timeSpent || 0) + secs,
          newLog: {
            date: new Date(),
            duration: mins,
            notes: `Studied: watched ${lessonTitle}`,
          },
        }).catch((e) => console.error("Error auto logging video play", e));
      }
    };
  }, []);

  // Handle video end — auto mark complete
  const handleVideoEnd = () => {
    handleMarkComplete(true);
  };

  // Go back to dashboard
  const handleBack = () => {
    navigate("/dashboard");
  };

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "var(--bg-main)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: "center" }}
        >
          <div style={{
            width: "48px",
            height: "48px",
            border: "3px solid rgba(99, 102, 241, 0.2)",
            borderTop: "3px solid var(--primary)",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            margin: "0 auto 16px",
          }} />
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Loading lesson...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </motion.div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "var(--bg-main)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
      }}>
        <div style={{ textAlign: "center" }}>
          <h2 style={{ marginBottom: "12px" }}>⚠️ {error || "Course not found"}</h2>
          <button
            onClick={handleBack}
            style={{
              padding: "12px 24px",
              background: "var(--primary)",
              color: "white",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              fontWeight: "700",
              fontSize: "14px",
            }}
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const isCompleted = currentLesson?.completed || false;
  const progress = course.progress || 0;

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg-main)",
      color: "white",
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
    }}>
      <Navbar />

      <div style={{ padding: "20px 24px 60px", maxWidth: "1400px", margin: "0 auto" }}>
        {/* Top Navigation Bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            marginBottom: "24px",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={handleBack}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 18px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "12px",
              color: "white",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "600",
              transition: "all 0.2s",
            }}
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>

          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}>
            <div style={{
              padding: "6px 14px",
              background: "rgba(99, 102, 241, 0.1)",
              border: "1px solid rgba(99, 102, 241, 0.2)",
              borderRadius: "10px",
              fontSize: "12px",
              fontWeight: "700",
              color: "var(--primary-light)",
            }}>
              <BookOpen size={12} style={{ marginRight: "6px", verticalAlign: "middle" }} />
              {completedLessons}/{totalLessons} Lessons
            </div>
            <div style={{
              padding: "6px 14px",
              background: progress === 100 ? "rgba(16, 185, 129, 0.1)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${progress === 100 ? "rgba(16, 185, 129, 0.2)" : "rgba(255,255,255,0.08)"}`,
              borderRadius: "10px",
              fontSize: "12px",
              fontWeight: "700",
              color: progress === 100 ? "#10b981" : "var(--text-muted)",
            }}>
              {progress}% Complete
            </div>
          </div>
        </motion.div>

        {/* Course Title */}
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          style={{ marginBottom: "20px" }}
        >
          <h1 style={{
            margin: "0 0 6px 0",
            fontSize: "22px",
            fontWeight: "800",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}>
            <Play size={20} color="var(--primary)" />
            {course.title}
          </h1>
          <p style={{
            margin: 0,
            fontSize: "13px",
            color: "var(--text-muted)",
          }}>
            Module: {currentModule?.title || "Unknown"} &bull; Lesson {currentLIndex + 1}
          </p>
        </motion.div>

        {/* Main Layout: Video + Sidebar */}
        <div className="video-page-layout">
          {/* Left Column — Video Player & Controls */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            {/* Video Player Container */}
            <div style={{
              borderRadius: "16px",
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.06)",
              background: "#000",
              aspectRatio: "16/9",
              position: "relative",
            }}>
              {videoUrl ? (
                <VideoPlayer
                  videoUrl={videoUrl}
                  lessonTitle={lessonTitle}
                  onVideoEnd={handleVideoEnd}
                  autoPlay={true}
                />
              ) : (
                <div style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  gap: "12px",
                  color: "var(--text-muted)",
                  minHeight: "400px",
                }}>
                  <Play size={48} />
                  <p style={{ fontSize: "14px" }}>No video available for this lesson</p>
                </div>
              )}
            </div>

            {/* Lesson Info Bar */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "rgba(15, 23, 42, 0.6)",
              backdropFilter: "blur(12px)",
              padding: "16px 20px",
              borderRadius: "14px",
              border: "1px solid rgba(255,255,255,0.06)",
              flexWrap: "wrap",
              gap: "12px",
            }}>
              <div style={{ flex: 1, minWidth: "200px" }}>
                <span style={{
                  fontWeight: "700",
                  fontSize: "15px",
                  color: "white",
                  display: "block",
                  marginBottom: "4px",
                }}>
                  {lessonTitle}
                </span>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  <Clock size={11} style={{ marginRight: "4px", verticalAlign: "middle" }} />
                  {currentLesson?.duration || 0} min &bull; {currentModule?.title}
                </span>
              </div>

              <button
                onClick={() => handleMarkComplete(!isCompleted)}
                style={{
                  padding: "10px 20px",
                  borderRadius: "10px",
                  background: isCompleted
                    ? "rgba(16, 185, 129, 0.12)"
                    : "linear-gradient(135deg, var(--primary), var(--primary-dark))",
                  color: isCompleted ? "#10b981" : "white",
                  border: isCompleted
                    ? "1px solid rgba(16, 185, 129, 0.3)"
                    : "none",
                  fontWeight: "700",
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.2s",
                }}
              >
                <CheckCircle2 size={15} />
                {isCompleted ? "Completed ✓" : "Mark Completed"}
              </button>
            </div>

            {/* Prev / Next Navigation */}
            <div style={{
              display: "flex",
              gap: "10px",
              justifyContent: "space-between",
            }}>
              <button
                onClick={() => hasPrev && goToLesson(currentFlatIndex - 1)}
                disabled={!hasPrev}
                style={{
                  flex: 1,
                  padding: "12px 18px",
                  borderRadius: "12px",
                  background: hasPrev ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  color: hasPrev ? "white" : "rgba(255,255,255,0.2)",
                  cursor: hasPrev ? "pointer" : "not-allowed",
                  fontWeight: "600",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "all 0.2s",
                }}
              >
                <ChevronLeft size={16} />
                Previous Lesson
              </button>
              <button
                onClick={() => hasNext && goToLesson(currentFlatIndex + 1)}
                disabled={!hasNext}
                style={{
                  flex: 1,
                  padding: "12px 18px",
                  borderRadius: "12px",
                  background: hasNext
                    ? "linear-gradient(135deg, var(--primary), var(--primary-dark))"
                    : "rgba(255,255,255,0.02)",
                  border: hasNext ? "none" : "1px solid rgba(255,255,255,0.06)",
                  color: hasNext ? "white" : "rgba(255,255,255,0.2)",
                  cursor: hasNext ? "pointer" : "not-allowed",
                  fontWeight: "700",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "all 0.2s",
                }}
              >
                Next Lesson
                <ChevronRight size={16} />
              </button>
            </div>
          </motion.div>

          {/* Right Column — Module Outline + Notes */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            {/* Course Module Outline */}
            <div style={{
              background: "rgba(15, 23, 42, 0.5)",
              backdropFilter: "blur(12px)",
              borderRadius: "16px",
              border: "1px solid rgba(255,255,255,0.06)",
              overflow: "hidden",
              maxHeight: "420px",
              overflowY: "auto",
            }}>
              <div style={{
                padding: "16px 20px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                position: "sticky",
                top: 0,
                background: "rgba(15, 23, 42, 0.95)",
                backdropFilter: "blur(12px)",
                zIndex: 2,
              }}>
                <BookOpen size={15} color="var(--primary)" />
                <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "700" }}>
                  Course Outline
                </h3>
              </div>

              <div style={{ padding: "8px 12px" }}>
                {course.modules?.map((mod, mi) => (
                  <div key={mi} style={{ marginBottom: "8px" }}>
                    <div style={{
                      padding: "10px 12px",
                      fontSize: "12px",
                      fontWeight: "800",
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}>
                      {mod.title}
                    </div>
                    {mod.lessons?.map((lesson, li) => {
                      const isCurrent = mi === currentMIndex && li === currentLIndex;
                      return (
                        <button
                          key={li}
                          onClick={() => {
                            if (lesson.videoUrl) {
                              setCurrentMIndex(mi);
                              setCurrentLIndex(li);
                            }
                          }}
                          style={{
                            width: "100%",
                            padding: "10px 14px",
                            background: isCurrent
                              ? "rgba(99, 102, 241, 0.12)"
                              : "transparent",
                            border: isCurrent
                              ? "1px solid rgba(99, 102, 241, 0.25)"
                              : "1px solid transparent",
                            borderRadius: "10px",
                            color: isCurrent
                              ? "white"
                              : lesson.completed
                              ? "rgba(255,255,255,0.4)"
                              : "rgba(255,255,255,0.75)",
                            cursor: lesson.videoUrl ? "pointer" : "default",
                            textAlign: "left",
                            fontSize: "13px",
                            fontWeight: isCurrent ? "700" : "500",
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            transition: "all 0.15s",
                            marginBottom: "2px",
                          }}
                        >
                          {lesson.completed ? (
                            <CheckCircle2 size={14} color="#10b981" />
                          ) : isCurrent ? (
                            <Play size={14} color="var(--primary)" fill="var(--primary)" />
                          ) : (
                            <div style={{
                              width: "14px",
                              height: "14px",
                              borderRadius: "50%",
                              border: "1.5px solid rgba(255,255,255,0.15)",
                              flexShrink: 0,
                            }} />
                          )}
                          <span style={{
                            flex: 1,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            textDecoration: lesson.completed && !isCurrent ? "line-through" : "none",
                          }}>
                            {lesson.title}
                          </span>
                          <span style={{
                            fontSize: "11px",
                            color: "rgba(255,255,255,0.25)",
                            flexShrink: 0,
                          }}>
                            {lesson.duration}m
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Notes Panel */}
            <div style={{
              background: "rgba(15, 23, 42, 0.5)",
              backdropFilter: "blur(12px)",
              borderRadius: "16px",
              border: "1px solid rgba(255,255,255,0.06)",
              padding: "18px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}>
                <h4 style={{
                  margin: 0,
                  fontWeight: "700",
                  fontSize: "14px",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}>
                  <FileText size={14} color="var(--primary)" />
                  Focus Notes
                </h4>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    onClick={handleAddTimestamp}
                    style={{
                      padding: "5px 10px",
                      background: "rgba(255,255,255,0.04)",
                      color: "var(--text-muted)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: "8px",
                      fontSize: "11px",
                      fontWeight: "bold",
                      cursor: "pointer",
                    }}
                  >
                    + Timestamp
                  </button>
                  <button
                    onClick={handleSaveNotes}
                    disabled={isSaving}
                    style={{
                      padding: "5px 12px",
                      background: "var(--primary)",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "11px",
                      fontWeight: "bold",
                      cursor: "pointer",
                    }}
                  >
                    {isSaving ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Take notes while you watch..."
                style={{
                  width: "100%",
                  minHeight: "160px",
                  background: "rgba(0,0,0,0.2)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "10px",
                  color: "white",
                  padding: "12px",
                  outline: "none",
                  fontSize: "13px",
                  fontFamily: "inherit",
                  resize: "vertical",
                  boxSizing: "border-box",
                }}
              />
              {notesSaved && (
                <span style={{
                  color: "#10b981",
                  fontSize: "12px",
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}>
                  <Sparkles size={12} /> Notes saved!
                </span>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
