import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import LessonTracker from "./LessonTracker";
import Confetti from "react-confetti";
import { toast } from "react-hot-toast";
import "./CourseCard.css";

const WORK_TIME = 25 * 60;
const BREAK_TIME = 5 * 60;

function CourseCard({ course, onDelete, onUpdate, onPlayVideo }) {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [newProgress, setNewProgress] = useState(course.progress || 0);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [timerActive, setTimerActive] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [manualTime, setManualTime] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState(course.notes || "");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [sessionNotes, setSessionNotes] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  
  // Pomodoro State
  const [timerMode, setTimerMode] = useState("stopwatch"); // "stopwatch" or "pomodoro"
  const [pomodoroPhase, setPomodoroPhase] = useState("work"); // "work" or "break"
  const [pomodoroSecondsLeft, setPomodoroSecondsLeft] = useState(WORK_TIME);

  // Celebration & Achievement State
  const [achievement, setAchievement] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const stored = localStorage.getItem("soundEnabled");
    return stored !== null ? JSON.parse(stored) : true;
  });

  // Refs for tracking previous state to trigger animations
  const prevProgressRef = useRef(course.progress || 0);
  const prevModulesRef = useRef(course.modules || []);
  
  const courseRef = useRef(course);
  useEffect(() => { courseRef.current = course; }, [course]);

  const sessionTimeRef = useRef(sessionTime);
  const pomodoroSecondsLeftRef = useRef(pomodoroSecondsLeft);

  useEffect(() => {
    sessionTimeRef.current = sessionTime;
  }, [sessionTime]);

  useEffect(() => {
    pomodoroSecondsLeftRef.current = pomodoroSecondsLeft;
  }, [pomodoroSecondsLeft]);

  const triggerAchievement = useCallback((title, message) => {
    setAchievement({ title, message });
    if (soundEnabled) {
      // Play a satisfying success chime
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3");
      audio.play().catch((e) => console.log('Audio autoplay blocked by browser:', e));
    }
  }, [soundEnabled]);

  useEffect(() => {
    const currentProgress = course.progress || 0;
    const prevProgress = prevProgressRef.current;

    if (currentProgress === 100 && prevProgress < 100) {
      triggerAchievement("Course Completed!", `You successfully finished "${course.title}". Amazing work!`);
    } else if (course.modules && prevModulesRef.current) {
      let completedModuleTitle = null;
      course.modules.forEach((mod, idx) => {
        const prevMod = prevModulesRef.current[idx];
        if (mod && prevMod && mod.lessons && prevMod.lessons) {
          const isNowComplete = mod.lessons.length > 0 && mod.lessons.every(l => l.completed);
          const wasComplete = prevMod.lessons.length > 0 && prevMod.lessons.every(l => l.completed);
          if (isNowComplete && !wasComplete && currentProgress < 100) {
            completedModuleTitle = mod.title;
          }
        }
      });
      if (completedModuleTitle) {
        triggerAchievement("Module Completed!", `Great job finishing "${completedModuleTitle}". Keep up the momentum!`);
      }
    }

    prevProgressRef.current = currentProgress;
    prevModulesRef.current = course.modules || [];
  }, [course.progress, course.modules, course.title, triggerAchievement]);

  // Safely switch between Stopwatch and Pomodoro modes without losing data
  const handleModeSwitch = (newMode) => {
    if (timerMode === newMode) return;
    
    const hasUnsavedStopwatchTime = sessionTime > 0;
    const hasUnsavedPomodoroTime = timerMode === "pomodoro" && pomodoroPhase === "work" && pomodoroSecondsLeft < WORK_TIME;
    
    if (hasUnsavedStopwatchTime || hasUnsavedPomodoroTime) {
      if (!window.confirm("You have unsaved logged time. Switching modes will discard it. Continue?")) {
        return;
      }
    }
    
    setTimerMode(newMode);
    setTimerActive(false);
    setSessionTime(0);
    setPomodoroPhase("work");
    setPomodoroSecondsLeft(WORK_TIME);
  };

  // Handle Stopwatch Timer
  useEffect(() => {
    let interval = null;
    if (timerActive) {
      const startTime = Date.now();
      const initialSessionTime = sessionTimeRef.current;
      const initialPomodoroTime = pomodoroSecondsLeftRef.current;

      interval = setInterval(() => {
        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        
        if (timerMode === "stopwatch") {
          setSessionTime(initialSessionTime + elapsedSeconds);
        } else {
          const left = initialPomodoroTime - elapsedSeconds;
          if (left <= 0) {
            setTimerActive(false);
            setPomodoroSecondsLeft(0);
            
            if (soundEnabled) {
              const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
              audio.play().catch(() => {});
            }

            if (pomodoroPhase === "work") {
               const currentTotal = courseRef.current.timeSpent || 0;
               onUpdate({ 
                 timeSpent: currentTotal + WORK_TIME,
                 newLog: {
                   date: new Date(),
                   duration: Math.round(WORK_TIME / 60),
                   notes: "Completed Pomodoro Session 🍅"
                 }
               }).then(() => {
                  setPomodoroPhase("break");
                  setPomodoroSecondsLeft(BREAK_TIME);
                  triggerAchievement("Pomodoro Complete! 🍅", "25 minutes logged! Take a well-deserved 5-minute break.");
               }).catch(err => {
                  console.error("Failed to log Pomodoro session:", err);
               });
            } else {
               setPomodoroPhase("work");
               setPomodoroSecondsLeft(WORK_TIME);
               triggerAchievement("Break Over! 🔔", "Ready to focus again? Start the timer when you're ready.");
            }
          } else {
            setPomodoroSecondsLeft(left);
          }
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, timerMode, pomodoroPhase, soundEnabled, onUpdate, triggerAchievement]);

  // Prevent accidental navigation if there is unsaved session time
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      const hasUnsavedStopwatchTime = sessionTime > 0;
      const hasUnsavedPomodoroTime = timerMode === "pomodoro" && pomodoroPhase === "work" && pomodoroSecondsLeft < WORK_TIME;

      if (hasUnsavedStopwatchTime || hasUnsavedPomodoroTime) {
        e.preventDefault();
        e.returnValue = "You have unsaved logged time. Are you sure you want to leave?";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [sessionTime, timerMode, pomodoroPhase, pomodoroSecondsLeft]);

  const formatStopwatch = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) {
      return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const formatLoggedTime = (totalSeconds) => {
    if (!totalSeconds) return "0h 0m";
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const handleOpenLogModal = () => {
    setTimerActive(false);
    setShowLogModal(true);
  };

  const handleConfirmLog = async () => {
    setIsUpdating(true);
    try {
      const currentTotal = course.timeSpent || 0;
      let loggedSeconds = 0;
      
      if (timerMode === "stopwatch") {
         loggedSeconds = sessionTime;
      } else {
         loggedSeconds = pomodoroPhase === "work" ? (WORK_TIME - pomodoroSecondsLeft) : 0;
      }

      const hasNotes = sessionNotes.trim().length > 0;
      if (loggedSeconds === 0 && !hasNotes) {
        setTimerActive(false);
        setShowLogModal(false);
        return;
      }

      const updateData = {};
      if (loggedSeconds > 0) {
        updateData.timeSpent = currentTotal + loggedSeconds;
      }
      
      if (loggedSeconds > 0 || hasNotes) {
        updateData.newLog = {
          date: new Date(),
          duration: Math.max(1, Math.round(loggedSeconds / 60)),
          notes: sessionNotes
        };
      }
      
      await onUpdate(updateData);
      
      if (timerMode === "stopwatch") {
        setSessionTime(0);
      } else {
        setPomodoroSecondsLeft(pomodoroPhase === "work" ? WORK_TIME : BREAK_TIME);
      }
      
      setTimerActive(false);
      setShowLogModal(false);
      setSessionNotes("");
      triggerAchievement("Session Logged!", `You've successfully logged ${Math.max(1, Math.round(loggedSeconds / 60))} minutes.`);
    } finally {
      setIsUpdating(false);
    }
  };

  // Automatically injects a formatted timestamp header into the rich-text editor
  const handleAddSessionEntry = () => {
    const dateStr = new Date().toLocaleString('en-US', { 
      weekday: 'short', month: 'short', day: 'numeric', 
      hour: 'numeric', minute: '2-digit' 
    });
    const header = `\n--- 📝 Session: ${dateStr} ---\n`;
    
    setNotes(prev => (!prev ? header.trimStart() : prev + header));
  };

  const logAdditionalTime = async (mins) => {
    if (!mins || mins <= 0) return;
    setIsUpdating(true);
    try {
      const currentTotal = course.timeSpent || 0;
      await onUpdate({ 
        timeSpent: currentTotal + Math.round(mins * 60),
        newLog: {
          date: new Date(),
          duration: Math.round(mins),
          notes: `Quick log: ${mins}m`
        }
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleManualLog = async (e) => {
    e.preventDefault();
    await logAdditionalTime(Number(manualTime));
    setManualTime("");
  };

  const handleSaveNotes = async () => {
    setIsUpdating(true);
    try {
      await onUpdate({ notes });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDownloadNotes = () => {
    const element = document.createElement("a");
    const file = new Blob([notes], {type: 'text/plain'});
    const url = URL.createObjectURL(file);
    element.href = url;
    element.download = `${course.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_notes.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    URL.revokeObjectURL(url);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const updatedProgress = Number(newProgress);
      const updates = { progress: updatedProgress };
      
      if (updatedProgress === 100 && course.status !== "Completed") {
        updates.status = "Completed";
      } else if (updatedProgress > 0 && updatedProgress < 100 && (course.status === "Not Started" || course.status === "Completed")) {
        updates.status = "In Progress";
      } else if (updatedProgress === 0 && course.status !== "Not Started") {
        updates.status = "Not Started";
      }
      
      await onUpdate(updates);
      setIsEditing(false);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteClick = async () => {
    if (isUpdating) return;
    setIsDeleting(true);
    try {
      await onDelete();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLessonToggle = async (moduleIndex, lessonIndex, forceComplete = false) => {
    setIsUpdating(true);
    try {
      // Create deep clone of modules to avoid direct state mutation issues
      const updatedModules = JSON.parse(JSON.stringify(course.modules || []));
      const lesson = updatedModules[moduleIndex].lessons[lessonIndex];
      if (forceComplete) {
        if (!lesson.completed) {
          lesson.completedAt = new Date().toISOString();
        }
        lesson.completed = true;
      } else {
        lesson.completed = !lesson.completed;
        if (lesson.completed) {
          lesson.completedAt = new Date().toISOString();
        } else {
          lesson.completedAt = null;
        }
      }
      
      // Automatically calculate overall course progress based on lesson durations
      let totalDuration = 0;
      let completedDuration = 0;
      let totalLessons = 0;
      let completedLessons = 0;
      updatedModules.forEach(mod => {
        if (mod.lessons) {
          mod.lessons.forEach(l => {
            totalLessons++;
            const dur = Number(l.duration) || 0;
            totalDuration += dur;
            if (l.completed) {
              completedLessons++;
              completedDuration += dur;
            }
          });
        }
      });
      
      const calculatedProgress = totalDuration > 0 ? Math.round((completedDuration / totalDuration) * 100) : totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : (course.progress || 0);
      
      const updates = { modules: updatedModules, progress: calculatedProgress };
      
      if (calculatedProgress === 100 && course.status !== "Completed") {
        updates.status = "Completed";
      } else if (calculatedProgress > 0 && calculatedProgress < 100 && (course.status === "Not Started" || course.status === "Completed")) {
        updates.status = "In Progress";
      } else if (calculatedProgress === 0 && course.status !== "Not Started") {
        updates.status = "Not Started";
      }
      
      await onUpdate(updates);
    } finally {
      setIsUpdating(false);
    }
  };

  // GENERATE CERTIFICATE FOR COMPLETED COURSES
  const handleGenerateCertificate = async () => {
    setIsUpdating(true);
    try {
      navigate(`/certificate?courseName=${encodeURIComponent(course.title)}`);
    } catch (error) {
      console.error("Error navigating to certificate page:", error);
      toast.error("Unable to open certificate page. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const progress = course.progress || 0;

  const hasLessons = course.modules && course.modules.some(mod => mod.lessons && mod.lessons.length > 0);
  const isOverTime = (course.timeSpent || 0) > (Number(course.totalHours) * 3600);
  const hasNotes = course.notes && course.notes.trim() !== "";

  let totalCourseLessons = 0;
  let compCourseLessons = 0;
  if (course.modules) {
    course.modules.forEach(mod => {
      if (mod.lessons) {
        totalCourseLessons += mod.lessons.length;
        mod.lessons.forEach(l => {
          if (l.completed) compCourseLessons++;
        });
      }
    });
  }

  return (
    <div className="course-card">
      <style>{`
        @media (max-width: 768px) {
          .cc-quick-add-controls { flex-direction: column !important; }
        }
        @media (max-width: 480px) {
          .cc-manual-form { flex-direction: column !important; }
          .cc-manual-submit { width: 100% !important; }
        }
        /* Premium UI Overrides for Readability & Contrast */
        .course-card {
          background-color: #1E293B !important;
          border: 1px solid rgba(255,255,255,0.08) !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
          color: #FFFFFF !important;
          transition: transform 0.3s ease, box-shadow 0.3s ease !important;
          will-change: transform;
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        .course-card:hover {
          transform: translateY(-4px) !important;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.1) !important;
        }
        .cc-title { color: #FFFFFF !important; font-weight: 700 !important; }
        .cc-platform { color: #D1D5DB !important; font-weight: 500 !important; }
        .cc-category-badge { background: rgba(59, 130, 246, 0.15) !important; color: #60A5FA !important; border: 1px solid rgba(59, 130, 246, 0.3) !important; }
        .cc-progress-text { color: #F5F7FA !important; font-weight: 600 !important; }
        .cc-progress-count { color: #D1D5DB !important; font-weight: 600 !important; }
        .cc-progress-percent { color: #3B82F6 !important; font-weight: 700 !important; }
        .cc-timer-readout { color: #FFFFFF !important; font-weight: 700 !important; text-shadow: none !important; }
        .cc-mode-btn.active { background: #3B82F6 !important; color: #FFFFFF !important; }
        .cc-timer-start-btn { background-color: #3B82F6 !important; color: #FFFFFF !important; font-weight: 600 !important; box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important; border: none !important; }
        .cc-timer-start-btn:hover { background-color: #2563EB !important; }
        .cc-timer-log-btn { background-color: rgba(255,255,255,0.1) !important; color: #FFFFFF !important; border: 1px solid rgba(255,255,255,0.2) !important; font-weight: 600 !important; }
        .cc-timer-log-btn:hover { background-color: rgba(255,255,255,0.15) !important; }
        .cc-quick-add-btn { background-color: rgba(255,255,255,0.05) !important; color: #FFFFFF !important; border: 1px solid rgba(255,255,255,0.1) !important; font-weight: 600 !important; }
        .cc-quick-add-btn:hover { background-color: rgba(255,255,255,0.15) !important; }
        .cc-manual-input { background-color: #0F172A !important; color: #FFFFFF !important; border: 1px solid rgba(255,255,255,0.1) !important; }
        .cc-manual-submit { background-color: #3B82F6 !important; color: #FFFFFF !important; font-weight: 600 !important; border: none !important; }
        .cc-details-toggle { color: #60A5FA !important; font-weight: 600 !important; background: transparent !important; }
        .cc-details-toggle:hover { color: #3B82F6 !important; text-decoration: underline; }
      `}</style>
      <div className="cc-header" style={{ display: "flex", alignItems: "flex-start", gap: "12px", justifyContent: "space-between" }}>
        <div className="cc-title-wrapper" style={{ flex: 1, minWidth: 0 }}>
          <h2 className="cc-title" title={course.title} style={{ margin: 0, whiteSpace: "normal", wordBreak: "break-word" }}>{course.title}</h2>
        </div>
        <button 
          onClick={() => onUpdate({ pinned: !course.pinned })} 
          className={`cc-pin-btn ${course.pinned ? "pinned" : ""}`}
          title={course.pinned ? "Unpin Course" : "Pin Course"}
          style={{ flexShrink: 0 }}
        >
          📌
        </button>
      </div>

      <p className="cc-platform" style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
        {course.platform}
        {course.category && (
          <span className="cc-category-badge" style={{ whiteSpace: "nowrap" }}>
            {course.category}
          </span>
        )}
      </p>

      {/* Thinner Modern Progress Bar */}
      <div className="cc-progress">
        <div className="cc-progress-labels" style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "space-between" }}>
          <span className="cc-progress-text">Progress: <span className="cc-progress-percent">{progress}%</span></span>
          {totalCourseLessons > 0 ? (
            <span className="cc-progress-count">{compCourseLessons}/{totalCourseLessons} Lessons</span>
          ) : (
            <span className="cc-progress-count">{formatLoggedTime(course.timeSpent || 0)} / {course.totalHours}h</span>
          )}
        </div>
        <div className="cc-progress-track">
          <div className="cc-progress-fill" style={{ width: `${progress}%`, background: progress === 100 ? "var(--success)" : "linear-gradient(90deg, var(--primary-light), var(--primary))" }}></div>
        </div>
      </div>
          
      {/* Compact Timer Controls */}
      <div className="cc-timer-box">
        <div className="cc-timer-top" style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center", justifyContent: "space-between" }}>
          <div className="cc-timer-mode-switch" style={{ flexShrink: 0 }}>
             <button onClick={() => handleModeSwitch("stopwatch")} className={`cc-mode-btn stopwatch ${timerMode === "stopwatch" ? "active" : ""}`}>⏱️</button>
             <button onClick={() => handleModeSwitch("pomodoro")} className={`cc-mode-btn pomodoro ${timerMode === "pomodoro" ? "active" : ""}`}>🍅</button>
          </div>
          <div className="cc-timer-display" style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end" }}>
            {timerMode === "pomodoro" && (
              <span className={`cc-pomodoro-phase ${pomodoroPhase}`}>{pomodoroPhase}</span>
            )}
            <span className={`cc-timer-readout ${timerActive ? (timerMode === 'pomodoro' ? 'active-pomodoro' : 'active-stopwatch') : 'inactive'}`}>
              {timerMode === "stopwatch" ? formatStopwatch(sessionTime) : formatStopwatch(pomodoroSecondsLeft)}
            </span>
            {!timerActive && ((timerMode === "stopwatch" && sessionTime > 0) || (timerMode === "pomodoro" && pomodoroSecondsLeft < (pomodoroPhase === 'work' ? WORK_TIME : BREAK_TIME))) && (
              <button onClick={() => { 
                  if (window.confirm("Are you sure you want to reset the timer?")) {
                     if (timerMode === "stopwatch") setSessionTime(0);
                     else setPomodoroSecondsLeft(pomodoroPhase === "work" ? WORK_TIME : BREAK_TIME);
                  }
                }} disabled={isUpdating} className="cc-timer-reset" title="Reset Timer"
              >&times;</button>
            )}
          </div>
        </div>
        
        <div className="cc-timer-main-actions" style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "12px" }}>
          <button onClick={() => setTimerActive(!timerActive)} disabled={isUpdating} className={`cc-timer-start-btn ${timerActive ? "running" : "stopped"}`} style={{ flex: "1 1 120px", minWidth: 0, boxSizing: "border-box" }}>
            {timerActive ? "⏸ Pause" : ((timerMode === "stopwatch" && sessionTime > 0) || (timerMode === "pomodoro" && pomodoroSecondsLeft < (pomodoroPhase === 'work' ? WORK_TIME : BREAK_TIME)) ? "▶ Resume" : "▶ Start")}
          </button>
          {((timerMode === "stopwatch" && (timerActive || sessionTime > 0)) || (timerMode === "pomodoro" && pomodoroPhase === "work" && (timerActive || pomodoroSecondsLeft < WORK_TIME))) && (
            <button onClick={handleOpenLogModal} disabled={isUpdating} className="cc-timer-log-btn" style={{ flex: "1 1 80px", minWidth: 0, boxSizing: "border-box" }}>
              {isUpdating ? "..." : "⏹ Log"}
            </button>
          )}
        </div>
        
        <div className="cc-quick-add" style={{ width: "100%", boxSizing: "border-box", overflow: "hidden" }}>
          <span className="cc-quick-add-label">Quick Add:</span>
          <div className="cc-quick-add-controls" style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "4px", width: "100%", boxSizing: "border-box" }}>
            <div className="cc-quick-add-grid" style={{ display: "flex", flexWrap: "nowrap", gap: "8px", flex: "1 1 120px", minWidth: 0, boxSizing: "border-box" }}>
              {[15, 30, 60].map(mins => (
                <button key={mins} type="button" onClick={() => logAdditionalTime(mins)} disabled={isUpdating} className="cc-quick-add-btn" style={{ flex: 1, minWidth: 0, padding: "6px 4px", boxSizing: "border-box" }}>
                  +{mins === 60 ? "1h" : `${mins}m`}
                </button>
              ))}
            </div>
            <form onSubmit={handleManualLog} className="cc-manual-form" style={{ display: "flex", flexWrap: "nowrap", gap: "8px", flex: "1 1 120px", minWidth: 0, boxSizing: "border-box" }}>
              <input type="number" placeholder="Custom mins" value={manualTime} onChange={(e) => setManualTime(e.target.value)} min="0.1" step="any" disabled={isUpdating} className="cc-manual-input" style={{ flex: 1, minWidth: 0, width: "100%", boxSizing: "border-box" }} />
              <button type="submit" disabled={isUpdating || !manualTime} className="cc-manual-submit" style={{ flexShrink: 0, boxSizing: "border-box" }}>
                Add
              </button>
            </form>
          </div>
        </div>
      </div>

      <button 
        onClick={() => setShowDetails(!showDetails)} 
        className="cc-details-toggle" style={{ margin: "auto 0 0 0", paddingTop: "16px" }}
      >
        {showDetails ? "Hide Details ⬆" : "View Details ⬇"}
      </button>

      {progress === 100 && (
        <button onClick={handleGenerateCertificate} style={{ padding: "12px", background: "#10B981", color: "#FFFFFF", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "14px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)", marginTop: "12px", width: "100%" }}>
          🏆 View Certificate
        </button>
      )}

      {/* Expandable Details Section */}
      {showDetails && (
        <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px dashed rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ fontSize: "13px", color: "#D1D5DB", display: "flex", justifyContent: "space-between", fontWeight: "500" }}>
            <span><strong>Est:</strong> <span style={{ color: "#FFFFFF" }}>{course.totalHours}h</span></span>
            <span><strong>Logged:</strong> <span style={{ color: isOverTime ? "#EF4444" : "#FFFFFF", fontWeight: isOverTime ? "bold" : "600" }}>{formatLoggedTime(course.timeSpent || 0)}</span> {isOverTime && "⚠️"}</span>
          </div>

          <LessonTracker 
            courseId={course._id}
            courseTitle={course.title}
            modules={course.modules}
            isUpdating={isUpdating}
            onLessonToggle={handleLessonToggle}
            onPlayVideo={(videoData) => onPlayVideo && onPlayVideo({ ...videoData, course })}
            onUploadSuccess={(result) => {
              if (result.course) {
                onUpdate({ modules: result.course.modules });
              }
            }}
          />

          {showNotes && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", background: "#0F172A", padding: "16px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.1)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <h5 style={{ margin: 0, color: "#FFFFFF", fontSize: "14px", fontWeight: "600" }}>Daily Notes</h5>
                  {saveSuccess && <span style={{ color: "#10B981", fontSize: "12px", fontWeight: "bold" }}>✅ Saved!</span>}
                </div>
                <button onClick={handleAddSessionEntry} disabled={isUpdating} style={{ background: "rgba(59, 130, 246, 0.15)", color: "#60A5FA", border: "1px solid rgba(59, 130, 246, 0.3)", borderRadius: "6px", padding: "6px 10px", cursor: isUpdating ? "not-allowed" : "pointer", fontSize: "12px", fontWeight: "600" }}>
                  📅 New
                </button>
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Jot down key takeaways..."
                disabled={isUpdating}
                style={{ width: "100%", minHeight: "100px", padding: "12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", background: "#1E293B", color: "#FFFFFF", fontSize: "14px", outline: "none", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button onClick={() => { if (window.confirm("Clear notes?")) { setNotes(""); onUpdate({ notes: "" }); } }} disabled={isUpdating || !notes} style={{ padding: "8px 12px", background: "transparent", color: "#EF4444", border: "1px solid rgba(239, 68, 68, 0.5)", borderRadius: "6px", cursor: (isUpdating || !notes) ? "not-allowed" : "pointer", fontWeight: "600", fontSize: "12px", opacity: !notes ? 0.5 : 1 }}>Clear</button>
                  <button onClick={handleDownloadNotes} disabled={!notes} style={{ padding: "8px 12px", background: "transparent", color: "#60A5FA", border: "1px solid rgba(96, 165, 250, 0.5)", borderRadius: "6px", cursor: !notes ? "not-allowed" : "pointer", fontWeight: "600", fontSize: "12px", opacity: !notes ? 0.5 : 1 }}>⬇️ Download</button>
                </div>
                <button onClick={handleSaveNotes} disabled={isUpdating} style={{ padding: "8px 16px", background: "#3B82F6", color: "#FFFFFF", border: "none", borderRadius: "6px", cursor: isUpdating ? "not-allowed" : "pointer", fontWeight: "600", fontSize: "12px", flex: 1, minWidth: "80px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
                  {isUpdating ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            {progress === 100 ? (
              <button onClick={handleGenerateCertificate} style={{ padding: "12px", background: "#10B981", color: "#FFFFFF", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "14px" }}>
                🏆 View Certificate
              </button>
            ) : isEditing ? (
              <form onSubmit={handleUpdateSubmit} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <input type="number" min="0" max="100" value={newProgress} onChange={(e) => setNewProgress(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.1)", background: "#0F172A", color: "#FFFFFF", outline: "none", fontSize: "14px", boxSizing: "border-box" }} required />
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button type="submit" disabled={isUpdating} style={{ flex: 1, padding: "10px", background: "#3B82F6", color: "#FFFFFF", border: "none", borderRadius: "8px", cursor: isUpdating ? "not-allowed" : "pointer", fontWeight: "600", fontSize: "13px" }}>
                    {isUpdating ? "Saving..." : "Save"}
                  </button>
                  <button type="button" onClick={() => setIsEditing(false)} disabled={isUpdating} style={{ flex: 1, padding: "10px", background: "transparent", color: "#FFFFFF", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "8px", cursor: isUpdating ? "not-allowed" : "pointer", fontWeight: "600", fontSize: "13px" }}>
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {!hasLessons && (
                  <button onClick={() => { setNewProgress(progress); setIsEditing(true); }} style={{ flex: "1 1 120px", minWidth: 0, boxSizing: "border-box", padding: "10px", background: "#3B82F6", color: "#FFFFFF", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "13px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
                    📈 Update %
                  </button>
                )}
                <button onClick={() => setShowNotes(!showNotes)} disabled={isUpdating} style={{ flex: "1 1 120px", minWidth: 0, boxSizing: "border-box", padding: "10px", background: showNotes ? "rgba(59, 130, 246, 0.15)" : "rgba(255,255,255,0.05)", color: showNotes ? "#60A5FA" : "#FFFFFF", border: showNotes ? "1px solid rgba(59, 130, 246, 0.3)" : "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", cursor: isUpdating ? "not-allowed" : "pointer", fontWeight: "600", fontSize: "13px" }}>
                  {hasNotes ? "📝 Notes" : "➕ Notes"}
                </button>
              </div>
            )}
            <button onClick={handleDeleteClick} disabled={isDeleting || isUpdating} style={{ padding: "10px", background: isDeleting ? "rgba(239, 68, 68, 0.2)" : "rgba(239, 68, 68, 0.05)", color: "#EF4444", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "8px", cursor: (isDeleting || isUpdating) ? "not-allowed" : "pointer", fontWeight: "600", fontSize: "13px", transition: "all 0.2s ease" }}>
              {isDeleting ? "🗑️ Deleting..." : "🗑️ Delete Course"}
            </button>
          </div>
        </div>
      )}

      {/* Log Session Modal */}
      {showLogModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.75)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, padding: "20px" }}>
          <div style={{ background: "#1E293B", padding: "24px", borderRadius: "16px", width: "100%", maxWidth: "400px", position: "relative", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
            <h2 style={{ margin: "0 0 16px 0", color: "#FFFFFF", fontSize: "20px", fontWeight: "700" }}>Log Study Session</h2>
            <p style={{ margin: "0 0 16px 0", color: "#D1D5DB", fontSize: "14px" }}>
              You studied for <strong style={{ color: "#FFFFFF" }}>{Math.max(1, Math.round((timerMode === "stopwatch" ? sessionTime : (WORK_TIME - pomodoroSecondsLeft)) / 60))} minutes</strong>. 
              Add notes?
            </p>
            <textarea 
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              placeholder="What did you focus on? (Optional)"
              style={{ width: "100%", height: "80px", padding: "12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", background: "#0F172A", color: "#FFFFFF", fontSize: "14px", outline: "none", marginBottom: "16px", resize: "none", boxSizing: "border-box" }}
            />
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", flexWrap: "wrap" }}>
              <button onClick={() => setShowLogModal(false)} style={{ padding: "8px 16px", background: "transparent", color: "#D1D5DB", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "14px" }}>Cancel</button>
              <button onClick={handleConfirmLog} disabled={isUpdating} style={{ padding: "8px 16px", background: "#3B82F6", color: "#FFFFFF", border: "none", borderRadius: "8px", cursor: isUpdating ? "not-allowed" : "pointer", fontWeight: "600", fontSize: "14px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
                {isUpdating ? "Saving..." : "Save Session"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Achievement & Confetti Modal */}
      {achievement && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.85)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999, padding: "20px" }}>
          <Confetti 
            width={window.innerWidth} 
            height={window.innerHeight} 
            recycle={false} 
            numberOfPieces={500} 
            gravity={0.15}
          />
          <div style={{ background: "#1E293B", padding: "32px", borderRadius: "16px", width: "100%", maxWidth: "400px", textAlign: "center", position: "relative", boxShadow: "0 10px 30px rgba(0,0,0,0.5)", animation: "popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards", zIndex: 10000 }}>
            <div style={{ fontSize: "56px", marginBottom: "12px" }}>{achievement.title.includes("Course") ? "🏆" : "🌟"}</div>
            <h2 style={{ margin: "0 0 12px 0", color: "#FFFFFF", fontSize: "24px", fontWeight: "bold" }}>{achievement.title}</h2>
            <p style={{ color: "#D1D5DB", fontSize: "15px", marginBottom: "24px", lineHeight: "1.5" }}>{achievement.message}</p>
            
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", marginBottom: "24px" }}>
              <input 
                type="checkbox" 
                id={`soundToggle-${course._id}`} 
                checked={soundEnabled} 
                onChange={(e) => { 
                  setSoundEnabled(e.target.checked); 
                  localStorage.setItem("soundEnabled", e.target.checked); 
                }} 
                style={{ width: "16px", height: "16px", accentColor: "#3B82F6", cursor: "pointer" }}
              />
              <label htmlFor={`soundToggle-${course._id}`} style={{ fontSize: "14px", color: "#D1D5DB", cursor: "pointer", fontWeight: "500" }}>Play celebration sounds</label>
            </div>

            <button 
              onClick={() => setAchievement(null)} 
              style={{ padding: "12px 32px", background: "#3B82F6", color: "#FFFFFF", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "15px", boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)" }}
            >
              Awesome!
            </button>
          </div>
          <style>{`
            @keyframes popIn {
              0% { transform: scale(0.8); opacity: 0; }
              100% { transform: scale(1); opacity: 1; }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}

export default CourseCard;
