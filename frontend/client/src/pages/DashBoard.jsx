import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import CourseCard from "../components/CourseCard";
import API from "../services/api";
import Navbar from "../components/NavBar";
import { useTheme } from "../useTheme";
import VideoPlayer from "../components/VideoPlayer";
import ProgressBar from "../components/ProgressBar";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { io } from "socket.io-client";
import {
  LayoutDashboard,
  BookOpen,
  Clock,
  Flame,
  Trophy,
  Target,
  Bell,
  User,
  Settings,
  LogOut,
  CheckCircle2,
  Compass,
  TrendingUp,
  Zap,
  Gamepad2,
  Search,
  SlidersHorizontal,
  Plus,
  Lock,
  Eye,
  EyeOff,
  Download,
  Award,
  Sparkles,
  Calendar,
  ChevronRight,
  Play,
  Trash2,
  Pin,
  AlertCircle,
  UserCheck,
  Palette,
  FileText,
  BrainCircuit,
  QrCode,
  Activity,
  CheckSquare,
  ChevronUp,
  Share2
} from "lucide-react";
import "./DashBoard.css";

// Dynamic Quote Generator
const MOTIVATIONAL_QUOTES = [
  "Consistency is the key to unlocking your full coding potential.",
  "Every line of code you write is a step closer to mastery.",
  "Mistakes are proof that you are trying and learning.",
  "The only way to learn a new programming language is by writing programs in it.",
  "Small daily study logs add up to massive career achievements.",
  "Your future self will thank you for studying today."
];

// Reusable Custom Animated Counter
function AnimatedCounter({ value, duration = 1.2, suffix = "" }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = parseFloat(value);
    if (isNaN(end) || end === 0) {
      setCount(value);
      return;
    }
    const totalMiliseconds = duration * 1000;
    const incrementTime = 25; // 25ms steps
    const steps = totalMiliseconds / incrementTime;
    const increment = end / steps;
    
    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      start += increment;
      if (currentStep >= steps) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(end % 1 === 0 ? Math.round(start) : parseFloat(start.toFixed(1)));
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value, duration]);

  return <span className="animated-counter-val">{count}{suffix}</span>;
}

// Reusable Custom Circular SVG Progress Ring
function ProgressRing({ progress, size = 52, strokeWidth = 5, color = "var(--primary)" }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, progress)) / 100) * circumference;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
      <circle
        stroke="rgba(255, 255, 255, 0.05)"
        fill="transparent"
        strokeWidth={strokeWidth}
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />
      <circle
        stroke={color}
        fill="transparent"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        style={{ strokeDashoffset, transition: "stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)" }}
        strokeLinecap="round"
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />
    </svg>
  );
}

const AVAILABLE_GAMES = [
  { id: "memory-game", title: "Memory Match", description: "Classic concentration match game to boost your recall.", icon: BrainCircuit, route: "/memory-game", difficulty: "Easy", color: "#8b5cf6" },
  { id: "word-scramble", title: "Word Scramble", description: "Unscramble programming vocabulary terms under a timer.", icon: Compass, route: "/word-scramble", difficulty: "Medium", color: "#ec4899" },
  { id: "speed-type", title: "Speed Type", description: "Type snippets fast to improve your coding accuracy.", icon: Gamepad2, route: "/speed-type", difficulty: "Medium - Hard", color: "#06b6d4" },
];

const AVAILABLE_QUIZZES = [
  { id: "quick-quiz", title: "Quick Quiz", description: "Answer standard programming questions under 30s limits.", icon: Zap, route: "/quick-quiz", difficulty: "Medium", color: "#f59e0b" },
  { id: "course-trivia", title: "Course Trivia", description: "Test your computer science and architectural fundamentals.", icon: Target, route: "/course-trivia", difficulty: "Medium - Hard", color: "#10b981" },
];

const MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
  { id: 'courses', label: 'My Enrolled Courses', icon: BookOpen },
  { id: 'logs', label: 'Study Logs & Notes', icon: Clock },
  { id: 'quizzes', label: 'Quizzes & Trivia', icon: Zap },
  { id: 'games', label: 'Learning Games', icon: Gamepad2 },
  { id: 'puzzles', label: 'Coding Puzzles', icon: BrainCircuit },
  { id: 'certificates', label: 'My Certificates', icon: Award },
  { id: 'achievements', label: 'Achievements & Badges', icon: Trophy },
  { id: 'leaderboard', label: 'Global Leaderboard', icon: TrendingUp },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'profile', label: 'Profile Settings', icon: Settings },
];

function Dashboard() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [viewMode, setViewMode] = useState("grid");
  const [draggingCourseId, setDraggingCourseId] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  });

  useTheme(); // Initialize theme



  // MANUAL LOG FORM STATE
  const [manualLog, setManualLog] = useState({
    courseId: "",
    duration: 30,
    date: new Date().toISOString().split("T")[0],
    notes: ""
  });
  const [manualLogSubmitting, setManualLogSubmitting] = useState(false);

  // QR VERIFIER FORM STATE
  const [verifyCertId, setVerifyCertId] = useState("");
  const [verificationResult, setVerificationResult] = useState(null);
  const [verifyingCert, setVerifyingCert] = useState(false);

  // PROFILE FORM STATE (Extended with skills & interests saved to Mongo)
  const [profileForm, setProfileForm] = useState({
    name: currentUser?.name || "",
    email: currentUser?.email || "",
    weeklyGoalHours: currentUser?.weeklyGoalHours || 10,
    skills: currentUser?.skills || "HTML, CSS, JavaScript, React",
    interests: currentUser?.interests || "Web Development, UI/UX Design, Artificial Intelligence"
  });
  const [profileEditing, setProfileEditing] = useState(false);
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [pwdForm, setPwdForm] = useState({ currentPassword: "", newPassword: "" });
  const [pwdSubmitting, setPwdSubmitting] = useState(false);

  const isAdmin = currentUser?.isAdmin || currentUser?.role === "admin" || currentUser?.email === "admin@gmail.com";

  const [leaderBoardUsers, setLeaderBoardUsers] = useState([]);

  // FETCH COURSES AND SYNC STREAKS
  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await API.get("/courses");
      const coursesData = Array.isArray(res.data) ? res.data : [];
      setCourses(coursesData);
    } catch (error) {
      console.error("Error fetching courses:", error);
      if (error.response?.status !== 401) {
        setCourses([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await API.get('/auth/users');
      const usersData = Array.isArray(res.data) ? res.data : [];
      
      const ranked = usersData.map((u) => {
        const streak = u.studyStreak || 0;
        const todayStudy = (u.todayStudyTime || 0) / 3600;
        const score = ((u.totalCourses || 0) * 100) + ((u.avgProgress || 0) * 10) + (streak * 50);
        return {
          id: u._id,
          name: u.name || "Student",
          hours: Number(todayStudy.toFixed(1)),
          streak: streak,
          score: score,
          isSelf: currentUser?._id === u._id || currentUser?.id === u._id
        };
      }).sort((a, b) => b.score - a.score).map((user, idx) => ({ ...user, rank: idx + 1 }));

      setLeaderBoardUsers(ranked.slice(0, 10));
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    if (isAdmin) {
      navigate("/admin");
      return;
    }

    fetchCourses();
    fetchLeaderboard();

    // Socket.io sync integration
    const socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || "http://localhost:5000", {
      auth: { token },
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socket.on("courseUpdated", (updatedCourse) => {
      if (updatedCourse && updatedCourse._id) {
        setCourses((prev) =>
          prev.map((c) => (c._id === updatedCourse._id ? updatedCourse : c))
        );
      }
    });

    socket.on("courseAdded", (newCourse) => {
      if (newCourse && newCourse._id) {
        setCourses((prev) => {
          if (!prev.find((c) => c._id === newCourse._id)) {
            return [...prev, newCourse];
          }
          return prev;
        });
      }
    });

    socket.on("courseDeleted", (deletedId) => {
      if (deletedId) {
        setCourses((prev) => prev.filter((c) => c._id !== deletedId));
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [navigate, isAdmin]);

  // DAILY STUDY REMINDERS
  useEffect(() => {
    if (courses.length === 0 || !("Notification" in window) || Notification.permission !== "granted") return;

    const lastNotified = localStorage.getItem("lastReminderDate");
    const todayStr = new Date().toISOString().split("T")[0];

    if (lastNotified === todayStr) return;

    const inactiveCourses = courses.filter((course) => {
      const status = course.status || "Not Started";
      if (status === "Paused" || status === "Completed" || status === "Not Started") return false;

      let lastStudyDate = course.createdAt ? new Date(course.createdAt) : new Date();
      if (Array.isArray(course.studyLogs) && course.studyLogs.length > 0) {
        const sorted = [...course.studyLogs].sort((a, b) => new Date(b.date) - new Date(a.date));
        lastStudyDate = new Date(sorted[0].date);
      }

      const diff = Math.floor((new Date() - lastStudyDate) / (1000 * 60 * 60 * 24));
      return diff >= 3;
    });

    if (inactiveCourses.length > 0) {
      const names = inactiveCourses.map((c) => c.title).slice(0, 2).join(", ");
      new Notification("Time to Study! 📚", {
        body: `You haven't logged time for ${names} in a few days. Let's jump back in!`,
      });
      localStorage.setItem("lastReminderDate", todayStr);
    }
  }, [courses]);

  // DELETE AND UPDATE WRAPPERS
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this course?")) return;
    try {
      await API.delete(`/courses/${id}`);
      setCourses((prev) => prev.filter((c) => c._id !== id));
    } catch (error) {
      console.error(error);
      alert("Failed to delete course");
    }
  };

  const handleUpdate = async (id, updateData) => {
    try {
      const res = await API.put(`/courses/${id}`, updateData);
      const updated = res.data.course ? res.data.course : res.data;
      setCourses((prev) => prev.map((c) => (c._id === id ? updated : c)));

      // Sync active student streak/stats from server response
      if (res.data.user) {
        const stored = JSON.parse(localStorage.getItem("user") || "{}");
        const fresh = { ...stored, ...res.data.user };
        localStorage.setItem("user", JSON.stringify(fresh));
        setCurrentUser(fresh);
        setProfileForm((prev) => ({ ...prev, ...res.data.user }));
      }
    } catch (error) {
      console.error(error);
      alert("Failed to update progress");
    }
  };

  // ADD PERSONAL STUDY LOG HANDLER
  const handleAddManualLog = async (e) => {
    e.preventDefault();
    if (!manualLog.courseId) {
      alert("Please select a course to log time against.");
      return;
    }
    if (Number(manualLog.duration) <= 0) {
      alert("Please enter a valid duration studied (in minutes).");
      return;
    }

    setManualLogSubmitting(true);
    try {
      const targetCourse = courses.find((c) => c._id === manualLog.courseId);
      if (!targetCourse) return;

      const durationMinutes = Number(manualLog.duration);
      const secondsAdded = durationMinutes * 60;
      const currentSeconds = targetCourse.timeSpent || 0;

      const payload = {
        timeSpent: currentSeconds + secondsAdded,
        newLog: {
          date: new Date(manualLog.date),
          duration: durationMinutes,
          notes: manualLog.notes.trim() || "Manual study log entry"
        }
      };

      await handleUpdate(manualLog.courseId, payload);
      alert("Manual study log added successfully!");
      setManualLog({
        courseId: "",
        duration: 30,
        date: new Date().toISOString().split("T")[0],
        notes: ""
      });
      fetchCourses();
    } catch (error) {
      console.error(error);
      alert("Failed to add study log.");
    } finally {
      setManualLogSubmitting(false);
    }
  };



  // STATS CALCULATIONS
  const totalCourses = courses.length;
  const completedCoursesCount = courses.filter((c) => (c.progress || 0) === 100).length;
  const loggedMinutes = courses.reduce((acc, curr) => {
    if (Array.isArray(curr.studyLogs)) {
      return acc + curr.studyLogs.reduce((sum, log) => sum + (Number(log.duration) || 0), 0);
    }
    return acc;
  }, 0);
  const totalHours = Math.round((loggedMinutes / 60) * 10) / 10;
  const avgProgress = totalCourses > 0 ? Math.round(courses.reduce((acc, curr) => acc + (Number(curr.progress) || 0), 0) / totalCourses) : 0;

  // Day streak calculations
  let displayStreak = currentUser?.studyStreak || 0;
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  if (currentUser?.lastStudyDate) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    if (currentUser.lastStudyDate !== todayStr && currentUser.lastStudyDate !== yesterdayStr) {
      displayStreak = 0;
    }
  }

  let effectiveTodayStudyTime = 0;
  if (currentUser?.lastStudyDate === todayStr) {
    effectiveTodayStudyTime = currentUser?.todayStudyTime || 0;
  }
  const dailyGoalSeconds = 600; // 10 minutes
  const goalProgress = Math.min(100, Math.round((effectiveTodayStudyTime / dailyGoalSeconds) * 100));

  // XP level calculation (Gamification System)
  const totalXP = (loggedMinutes * 10) + (completedCoursesCount * 500) + (totalCourses * 100);
  const level = Math.floor(totalXP / 1000) + 1;
  const xpProgress = totalXP % 1000;
  const xpProgressPct = Math.round((xpProgress / 1000) * 100);

  // Unlocked badges metric
  const BADGES = [
    { title: "Spark Badge", description: "Maintain a study streak of 3 days.", icon: "🔥", requiredStreak: 3 },
    { title: "Habit Builder", description: "Maintain a study streak of 7 days.", icon: "🚀", requiredStreak: 7 },
    { title: "Unstoppable", description: "Maintain a study streak of 30 days.", icon: "💎", requiredStreak: 30 },
    { title: "Scholar Badge", description: "Maintain a study streak of 100 days.", icon: "👑", requiredStreak: 100 },
  ];
  const badgeCount = BADGES.filter(b => displayStreak >= b.requiredStreak).length;

  // Prepare Last 7 days calendar heatmap
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dStr = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    last7Days.push({
      dateStr: dStr,
      dayName: d.toLocaleDateString("en-US", { weekday: "short" }).charAt(0),
      duration: 0
    });
  }

  courses.forEach((c) => {
    if (Array.isArray(c.studyLogs)) {
      c.studyLogs.forEach((log) => {
        const logDate = new Date(log.date);
        if (!isNaN(logDate.getTime())) {
          const lStr = logDate.getFullYear() + "-" + String(logDate.getMonth() + 1).padStart(2, "0") + "-" + String(logDate.getDate()).padStart(2, "0");
          const match = last7Days.find((d) => d.dateStr === lStr);
          if (match) {
            match.duration += Number(log.duration) || 0;
          }
        }
      });
    }
  });

  // Kanban operations
  const handleDragStartCourse = (id) => setDraggingCourseId(id);
  const handleDropCourse = (newStatus) => {
    if (!draggingCourseId) return;
    const course = courses.find((c) => c._id === draggingCourseId);
    if (!course) return;

    let updates = { status: newStatus };
    if (newStatus === "Completed") updates.progress = 100;
    else if (newStatus === "Not Started") updates.progress = 0;
    else if (newStatus === "In Progress") {
      if ((course.progress || 0) === 0) updates.progress = 5;
      if ((course.progress || 0) === 100) updates.progress = 95;
    }

    setDraggingCourseId(null);
    handleUpdate(course._id, updates);
  };

  const availableCategories = [...new Set(courses.map((c) => c.category).filter(Boolean))];

  // Filtering
  const filteredCourses = courses.filter((course) => {
    const tStr = String(course.title || "").toLowerCase();
    const pStr = String(course.platform || "").toLowerCase();
    const matchesSearch = tStr.includes(searchTerm.toLowerCase()) || pStr.includes(searchTerm.toLowerCase());

    let matchesStatus = true;
    const courseStatus = course.status || "Not Started";
    if (statusFilter === "Completed") matchesStatus = (course.progress || 0) === 100;
    else if (statusFilter === "In Progress") matchesStatus = (course.progress || 0) > 0 && (course.progress || 0) < 100 && courseStatus !== "Paused";
    else if (statusFilter === "Paused") matchesStatus = courseStatus === "Paused" && (course.progress || 0) < 100;
    else if (statusFilter === "Not Started") matchesStatus = (course.progress || 0) === 0;

    const matchesCategory = categoryFilter === "All" || course.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Expected vs actual hours study time
  const expectedVsActualData = courses.map((course) => ({
    name: course.title.length > 15 ? course.title.slice(0, 15) + "..." : course.title,
    Expected: Number(course.totalHours) || 0,
    Actual: Number(((course.timeSpent || 0) / 3600).toFixed(2))
  }));

  // Burnup timeline chart
  const burnupEvents = [];
  courses.forEach((c) => {
    let courseTotalLessons = 0;
    if (Array.isArray(c.modules)) {
      c.modules.forEach((mod) => {
        if (Array.isArray(mod.lessons)) {
          courseTotalLessons += mod.lessons.length;
          mod.lessons.forEach((l) => {
            if (l.completed) {
              const compDate = l.completedAt ? new Date(l.completedAt) : (c.updatedAt ? new Date(c.updatedAt) : new Date());
              burnupEvents.push({ date: compDate.toISOString().split("T")[0], type: "completed" });
            }
          });
        }
      });
    }
    if (courseTotalLessons > 0) {
      const addDate = c.createdAt ? new Date(c.createdAt) : new Date();
      burnupEvents.push({ date: addDate.toISOString().split("T")[0], type: "added", count: courseTotalLessons });
    }
  });

  burnupEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

  let accumTotal = 0;
  let accumCompleted = 0;
  const burnupTimelineMap = {};

  burnupEvents.forEach((ev) => {
    if (ev.type === "added") accumTotal += ev.count;
    if (ev.type === "completed") accumCompleted += 1;

    const d = new Date(ev.date);
    const dateKey = d.toLocaleDateString("en-US", { timeZone: "UTC", month: "short", day: "numeric" });

    burnupTimelineMap[dateKey] = {
      name: dateKey,
      timestamp: d.getTime(),
      Total: accumTotal,
      Completed: accumCompleted
    };
  });

  const burnupData = Object.values(burnupTimelineMap).sort((a, b) => a.timestamp - b.timestamp);
  if (burnupData.length > 0) {
    const todayStrShort = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const lastPt = burnupData[burnupData.length - 1];
    if (lastPt.name !== todayStrShort) {
      burnupData.push({
        name: todayStrShort,
        timestamp: Date.now(),
        Total: lastPt.Total,
        Completed: lastPt.Completed
      });
    }
  } else {
    const todayStrShort = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
    burnupData.push({ name: todayStrShort, timestamp: Date.now(), Total: 0, Completed: 0 });
  }

  // Study log list extraction
  const studyLogsList = [];
  courses.forEach((c) => {
    if (Array.isArray(c.studyLogs)) {
      c.studyLogs.forEach((log, index) => {
        studyLogsList.push({
          id: log._id || `${c._id}-${index}`,
          courseId: c._id,
          courseTitle: c.title,
          date: new Date(log.date),
          duration: log.duration,
          notes: log.notes || ""
        });
      });
    }
  });
  studyLogsList.sort((a, b) => b.date - a.date);

  // Time Spent distribution by course (Pie Chart)
  const courseTimeSpentData = courses.map((c) => ({
    name: c.title.length > 15 ? c.title.slice(0, 15) + "..." : c.title,
    value: Number(((c.timeSpent || 0) / 3600).toFixed(1))
  })).filter((d) => d.value > 0);

  const PIE_COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899", "#06b6d4", "#ef4444", "#a855f7"];

  // Prediction calculations for course completions
  const completionPredictions = courses.map((c) => {
    const currentProg = c.progress || 0;
    if (currentProg === 100) return { title: c.title, prediction: "Completed" };
    if (currentProg === 0) return { title: c.title, prediction: "Not started yet" };

    const cLogs = studyLogsList.filter((log) => log.courseId === c._id);
    if (cLogs.length === 0) return { title: c.title, prediction: "Need more data" };

    const totalStudiedMins = cLogs.reduce((sum, log) => sum + log.duration, 0);
    const studyDays = (new Date() - new Date(c.createdAt)) / (1000 * 60 * 60 * 24);
    const ratePerDay = totalStudiedMins / Math.max(1, studyDays); // mins per day

    // Estimate total time required based on progress rate
    const estimatedTotalMins = (totalStudiedMins / currentProg) * 100;
    const remainingMins = estimatedTotalMins - totalStudiedMins;
    const daysToComplete = remainingMins / Math.max(1, ratePerDay);

    const completionDate = new Date();
    completionDate.setDate(completionDate.getDate() + Math.ceil(daysToComplete));

    return {
      title: c.title,
      prediction: `Approx. ${Math.ceil(daysToComplete)} days (${completionDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })})`
    };
  });

  // Dynamic user rankings for community leaderboard fetched from API

  // QR Certificate Verifier Handler
  const handleVerifyCertificate = async (e) => {
    e.preventDefault();
    if (!verifyCertId.trim()) return;

    setVerifyingCert(true);
    setVerificationResult(null);
    try {
      const res = await API.get(`/courses`);
      const allUserCourses = Array.isArray(res.data) ? res.data : [];
      
      // Match certificateId locally across user courses
      const matchedCourse = allUserCourses.find(c => c.certificateId === verifyCertId.trim() || `UC-${c._id.toString().slice(-8).toUpperCase()}` === verifyCertId.trim());

      if (matchedCourse) {
        setVerificationResult({
          status: "verified",
          certificateId: verifyCertId.trim(),
          courseTitle: matchedCourse.title,
          studentName: currentUser?.name || "Student",
          issueDate: matchedCourse.certificateIssuedAt 
            ? new Date(matchedCourse.certificateIssuedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
            : new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
        });
      } else {
        setVerificationResult({
          status: "invalid",
          message: "No certificate matching this ID was found on this network."
        });
      }
    } catch (err) {
      console.error(err);
      setVerificationResult({
        status: "invalid",
        message: "Failed to connect to the verification server. Try again."
      });
    } finally {
      setVerifyingCert(false);
    }
  };

  // PROFILE SETTINGS FORM SAVE
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileSubmitting(true);
    try {
      const res = await API.put("/auth/profile", {
        userId: currentUser._id,
        name: profileForm.name,
        email: profileForm.email,
        weeklyGoalHours: Number(profileForm.weeklyGoalHours),
        skills: profileForm.skills,
        interests: profileForm.interests
      });
      const freshUser = { ...currentUser, ...res.data.user };
      localStorage.setItem("user", JSON.stringify(freshUser));
      setCurrentUser(freshUser);
      setProfileEditing(false);
      alert("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to update profile settings.");
    } finally {
      setProfileSubmitting(false);
    }
  };

  // PASSWORD UPDATE HANDLER
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!pwdForm.currentPassword || !pwdForm.newPassword) {
      alert("Please fill in all password fields.");
      return;
    }
    setPwdSubmitting(true);
    try {
      await API.put("/auth/profile", {
        userId: currentUser._id,
        currentPassword: pwdForm.currentPassword,
        newPassword: pwdForm.newPassword
      });
      alert("Password updated successfully!");
      setPwdForm({ currentPassword: "", newPassword: "" });
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to update password. Verify current password.");
    } finally {
      setPwdSubmitting(false);
    }
  };

  // EXPORTS
  const handleExportCSV = () => {
    let csv = "Date,Course,Duration (mins),Notes\n";
    studyLogsList.forEach((log) => {
      const dateStr = log.date.toISOString().split("T")[0];
      const notesClean = log.notes.replace(/"/g, '""').replace(/\n/g, " ");
      csv += `${dateStr},"${log.courseTitle}",${log.duration},"${notesClean}"\n`;
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "My_Study_Logs.csv";
    link.click();
  };

  const handleExportMarkdown = () => {
    let md = `# My Learning Progress & Notes\n\n## Courses Overview\n\n`;
    courses.forEach((c) => {
      md += `- **${c.title}** (${c.platform}): ${c.progress || 0}% completed\n`;
    });
    md += `\n## Daily Study Logs\n\n`;
    studyLogsList.forEach((log) => {
      const dateStr = log.date.toISOString().split("T")[0];
      md += `### ${dateStr} - ${log.courseTitle} (${log.duration} mins)\n> ${log.notes}\n\n`;
    });
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "My_Learning_Data.md";
    link.click();
  };

  // THEME SWITCHER
  const toggleTheme = async () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    window.dispatchEvent(new Event("theme-updated"));

    try {
      await API.put("/auth/profile", {
        userId: currentUser._id,
        theme: newTheme
      });
      const fresh = { ...currentUser, theme: newTheme };
      localStorage.setItem("user", JSON.stringify(fresh));
      setCurrentUser(fresh);
    } catch (err) {
      console.warn("Could not sync theme with server", err);
    }
  };

  // LOGOUT
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    alert("Logged out successfully");
    navigate("/login");
  };

  const ExpectedActualTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const expected = payload.find((p) => p.dataKey === "Expected")?.value || 0;
      const actual = payload.find((p) => p.dataKey === "Actual")?.value || 0;
      const diff = Math.abs(expected - actual).toFixed(2);

      return (
        <div style={{ backgroundColor: "rgba(15, 23, 42, 0.9)", backdropFilter: "blur(10px)", padding: "16px", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", color: "white", boxShadow: "0 10px 25px rgba(0,0,0,0.3)" }}>
          <p style={{ margin: "0 0 8px 0", fontWeight: "bold", fontSize: "14px" }}>{label}</p>
          <p style={{ margin: "4px 0", color: "var(--text-muted)", fontSize: "13px" }}>Expected: <strong style={{ color: "white" }}>{expected} hrs</strong></p>
          <p style={{ margin: "4px 0", color: "#8b5cf6", fontSize: "13px" }}>Actual: <strong style={{ color: "#a78bfa" }}>{actual} hrs</strong></p>
          <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px dashed rgba(255,255,255,0.1)", fontSize: "12px", fontWeight: "bold", color: actual >= expected ? "#10b981" : "#f59e0b" }}>
            {actual >= expected ? `✅ Target achieved!` : `⏱️ ${diff} hrs remaining`}
          </div>
        </div>
      );
    }
    return null;
  };

  const handleLessonUpdateStatus = async (course, mIndex, lIndex, isCompleted) => {
    if (!course || !course.modules || !course.modules[mIndex]?.lessons?.[lIndex]) return;

    const copyModules = JSON.parse(JSON.stringify(course.modules));
    const lesson = copyModules[mIndex].lessons[lIndex];
    lesson.completed = isCompleted;
    lesson.completedAt = isCompleted ? new Date().toISOString() : null;

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

    const calcProgress = totalDuration > 0
      ? Math.round((completedDuration / totalDuration) * 100)
      : totalL > 0
        ? Math.round((completedL / totalL) * 100)
        : (course.progress || 0);

    const updates = { modules: copyModules, progress: calcProgress };
    if (calcProgress === 100) updates.status = "Completed";
    else if (calcProgress > 0 && calcProgress < 100) updates.status = "In Progress";
    else if (calcProgress === 0) updates.status = "Not Started";

    await handleUpdate(course._id, updates);
  };

  // TIME-BASED GREETING
  const getGreeting = () => {
    const hrs = new Date().getHours();
    if (hrs < 12) return "Good morning";
    if (hrs < 17) return "Good afternoon";
    return "Good evening";
  };

  // RENDERS
  const renderDashboard = () => {
    const initials = currentUser?.name ? currentUser.name.split(" ").map(n => n.charAt(0).toUpperCase()).join("") : "ST";
    const greeting = getGreeting();
    const quoteIdx = Math.abs((currentUser?.name || "Student").charCodeAt(0) || 0) % MOTIVATIONAL_QUOTES.length;
    const dailyQuote = MOTIVATIONAL_QUOTES[quoteIdx];

    // AI Insight card arrays
    const insights = [
      {
        title: "Study Velocity Surge! 📈",
        desc: totalHours > 5 
          ? `Your learning duration is up 15% this week compared to historical baselines. Spectacular progress!`
          : `Start recording your curriculum hours to unlock detailed AI velocity analytics!`,
        tag: "Efficiency Metrics",
        color: "#10b981"
      },
      {
        title: "Cognitive Focus Period 💡",
        desc: `Your data shows maximum interaction and completion rates occur in the Evening (6:00 PM - 10:00 PM). Log then!`,
        tag: "Schedule Smart",
        color: "#6366f1"
      },
      {
        title: `Streak Safeguard Locked! 🔥`,
        desc: goalProgress >= 100 
          ? `Outstanding! Daily study streak secured. Maintain curriculum focus tomorrow to increment your streak!`
          : `Log another ${10 - Math.round(effectiveTodayStudyTime / 60)} minutes today to prevent your ${displayStreak} day streak from lapsing!`,
        tag: "Consistency Loop",
        color: "#f59e0b"
      }
    ];

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
        
        {/* Section 1: Breathtaking Welcome Hero */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="welcome-hero-banner glass-card" 
          style={{ padding: "32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "24px" }}
        >
          <div style={{ display: "flex", gap: "20px", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{
              width: "74px",
              height: "74px",
              borderRadius: "22px",
              background: "linear-gradient(135deg, var(--primary), var(--primary-light))",
              border: "3px solid rgba(255, 255, 255, 0.15)",
              boxShadow: "0 8px 24px rgba(99, 102, 241, 0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "26px",
              fontWeight: "900",
              color: "white"
            }}>
              {initials}
            </div>
            <div>
              <h1 style={{ fontSize: "26px", fontWeight: "800", margin: "0 0 6px 0", color: "white" }}>
                {greeting}, {currentUser?.name || "Student"}!
              </h1>
              <p style={{ margin: 0, fontSize: "14px", color: "rgba(255, 255, 255, 0.75)", maxWidth: "520px", lineHeight: "1.5" }}>
                ✨ "{dailyQuote}"
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
            {/* Flame streak badge */}
            <div style={{
              background: "rgba(245, 158, 11, 0.12)",
              border: "1px solid rgba(245, 158, 11, 0.25)",
              borderRadius: "16px",
              padding: "10px 18px",
              display: "flex",
              alignItems: "center",
              gap: "10px"
            }}>
              <Flame size={24} color="#f59e0b" fill="#f59e0b" style={{ filter: "drop-shadow(0 0 4px rgba(245,158,11,0.4))" }} />
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "15px", fontWeight: "900", color: "#f59e0b", lineHeight: 1 }}>
                  {displayStreak} Day Streak
                </span>
                <span style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.5)", marginTop: "2px" }}>
                  Active target: 10m
                </span>
              </div>
            </div>

            {/* Quick action button */}
            <button 
              onClick={() => handleTabChange("courses")} 
              className="btn-glow"
              style={{
                padding: "12px 22px",
                borderRadius: "16px",
                fontSize: "14px",
                fontWeight: "700",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <Play size={14} fill="currentColor" />
              Continue Learning
            </button>
          </div>
        </motion.div>

        {/* Section 2: Learning Stats Grid with Counters */}
        <div className="dashboard-stats-grid">
          
          <motion.div whileHover={{ y: -5 }} className="glass-card stat-card">
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Courses</span>
              <h2 style={{ fontSize: "28px", margin: 0, fontWeight: "800", color: "white" }}>
                <AnimatedCounter value={totalCourses} />
              </h2>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Enrolled total</span>
            </div>
            <div className="stat-icon-wrapper" style={{ color: "#3b82f6" }}>
              <BookOpen size={18} />
            </div>
          </motion.div>

          <motion.div whileHover={{ y: -5 }} className="glass-card stat-card">
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Completed</span>
              <h2 style={{ fontSize: "28px", margin: 0, fontWeight: "800", color: "#10b981" }}>
                <AnimatedCounter value={completedCoursesCount} />
              </h2>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>100% finished</span>
            </div>
            <div className="stat-icon-wrapper" style={{ color: "#10b981" }}>
              <CheckCircle2 size={18} />
            </div>
          </motion.div>

          <motion.div whileHover={{ y: -5 }} className="glass-card stat-card">
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Hours studied</span>
              <h2 style={{ fontSize: "28px", margin: 0, fontWeight: "800", color: "#8b5cf6" }}>
                <AnimatedCounter value={totalHours} suffix="h" />
              </h2>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Logged duration</span>
            </div>
            <div className="stat-icon-wrapper" style={{ color: "#8b5cf6" }}>
              <Clock size={18} />
            </div>
          </motion.div>

          <motion.div whileHover={{ y: -5 }} className="glass-card stat-card">
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Streak Days</span>
              <h2 style={{ fontSize: "28px", margin: 0, fontWeight: "800", color: "#f59e0b" }}>
                <AnimatedCounter value={displayStreak} />
              </h2>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Consecutive active</span>
            </div>
            <div className="stat-icon-wrapper" style={{ color: "#f59e0b" }}>
              <Flame size={18} />
            </div>
          </motion.div>

          <motion.div whileHover={{ y: -5 }} className="glass-card stat-card">
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Daily Goal</span>
              <h2 style={{ fontSize: "28px", margin: 0, fontWeight: "800", color: "#ec4899" }}>
                <AnimatedCounter value={goalProgress} suffix="%" />
              </h2>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                {Math.round(effectiveTodayStudyTime / 60)}/10m
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center" }}>
              <ProgressRing progress={goalProgress} size={42} strokeWidth={4} color="#ec4899" />
            </div>
          </motion.div>

          <motion.div whileHover={{ y: -5 }} className="glass-card stat-card">
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Badges</span>
              <h2 style={{ fontSize: "28px", margin: 0, fontWeight: "800", color: "#06b6d4" }}>
                <AnimatedCounter value={badgeCount} />
              </h2>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Achievements</span>
            </div>
            <div className="stat-icon-wrapper" style={{ color: "#06b6d4" }}>
              <Trophy size={18} />
            </div>
          </motion.div>

        </div>

        {/* Section 7: AI Learning Insights */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Sparkles size={18} color="var(--primary)" />
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>Smart AI Insights Recommendations</h3>
          </div>
          <div className="insights-grid">
            {insights.map((ins, i) => (
              <motion.div 
                key={i} 
                whileHover={{ y: -4 }}
                className="glass-card" 
                style={{ padding: "20px", borderLeft: `4px solid ${ins.color}`, background: "rgba(21, 25, 35, 0.45)" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "800", color: ins.color, textTransform: "uppercase", letterSpacing: "0.5px" }}>{ins.tag}</span>
                  <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>AI Recommendation</span>
                </div>
                <h4 style={{ margin: "0 0 6px 0", fontWeight: "700", fontSize: "14px", color: "white" }}>{ins.title}</h4>
                <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)", lineHeight: "1.5" }}>{ins.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Section 4 & 5: Gamification Progression & Weekly Activity */}
        <div className="charts-grid">
          {/* XP & Level Progression Card */}
          <div className="glass-card" style={{ padding: "24px", justifyContent: "space-between", minHeight: "260px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h3 style={{ margin: "0 0 4px 0", fontSize: "17px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Activity size={18} color="#d97706" />
                  XP Gamification Progression
                </h3>
                <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>Unlock levels by watching modules and completing courses.</p>
              </div>
              <div className="xp-level-badge">
                <Sparkles size={12} fill="white" />
                Level {level}
              </div>
            </div>

            <div style={{ margin: "24px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: "bold", marginBottom: "6px", color: "white" }}>
                <span>XP Balance: <strong>{totalXP} XP</strong></span>
                <span>{xpProgressPct}% toward Level {level + 1}</span>
              </div>
              <div style={{ width: "100%", height: "10px", background: "rgba(255,255,255,0.05)", borderRadius: "10px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ width: `${xpProgressPct}%`, height: "100%", background: "linear-gradient(90deg, #ec4899, #8b5cf6)", borderRadius: "10px", transition: "width 0.8s" }} />
              </div>
            </div>

            {/* Daily challenges preview */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <span style={{ fontSize: "11px", fontWeight: "800", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Daily Learning Quests</span>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: goalProgress >= 100 ? "#10b981" : "var(--text-muted)" }}>
                  <CheckSquare size={13} color={goalProgress >= 100 ? "#10b981" : "var(--text-muted)"} />
                  <span>Maintain Study Streak (10m study) {goalProgress >= 100 && "✓"}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--text-muted)" }}>
                  <CheckSquare size={13} />
                  <span>Attempt 1 Skill Quiz (Gain 50 XP)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Heatmap Study log heatmap */}
          <div className="glass-card" style={{ padding: "24px", justifyContent: "space-between", minHeight: "260px" }}>
            <div>
              <h3 style={{ margin: "0 0 4px 0", fontSize: "17px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
                <Calendar size={18} color="#10b981" />
                Weekly study log heatmap
              </h3>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>Your study minutes tracked daily across the last 7 days.</p>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", margin: "20px 0" }}>
              {last7Days.map((day, idx) => {
                const active = day.duration > 0;
                return (
                  <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", flex: 1 }}>
                    <div 
                      className="heatmap-cell"
                      style={{
                        width: "100%",
                        height: "40px",
                        borderRadius: "8px",
                        background: active ? `rgba(16, 185, 129, ${Math.min(1, 0.2 + day.duration / 30)})` : "rgba(255,255,255,0.02)",
                        border: `1.5px solid ${active ? "rgba(16, 185, 129, 0.4)" : "rgba(255,255,255,0.04)"}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "11px",
                        fontWeight: "bold",
                        color: active ? "white" : "rgba(255,255,255,0.3)"
                      }}
                    >
                      {active ? `${day.duration}m` : ""}
                    </div>
                    <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted)" }}>{day.dayName}</span>
                  </div>
                );
              })}
            </div>
            
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Streak locks increment when a day box turns green!</span>
          </div>
        </div>

        {/* Section 8: Community Leaderboard Widget */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <TrendingUp size={18} color="var(--primary)" />
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>Global Community Rankings</h3>
          </div>
          <div className="glass-card" style={{ padding: "20px" }}>
            <div style={{ overflowX: "auto" }}>
              <table className="responsive-table" style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 8px" }}>
                <thead>
                  <tr style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    <th style={{ padding: "8px 16px", textAlign: "left" }}>Rank</th>
                    <th style={{ padding: "8px 16px", textAlign: "left" }}>Student</th>
                    <th style={{ padding: "8px 16px", textAlign: "left" }}>Duration</th>
                    <th style={{ padding: "8px 16px", textAlign: "left" }}>Streak</th>
                    <th style={{ padding: "8px 16px", textAlign: "right" }}>Score Points</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderBoardUsers.map((user) => (
                    <tr 
                      key={user.rank} 
                      style={{ 
                        background: user.isSelf ? "rgba(99, 102, 241, 0.1)" : "rgba(255,255,255,0.01)",
                        border: user.isSelf ? "1px solid rgba(99,102,241,0.3)" : "1px solid rgba(255,255,255,0.04)"
                      }}
                    >
                      <td style={{ padding: "12px 16px", fontWeight: "bold", color: user.rank <= 3 ? "#f59e0b" : "white" }}>
                        {user.rank === 1 ? "🥇 1" : user.rank === 2 ? "🥈 2" : user.rank === 3 ? "🥉 3" : `${user.rank}`}
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: "bold" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{
                            width: "28px",
                            height: "28px",
                            borderRadius: "50%",
                            background: user.isSelf ? "var(--primary)" : "#374151",
                            fontSize: "11px",
                            fontWeight: "800",
                            color: "white",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                          }}>
                            {user.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                          </div>
                          <span style={{ color: user.isSelf ? "white" : "var(--text-muted)" }}>
                            {user.name} {user.isSelf && " (You)"}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px", color: "white" }}>{user.hours} hrs</td>
                      <td style={{ padding: "12px 16px", color: "#f59e0b", fontWeight: "bold" }}>{user.streak} days 🔥</td>
                      <td style={{ padding: "12px 16px", fontWeight: "800", color: "var(--primary-light)", textAlign: "right" }}>{user.score} XP</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Section 6: Analytics Recharts */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Activity size={18} color="var(--primary)" />
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>Interactive Study Analytics</h3>
        </div>
        <div className="charts-grid">
          {/* Expected vs Actual hours */}
          <div className="glass-card" style={{ minHeight: "340px" }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "700", color: "white" }}>📈 Target vs Recorded Study Time</h3>
            <div style={{ width: "100%", height: "240px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expectedVsActualData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} />
                  <YAxis stroke="var(--text-muted)" fontSize={10} />
                  <Tooltip content={<ExpectedActualTooltip />} />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                  <Bar dataKey="Expected" fill="rgba(99, 102, 241, 0.2)" stroke="var(--primary)" strokeWidth={1} radius={[4, 4, 0, 0]} name="Expected Target" />
                  <Bar dataKey="Actual" fill="var(--primary)" radius={[4, 4, 0, 0]} name="Actual Logged" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Burnup progress line */}
          <div className="glass-card" style={{ minHeight: "340px" }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "700", color: "white" }}>🚀 Course Lessons Burnup Trend</h3>
            <div style={{ width: "100%", height: "240px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={burnupData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorComp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} />
                  <YAxis stroke="var(--text-muted)" fontSize={10} />
                  <Tooltip contentStyle={{ background: "rgba(15,23,42,0.9)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", color: "white" }} />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                  <Area type="monotone" dataKey="Total" stroke="#3b82f6" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={2} name="Total Lessons" />
                  <Area type="monotone" dataKey="Completed" stroke="#10b981" fillOpacity={1} fill="url(#colorComp)" strokeWidth={2} name="Completed Lessons" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>
    );
  };

  const renderCourses = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>


      {/* View Filters bar */}
      <div className="glass-card" style={{ padding: "18px 24px" }}>
        <div className="filter-bar" style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
          
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {["All", "In Progress", "Paused", "Completed", "Not Started"].map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                style={{
                  padding: "8px 14px",
                  borderRadius: "8px",
                  background: statusFilter === f ? "linear-gradient(135deg, var(--primary), var(--primary-dark))" : "rgba(255,255,255,0.02)",
                  color: statusFilter === f ? "white" : "var(--text-muted)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  fontWeight: "700",
                  fontSize: "12px",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                {f}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <Search size={14} color="rgba(255,255,255,0.3)" style={{ position: "absolute", left: "10px" }} />
              <input
                type="text"
                placeholder="Search curriculum title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: "8px 12px 8px 30px",
                  borderRadius: "8px",
                  background: "var(--bg-main)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  color: "white",
                  outline: "none",
                  fontSize: "13px"
                }}
              />
            </div>

            <div style={{ display: "flex", borderRadius: "8px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" }}>
              <button onClick={() => setViewMode("grid")} style={{ padding: "8px 12px", background: viewMode === "grid" ? "var(--primary)" : "var(--bg-main)", color: "white", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}>Grid</button>
              <button onClick={() => setViewMode("kanban")} style={{ padding: "8px 12px", background: viewMode === "kanban" ? "var(--primary)" : "var(--bg-main)", color: "white", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}>Kanban</button>
            </div>
          </div>
        </div>

        {availableCategories.length > 0 && (
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "12px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "12px" }}>
            <button
              onClick={() => setCategoryFilter("All")}
              style={{
                padding: "4px 10px",
                borderRadius: "6px",
                background: categoryFilter === "All" ? "var(--primary)" : "rgba(255,255,255,0.02)",
                color: "white",
                border: "none",
                fontSize: "11px",
                fontWeight: "700",
                cursor: "pointer"
              }}
            >
              All Categories
            </button>
            {availableCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                style={{
                  padding: "4px 10px",
                  borderRadius: "6px",
                  background: categoryFilter === cat ? "var(--primary)" : "rgba(255,255,255,0.02)",
                  color: "white",
                  border: "none",
                  fontSize: "11px",
                  fontWeight: "700",
                  cursor: "pointer"
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {filteredCourses.length > 0 ? (
        viewMode === "grid" ? (
          <div className="course-card-grid">
            {filteredCourses.map((c) => (
              <motion.div 
                key={c._id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <CourseCard
                  course={c}
                  onDelete={() => handleDelete(c._id)}
                  onUpdate={(data) => handleUpdate(c._id, data)}
                  onPlayVideo={(videoData) => {
                    navigate(`/video?courseId=${c._id}&mIndex=${videoData.mIndex}&lIndex=${videoData.lIndex}`);
                  }}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="kanban-board" style={{ display: "flex", gap: "20px", overflowX: "auto", paddingBottom: "16px", alignItems: "flex-start" }}>
            {["Not Started", "In Progress", "Paused", "Completed"].map((status) => {
              const colCourses = filteredCourses.filter((c) => {
                const prog = c.progress || 0;
                if (status === "Completed") return prog === 100;
                if (status === "Paused") return c.status === "Paused" && prog < 100;
                if (status === "Not Started") return c.status !== "Paused" && prog === 0;
                if (status === "In Progress") return c.status !== "Paused" && prog > 0 && prog < 100;
                return false;
              });

              return (
                <div
                  key={status}
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.backgroundColor = "rgba(99, 102, 241, 0.04)"; }}
                  onDragLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                  onDrop={(e) => { e.preventDefault(); e.currentTarget.style.backgroundColor = "transparent"; handleDropCourse(status); }}
                  style={{ flex: "1 0 310px", minWidth: "310px", background: "rgba(15,23,42,0.3)", borderRadius: "18px", border: "1px solid rgba(255,255,255,0.06)", transition: "all 0.2s" }}
                >
                  <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.05)", fontWeight: "bold", fontSize: "14px", display: "flex", justifyContent: "space-between", alignItems: "center", color: "white" }}>
                    <span>{status}</span>
                    <span style={{ background: "var(--primary)", color: "white", padding: "2px 8px", borderRadius: "10px", fontSize: "10px" }}>{colCourses.length}</span>
                  </div>
                  <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "12px", minHeight: "220px" }}>
                    {colCourses.map((c) => (
                      <div
                        key={c._id}
                        draggable
                        onDragStart={() => handleDragStartCourse(c._id)}
                        style={{ cursor: "grab", opacity: draggingCourseId === c._id ? 0.5 : 1 }}
                      >
                        <CourseCard
                          course={c}
                          onDelete={() => handleDelete(c._id)}
                          onUpdate={(data) => handleUpdate(c._id, data)}
                          onPlayVideo={(videoData) => {
                            navigate(`/video?courseId=${c._id}&mIndex=${videoData.mIndex}&lIndex=${videoData.lIndex}`);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        <div style={{ textAlign: "center", padding: "40px", background: "rgba(21,25,35,0.4)", border: "2.5px dashed rgba(255,255,255,0.05)", borderRadius: "18px" }}>
          <AlertCircle size={24} color="var(--text-muted)" style={{ marginBottom: "10px" }} />
          <h3 style={{ color: "white" }}>No Courses Found</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>Search or modify status filters, or add manual courses to begin.</p>
        </div>
      )}
    </div>
  );

  const renderLogs = () => (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "28px" }} className="profile-layout-grid">
      <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
        
        {/* Study log manual form */}
        <div className="glass-card" style={{ padding: "22px" }}>
          <h3 style={{ margin: "0 0 4px 0", fontSize: "17px", fontWeight: "700", color: "white", display: "flex", alignItems: "center", gap: "8px" }}>
            <Clock size={16} color="var(--primary)" />
            Log Custom Study Session
          </h3>
          <p style={{ margin: "0 0 20px 0", fontSize: "12px", color: "var(--text-muted)" }}>Enter study sessions manually to keep your learning metrics synchronized.</p>
          
          <form onSubmit={handleAddManualLog} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", marginBottom: "6px" }}>Select Curriculum</label>
              <select
                value={manualLog.courseId}
                onChange={(e) => setManualLog({ ...manualLog, courseId: e.target.value })}
                required
                style={{ width: "100%", padding: "10px", background: "var(--bg-main)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", color: "white", outline: "none", fontSize: "13px" }}
              >
                <option value="">-- Choose a course --</option>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>{c.title}</option>
                ))}
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", marginBottom: "6px" }}>Duration (mins)</label>
                <input
                  type="number"
                  value={manualLog.duration}
                  onChange={(e) => setManualLog({ ...manualLog, duration: Number(e.target.value) })}
                  min="1"
                  required
                  style={{ width: "100%", padding: "10px", background: "var(--bg-main)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", color: "white", outline: "none", fontSize: "13px" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", marginBottom: "6px" }}>Study Date</label>
                <input
                  type="date"
                  value={manualLog.date}
                  onChange={(e) => setManualLog({ ...manualLog, date: e.target.value })}
                  required
                  style={{ width: "100%", padding: "10px", background: "var(--bg-main)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", color: "white", outline: "none", fontSize: "13px" }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", marginBottom: "6px" }}>Topic Highlights</label>
              <textarea
                value={manualLog.notes}
                onChange={(e) => setManualLog({ ...manualLog, notes: e.target.value })}
                placeholder="What did you focus on during this curriculum session?"
                required
                style={{ width: "100%", minHeight: "80px", padding: "10px", background: "var(--bg-main)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", color: "white", outline: "none", resize: "none", fontSize: "13px", fontFamily: "inherit" }}
              />
            </div>

            <button
              type="submit"
              disabled={manualLogSubmitting}
              className="action-btn"
              style={{
                width: "100%",
                padding: "11px",
                background: "linear-gradient(135deg, var(--primary), var(--primary-dark))",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontWeight: "bold",
                cursor: manualLogSubmitting ? "not-allowed" : "pointer",
                fontSize: "13px"
              }}
            >
              {manualLogSubmitting ? "Submitting..." : "💾 Add Study Log"}
            </button>
          </form>
        </div>

        <div className="glass-card" style={{ padding: "20px" }}>
          <h4 style={{ margin: "0 0 6px 0", fontSize: "14px", fontWeight: "700", color: "white" }}>🔮 Predictor Insights</h4>
          <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.6 }}>Based on your average rate of {loggedMinutes > 0 ? Math.round(loggedMinutes / courses.length) : 0} minutes per curriculum, you are keeping a healthy learning rhythm!</p>
        </div>
      </div>

      <div className="glass-card" style={{ padding: "24px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
          <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "700", color: "white" }}>📜 Learning Sessions Log History</h3>
          <div style={{ display: "flex", gap: "6px" }}>
            <button onClick={handleExportCSV} style={{ padding: "6px 12px", background: "var(--bg-main)", color: "white", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", fontSize: "11px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
              <Download size={12} />
              CSV
            </button>
            <button onClick={handleExportMarkdown} style={{ padding: "6px 12px", background: "var(--bg-main)", color: "white", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", fontSize: "11px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
              <FileText size={12} />
              Markdown
            </button>
          </div>
        </div>

        <div style={{ overflowX: "auto", width: "100%", flex: 1 }}>
          {studyLogsList.length > 0 ? (
            <table className="responsive-table" style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 8px" }}>
              <thead>
                <tr style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  <th style={{ padding: "10px 16px" }}>Date</th>
                  <th style={{ padding: "10px 16px" }}>Course Title</th>
                  <th style={{ padding: "10px 16px" }}>Duration</th>
                  <th style={{ padding: "10px 16px" }}>Study Highlights</th>
                </tr>
              </thead>
              <tbody>
                {studyLogsList.map((log) => (
                  <tr key={log.id} style={{ background: "rgba(255,255,255,0.01)" }}>
                    <td style={{ padding: "12px 16px", whiteSpace: "nowrap", fontSize: "12px", color: "var(--text-muted)" }}>{log.date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                    <td style={{ padding: "12px 16px", fontWeight: "bold", color: "white", fontSize: "13px" }}>{log.courseTitle}</td>
                    <td style={{ padding: "12px 16px", color: "var(--primary-light)", fontWeight: "700", fontSize: "13px" }}>{log.duration} mins</td>
                    <td style={{ padding: "12px 16px", color: "var(--text-muted)", fontSize: "12px" }}>{log.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ height: "200px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
              No study session logs recorded yet. Complete video modules or record logs above!
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderQuizzes = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      <div className="glass-card" style={{ padding: "30px", background: "linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(16, 185, 129, 0.08))", border: "1px solid rgba(245, 158, 11, 0.15)" }}>
        <h2 style={{ margin: "0 0 10px 0", fontSize: "22px", fontWeight: "800", color: "white", display: "flex", alignItems: "center", gap: "10px" }}>
          <Zap size={22} color="#f59e0b" fill="#f59e0b" />
          Student Recall Quizzes & Trivia
        </h2>
        <p style={{ margin: 0, fontSize: "14px", color: "var(--text-muted)", maxWidth: "700px", lineHeight: 1.6 }}>
          Validate your computer science, programming syntax, and architectural concepts! Attempt rapid-fire timed evaluations to secure high scores and community XP points.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))", gap: "24px" }} className="course-card-grid">
        {AVAILABLE_QUIZZES.map((quiz) => {
          const QuizIcon = quiz.icon;
          return (
            <div key={quiz.id} className="glass-card" style={{ padding: "24px", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "220px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: `${quiz.color}15`, display: "flex", alignItems: "center", justifyContent: "center", color: quiz.color }}>
                  <QuizIcon size={24} />
                </div>
                <span style={{ padding: "4px 10px", borderRadius: "12px", background: `${quiz.color}20`, color: quiz.color, fontSize: "11px", fontWeight: "bold" }}>{quiz.difficulty}</span>
              </div>
              <div>
                <h3 style={{ margin: "0 0 8px 0", fontSize: "17px", fontWeight: "700", color: "white" }}>{quiz.title}</h3>
                <p style={{ margin: "0 0 20px 0", fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.5 }}>{quiz.description}</p>
              </div>
              <Link to={quiz.route} style={{ textDecoration: "none", width: "100%" }}>
                <button
                  className="action-btn"
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: quiz.color,
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    fontSize: "13px"
                  }}
                >
                  Attempt Evaluation →
                </button>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderGames = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      <div className="glass-card" style={{ padding: "30px", background: "linear-gradient(135deg, rgba(6, 182, 212, 0.08), rgba(236, 72, 153, 0.08))", border: "1px solid rgba(6, 182, 212, 0.15)" }}>
        <h2 style={{ margin: "0 0 10px 0", fontSize: "22px", fontWeight: "800", color: "white", display: "flex", alignItems: "center", gap: "10px" }}>
          <Gamepad2 size={22} color="#06b6d4" />
          Interactive Learning Games
        </h2>
        <p style={{ margin: 0, fontSize: "14px", color: "var(--text-muted)", maxWidth: "700px", lineHeight: 1.6 }}>
          Play high-contrast gamified vocabulary and typing speed drills! Reinforce syntax patterns, type quickly to secure scores, and level up your engineering reflexes.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }} className="course-card-grid">
        {AVAILABLE_GAMES.map((game) => {
          const GameIcon = game.icon;
          return (
            <div key={game.id} className="glass-card" style={{ padding: "24px", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "220px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: `${game.color}15`, display: "flex", alignItems: "center", justifyContent: "center", color: game.color }}>
                  <GameIcon size={22} />
                </div>
                <span style={{ padding: "4px 10px", borderRadius: "12px", background: `${game.color}20`, color: game.color, fontSize: "11px", fontWeight: "bold" }}>{game.difficulty}</span>
              </div>
              <div>
                <h3 style={{ margin: "0 0 8px 0", fontSize: "17px", fontWeight: "700", color: "white" }}>{game.title}</h3>
                <p style={{ margin: "0 0 20px 0", fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.5 }}>{game.description}</p>
              </div>
              <Link to={game.route} style={{ textDecoration: "none", width: "100%" }}>
                <button
                  className="action-btn"
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: game.color,
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    fontSize: "13px"
                  }}
                >
                  Play Game Module →
                </button>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderPuzzles = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      <div className="glass-card" style={{ padding: "30px", background: "linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(59, 130, 246, 0.08))", border: "1px solid rgba(139, 92, 246, 0.15)" }}>
        <h2 style={{ margin: "0 0 10px 0", fontSize: "22px", fontWeight: "800", color: "white", display: "flex", alignItems: "center", gap: "10px" }}>
          <BrainCircuit size={22} color="#8b5cf6" />
          Interactive Debug Puzzles
        </h2>
        <p style={{ margin: 0, fontSize: "14px", color: "var(--text-muted)", maxWidth: "700px", lineHeight: 1.6 }}>
          Solve logical and compiler syntax bugs directly in your web workspace environment! Uncover execution flows, rewrite variables, and speed up your diagnostic algorithms.
        </p>
      </div>

      <div className="glass-card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "700", color: "white" }}>Debug Complex Algorithmic Puzzles</h3>
            <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "var(--text-muted)" }}>Evaluate lexical declarations and identify asynchronous runtime bug patterns.</p>
          </div>
          <Link to="/coding-puzzle" style={{ textDecoration: "none" }}>
            <button className="action-btn btn-glow" style={{ padding: "10px 22px", borderRadius: "10px", fontWeight: "bold", cursor: "pointer", fontSize: "13px" }}>
              💻 Launch Code Console
            </button>
          </Link>
        </div>
      </div>
    </div>
  );

  const renderCertificates = () => {
    const completedCoursesList = courses.filter((c) => (c.progress || 0) === 100);

    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "28px" }} className="profile-layout-grid">
        
        {/* Certificate Previews */}
        <div className="glass-card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
          <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "700", color: "white", display: "flex", alignItems: "center", gap: "8px" }}>
            <Award size={18} color="var(--primary)" />
            Authenticated Course Credentials
          </h3>
          <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)" }}>Earned upon satisfying 100% video modules and lesson logs. Download and authenticate instantly.</p>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", overflowY: "auto", maxHeight: "380px" }}>
            {completedCoursesList.length > 0 ? (
              completedCoursesList.map((course) => (
                <div 
                  key={course._id} 
                  className="gold-badge-glow"
                  style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center", 
                    padding: "16px", 
                    border: "1.5px solid rgba(245,158,11,0.25)",
                    background: "rgba(245,158,11,0.02)", 
                    borderRadius: "14px",
                    transition: "all 0.3s"
                  }}
                >
                  <div>
                    <h4 style={{ margin: "0 0 4px 0", fontWeight: "800", color: "white", fontSize: "14px" }}>{course.title}</h4>
                    <span style={{ fontSize: "11px", color: "rgba(245, 158, 11, 0.7)", fontFamily: "monospace" }}>ID: UC-{course._id.toString().slice(-8).toUpperCase()}</span>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <Link
                      to={`/certificate?courseName=${encodeURIComponent(course.title)}`}
                      style={{ textDecoration: "none" }}
                    >
                      <button className="action-btn" style={{ padding: "6px 14px", background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "white", border: "none", borderRadius: "8px", fontSize: "12px", fontWeight: "bold", cursor: "pointer", boxShadow: "0 4px 12px rgba(245,158,11,0.2)" }}>📄 View PDF</button>
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ height: "200px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
                No completed courses found. Reach 100% to unlock certificates!
              </div>
            )}
          </div>
        </div>

        {/* Local Verification Hub */}
        <div className="glass-card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
          <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "700", color: "white", display: "flex", alignItems: "center", gap: "8px" }}>
            <QrCode size={18} color="#10b981" />
            Verification scanner log
          </h3>
          <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)" }}>Input or audit cryptographic platform signatures to prove educational authenticity.</p>

          <form onSubmit={handleVerifyCertificate} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <input
              type="text"
              placeholder="Enter Certificate ID (e.g. UC-XXXXXXXX)..."
              value={verifyCertId}
              onChange={(e) => setVerifyCertId(e.target.value)}
              required
              style={{ width: "100%", padding: "10px", background: "var(--bg-main)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", color: "white", outline: "none", fontSize: "13px" }}
            />
            <button
              type="submit"
              disabled={verifyingCert}
              className="action-btn"
              style={{
                width: "100%",
                padding: "11px",
                background: "linear-gradient(135deg, #10b981, #059669)",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontWeight: "bold",
                cursor: verifyingCert ? "not-allowed" : "pointer",
                fontSize: "13px"
              }}
            >
              {verifyingCert ? "Verifying..." : "🔍 Scan Cryptographic Authenticity"}
            </button>
          </form>

          {verificationResult && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                padding: "16px",
                borderRadius: "12px",
                background: verificationResult.status === "verified" ? "rgba(16, 185, 129, 0.08)" : "rgba(239, 68, 68, 0.08)",
                border: `1.5px solid ${verificationResult.status === "verified" ? "#10b981" : "#ef4444"}`,
                color: verificationResult.status === "verified" ? "#10b981" : "#ef4444"
              }}
            >
              {verificationResult.status === "verified" ? (
                <div>
                  <h4 style={{ margin: "0 0 6px 0", fontWeight: "900", display: "flex", alignItems: "center", gap: "6px" }}>
                    <CheckCircle2 size={16} />
                    SIGNATURE VERIFIED
                  </h4>
                  <p style={{ margin: "4px 0", fontSize: "13px", color: "white" }}>Issued to: <strong>{verificationResult.studentName}</strong></p>
                  <p style={{ margin: "4px 0", fontSize: "13px", color: "white" }}>Course: <strong>{verificationResult.courseTitle}</strong></p>
                  <p style={{ margin: "4px 0", fontSize: "12px", color: "var(--text-muted)" }}>Verify Timestamp: {verificationResult.issueDate}</p>
                </div>
              ) : (
                <div>
                  <h4 style={{ margin: "0 0 6px 0", fontWeight: "900", display: "flex", alignItems: "center", gap: "6px" }}>
                    <AlertCircle size={16} />
                    VERIFICATION FAILED
                  </h4>
                  <p style={{ margin: 0, fontSize: "12px", color: "white" }}>{verificationResult.message}</p>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    );
  };

  const renderAchievements = () => {
    return (
      <div className="glass-card" style={{ padding: "24px" }}>
        <h3 style={{ margin: "0 0 6px 0", fontSize: "18px", fontWeight: "700", color: "white", display: "flex", alignItems: "center", gap: "8px" }}>
          <Trophy size={18} color="var(--primary)" />
          Earned Streak Badges & Accolades
        </h3>
        <p style={{ margin: "0 0 24px 0", fontSize: "13px", color: "var(--text-muted)" }}>Unlock premium badges by securing study streaks. Celebrate milestones with audio cues!</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" }} className="course-card-grid">
          {BADGES.map((badge, idx) => {
            const unlocked = displayStreak >= badge.requiredStreak;
            return (
              <motion.div
                key={idx}
                whileHover={unlocked ? { y: -4 } : {}}
                style={{
                  padding: "24px",
                  borderRadius: "20px",
                  background: unlocked ? "rgba(16, 185, 129, 0.02)" : "rgba(255,255,255,0.01)",
                  border: `2px solid ${unlocked ? "#10b981" : "rgba(255,255,255,0.05)"}`,
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "space-between",
                  minHeight: "200px"
                }}
              >
                <div style={{
                  width: "70px",
                  height: "70px",
                  borderRadius: "50%",
                  background: unlocked ? "rgba(16, 185, 129, 0.08)" : "rgba(255,255,255,0.02)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "36px",
                  filter: unlocked ? "none" : "grayscale(100%) opacity(0.35)",
                  boxShadow: unlocked ? "0 0 20px rgba(16,185,129,0.15)" : "none"
                }}>
                  {badge.icon}
                </div>
                <div>
                  <h4 style={{ margin: "12px 0 4px 0", color: unlocked ? "white" : "var(--text-muted)", fontWeight: "bold", fontSize: "14px" }}>{badge.title}</h4>
                  <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)", lineHeight: "1.4" }}>{badge.description}</p>
                </div>
                <span style={{
                  display: "inline-block",
                  marginTop: "12px",
                  fontSize: "11px",
                  fontWeight: "bold",
                  padding: "4px 10px",
                  borderRadius: "10px",
                  background: unlocked ? "rgba(16, 185, 129, 0.15)" : "rgba(255,255,255,0.05)",
                  color: unlocked ? "#10b981" : "var(--text-muted)"
                }}>
                  {unlocked ? "✓ UNLOCKED" : `Streak: ${displayStreak}/${badge.requiredStreak}`}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderLeaderboard = () => (
    <div className="glass-card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "white", display: "flex", alignItems: "center", gap: "8px" }}>
          <TrendingUp size={18} color="var(--primary)" />
          Global community rankings
        </h3>
        <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "var(--text-muted)" }}>Compete with standard students across study nodes based on logged XP and study consistency.</p>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table className="responsive-table" style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 8px" }}>
          <thead>
            <tr style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              <th style={{ padding: "10px 16px" }}>Rank</th>
              <th style={{ padding: "10px 16px" }}>Learner Node</th>
              <th style={{ padding: "10px 16px" }}>Study Duration</th>
              <th style={{ padding: "10px 16px" }}>Active Streak</th>
              <th style={{ padding: "10px 16px", textAlign: "right" }}>XP points system</th>
            </tr>
          </thead>
          <tbody>
            {leaderBoardUsers.map((user) => (
              <tr key={user.rank} style={{ background: user.isSelf ? "rgba(99, 102, 241, 0.08)" : "rgba(255,255,255,0.015)" }}>
                <td style={{ padding: "14px 16px", fontWeight: "bold", color: user.rank <= 3 ? "#f59e0b" : "white" }}>
                  {user.rank === 1 ? "🥇 1" : user.rank === 2 ? "🥈 2" : user.rank === 3 ? "🥉 3" : `${user.rank}`}
                </td>
                <td style={{ padding: "14px 16px", fontWeight: "bold", color: user.isSelf ? "white" : "var(--text-muted)" }}>
                  {user.name} {user.isSelf && " (You)"}
                </td>
                <td style={{ padding: "14px 16px", color: "white" }}>{user.hours} hrs</td>
                <td style={{ padding: "14px 16px", color: "#f59e0b" }}>{user.streak} days 🔥</td>
                <td style={{ padding: "14px 16px", fontWeight: "900", color: "var(--primary-light)", textAlign: "right" }}>{user.score} XP</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderNotifications = () => (
    <div className="glass-card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
      <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "700", color: "white", display: "flex", alignItems: "center", gap: "8px" }}>
        <Bell size={18} color="var(--primary)" />
        System Notifications & reminding logs
      </h3>
      <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)" }}>Course notifications, deadline notifications, and congratulations alerts.</p>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <motion.div 
          whileHover={{ x: 4 }}
          style={{ padding: "16px", background: "rgba(99, 102, 241, 0.06)", borderLeft: "4px solid var(--primary)", borderRadius: "10px", borderTop: "1px solid rgba(255,255,255,0.03)", borderRight: "1px solid rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.03)" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontWeight: "bold", fontSize: "13px" }}>
            <span style={{ color: "white" }}>🛠️ Modernized LMS Interface Online</span>
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Just now</span>
          </div>
          <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)", lineHeight: "1.4" }}>Your Student hub dashboard was completely upgraded to a highly responsive glassmorphic dark interface with automated countdown counters and SVG rings.</p>
        </motion.div>

        <motion.div 
          whileHover={{ x: 4 }}
          style={{ padding: "16px", background: "rgba(255,255,255,0.01)", borderLeft: "4px solid rgba(255,255,255,0.1)", borderRadius: "10px", borderTop: "1px solid rgba(255,255,255,0.02)", borderRight: "1px solid rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.02)" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontWeight: "bold", fontSize: "13px" }}>
            <span style={{ color: "white" }}>🔥 Studying Habit Target Reminders</span>
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>1 day ago</span>
          </div>
          <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)", lineHeight: "1.4" }}>Daily study streak logs require an active video learning or manual study logging of at least 10 minutes (600s). Complete yours today!</p>
        </motion.div>
      </div>
    </div>
  );

  const renderProfile = () => {
    const initials = currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : "U";

    // Profile Completion percentage metric
    let completeness = 0;
    if (currentUser?.name) completeness += 25;
    if (currentUser?.email) completeness += 25;
    if (currentUser?.weeklyGoalHours) completeness += 25;
    if (currentUser?.skills || currentUser?.interests) completeness += 25;

    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "28px" }} className="profile-layout-grid">
        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          
          {/* Avatar Profile completion card */}
          <div className="glass-card" style={{ padding: "30px", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, var(--primary), var(--primary-light))",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "32px",
              fontWeight: "900",
              marginBottom: "16px",
              boxShadow: "0 8px 24px rgba(99,102,241,0.25)"
            }}>
              {initials}
            </div>
            <h3 style={{ margin: "0 0 4px 0", fontSize: "18px", fontWeight: "800", color: "white" }}>{currentUser?.name || "Student"}</h3>
            <span style={{ padding: "4px 10px", borderRadius: "12px", background: "rgba(99, 102, 241, 0.15)", color: "var(--primary-light)", fontSize: "11px", fontWeight: "bold" }}>Standard Student</span>

            <div style={{ width: "100%", borderTop: "1px solid rgba(255,255,255,0.05)", marginTop: "24px", paddingTop: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Profile Completion</span>
                <span style={{ fontSize: "12px", fontWeight: "bold", color: "#10b981" }}>{completeness}%</span>
              </div>
              <div style={{ width: "100%", height: "6px", background: "rgba(255,255,255,0.05)", borderRadius: "10px" }}>
                <div style={{ width: `${completeness}%`, height: "100%", background: "#10b981", borderRadius: "10px" }} />
              </div>
            </div>

            <div style={{ width: "100%", marginTop: "20px", fontSize: "12px" }}>
              <p style={{ margin: "0 0 4px 0", color: "var(--text-muted)", fontWeight: "bold" }}>User ID Token</p>
              <p style={{ margin: 0, fontFamily: "monospace", color: "rgba(255,255,255,0.5)", wordBreak: "break-all" }}>{currentUser?._id}</p>
            </div>
          </div>

          <div className="glass-card" style={{ padding: "20px" }}>
            <h4 style={{ margin: "0 0 6px 0", fontSize: "14px", fontWeight: "700", color: "white" }}>📥 Export Local Records</h4>
            <p style={{ margin: "0 0 16px 0", fontSize: "12px", color: "var(--text-muted)" }}>Download backup copies of your local log and study files.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <button onClick={handleExportCSV} style={{ padding: "8px 12px", background: "var(--bg-main)", color: "white", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "6px", fontSize: "11px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                <Download size={13} />
                Download Logs (CSV)
              </button>
              <button onClick={handleExportMarkdown} style={{ padding: "8px 12px", background: "var(--bg-main)", color: "white", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "6px", fontSize: "11px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                <FileText size={13} />
                Download Notes (Markdown)
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          
          {/* Profile settings fields form */}
          <div className="glass-card" style={{ padding: "24px" }}>
            <h3 style={{ margin: "0 0 20px 0", fontSize: "17px", fontWeight: "700", color: "white" }}>General Profile Settings</h3>
            
            {profileEditing ? (
              <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", marginBottom: "6px" }}>Full Name</label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    required
                    style={{ width: "100%", padding: "10px", background: "var(--bg-main)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", color: "white", outline: "none", fontSize: "13px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", marginBottom: "6px" }}>Email Address</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    required
                    style={{ width: "100%", padding: "10px", background: "var(--bg-main)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", color: "white", outline: "none", fontSize: "13px" }}
                  />
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "14px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", marginBottom: "6px" }}>Weekly Goal Hours</label>
                    <input
                      type="number"
                      value={profileForm.weeklyGoalHours}
                      onChange={(e) => setProfileForm({ ...profileForm, weeklyGoalHours: Number(e.target.value) })}
                      min="1"
                      required
                      style={{ width: "100%", padding: "10px", background: "var(--bg-main)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", color: "white", outline: "none", fontSize: "13px" }}
                    />
                  </div>
                </div>

                {/* Skill level tags edit */}
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", marginBottom: "6px" }}>My Technical Skills (Comma-separated)</label>
                  <input
                    type="text"
                    value={profileForm.skills}
                    onChange={(e) => setProfileForm({ ...profileForm, skills: e.target.value })}
                    placeholder="e.g. React, Python, JavaScript, CSS"
                    style={{ width: "100%", padding: "10px", background: "var(--bg-main)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", color: "white", outline: "none", fontSize: "13px" }}
                  />
                </div>

                {/* Learning Interests edit */}
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", marginBottom: "6px" }}>Learning Interests / Topics (Comma-separated)</label>
                  <input
                    type="text"
                    value={profileForm.interests}
                    onChange={(e) => setProfileForm({ ...profileForm, interests: e.target.value })}
                    placeholder="e.g. Machine Learning, Mobile Dev, UI/UX"
                    style={{ width: "100%", padding: "10px", background: "var(--bg-main)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", color: "white", outline: "none", fontSize: "13px" }}
                  />
                </div>

                <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                  <button type="submit" disabled={profileSubmitting} style={{ padding: "10px 20px", background: "var(--primary)", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "13px" }}>{profileSubmitting ? "Saving..." : "Save Changes"}</button>
                  <button type="button" onClick={() => setProfileEditing(false)} style={{ padding: "10px 20px", background: "var(--bg-main)", color: "white", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "13px" }}>Cancel</button>
                </div>
              </form>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", fontWeight: "bold", textTransform: "uppercase" }}>Full Name</label>
                    <p style={{ margin: "4px 0 0 0", fontWeight: "bold", fontSize: "15px", color: "white" }}>{currentUser?.name}</p>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", fontWeight: "bold", textTransform: "uppercase" }}>Email Address</label>
                    <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "white" }}>{currentUser?.email}</p>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", fontWeight: "bold", textTransform: "uppercase" }}>Weekly Learning Goal</label>
                    <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "white", fontWeight: "bold" }}>{currentUser?.weeklyGoalHours || 10} hours</p>
                  </div>
                </div>

                {/* Render skill level badges */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", fontWeight: "bold", textTransform: "uppercase", marginBottom: "6px" }}>Skill Level Badges</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {(currentUser?.skills || "HTML, CSS, JavaScript, React").split(",").map((s, i) => (
                      <span 
                        key={i} 
                        style={{ 
                          padding: "4px 10px", 
                          borderRadius: "8px", 
                          background: "rgba(99, 102, 241, 0.12)", 
                          color: "var(--primary-light)", 
                          fontSize: "11px", 
                          fontWeight: "bold",
                          border: "1px solid rgba(99, 102, 241, 0.2)"
                        }}
                      >
                        ⚡ {s.trim()}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Render learning interests tags */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", fontWeight: "bold", textTransform: "uppercase", marginBottom: "6px" }}>Learning Interests</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {(currentUser?.interests || "Web Development, UI/UX Design, Artificial Intelligence").split(",").map((int, i) => (
                      <span 
                        key={i} 
                        style={{ 
                          padding: "4px 10px", 
                          borderRadius: "8px", 
                          background: "rgba(16, 185, 129, 0.12)", 
                          color: "#10b981", 
                          fontSize: "11px", 
                          fontWeight: "bold",
                          border: "1px solid rgba(16, 185, 129, 0.2)"
                        }}
                      >
                        🏷️ {int.trim()}
                      </span>
                    ))}
                  </div>
                </div>

                <button onClick={() => {
                  setProfileForm({ 
                    name: currentUser?.name || "", 
                    email: currentUser?.email || "", 
                    weeklyGoalHours: currentUser?.weeklyGoalHours || 10,
                    skills: currentUser?.skills || "HTML, CSS, JavaScript, React",
                    interests: currentUser?.interests || "Web Development, UI/UX Design, Artificial Intelligence"
                  });
                  setProfileEditing(true);
                }} style={{ padding: "10px 20px", background: "var(--primary)", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", width: "fit-content", marginTop: "10px", fontSize: "13px" }}>Edit Profile Details</button>
              </div>
            )}
          </div>

          {/* Change Password settings */}
          <div className="glass-card" style={{ padding: "24px" }}>
            <h3 style={{ margin: "0 0 20px 0", fontSize: "17px", fontWeight: "700", color: "white" }}>Security & Password</h3>
            <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", marginBottom: "6px" }}>Current Password</label>
                  <input
                    type="password"
                    placeholder="Enter current password..."
                    value={pwdForm.currentPassword}
                    onChange={(e) => setPwdForm({ ...pwdForm, currentPassword: e.target.value })}
                    style={{ width: "100%", padding: "10px", background: "var(--bg-main)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", color: "white", outline: "none", fontSize: "13px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", marginBottom: "6px" }}>New Password</label>
                  <input
                    type="password"
                    placeholder="Enter new password..."
                    value={pwdForm.newPassword}
                    onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
                    style={{ width: "100%", padding: "10px", background: "var(--bg-main)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", color: "white", outline: "none", fontSize: "13px" }}
                  />
                </div>
              </div>
              <button type="submit" disabled={pwdSubmitting} style={{ padding: "10px 20px", background: "linear-gradient(135deg, var(--primary), var(--primary-dark))", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", width: "fit-content", fontSize: "13px" }}>
                {pwdSubmitting ? "Updating..." : "💾 Update Password"}
              </button>
            </form>
          </div>

          {/* Appearance Settings */}
          <div className="glass-card" style={{ padding: "24px" }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: "17px", fontWeight: "700", color: "white" }}>Theme Customization</h3>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ margin: "0 0 4px 0", fontWeight: "bold", fontSize: "14px", color: "white" }}>Toggle Theme</p>
                <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)" }}>Toggle dark mode preferences for night viewing.</p>
              </div>
              <button
                onClick={toggleTheme}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  background: "var(--primary)",
                  color: "white",
                  border: "none",
                  fontWeight: "bold",
                  cursor: "pointer",
                  fontSize: "12px"
                }}
              >
                {theme === "dark" ? "✅ Dark Mode" : "Light Mode"}
              </button>
            </div>
          </div>

        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard": return renderDashboard();
      case "courses": return renderCourses();
      case "logs": return renderLogs();
      case "quizzes": return renderQuizzes();
      case "games": return renderGames();
      case "puzzles": return renderPuzzles();
      case "certificates": return renderCertificates();
      case "achievements": return renderAchievements();
      case "leaderboard": return renderLeaderboard();
      case "notifications": return renderNotifications();
      case "profile": return renderProfile();
      default: return renderDashboard();
    }
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setIsSidebarOpen(false);
  };

  // Loading skeleton layout matching dark glassmorphism
  if (loading) {
    return (
      <div className="dashboard-page-wrapper">
        <Navbar />
        <div style={{ display: "flex", minHeight: "calc(100vh - 70px)" }}>
          <div className="student-sidebar" style={{ background: "rgba(15, 23, 42, 0.45)" }}>
            <div style={{ height: "40px", width: "80%", background: "rgba(255,255,255,0.03)", borderRadius: "8px", marginBottom: "20px" }} className="skeleton-box" />
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ height: "48px", width: "100%", background: "rgba(255,255,255,0.03)", borderRadius: "10px", marginBottom: "10px" }} className="skeleton-box" />
            ))}
          </div>
          <div className="student-content" style={{ display: "flex", flexDirection: "column", gap: "24px", flex: 1, padding: "40px" }}>
            <div style={{ height: "180px", width: "100%", background: "rgba(255,255,255,0.03)", borderRadius: "24px" }} className="skeleton-box" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "20px" }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} style={{ height: "90px", background: "rgba(255,255,255,0.03)", borderRadius: "16px" }} className="skeleton-box" />
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
              <div style={{ height: "320px", background: "rgba(255,255,255,0.03)", borderRadius: "20px" }} className="skeleton-box" />
              <div style={{ height: "320px", background: "rgba(255,255,255,0.03)", borderRadius: "20px" }} className="skeleton-box" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page-wrapper">
      
      {/* Floating glowing particle orbs in background */}
      <div className="floating-glow-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <style>{`
        .action-btn { transition: all 0.2s ease; }
        .action-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 10px rgba(0,0,0,0.25); }
        .action-btn:active:not(:disabled) { transform: translateY(0); }

        .student-content {
          flex: 1;
          padding: 40px;
          min-width: 0;
          position: relative;
          z-index: 2;
        }

        @media (min-width: 1025px) {
          .student-sidebar {
            position: sticky;
            top: 70px;
            height: calc(100vh - 70px);
            transform: translateX(0) !important;
          }
          .student-mobile-header { display: none !important; }
          .sidebar-overlay { display: none !important; }
        }

        @media (max-width: 1024px) {
          .student-sidebar {
            position: fixed;
            top: 0;
            left: 0;
            height: 100vh;
            z-index: 1000;
            transform: translateX(-100%);
            padding-top: 20px;
          }
          .student-sidebar.open {
            transform: translateX(0);
            box-shadow: 10px 0 40px rgba(0, 0, 0, 0.45);
          }
          .student-mobile-header { display: flex !important; }
        }

        @media (max-width: 768px) {
          .student-content { padding: 24px 16px !important; }
        }
      `}</style>

      <Navbar />

      {/* Mobile Top Header */}
      <div className="student-mobile-header" style={{ display: "none", padding: "16px 20px", background: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "space-between", position: "relative", zIndex: 10 }}>
        <h2 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "white" }}>Student Command Hub</h2>
        <button onClick={() => setIsSidebarOpen(true)} style={{ background: "transparent", border: "none", color: "white", fontSize: "24px", cursor: "pointer" }}>☰</button>
      </div>

      <div style={{ display: "flex", minHeight: "calc(100vh - 70px)", position: "relative" }}>
        
        {/* Mobile menu click overlay */}
        {isSidebarOpen && (
          <div
            className="sidebar-overlay"
            onClick={() => setIsSidebarOpen(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 999, backdropFilter: "blur(5px)" }}
          />
        )}

        {/* Sidebar Nav Selection */}
        <div className={`student-sidebar ${isSidebarOpen ? "open" : ""}`}>
          {isSidebarOpen && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 10px 10px 10px", marginBottom: "14px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <span style={{ fontWeight: "800", fontSize: "15px", color: "white" }}>Student Command Hub</span>
              <button onClick={() => setIsSidebarOpen(false)} style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "22px", cursor: "pointer" }}>✕</button>
            </div>
          )}

          <div style={{ padding: "8px 10px", marginBottom: "12px" }}>
            <p style={{ fontSize: "10px", fontWeight: "800", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1.5px", margin: 0 }}>Learning Hub</p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {MENU_ITEMS.map((item) => {
              const ItemIcon = item.icon;
              
              if (item.id === "quizzes") return <div key="div-q" style={{ height: "1px", background: "rgba(255,255,255,0.05)", margin: "10px 10px" }} />;
              if (item.id === "achievements") return <div key="div-a" style={{ height: "1px", background: "rgba(255,255,255,0.05)", margin: "10px 10px" }} />;
              if (item.id === "profile") return <div key="div-p" style={{ height: "1px", background: "rgba(255,255,255,0.05)", margin: "10px 10px" }} />;

              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`sidebar-menu-btn ${activeTab === item.id ? "active" : ""}`}
                >
                  {activeTab === item.id && <span className="active-bar-indicator" />}
                  <span className="menu-icon"><ItemIcon size={16} /></span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div style={{ height: "1px", background: "rgba(255,255,255,0.05)", margin: "14px 10px" }} />
          
          <button
            onClick={handleLogout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              padding: "14px 18px",
              borderRadius: "14px",
              background: "transparent",
              color: "#ef4444",
              border: "none",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600",
              width: "100%",
              textAlign: "left",
              transition: "all 0.3s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(239, 68, 68, 0.06)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><LogOut size={16} /></span>
            <span>Logout Session</span>
          </button>
        </div>

        {/* Tab Wrapper */}
        <div className="student-content">
          <div className="dashboard-container" style={{ padding: 0 }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;
