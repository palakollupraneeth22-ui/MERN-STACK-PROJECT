import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/NavBar";
import API from "../services/api";
import { useTheme } from "../useTheme";
import { motion, AnimatePresence } from "framer-motion";
import "./DashBoard.css";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  RadialBarChart,
  RadialBar
} from "recharts";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Gamepad2,
  Zap,
  BrainCircuit,
  Award,
  TrendingUp,
  FileText,
  Bell,
  Lock,
  Settings,
  LogOut,
  Search,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Activity,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  Shield,
  Eye,
  Download,
  Share2,
  Clock,
  Compass,
  CheckSquare,
  DollarSign,
  ChevronRight,
  EyeOff,
  SlidersHorizontal,
  RefreshCw,
  PlusCircle,
  HelpCircle,
  Key
} from "lucide-react";

// Color Schemes for visual perfection
const PIE_COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#ec4899", "#f59e0b"];

// Reusable custom Sparkline chart for statistic cards
function MiniSparkline({ data = [30, 40, 35, 50, 49, 60, 70, 91], color = "var(--primary)" }) {
  const chartData = data.map((v, i) => ({ name: i, value: v }));
  return (
    <div style={{ width: "80px", height: "30px", opacity: 0.8 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <Area type="monotone" dataKey="value" stroke={color} fill={`${color}15`} strokeWidth={1.5} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Reusable Custom Animated Counter
function AnimatedCounter({ value, duration = 1.0, suffix = "" }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = parseFloat(value);
    if (isNaN(end) || end === 0) {
      setCount(value);
      return;
    }
    const totalMiliseconds = duration * 1000;
    const incrementTime = 20; // 20ms steps
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

  return <span>{count}{suffix}</span>;
}

const MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
  { id: 'users', label: 'User Management', icon: Users },
  { id: 'courses', label: 'Course Management', icon: BookOpen },
  { id: 'games', label: 'Games Management', icon: Gamepad2 },
  { id: 'quizzes', label: 'Quiz Management', icon: Zap },
  { id: 'puzzles', label: 'Coding Puzzles', icon: BrainCircuit },
  { id: 'certificates', label: 'Certificates Authority', icon: Award },
  { id: 'analytics', label: 'Advanced Analytics', icon: TrendingUp },
  { id: 'reports', label: 'Weekly Reports', icon: FileText },
  { id: 'notifications', label: 'Broadcasts Center', icon: Bell },
  { id: 'security', label: 'Security & Access', icon: Lock },
  { id: 'settings', label: 'System Settings', icon: Settings },
];

function Admin() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [adminCourses, setAdminCourses] = useState([]);
  const [adminGames, setAdminGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingGames, setLoadingGames] = useState(false);
  const [error, setError] = useState("");
  const [editingUserId, setEditingUserId] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: "", email: "", role: "student" });
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Advanced User states
  const [selectedUser, setSelectedUser] = useState(null); // Profile detail modal
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // Advanced Course states
  const [courseForm, setCourseForm] = useState({ title: "", platform: "", totalHours: 10, category: "Web Development" });
  const [isAddingCourse, setIsAddingCourse] = useState(false);

  // Security Access logs & session states
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [securityLogs, setSecurityLogs] = useState([
    { timestamp: "2026-05-22 10:14:22", event: "Admin session initialized", ip: "192.168.1.52", status: "success" },
    { timestamp: "2026-05-22 09:44:01", event: "User password recovery request", ip: "10.0.0.124", status: "warning" },
    { timestamp: "2026-05-22 08:12:15", event: "Suspicious API request spike", ip: "185.220.101.4", status: "danger" },
    { timestamp: "2026-05-21 23:58:10", event: "Backup sync to cloud database", ip: "localhost", status: "success" }
  ]);

  useTheme(); // Initialize theme

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await API.get("/auth/users");
      const usersData = Array.isArray(res.data) ? res.data : [];
      setUsers(usersData);
    } catch (err) {
      console.error("Error fetching users:", err);
      const errorMessage = err.response?.data?.message || err.message || "Unknown error.";
      setError(`Failed to load users: ${errorMessage}`);
      if (err.response?.status !== 401) {
        setUsers([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminCourses = async () => {
    setLoadingCourses(true);
    try {
      const res = await API.get("/courses");
      setAdminCourses(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching courses:", err);
    } finally {
      setLoadingCourses(false);
    }
  };

  const fetchAdminGames = async () => {
    setLoadingGames(true);
    try {
      const res = await API.get("/games");
      setAdminGames(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching games:", err);
    } finally {
      setLoadingGames(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token || !storedUser) {
      navigate("/login");
      return;
    }

    let user;
    try {
      user = JSON.parse(storedUser);
    } catch {
      navigate("/login");
      return;
    }

    const isAdmin = user?.isAdmin || user?.role === "admin" || user?.email === "admin@gmail.com";
    if (!isAdmin) {
      alert("Access Denied: You do not have admin privileges.");
      navigate("/dashboard");
      return;
    }

    fetchUsers();
  }, [navigate]);

  useEffect(() => {
    if (activeTab === 'courses') {
      fetchAdminCourses();
    }
    if (activeTab === 'games' || activeTab === 'quizzes' || activeTab === 'puzzles') {
      fetchAdminGames();
    }
  }, [activeTab]);

  const handleEditClick = (user) => {
    setEditingUserId(user._id);
    setEditFormData({ name: user.name, email: user.email, role: user.role || "student" });
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditFormData({ name: "", email: "", role: "student" });
  };

  const handleUpdateUser = async (userId) => {
    try {
      const res = await API.put("/auth/profile", {
        userId: userId,
        ...editFormData
      });
      
      setUsers(users.map(u => u._id === userId ? { ...u, ...(res.data?.user || editFormData) } : u));
      setEditingUserId(null);
      alert("User details updated successfully!");
    } catch (err) {
      console.error("Error updating user:", err);
      alert(err.response?.data?.message || "Failed to update user details.");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
    try {
      await API.delete(`/auth/users/${userId}`);
      setUsers(users.filter(u => u._id !== userId));
      alert("User account deleted successfully!");
    } catch (err) {
      console.error("Error deleting user:", err);
      alert(err.response?.data?.message || "Failed to delete user.");
    }
  };

  // Add course handler
  const handleCreateCourseSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("/courses", courseForm);
      alert("Course created successfully!");
      setAdminCourses([...adminCourses, res.data]);
      setIsAddingCourse(false);
      setCourseForm({ title: "", platform: "", totalHours: 10, category: "Web Development" });
    } catch (err) {
      console.error(err);
      alert("Failed to add course");
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm("Are you sure you want to delete this course? This action cannot be undone.")) return;
    try {
      await API.delete(`/courses/${courseId}`);
      setAdminCourses(adminCourses.filter(c => c._id !== courseId));
      alert("Course deleted successfully.");
    } catch (err) {
      console.error("Error deleting course:", err);
      alert("Failed to delete course.");
    }
  };

  const handleDeleteGame = async (gameId) => {
    if (!window.confirm("Are you sure you want to delete this game? This action cannot be undone.")) return;
    try {
      await API.delete(`/games/${gameId}`);
      setAdminGames(adminGames.filter(g => g._id !== gameId && g.id !== gameId));
      alert("Game deleted successfully.");
    } catch (err) {
      console.error("Error deleting game:", err);
      alert("Failed to delete game.");
    }
  };

  // USER EXPORT
  const handleExportCSV = () => {
    let csv = "ID,Name,Email,Role,Registered Date\n";
    users.forEach((u) => {
      csv += `${u._id},"${u.name}","${u.email}",${u.role || 'student'},"${u.createdAt || ''}"\n`;
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "SkillUp_Users_Backup.csv";
    link.click();
  };

  // FILTER USERS
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      String(user.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(user.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(user._id || "").includes(searchTerm);
    
    const matchesRole = roleFilter === "All" || (user.role || "student") === roleFilter;
    const matchesStatus = statusFilter === "All" || (statusFilter === "Admin" ? user.isAdmin : !user.isAdmin);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleTabChange = (id) => {
    setActiveTab(id);
    setIsSidebarOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    alert("Admin session terminated.");
    navigate("/login");
  };

  // ADVANCED ANALYTICS CHART MOCK DATA
  const userGrowthData = [
    { month: 'Jan', students: 80, mentors: 5, courses: 3 },
    { month: 'Feb', students: 130, mentors: 6, courses: 4 },
    { month: 'Mar', students: 210, mentors: 9, courses: 6 },
    { month: 'Apr', students: 340, mentors: 12, courses: 9 },
    { month: 'May', students: 480, mentors: 15, courses: 14 }
  ];

  const quizParticipationData = [
    { name: 'JavaScript Basic', attempts: 320, passRate: 85 },
    { name: 'Python Core', attempts: 240, passRate: 78 },
    { name: 'CSS Flexbox', attempts: 180, passRate: 92 },
    { name: 'React Hooks', attempts: 290, passRate: 64 },
    { name: 'Git Workflow', attempts: 150, passRate: 88 }
  ];

  const coursePopularityData = [
    { name: 'Web Dev Mastery', students: 480, value: 480 },
    { name: 'Python Basics', students: 340, value: 340 },
    { name: 'Data Structures', students: 210, value: 210 },
    { name: 'UI/UX Design', students: 180, value: 180 },
    { name: 'AI Core Essentials', students: 290, value: 290 }
  ];

  // RENDERS
  const renderDashboard = () => {
    // Dynamic XP/Users counters
    const activeCount = Math.max(1, Math.floor(users.length * 0.72));
    const totalChapters = adminCourses.reduce((acc, curr) => acc + (curr.modules?.length || 3), 0);
    const issuedCerts = users.flatMap(u => u.certificates || []).length || 8;

    // AI Insight card array
    const insights = [
      { text: "💡 User study engagement spiked by 18% during evening slots (6 PM - 9 PM) this week.", color: "#3b82f6" },
      { text: "🔥 'Web Dev Mastery' remains the highest enrolled curriculum with 480 total learners.", color: "#10b981" },
      { text: "⚠️ Inactivity flag: 4 students haven't recorded study logs in the past 7 days.", color: "#f59e0b" },
      { text: "🏆 Top-performing Quiz module: 'CSS Flexbox' with an impressive 92% average pass rate.", color: "#ec4899" }
    ];

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
        
        {/* welcome header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "900", margin: "0 0 6px 0", color: "white" }}>
              Enterprise Overview Hub
            </h1>
            <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "14px" }}>
              Welcome back, Admin. Maintain security matrices, audit students logs, and manage curriculum settings.
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button className="action-btn" onClick={fetchUsers} style={{ padding: "10px 18px", borderRadius: "10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", color: "white", cursor: "pointer", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
              <RefreshCw size={14} />
              Re-sync DB
            </button>
            <button className="action-btn btn-glow" onClick={() => setActiveTab("users")} style={{ padding: "10px 18px", borderRadius: "10px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
              <Users size={14} />
              Manage Users Node
            </button>
          </div>
        </div>

        {/* AI Insight section */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Sparkles size={18} color="var(--primary)" />
            <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1px", color: "rgba(255,255,255,0.7)" }}>AI Smart Insights Console</h3>
          </div>
          <div className="insights-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
            {insights.map((ins, i) => (
              <motion.div 
                key={i} 
                whileHover={{ y: -3 }}
                className="glass-card" 
                style={{ padding: "18px", borderLeft: `4px solid ${ins.color}`, background: "rgba(21, 25, 35, 0.4)" }}
              >
                <span style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.5 }}>{ins.text}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Statistic grids */}
        <div className="dashboard-stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "20px" }}>
          
          <motion.div whileHover={{ y: -4 }} className="glass-card stat-card" style={{ padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Total Enrolled</span>
              <h2 style={{ fontSize: "28px", margin: "4px 0", fontWeight: "900", color: "white" }}>
                <AnimatedCounter value={users.length} />
              </h2>
              <span style={{ fontSize: "11px", color: "#10b981", fontWeight: "bold" }}>+12% New users</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
              <div className="stat-icon-wrapper" style={{ color: "#3b82f6", background: "rgba(59,130,246,0.08)" }}><Users size={16} /></div>
              <MiniSparkline data={[20, 30, 25, 45, 52, 60, 68]} color="#3b82f6" />
            </div>
          </motion.div>

          <motion.div whileHover={{ y: -4 }} className="glass-card stat-card" style={{ padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Active Users</span>
              <h2 style={{ fontSize: "28px", margin: "4px 0", fontWeight: "900", color: "#10b981" }}>
                <AnimatedCounter value={activeCount} />
              </h2>
              <span style={{ fontSize: "11px", color: "#10b981", fontWeight: "bold" }}>72% Engagement</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
              <div className="stat-icon-wrapper" style={{ color: "#10b981", background: "rgba(16,185,129,0.08)" }}><Activity size={16} /></div>
              <MiniSparkline data={[40, 35, 48, 52, 60, 65, 72]} color="#10b981" />
            </div>
          </motion.div>

          <motion.div whileHover={{ y: -4 }} className="glass-card stat-card" style={{ padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Platform Courses</span>
              <h2 style={{ fontSize: "28px", margin: "4px 0", fontWeight: "900", color: "#8b5cf6" }}>
                <AnimatedCounter value={adminCourses.length || 5} />
              </h2>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{totalChapters} video chapters</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
              <div className="stat-icon-wrapper" style={{ color: "#8b5cf6", background: "rgba(139,92,246,0.08)" }}><BookOpen size={16} /></div>
              <MiniSparkline data={[2, 3, 3, 4, 4, 5, 5]} color="#8b5cf6" />
            </div>
          </motion.div>

          <motion.div whileHover={{ y: -4 }} className="glass-card stat-card" style={{ padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Credentials Issued</span>
              <h2 style={{ fontSize: "28px", margin: "4px 0", fontWeight: "900", color: "#f59e0b" }}>
                <AnimatedCounter value={issuedCerts} />
              </h2>
              <span style={{ fontSize: "11px", color: "#f59e0b", fontWeight: "bold" }}>100% Cryptographic</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
              <div className="stat-icon-wrapper" style={{ color: "#f59e0b", background: "rgba(245,158,11,0.08)" }}><Award size={16} /></div>
              <MiniSparkline data={[1, 2, 4, 5, 5, 6, 8]} color="#f59e0b" />
            </div>
          </motion.div>

        </div>

        {/* Charts & Graphs Grid */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <TrendingUp size={18} color="var(--primary)" />
          <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1px", color: "rgba(255,255,255,0.7)" }}>Advanced Business & Learning Analytics</h3>
        </div>
        <div className="charts-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          
          {/* Growth Timeline (Area) */}
          <div className="glass-card" style={{ padding: "24px" }}>
            <h4 style={{ margin: "0 0 16px 0", fontSize: "15px", fontWeight: "700", color: "white" }}>📈 Platform User & Resource Growth</h4>
            <div style={{ width: "100%", height: "240px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={userGrowthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={10} />
                  <YAxis stroke="var(--text-muted)" fontSize={10} />
                  <RechartsTooltip contentStyle={{ background: "rgba(15,23,42,0.9)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", color: "white" }} />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                  <Area type="monotone" dataKey="students" stroke="#3b82f6" fillOpacity={1} fill="url(#colorUsers)" strokeWidth={2.5} name="Active Learners" />
                  <Area type="monotone" dataKey="mentors" stroke="#10b981" fill="none" strokeWidth={2} name="Instructors" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quiz Attempts & Pass Rates */}
          <div className="glass-card" style={{ padding: "24px" }}>
            <h4 style={{ margin: "0 0 16px 0", fontSize: "15px", fontWeight: "700", color: "white" }}>📊 Timed Evaluations & Success Rates</h4>
            <div style={{ width: "100%", height: "240px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={quizParticipationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={9} />
                  <YAxis stroke="var(--text-muted)" fontSize={10} />
                  <RechartsTooltip contentStyle={{ background: "rgba(15,23,42,0.9)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", color: "white" }} />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                  <Bar dataKey="attempts" fill="var(--primary)" radius={[4, 4, 0, 0]} name="Attempt Count" />
                  <Bar dataKey="passRate" fill="#10b981" radius={[4, 4, 0, 0]} name="Avg Pass Rate (%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Live system monitoring timeline feed */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }} className="profile-layout-grid">
          
          {/* Live system activities audit logs */}
          <div className="glass-card" style={{ padding: "24px" }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "700", color: "white", display: "flex", alignItems: "center", gap: "8px" }}>
              <Shield size={16} color="var(--primary)" />
              Security access logs & session events
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {securityLogs.map((log, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: "rgba(255,255,255,0.01)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.03)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: log.status === "success" ? "#10b981" : log.status === "warning" ? "#f59e0b" : "#ef4444"
                    }} />
                    <div>
                      <span style={{ fontSize: "13px", fontWeight: "bold", color: "white" }}>{log.event}</span>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>IP Node: {log.ip}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{log.timestamp}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats Distribution */}
          <div className="glass-card" style={{ padding: "24px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: "15px", fontWeight: "700", color: "white" }}>🕒 Course Distribution</h3>
            <div style={{ width: "100%", height: "160px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={coursePopularityData} cx="50%" cy="50%" innerRadius={42} outerRadius={60} paddingAngle={4} dataKey="value">
                    {coursePopularityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px" }}>
              {coursePopularityData.slice(0, 3).map((c, idx) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: PIE_COLORS[idx] }} />
                    <span style={{ color: "var(--text-muted)" }}>{c.name}</span>
                  </div>
                  <span style={{ fontWeight: "bold", color: "white" }}>{c.students}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    );
  };

  const renderUsers = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "20px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "900", margin: "0 0 6px 0", color: "white" }}>User Node Controller</h1>
          <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "14px" }}>Configure roles, update records, and monitor logs for all enrolled accounts.</p>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button className="action-btn" onClick={handleExportCSV} style={{ padding: "10px 18px", borderRadius: "10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", color: "white", cursor: "pointer", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
            <Download size={13} />
            Export CSV
          </button>
          <button className="action-btn btn-glow" onClick={fetchUsers} style={{ padding: "10px 18px", borderRadius: "10px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
            <RefreshCw size={13} />
            Refresh
          </button>
        </div>
      </div>

      {/* Advanced search filters */}
      <div className="glass-card" style={{ padding: "16px 24px", display: "flex", flexWrap: "wrap", gap: "16px", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flex: 1, minWidth: "260px" }}>
          <div style={{ position: "relative", display: "flex", alignItems: "center", width: "100%" }}>
            <Search size={14} color="rgba(255,255,255,0.3)" style={{ position: "absolute", left: "12px" }} />
            <input
              type="text"
              placeholder="Search user name, email address, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: "100%", padding: "10px 12px 10px 34px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)", background: "var(--bg-main)", color: "white", outline: "none", fontSize: "13px" }}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <select 
            value={roleFilter} 
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)", background: "var(--bg-main)", color: "white", fontSize: "12px", outline: "none" }}
          >
            <option value="All">All Roles</option>
            <option value="admin">Admin</option>
            <option value="mentor">Mentor</option>
            <option value="student">Student</option>
          </select>

          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)", background: "var(--bg-main)", color: "white", fontSize: "12px", outline: "none" }}
          >
            <option value="All">All Levels</option>
            <option value="Admin">Administrator</option>
            <option value="Standard">Standard Learner</option>
          </select>
        </div>
      </div>

      {/* Users table */}
      <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "60px", textAlign: "center", color: "var(--text-muted)" }} className="skeleton-box">
            Loading enrolled learners accounts...
          </div>
        ) : filteredUsers.length > 0 ? (
          <div className="responsive-table-wrapper">
            <table className="responsive-table">
              <thead>
                <tr style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  <th>User Details</th>
                  <th>Privilege & Status</th>
                  <th>Curriculum Track</th>
                  <th style={{ textAlign: "right" }}>Control Node</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const isEditing = editingUserId === user._id;
                  return (
                    <tr key={user._id} style={{ background: "rgba(255,255,255,0.005)" }}>
                      {/* Name & Mail */}
                      <td data-label="User Details">
                        {isEditing ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <input type="text" value={editFormData.name} onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })} style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid var(--primary)", background: "var(--bg-main)", color: "white", fontSize: "12px", outline: "none" }} />
                            <input type="email" value={editFormData.email} onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })} style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid var(--primary)", background: "var(--bg-main)", color: "white", fontSize: "12px", outline: "none" }} />
                          </div>
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "linear-gradient(135deg, var(--primary), var(--primary-light))", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "900", fontSize: "16px" }}>
                              {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                            </div>
                            <div>
                              <span style={{ fontWeight: "700", color: "white", fontSize: "14px", cursor: "pointer" }} onClick={() => setSelectedUser(user)} className="hover-underline">{user.name}</span>
                              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{user.email}</div>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Role Privilege */}
                      <td data-label="Privilege & Status">
                        {isEditing ? (
                          <select value={editFormData.role} onChange={(e) => setEditFormData({...editFormData, role: e.target.value})} style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid var(--primary)", background: "var(--bg-main)", color: "white", fontSize: "12px", outline: "none" }}>
                            <option value="student">Student</option>
                            <option value="mentor">Mentor</option>
                            <option value="admin">Admin</option>
                          </select>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-start" }}>
                            <span style={{ padding: "3px 10px", background: user.role === 'admin' ? "rgba(239, 68, 68, 0.12)" : user.role === 'mentor' ? "rgba(245, 158, 11, 0.12)" : "rgba(99, 102, 241, 0.12)", color: user.role === 'admin' ? "#EF4444" : user.role === 'mentor' ? "#F59E0B" : "var(--primary-light)", borderRadius: "8px", fontSize: "11px", fontWeight: "bold" }}>
                              {user.role || 'Student'}
                            </span>
                            <span style={{ padding: "2px 8px", background: "rgba(16, 185, 129, 0.08)", color: "#10b981", borderRadius: "8px", fontSize: "10px", fontWeight: "bold" }}>Active</span>
                          </div>
                        )}
                      </td>

                      {/* Course Engagement */}
                      <td data-label="Curriculum Track">
                        <div style={{ fontSize: "12px", color: "white" }}><strong>{user.totalCourses || 0}</strong> Enrolled</div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
                          <div style={{ flex: 1, height: "4px", background: "rgba(255,255,255,0.05)", borderRadius: "3px", minWidth: "70px", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${user.avgProgress || 0}%`, background: "var(--primary)", borderRadius: "3px" }} />
                          </div>
                          <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "bold" }}>{user.avgProgress || 0}%</span>
                        </div>
                      </td>

                      {/* Edit actions */}
                      <td data-label="Control Node" style={{ textAlign: "right" }}>
                        {isEditing ? (
                          <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                            <button onClick={() => handleUpdateUser(user._id)} style={{ padding: "6px 12px", background: "#10b981", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "11px", fontWeight: "bold" }}>Save</button>
                            <button onClick={handleCancelEdit} style={{ padding: "6px 12px", background: "rgba(255,255,255,0.05)", color: "white", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", cursor: "pointer", fontSize: "11px", fontWeight: "bold" }}>Cancel</button>
                          </div>
                        ) : (
                          <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                            <button onClick={() => handleEditClick(user)} style={{ padding: "8px", background: "rgba(99, 102, 241, 0.08)", color: "var(--primary-light)", border: "none", borderRadius: "8px", cursor: "pointer" }} title="Edit Record">
                              <Key size={14} />
                            </button>
                            <button onClick={() => handleDeleteUser(user._id)} style={{ padding: "8px", background: "rgba(239, 68, 68, 0.08)", color: "#EF4444", border: "none", borderRadius: "8px", cursor: "pointer" }} title="Delete Account">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
            No accounts matched your filters.
          </div>
        )}
      </div>

      {/* Single User Detail Profile Modal */}
      {selectedUser && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100 }}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card" style={{ padding: "30px", width: "100%", maxWidth: "480px", background: "var(--bg-card)", display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontWeight: "900", color: "white", fontSize: "18px" }}>Learner Profile Summary</h3>
              <button onClick={() => setSelectedUser(null)} style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "20px", cursor: "pointer" }}>✕</button>
            </div>
            
            <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
              <div style={{ width: "54px", height: "54px", borderRadius: "50%", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", fontWeight: "bold", color: "white" }}>
                {selectedUser.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 style={{ margin: 0, fontWeight: "bold", color: "white", fontSize: "16px" }}>{selectedUser.name}</h4>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{selectedUser.email}</span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Unique Learner ID</span>
                <span style={{ fontFamily: "monospace", color: "white" }}>{selectedUser._id}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>System Privilege</span>
                <span style={{ fontWeight: "bold", color: "var(--primary-light)", textTransform: "capitalize" }}>{selectedUser.role || "student"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Total Study Streak</span>
                <span style={{ color: "#f59e0b", fontWeight: "bold" }}>{selectedUser.studyStreak || 0} Days 🔥</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Registered Node</span>
                <span style={{ color: "white" }}>{selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : "Active Student"}</span>
              </div>
            </div>

            <button onClick={() => setSelectedUser(null)} style={{ padding: "10px", background: "var(--primary)", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "13px", marginTop: "10px" }}>Dismiss Details</button>
          </motion.div>
        </div>
      )}

    </div>
  );

  const renderCourses = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "20px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "900", margin: "0 0 6px 0", color: "white" }}>Curriculum Management</h1>
          <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "14px" }}>Establish learning channels, upload modules, and configure expected targets.</p>
        </div>
        <button className="action-btn btn-glow" onClick={() => setIsAddingCourse(true)} style={{ padding: "10px 18px", borderRadius: "10px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
          <Plus size={14} />
          Create Course Channel
        </button>
      </div>

      {isAddingCourse && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: "24px", maxWidth: "600px" }}>
          <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "700", color: "white" }}>➕ Create New Course Channel</h3>
          <form onSubmit={handleCreateCourseSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", fontWeight: "bold", marginBottom: "6px" }}>Course Title</label>
              <input required type="text" placeholder="e.g. Master React Native" value={courseForm.title} onChange={e => setCourseForm({...courseForm, title: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: "8px", background: "var(--bg-main)", border: "1px solid rgba(255,255,255,0.06)", color: "white", outline: "none", fontSize: "13px" }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", fontWeight: "bold", marginBottom: "6px" }}>Platform Provider</label>
                <input required type="text" placeholder="e.g. SkillUp Hub" value={courseForm.platform} onChange={e => setCourseForm({...courseForm, platform: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: "8px", background: "var(--bg-main)", border: "1px solid rgba(255,255,255,0.06)", color: "white", outline: "none", fontSize: "13px" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", fontWeight: "bold", marginBottom: "6px" }}>Expected Duration (Hours)</label>
                <input required type="number" value={courseForm.totalHours} onChange={e => setCourseForm({...courseForm, totalHours: Number(e.target.value)})} style={{ width: "100%", padding: "10px", borderRadius: "8px", background: "var(--bg-main)", border: "1px solid rgba(255,255,255,0.06)", color: "white", outline: "none", fontSize: "13px" }} />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", fontWeight: "bold", marginBottom: "6px" }}>Category</label>
              <select value={courseForm.category} onChange={e => setCourseForm({...courseForm, category: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: "8px", background: "var(--bg-main)", border: "1px solid rgba(255,255,255,0.06)", color: "white", outline: "none", fontSize: "13px" }}>
                <option value="Web Development">Web Development</option>
                <option value="Mobile Development">Mobile Development</option>
                <option value="Artificial Intelligence">Artificial Intelligence</option>
                <option value="UI/UX Design">UI/UX Design</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
              <button type="submit" style={{ padding: "10px 18px", background: "var(--primary)", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "12px" }}>Save Course</button>
              <button type="button" onClick={() => setIsAddingCourse(false)} style={{ padding: "10px 18px", background: "rgba(255,255,255,0.04)", color: "white", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "12px" }}>Cancel</button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Searchable course table list */}
      <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
        {loadingCourses ? (
          <div style={{ padding: "60px", textAlign: "center", color: "var(--text-muted)" }}>Loading courses tracks...</div>
        ) : adminCourses.length > 0 ? (
          <div className="responsive-table-wrapper">
            <table className="responsive-table">
              <thead>
                <tr style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  <th>Course Title & Track</th>
                  <th>Host Platform</th>
                  <th>Expected Target</th>
                  <th style={{ textAlign: "right" }}>Controls</th>
                </tr>
              </thead>
              <tbody>
                {adminCourses.map((c) => (
                  <tr key={c._id} style={{ background: "rgba(255,255,255,0.005)" }}>
                    <td data-label="Course Title">
                      <div style={{ fontWeight: "700", color: "white", fontSize: "14px" }}>{c.title}</div>
                      {c.category && <span style={{ fontSize: "11px", color: "var(--primary-light)", fontWeight: "bold" }}>{c.category}</span>}
                    </td>
                    <td data-label="Platform" style={{ color: "var(--text-muted)", fontSize: "13px" }}>{c.platform}</td>
                    <td data-label="Duration" style={{ color: "white", fontSize: "13px", fontWeight: "bold" }}>{c.totalHours} hrs</td>
                    <td data-label="Controls" style={{ textAlign: "right" }}>
                      <button onClick={() => handleDeleteCourse(c._id)} style={{ padding: "6px 12px", background: "rgba(239, 68, 68, 0.08)", color: "#EF4444", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}>
                        Revoke Channel
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>No courses found. Add a new course to get started.</div>
        )}
      </div>
    </div>
  );

  const renderGames = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "20px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "900", margin: "0 0 6px 0", color: "white" }}>Games & Quizzes Node</h1>
          <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "14px" }}>Design rapid vocabulary matches, word scrambles, and diagnostic drills.</p>
        </div>
        <button className="action-btn btn-glow" onClick={() => navigate("/admin/manage-games")} style={{ padding: "10px 18px", borderRadius: "10px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
          <PlusCircle size={14} />
          Launch Games Builder
        </button>
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
        {loadingGames ? (
          <div style={{ padding: "60px", textAlign: "center", color: "var(--text-muted)" }}>Loading games...</div>
        ) : adminGames.length > 0 ? (
          <div className="responsive-table-wrapper">
            <table className="responsive-table">
              <thead>
                <tr style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  <th>Interactive Game</th>
                  <th>Difficulty Index</th>
                  <th>Question Count</th>
                  <th style={{ textAlign: "right" }}>Action Controls</th>
                </tr>
              </thead>
              <tbody>
                {adminGames.map((g, idx) => (
                  <tr key={g._id || g.id || idx} style={{ background: "rgba(255,255,255,0.005)" }}>
                    <td data-label="Game Title">
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "18px", background: `${g.color || '#3B82F6'}15`, padding: "6px", borderRadius: "8px" }}>{g.icon || "🎮"}</span>
                        <div style={{ fontWeight: "700", color: "white", fontSize: "14px" }}>{g.title}</div>
                      </div>
                    </td>
                    <td data-label="Difficulty" style={{ color: "var(--text-muted)", fontSize: "13px" }}>{g.difficulty || 'Medium'}</td>
                    <td data-label="Questions" style={{ color: "white", fontSize: "13px", fontWeight: "bold" }}>{g.questions?.length || 0}</td>
                    <td data-label="Actions" style={{ textAlign: "right" }}>
                      <button onClick={() => handleDeleteGame(g._id || g.id)} style={{ padding: "6px 12px", background: "rgba(239, 68, 68, 0.08)", color: "#EF4444", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}>
                        Remove Game
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>No games found. Add a new game via the Builder!</div>
        )}
      </div>
    </div>
  );

  const renderCertificates = () => {
    const allCerts = users.flatMap(u => (u.certificates || []).map(c => ({...c, userName: u.name, userEmail: u.email})));
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "900", margin: "0 0 6px 0", color: "white" }}>Cryptographic Certificate Authority</h1>
          <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "14px" }}>Track issued credentials, verify compliance codes, and authenticate PDFs.</p>
        </div>
        <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
          {allCerts.length > 0 ? (
            <div className="responsive-table-wrapper">
              <table className="responsive-table">
                <thead>
                  <tr style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    <th>Student Node</th>
                    <th>Credential ID</th>
                    <th>Approval Date</th>
                    <th>Status Sign</th>
                  </tr>
                </thead>
                <tbody>
                  {allCerts.map((cert, idx) => (
                    <tr key={idx} style={{ background: "rgba(255,255,255,0.005)" }}>
                      <td data-label="Student">
                        <div style={{ fontWeight: "700", color: "white" }}>{cert.userName}</div>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{cert.userEmail}</div>
                      </td>
                      <td data-label="Certificate Name" style={{ fontFamily: "monospace", color: "white" }}>{cert.name || `UC-${cert._id?.toString().slice(-8).toUpperCase()}`}</td>
                      <td data-label="Upload Date" style={{ color: "var(--text-muted)", fontSize: "13px" }}>{new Date(cert.uploadDate || Date.now()).toLocaleDateString()}</td>
                      <td data-label="Status">
                        <span style={{ padding: "4px 10px", background: "rgba(16, 185, 129, 0.12)", color: "#10b981", borderRadius: "8px", fontSize: "11px", fontWeight: "bold" }}>
                          Verified ✓
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: "60px", textAlign: "center", color: "var(--text-muted)" }}>No credentials uploaded yet. Reach 100% course curriculum to issue.</div>
          )}
        </div>
      </div>
    );
  };

  const renderNotifications = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h1 style={{ fontSize: "28px", fontWeight: "900", margin: "0 0 6px 0", color: "white" }}>System Broadcast Dispatches</h1>
        <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "14px" }}>Dispatch unread alerts, notifications logs, and maintenance reminders instantly.</p>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); alert('Broadcast dispatched to active sockets!'); e.target.reset(); }} className="glass-card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px", maxWidth: "600px" }}>
        <div>
           <label style={{ display: "block", marginBottom: "6px", fontWeight: "700", fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase" }}>Broadcast Header Title</label>
           <input required type="text" placeholder="e.g. Asynchronous Server Optimization Complete" style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)", background: "var(--bg-main)", color: "white", outline: "none", fontSize: "13px" }} />
        </div>
        <div>
           <label style={{ display: "block", marginBottom: "6px", fontWeight: "700", fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase" }}>Dispatch Message Detail</label>
           <textarea required rows={4} placeholder="Write system notification contents..." style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)", background: "var(--bg-main)", color: "white", outline: "none", resize: "none", fontSize: "13px" }}></textarea>
        </div>
        <div>
           <label style={{ display: "block", marginBottom: "6px", fontWeight: "700", fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase" }}>Target Segment</label>
           <select style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)", background: "var(--bg-main)", color: "white", outline: "none", fontSize: "13px" }}>
              <option>All Enrolled Learners Nodes</option>
              <option>Only Active Instructors</option>
              <option>Inactive Profiles</option>
           </select>
        </div>
        <button type="submit" className="action-btn btn-glow" style={{ padding: "12px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "13px", marginTop: "6px" }}>📢 Send Broadcast Notification</button>
      </form>
    </div>
  );

  const renderSecurity = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h1 style={{ fontSize: "28px", fontWeight: "900", margin: "0 0 6px 0", color: "white" }}>Security matrix & Protected Access</h1>
        <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "14px" }}>Toggle cryptographic protocols, manage admin keys, and review suspicious logs.</p>
      </div>

      <div className="glass-card" style={{ padding: "24px", maxWidth: "600px", display: "flex", flexDirection: "column", gap: "20px" }}>
        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "white" }}>Two-Factor Authentication (2FA)</h3>
        <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.5 }}>Protect your administration sessions. Require a cryptographically signed mobile notification token upon administrative key insertion.</p>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px", background: "rgba(255,255,255,0.01)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.03)" }}>
          <div>
            <span style={{ fontSize: "13px", fontWeight: "bold", color: "white" }}>Administrative MFA Protection</span>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Require standard 6-digit tokens</div>
          </div>
          <button 
            onClick={() => { setTwoFactorEnabled(!twoFactorEnabled); alert(twoFactorEnabled ? "MFA Disabled!" : "MFA Successfully Configured!"); }} 
            style={{
              padding: "6px 14px",
              borderRadius: "6px",
              background: twoFactorEnabled ? "rgba(16,185,129,0.12)" : "var(--primary)",
              color: twoFactorEnabled ? "#10b981" : "white",
              border: twoFactorEnabled ? "1px solid rgba(16,185,129,0.3)" : "none",
              fontWeight: "bold",
              fontSize: "12px",
              cursor: "pointer"
            }}
          >
            {twoFactorEnabled ? "✓ Active protection" : "Enable MFA"}
          </button>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h1 style={{ fontSize: "28px", fontWeight: "900", margin: "0 0 6px 0", color: "white" }}>System & Branding Policies</h1>
        <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "14px" }}>Configure external server APIs, branding parameters, and operational frameworks.</p>
      </div>
      <div className="glass-card" style={{ padding: "24px", maxWidth: "600px" }}>
        <form onSubmit={(e) => { e.preventDefault(); alert("General settings persisted successfully!"); }} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
             <label style={{ display: "block", marginBottom: "6px", fontWeight: "700", fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase" }}>Enterprise Hub Title</label>
             <input type="text" defaultValue="SkillUp Hub SaaS" style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)", background: "var(--bg-main)", color: "white", outline: "none", fontSize: "13px" }} />
          </div>
          <div>
             <label style={{ display: "block", marginBottom: "6px", fontWeight: "700", fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase" }}>Authorized Help Contact</label>
             <input type="email" defaultValue="admin-matrix@skilluphub.com" style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)", background: "var(--bg-main)", color: "white", outline: "none", fontSize: "13px" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px", background: "rgba(255,255,255,0.01)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.03)" }}>
             <input type="checkbox" defaultChecked id="allowRegistration" style={{ width: "16px", height: "16px", accentColor: "var(--primary)" }} />
             <label htmlFor="allowRegistration" style={{ fontWeight: "700", fontSize: "13px", color: "white", cursor: "pointer" }}>Allow standard user registrations</label>
          </div>
          <button type="submit" className="action-btn btn-glow" style={{ padding: "12px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "13px", marginTop: "6px" }}>💾 Save Branding Settings</button>
        </form>
      </div>
    </div>
  );

  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard': return renderDashboard();
      case 'users': return renderUsers();
      case 'courses': return renderCourses();
      case 'games': return renderGames();
      case 'quizzes': return renderGames();
      case 'puzzles': return renderGames();
      case 'analytics': return renderDashboard();
      case 'reports': return renderDashboard();
      case 'certificates': return renderCertificates();
      case 'notifications': return renderNotifications();
      case 'security': return renderSecurity();
      case 'settings': return renderSettings();
      default: return renderDashboard();
    }
  };

  return (
    <div className="dashboard-page-wrapper">
      
      {/* Floating ambient radial orbs in background */}
      <div className="floating-glow-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <style>{`
        .action-btn { transition: all 0.2s ease; }
        .action-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 10px rgba(0,0,0,0.25); }
        .action-btn:active:not(:disabled) { transform: translateY(0); }
        
        .admin-content-wrapper {
          flex: 1;
          padding: 40px;
          min-width: 0;
          position: relative;
          z-index: 2;
        }

        .admin-sidebar {
          width: ${isCollapsed ? "80px" : "265px"};
          background: var(--bg-card);
          border-right: 1px solid rgba(255,255,255,0.06);
          overflow-y: auto;
          padding: 24px 14px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          z-index: 10;
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @media (min-width: 1025px) {
          .admin-sidebar {
            position: sticky;
            top: 70px;
            height: calc(100vh - 70px);
            transform: translateX(0) !important;
          }
          .admin-mobile-header { display: none !important; }
          .sidebar-overlay { display: none !important; }
        }

        @media (max-width: 1024px) {
          .admin-sidebar {
            position: fixed;
            top: 0;
            left: 0;
            height: 100vh;
            z-index: 1000;
            transform: translateX(-100%);
            padding-top: 20px;
            width: 260px !important;
          }
          .admin-sidebar.open {
            transform: translateX(0);
            box-shadow: 10px 0 40px rgba(0, 0, 0, 0.45);
          }
          .admin-mobile-header { display: flex !important; }
        }

        @media (max-width: 768px) {
          .admin-content-wrapper { padding: 24px 16px !important; }
        }
      `}</style>
      
      <Navbar />

      {/* Mobile Top Navigation bar header */}
      <div className="admin-mobile-header" style={{ display: "none", padding: "16px 20px", background: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "space-between", position: "relative", zIndex: 10 }}>
        <h2 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "white" }}>Enterprise Hub Dashboard</h2>
        <button onClick={() => setIsSidebarOpen(true)} style={{ background: "transparent", border: "none", color: "white", fontSize: "24px", cursor: "pointer" }}>☰</button>
      </div>

      <div style={{ display: "flex", minHeight: "calc(100vh - 70px)", position: "relative" }}>
        
        {/* Mobile menu click overlay blur */}
        {isSidebarOpen && (
          <div 
            className="sidebar-overlay" 
            onClick={() => setIsSidebarOpen(false)} 
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 999, backdropFilter: "blur(5px)" }} 
          />
        )}

        {/* Collapsible Left Sidebar */}
        <div className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`}>
          
          {isSidebarOpen && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 10px 10px 10px", marginBottom: "14px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <span style={{ fontWeight: "800", fontSize: "15px", color: "white" }}>Admin Command Panel</span>
              <button onClick={() => setIsSidebarOpen(false)} style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "22px", cursor: "pointer" }}>✕</button>
            </div>
          )}

          <div style={{ padding: "8px 10px", marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            {!isCollapsed && <p style={{ fontSize: "10px", fontWeight: "800", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1.5px", margin: 0 }}>Command Console</p>}
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)} 
              className="admin-mobile-header-hide"
              style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "12px", padding: 0 }}
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isCollapsed ? "»" : "«"}
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {MENU_ITEMS.map((item) => {
              const ItemIcon = item.icon;
              
              if (item.id === 'notifications') return <div key="divider-q" style={{ height: "1px", background: "rgba(255,255,255,0.05)", margin: "10px 10px" }} />;
              if (item.id === 'security') return <div key="divider-s" style={{ height: "1px", background: "rgba(255,255,255,0.05)", margin: "10px 10px" }} />;

              return (
                <button
                  key={item.id}
                  className={`sidebar-menu-btn ${activeTab === item.id ? "active" : ""}`}
                  onClick={() => handleTabChange(item.id)}
                  title={isCollapsed ? item.label : ""}
                  style={{ justifyContent: isCollapsed ? "center" : "flex-start", padding: isCollapsed ? "12px" : "12px 16px" }}
                >
                  {activeTab === item.id && <span className="active-bar-indicator" />}
                  <span className="menu-icon"><ItemIcon size={16} /></span>
                  {!isCollapsed && <span>{item.label}</span>}
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
              transition: "all 0.3s",
              justifyContent: isCollapsed ? "center" : "flex-start"
            }}
            title={isCollapsed ? "Logout Session" : ""}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(239, 68, 68, 0.06)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><LogOut size={16} /></span>
            {!isCollapsed && <span>Logout Session</span>}
          </button>

        </div>

        {/* Dynamic Tab Area */}
        <div className="admin-content-wrapper">
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

export default Admin;
