import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Toaster } from "react-hot-toast";
import "./theme.css";
import "./interactive-styles.css";

const ReactLazy = React.lazy;
const Home = ReactLazy(() => import('./pages/Home'));
const Login = ReactLazy(() => import('./pages/Login'));
const Register = ReactLazy(() => import('./pages/Register'));
const Dashboard = ReactLazy(() => import('./pages/DashBoard'));
const Courses = ReactLazy(() => import('./pages/Courses'));
const Profile = ReactLazy(() => import('./pages/Profile'));
const Admin = ReactLazy(() => import('./pages/Admin'));
const AddCourse = ReactLazy(() => import('./pages/AddCourse'));
const Certificate = ReactLazy(() => import('./pages/Certificate'));
const StudyLogs = ReactLazy(() => import('./pages/StudyLogs'));
const CodingPuzzle = ReactLazy(() => import('./pages/CodingPuzzle'));
const Games = ReactLazy(() => import('./pages/Games'));
const QuickQuiz = ReactLazy(() => import('./pages/QuickQuiz'));
const MemoryGame = ReactLazy(() => import('./pages/MemoryGame'));
const CourseTrivia = ReactLazy(() => import('./pages/CourseTrivia'));
const WordScramble = ReactLazy(() => import('./pages/WordScramble'));
const SpeedType = ReactLazy(() => import('./pages/SpeedType'));
const AdminManageGames = ReactLazy(() => import('./pages/AdminManageGames'));
const VideoPage = ReactLazy(() => import('./pages/VideoPage'));

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error Boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          backgroundColor: "#121212",
          color: "#e0e0e0",
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          padding: "20px",
          textAlign: "center"
        }}>
          <h1>⚠️ Something went wrong</h1>
          <p style={{ color: "#a0a0a0", marginBottom: "20px", fontSize: "16px" }}>
            {this.state.error?.message || "An unexpected error occurred"}
          </p>
          <button 
            onClick={() => window.location.href = "/"}
            style={{
              padding: "12px 24px",
              background: "linear-gradient(135deg, #bb86fc, #9c27b0)",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "16px"
            }}
          >
            Go Home
          </button>
          <details style={{ marginTop: "30px", textAlign: "left" }}>
            <summary style={{ cursor: "pointer", fontWeight: "bold", marginBottom: "10px" }}>
              Error Details
            </summary>
            <pre style={{
              backgroundColor: "#1e1e1e",
              padding: "12px",
              borderRadius: "8px",
              overflow: "auto",
              maxHeight: "200px",
              fontSize: "12px",
              color: "#ff8a80"
            }}>
              {this.state.error?.toString()}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

const pageFadeVariants = {
  initial: { opacity: 0, y: 20, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -20, scale: 0.98 },
};

function PageWrapper({ children }) {
  return (
    <motion.div
      className="page-transition"
      variants={pageFadeVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.35, ease: "easeOut" }}
      style={{ width: "100%", maxWidth: "100%", minHeight: "100vh", position: "relative", overflowX: "hidden" }}
    >
      {children}
    </motion.div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
        <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
        <Route path="/register" element={<PageWrapper><Register /></PageWrapper>} />
        <Route path="/dashboard" element={<PageWrapper><Dashboard /></PageWrapper>} />
        <Route path="/courses" element={<PageWrapper><Courses /></PageWrapper>} />
        <Route path="/add-course" element={<PageWrapper><AddCourse /></PageWrapper>} />
        <Route path="/study-logs" element={<PageWrapper><StudyLogs /></PageWrapper>} />
        <Route path="/certificate" element={<PageWrapper><Certificate /></PageWrapper>} />
        <Route path="/profile" element={<PageWrapper><Profile /></PageWrapper>} />
        <Route path="/coding-puzzle" element={<PageWrapper><CodingPuzzle /></PageWrapper>} />
        <Route path="/games" element={<PageWrapper><Games /></PageWrapper>} />
        <Route path="/quick-quiz" element={<PageWrapper><QuickQuiz /></PageWrapper>} />
        <Route path="/memory-game" element={<PageWrapper><MemoryGame /></PageWrapper>} />
        <Route path="/course-trivia" element={<PageWrapper><CourseTrivia /></PageWrapper>} />
        <Route path="/word-scramble" element={<PageWrapper><WordScramble /></PageWrapper>} />
        <Route path="/speed-type" element={<PageWrapper><SpeedType /></PageWrapper>} />
        <Route path="/admin" element={<PageWrapper><Admin /></PageWrapper>} />
        <Route path="/admin/manage-games" element={<PageWrapper><AdminManageGames /></PageWrapper>} />
        <Route path="/video" element={<PageWrapper><VideoPage /></PageWrapper>} />

        <Route path="*" element={
          <PageWrapper>
            <div style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "100vh",
              backgroundColor: "var(--bg-main)",
              color: "var(--text-main)",
              fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
            }}>
              <h1>404 - Page Not Found</h1>
              <p style={{ color: "var(--text-muted)" }}>The page you're looking for doesn't exist.</p>
              <a href="/" style={{
                marginTop: "20px",
                padding: "12px 24px",
                background: "linear-gradient(135deg, var(--primary), var(--primary-dark))",
                color: "#fff",
                textDecoration: "none",
                borderRadius: "8px",
                fontWeight: "bold"
              }}>
                Go Home
              </a>
            </div>
          </PageWrapper>
        } />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{
          style: {
            background: 'var(--bg-card)',
            color: 'var(--text-main)',
            border: '1px solid var(--border-color)',
            backdropFilter: 'blur(10px)',
          }
        }} />
        <React.Suspense fallback={null}>
          <AnimatedRoutes />
        </React.Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
