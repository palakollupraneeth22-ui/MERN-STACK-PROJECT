import { useState, useEffect } from "react";
import { signInWithPopup } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import API from "../services/api";
import { auth, provider, isFirebaseConfigured } from "../firebaseConfig";
import { useTheme } from "../useTheme";
import { motion, AnimatePresence } from "framer-motion";
import "./DashBoard.css";
import {
  User,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  Zap,
  Key,
  AlertCircle
} from "lucide-react";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student",
    otp: "",
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  
  useTheme(); // Initialize theme

  useEffect(() => {
    const applyTheme = () => {
      const theme = localStorage.getItem("theme") || "light";
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
        document.documentElement.style.setProperty("--bg-main", "#0B0E14");
        document.documentElement.style.setProperty("--bg-card", "#151923");
        document.documentElement.style.setProperty("--text-main", "#ffffff");
        document.documentElement.style.setProperty("--text-muted", "#8E9BAE");
        document.documentElement.style.setProperty("--border-color", "rgba(255, 255, 255, 0.08)");
      } else {
        document.documentElement.classList.remove("dark");
        document.documentElement.style.setProperty("--bg-main", "#F8FAFC");
        document.documentElement.style.setProperty("--bg-card", "#ffffff");
        document.documentElement.style.setProperty("--text-main", "#0F172A");
        document.documentElement.style.setProperty("--text-muted", "#64748B");
        document.documentElement.style.setProperty("--border-color", "rgba(15, 23, 42, 0.08)");
      }
    };
    applyTheme();

    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get("token");
    const userParam = urlParams.get("user");

    if (tokenParam && userParam) {
      localStorage.setItem("token", tokenParam);
      try {
        const parsedUser = JSON.parse(decodeURIComponent(userParam));
        localStorage.setItem("user", JSON.stringify(parsedUser));
        const destination = parsedUser?.isAdmin || parsedUser?.role === "admin" || parsedUser?.email === "admin@gmail.com"
          ? "/admin"
          : "/dashboard";
        navigate(destination);
      } catch {
        console.error("Error parsing user from URL");
      }
    } else {
      const token = localStorage.getItem("token");
      if (token) {
        const storedUser = localStorage.getItem("user");
        const parsedUser = storedUser ? JSON.parse(storedUser) : null;
        const destination = parsedUser?.isAdmin || parsedUser?.role === "admin" || parsedUser?.email === "admin@gmail.com"
          ? "/admin"
          : "/dashboard";
        navigate(destination);
      }
    }
  }, [navigate]);

  useEffect(() => {
    let interval;
    if (otpSent && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpSent, resendTimer]);

  const handleGoogleSignup = async () => {
    if (isFirebaseConfigured && auth && provider) {
      setLoading(true);
      setErrorMsg("");
      try {
        const result = await signInWithPopup(auth, provider);
        const firebaseToken = await result.user.getIdToken();
        const res = await API.post("/auth/firebase-login", { firebaseToken });

        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));

        const destination = res.data.user?.isAdmin || res.data.user?.role === "admin" || res.data.user?.email === "admin@gmail.com"
          ? "/admin"
          : "/dashboard";
        navigate(destination);
        return;
      } catch (error) {
        console.error("Firebase Google Signup Error:", error);
        setErrorMsg(error.response?.data?.message || "Firebase signup failed. Please try again.");
        return;
      } finally {
        setLoading(false);
      }
    }

    const backendUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : "http://localhost:5000";
    window.location.href = `${backendUrl}/api/auth/google`;
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (errorMsg) setErrorMsg("");
  };

  const handleSendOtp = async () => {
    if (!formData.email) {
      setErrorMsg("Please enter an email address first.");
      return;
    }
    setIsSendingOtp(true);
    setErrorMsg("");
    try {
      await API.post("/auth/send-registration-otp", { email: formData.email, name: formData.name });
      setOtpSent(true);
      setResendTimer(60);
    } catch (error) {
      setErrorMsg(error.response?.data?.message || "Failed to send OTP.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    if (!otpSent || !formData.otp) {
      setErrorMsg("Please verify your email with an OTP first.");
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const registerData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        otp: formData.otp,
      };
      await API.post("/auth/register", registerData);

      // Auto login after successful sign up
      const loginRes = await API.post("/auth/login", {
        email: formData.email,
        password: formData.password,
      });

      localStorage.setItem("token", loginRes.data.token);
      if (loginRes.data.user) {
        localStorage.setItem("user", JSON.stringify(loginRes.data.user));
      }
      const destination = loginRes.data.user?.isAdmin || loginRes.data.user?.role === "admin" || loginRes.data.user?.email === "admin@gmail.com"
        ? "/admin"
        : "/dashboard";
      navigate(destination);
    } catch (error) {
      console.error("Registration Error Details:", error);
      
      const errorString = JSON.stringify(error.response?.data || "").toLowerCase();
      
      if (errorString.includes("exist") || errorString.includes("duplicate") || errorString.includes("11000")) {
        try {
          const loginRes = await API.post("/auth/login", {
            email: formData.email,
            password: formData.password,
          });
          localStorage.setItem("token", loginRes.data.token);
          if (loginRes.data.user) {
            localStorage.setItem("user", JSON.stringify(loginRes.data.user));
          }
          const destination = loginRes.data.user?.isAdmin || loginRes.data.user?.role === "admin" || loginRes.data.user?.email === "admin@gmail.com"
            ? "/admin"
            : "/dashboard";
          navigate(destination);
          return;
        } catch {
          setErrorMsg("Account already exists. Try registering with a different email.");
          setLoading(false);
          return;
        }
      }

      setErrorMsg(error.response?.data?.message || "An error occurred during registration.");
      setLoading(false);
    }
  };

  return (
    <div 
      className="dashboard-page-wrapper" 
      style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        minHeight: "100vh", 
        padding: "24px"
      }}
    >

      <style>{`
        .auth-card-split {
          display: flex;
          width: 960px;
          max-width: 100%;
          border-radius: 24px;
          overflow: hidden;
          background: rgba(21, 25, 35, 0.45);
          backdrop-filter: blur(25px);
          -webkit-backdrop-filter: blur(25px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.45);
        }
        .auth-banner-side {
          flex: 1.1;
          background: linear-gradient(135deg, rgba(11, 14, 20, 0.95) 0%, rgba(14, 165, 233, 0.25) 100%);
          padding: 48px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          position: relative;
          overflow: hidden;
          border-right: 1px solid rgba(255, 255, 255, 0.04);
        }
        .auth-form-side {
          flex: 0.9;
          padding: 48px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          background: rgba(15, 23, 42, 0.35);
        }
        
        .input-group-glow {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }
        .input-group-glow input {
          width: 100%;
          padding: 14px 14px 14px 44px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(11, 14, 20, 0.4);
          color: white;
          font-size: 14px;
          outline: none;
          transition: all 0.3s;
        }
        .input-group-glow input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 15px rgba(99, 102, 241, 0.25);
          background: rgba(99, 102, 241, 0.04);
        }
        .input-icon-left {
          position: absolute;
          left: 14px;
          color: var(--text-muted);
          pointer-events: none;
        }

        @media (max-width: 900px) {
          .auth-card-split { flex-direction: column; }
          .auth-banner-side { display: none !important; }
          .auth-form-side { padding: 36px 24px; }
        }
      `}</style>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="auth-card-split"
      >
        
        {/* Left Side Banner */}
        <div className="auth-banner-side">
          <div style={{ position: "absolute", top: "-20%", left: "-20%", width: "70%", height: "70%", background: "radial-gradient(circle, rgba(14,165,233,0.3) 0%, transparent 70%)", filter: "blur(50px)" }} />
          
          <div style={{ position: "relative", zIndex: 2 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 12px", background: "rgba(14,165,233,0.12)", border: "1px solid rgba(14,165,233,0.25)", borderRadius: "20px", color: "#0ea5e9", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "20px" }}>
              <Zap size={10} />
              Platform Registration
            </div>
            
            <h2 style={{ fontSize: "36px", fontWeight: "900", color: "white", margin: "0 0 16px 0", lineHeight: 1.1 }}>
              Start your mastery track.
            </h2>
            <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "15px", lineHeight: 1.6 }}>
              Unlock dynamic visualizers, timed pomodoros, level XP triggers, and cryptographically verified PDF credentials.
            </p>
          </div>
        </div>

        {/* Right Side Credentials Form */}
        <div className="auth-form-side">
          <div style={{ marginBottom: "24px" }}>
            <h3 style={{ margin: "0 0 4px 0", fontSize: "22px", fontWeight: "900", color: "white" }}>
              Deploy New Profile
            </h3>
            <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              Complete OTP verification to enable your secure dashboard
            </span>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            
            {/* Full Name */}
            <div className="input-group-glow">
              <User size={16} className="input-icon-left" />
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                disabled={otpSent}
                required
              />
            </div>



            {/* Email Address with OTP trigger */}
            <div style={{ display: "flex", gap: "8px" }}>
              <div className="input-group-glow" style={{ flex: 1 }}>
                <Mail size={16} className="input-icon-left" />
                <input
                  type="email"
                  name="email"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={otpSent}
                  required
                />
              </div>
              {!otpSent ? (
                <button type="button" onClick={handleSendOtp} disabled={isSendingOtp || !formData.email} style={{ padding: "0 18px", borderRadius: "12px", border: "none", background: isSendingOtp || !formData.email ? "rgba(255,255,255,0.05)" : "var(--primary)", color: "white", cursor: isSendingOtp || !formData.email ? "not-allowed" : "pointer", fontWeight: "700", fontSize: "12px", whiteSpace: "nowrap" }}>
                  {isSendingOtp ? "Sending..." : "Verify"}
                </button>
              ) : (
                <button type="button" onClick={() => { setOtpSent(false); setResendTimer(0); }} style={{ padding: "0 18px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "white", cursor: "pointer", fontWeight: "700", fontSize: "12px", whiteSpace: "nowrap" }}>
                  Change
                </button>
              )}
            </div>

            {/* OTP verification input */}
            {otpSent && (
              <div className="input-group-glow">
                <Key size={16} className="input-icon-left" />
                <input
                  type="text"
                  name="otp"
                  placeholder="Enter 6-digit email OTP"
                  value={formData.otp}
                  onChange={handleChange}
                  required
                  style={{ textAlign: "center", letterSpacing: "3px", fontWeight: "bold" }}
                />
              </div>
            )}

            {/* Password input */}
            <div className="input-group-glow">
              <Lock size={16} className="input-icon-left" />
              <input
                type="password"
                name="password"
                placeholder="Choose Secure Password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength="6"
              />
            </div>

            {/* Confirm Password input */}
            <div className="input-group-glow">
              <Lock size={16} className="input-icon-left" />
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                minLength="6"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="action-btn btn-glow"
              style={{ padding: "14px", borderRadius: "12px", cursor: loading ? "not-allowed" : "pointer", fontWeight: "bold", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "6px" }}
            >
              {loading ? "Registering..." : "Publish Profile"}
              {!loading && <ArrowRight size={14} />}
            </button>

            {/* Google OAuth separator */}
            <div style={{ display: "flex", alignItems: "center", margin: "4px 0" }}>
              <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
              <span style={{ padding: "0 12px", color: "var(--text-muted)", fontSize: "11px", fontWeight: "bold" }}>SECURE OAUTH</span>
              <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
            </div>

            <button
              type="button"
              onClick={handleGoogleSignup}
              style={{ padding: "12px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", color: "white", cursor: "pointer", fontWeight: "700", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", transition: "all 0.3s" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign Up with Google
            </button>

          </form>

          {/* Feedback alerts */}
          <AnimatePresence>
            {errorMsg && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ marginTop: "16px", padding: "12px 14px", borderRadius: "10px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", display: "flex", gap: "10px", alignItems: "center", color: "#f87171", fontSize: "13px" }}>
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <span style={{ fontSize: "13.5px", color: "var(--text-muted)", marginTop: "24px", textAlign: "center" }}>
            Already registered? <Link to="/login" style={{ color: "var(--primary-light)", fontWeight: "bold", textDecoration: "underline" }}>Log in here</Link>
          </span>

        </div>

      </motion.div>
    </div>
  );
}

export default Register;
