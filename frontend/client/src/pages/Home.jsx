import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useTheme } from "../useTheme";
import { motion } from "framer-motion";
import "./DashBoard.css";
import {
  BookOpen,
  Clock,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Shield,
  Zap,
  Gamepad2,
  CheckCircle2,
  Lock,
  ChevronRight,
  Activity,
  Award
} from "lucide-react";

function Home() {
  const navigate = useNavigate();
  useTheme();

  useEffect(() => {
    if (localStorage.getItem("token")) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <div className="dashboard-page-wrapper">

      <style>{`
        /* Hero title gradients and spacing adjustments */
        .hero-title {
          font-size: clamp(36px, 5vw, 64px);
          line-height: 1.1;
          font-weight: 900;
          letter-spacing: -2px;
          margin-bottom: 24px;
        }
        .hero-description {
          font-size: clamp(16px, 1.8vw, 20px);
          line-height: 1.6;
          color: var(--text-muted);
          margin-bottom: 40px;
        }
        
        /* Premium navigation links hover */
        .nav-link {
          color: var(--text-muted);
          text-decoration: none;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.3s;
        }
        .nav-link:hover {
          color: white;
          text-shadow: 0 0 10px rgba(255,255,255,0.2);
        }

        /* Responsive Breakpoints */
        @media (max-width: 992px) {
          .hero-row { flex-direction: column !important; gap: 40px !important; }
          .mockup-col { width: 100% !important; max-width: 540px !important; }
          .hero-info-col { text-align: center; }
          .hero-info-col .badge-wrapper { justify-content: center; }
        }
        @media (max-width: 576px) {
          .nav-header { padding: 16px !important; }
          .cta-card { padding: 40px 20px !important; }
        }
      `}</style>

      {/* Global Navigation Header */}
      <motion.header 
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="nav-header" 
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 40px", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", position: "sticky", top: 0, background: "rgba(11, 14, 20, 0.7)", zIndex: 100, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
      >
        
        <div style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "linear-gradient(135deg, var(--primary), var(--primary-dark))", display: "flex", justifyContent: "center", alignItems: "center", color: "white", fontSize: "20px", fontWeight: "900", boxShadow: "0 4px 15px rgba(99, 102, 241, 0.4)", border: "1px solid rgba(255,255,255,0.15)" }}>
            S
          </div>
          <div style={{ fontSize: "24px", fontWeight: "900", letterSpacing: "-1px" }}>
            <span style={{ color: "white" }}>SkillUp</span>
            <span style={{ background: "linear-gradient(135deg, var(--primary-light), #06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Hub</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <Link to="/login" className="nav-link" style={{ padding: "10px 20px" }}>Log in</Link>
          <Link to="/register" className="action-btn btn-glow" style={{ padding: "10px 22px", borderRadius: "10px", textDecoration: "none", fontWeight: "700", fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
            Start Free
            <ArrowRight size={14} />
          </Link>
        </div>
      </motion.header>

      {/* Main landing container */}
      <main className="dashboard-container" style={{ position: "relative", zIndex: 2, paddingBottom: "80px" }}>
        
        {/* Hero split layout */}
        <div className="hero-row" style={{ display: "flex", gap: "60px", alignItems: "center", marginTop: "40px", width: "100%" }}>
          
          <motion.div 
            initial={{ opacity: 0, x: -40 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ duration: 0.8 }} 
            className="hero-info-col"
            style={{ flex: 1.1 }}
          >
            <div className="badge-wrapper" style={{ display: "flex", marginBottom: "20px" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 14px", background: "rgba(99, 102, 241, 0.12)", border: "1px solid rgba(99, 102, 241, 0.25)", borderRadius: "20px", color: "var(--primary-light)", fontWeight: "700", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1.5px" }}>
                <Sparkles size={12} />
                Futuristic Learning Analytics
              </div>
            </div>

            <h1 className="hero-title">
              Master new skills. <br />
              Track in <span style={{ background: "linear-gradient(135deg, var(--primary-light), #06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Real-Time.</span>
            </h1>
            
            <p className="hero-description">
              Elevate your self-education journey. Experience an elegant, dark glassmorphism system packing customized Pomodoro tools, daily challenges, heatmaps, and cryptographic certificates of accomplishment.
            </p>

            <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
              <Link to="/register" className="action-btn btn-glow" style={{ padding: "16px 32px", borderRadius: "12px", textDecoration: "none", fontWeight: "800", fontSize: "16px", display: "inline-flex", alignItems: "center", gap: "8px" }}>
                Explore the Dashboard
                <ArrowRight size={16} />
              </Link>
            </div>
          </motion.div>

          {/* Interactive Mockup Visual */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ duration: 0.8, delay: 0.2 }} 
            className="mockup-col"
            style={{ flex: 0.9, position: "relative" }}
          >
            <div className="glass-card" style={{ padding: "24px", gap: "16px", background: "rgba(21, 25, 35, 0.45)", border: "1px solid rgba(255, 255, 255, 0.08)", boxShadow: "0 25px 60px rgba(0,0,0,0.4)" }}>
              {/* Header inside mockup */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: "6px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444" }} />
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#f59e0b" }} />
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981" }} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "linear-gradient(135deg, var(--primary), var(--primary-light))" }} />
                </div>
              </div>

              {/* Stat card group */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "12px", padding: "14px", display: "flex", gap: "10px", alignItems: "center" }}>
                  <div style={{ color: "#3b82f6", background: "rgba(59, 130, 246, 0.1)", padding: "8px", borderRadius: "8px" }}><Clock size={16} /></div>
                  <div>
                    <span style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase" }}>Study Time</span>
                    <div style={{ fontSize: "14px", fontWeight: "bold", color: "white" }}>142.5 hrs</div>
                  </div>
                </div>
                <div style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "12px", padding: "14px", display: "flex", gap: "10px", alignItems: "center" }}>
                  <div style={{ color: "#10b981", background: "rgba(16, 185, 129, 0.1)", padding: "8px", borderRadius: "8px" }}><Activity size={16} /></div>
                  <div>
                    <span style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase" }}>Completed</span>
                    <div style={{ fontSize: "14px", fontWeight: "bold", color: "white" }}>82% Avg</div>
                  </div>
                </div>
              </div>

              {/* Progress chart mockup */}
              <div style={{ background: "rgba(0, 0, 0, 0.15)", borderRadius: "14px", padding: "16px", border: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "14px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "bold", color: "white" }}>XP Gain Timeline</span>
                  <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>May 2026</span>
                </div>
                <div style={{ display: "flex", gap: "10px", height: "80px", alignItems: "flex-end", paddingBottom: "4px" }}>
                  <div style={{ flex: 1, height: "35%", background: "rgba(99, 102, 241, 0.3)", borderRadius: "4px" }} />
                  <div style={{ flex: 1, height: "55%", background: "rgba(99, 102, 241, 0.4)", borderRadius: "4px" }} />
                  <div style={{ flex: 1, height: "45%", background: "rgba(99, 102, 241, 0.3)", borderRadius: "4px" }} />
                  <div style={{ flex: 1, height: "85%", background: "linear-gradient(135deg, var(--primary), var(--primary-light))", borderRadius: "4px", boxShadow: "0 0 15px rgba(99,102,241,0.4)" }} />
                  <div style={{ flex: 1, height: "60%", background: "rgba(99, 102, 241, 0.5)", borderRadius: "4px" }} />
                </div>
              </div>

            </div>

            {/* Float Floating streak widget */}
            <motion.div 
              animate={{ y: [0, -12, 0] }} 
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }} 
              style={{ position: "absolute", bottom: "-15px", right: "-15px", background: "rgba(21, 25, 35, 0.8)", backdropFilter: "blur(15px)", WebkitBackdropFilter: "blur(15px)", border: "1px solid rgba(245, 158, 11, 0.4)", padding: "12px 18px", borderRadius: "14px", display: "flex", alignItems: "center", gap: "10px", boxShadow: "0 10px 25px rgba(0,0,0,0.4)" }}
            >
              <span style={{ fontSize: "24px" }}>🔥</span>
              <div>
                <span style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase" }}>Streak Logs</span>
                <div style={{ fontSize: "14px", fontWeight: "bold", color: "white" }}>12 Days Gold</div>
              </div>
            </motion.div>

          </motion.div>

        </div>

        {/* Feature Node Grid */}
        <section style={{ marginTop: "120px" }}>
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            style={{ textAlign: "center", marginBottom: "50px" }}
          >
            <h2 style={{ fontSize: "32px", fontWeight: "900", color: "white", margin: "0 0 10px 0" }}>Engineered for Deep Learning Mastery</h2>
            <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "15px" }}>Take complete structural control of your goals, metrics, and cognitive progression.</p>
          </motion.div>

          <div className="course-card-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
            
            <motion.div 
              whileHover={{ y: -6 }}
              className="glass-card" 
              style={{ padding: "28px" }}
            >
              <div style={{ color: "#3b82f6", background: "rgba(59, 130, 246, 0.1)", width: "42px", height: "42px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "18px" }}>
                <BookOpen size={20} />
              </div>
              <h3 style={{ margin: "0 0 10px 0", fontSize: "18px", fontWeight: "800", color: "white" }}>Dynamic Tracks</h3>
              <p style={{ margin: 0, fontSize: "13.5px", color: "var(--text-muted)", lineHeight: 1.6 }}>Organize complex learning channels. Break courses into modules, track lectures, and logs milestones with ease.</p>
            </motion.div>

            <motion.div 
              whileHover={{ y: -6 }}
              className="glass-card" 
              style={{ padding: "28px" }}
            >
              <div style={{ color: "#10b981", background: "rgba(16, 185, 129, 0.1)", width: "42px", height: "42px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "18px" }}>
                <Clock size={20} />
              </div>
              <h3 style={{ margin: "0 0 10px 0", fontSize: "18px", fontWeight: "800", color: "white" }}>Pomodoro System</h3>
              <p style={{ margin: 0, fontSize: "13.5px", color: "var(--text-muted)", lineHeight: 1.6 }}>Integrate focusing timers. Block distractions, establish deep session targets, and build consistency logs.</p>
            </motion.div>

            <motion.div 
              whileHover={{ y: -6 }}
              className="glass-card" 
              style={{ padding: "28px" }}
            >
              <div style={{ color: "#8b5cf6", background: "rgba(139, 92, 246, 0.1)", width: "42px", height: "42px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "18px" }}>
                <Gamepad2 size={20} />
              </div>
              <h3 style={{ margin: "0 0 10px 0", fontSize: "18px", fontWeight: "800", color: "white" }}>XP Gamification</h3>
              <p style={{ margin: 0, fontSize: "13.5px", color: "var(--text-muted)", lineHeight: 1.6 }}>Unlock levels, accumulate experience, and progress through rapid coding scrambles, trivia, and quizzes.</p>
            </motion.div>

          </div>
        </section>

        {/* CTA Banner Area */}
        <motion.section 
          initial={{ opacity: 0, y: 30 }} 
          whileInView={{ opacity: 1, y: 0 }} 
          viewport={{ once: true }} 
          transition={{ duration: 0.6 }} 
          style={{ marginTop: "120px" }}
        >
          <div className="glass-card welcome-hero-banner cta-card" style={{ padding: "60px 40px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" }}>
            <h2 style={{ fontSize: "32px", fontWeight: "900", color: "white", margin: 0 }}>Accelerate Your Journey Systematically</h2>
            <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "15px", maxWidth: "540px", lineHeight: 1.6 }}>Join a community of modern technical builders tracking hours, locking down credentials, and polishing core capabilities.</p>
            
            <Link to="/register" className="action-btn btn-glow" style={{ padding: "16px 36px", borderRadius: "12px", textDecoration: "none", fontWeight: "800", fontSize: "16px", display: "inline-flex", alignItems: "center", gap: "8px", marginTop: "10px" }}>
              Sign Up For Free
              <ArrowRight size={16} />
            </Link>
          </div>
        </motion.section>

      </main>

      {/* Global Footer */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "30px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px", background: "rgba(11, 14, 20, 0.4)", position: "relative", zIndex: 2 }}>
        <p style={{ margin: 0, opacity: 0.75 }}>&copy; {new Date().getFullYear()} SkillUp Hub. Crafted for ambitious self-learners.</p>
      </footer>

    </div>
  );
}

export default Home;