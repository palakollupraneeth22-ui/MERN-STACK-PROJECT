import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "../components/NavBar";
import { useTheme } from "../useTheme";
import API from "../services/api";
import "./DashBoard.css";

const availableGames = [
  {
    id: 1,
    title: "Coding Puzzle",
    description: "Solve JavaScript challenges and test your coding knowledge.",
    icon: "💻",
    route: "/coding-puzzle",
    difficulty: "Easy - Medium",
    plays: "Unlimited",
    color: "#3b82f6"
  },
  {
    id: 2,
    title: "Quick Quiz",
    description: "Fast-paced quizzes with time limits. Answer as many as you can!",
    icon: "⚡",
    route: "/quick-quiz",
    difficulty: "Medium",
    plays: "Unlimited",
    color: "#f59e0b"
  },
  {
    id: 3,
    title: "Memory Match",
    description: "Classic memory game to boost your concentration and recall.",
    icon: "🧠",
    route: "/memory-game",
    difficulty: "Easy",
    plays: "Unlimited",
    color: "#8b5cf6"
  },
  {
    id: 4,
    title: "Course Trivia",
    description: "Test your knowledge about programming concepts and best practices.",
    icon: "🎯",
    route: "/course-trivia",
    difficulty: "Medium - Hard",
    plays: "Unlimited",
    color: "#10b981"
  },
  {
    id: 5,
    title: "Word Scramble",
    description: "Unscramble programming terms and tech vocabulary.",
    icon: "🔤",
    route: "/word-scramble",
    difficulty: "Medium",
    plays: "Unlimited",
    color: "#ec4899"
  },
  {
    id: 6,
    title: "Speed Type",
    description: "Type code snippets as fast as you can to improve your typing speed.",
    icon: "⌨️",
    route: "/speed-type",
    difficulty: "Medium - Hard",
    plays: "Unlimited",
    color: "#06b6d4"
  }
];

function Games() {
  useTheme();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [gamesList, setGamesList] = useState(availableGames);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.warn("Failed to parse user", err);
      }
    }

    // Fetch dynamic games list from backend
    API.get("/games")
      .then((res) => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setGamesList(res.data);
        }
      })
      .catch((err) => console.warn("Failed to fetch games, using fallback:", err));
  }, [navigate]);

  const isAdmin = user?.isAdmin || user?.role === "admin" || user?.email === "admin@gmail.com";

  return (
    <div className="dashboard-page-wrapper" style={{ color: "var(--text-main)" }}>
      <Navbar />
      <main className="games-main" style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <style>{`
          .games-main { padding: clamp(20px, 4vw, 40px); }
          .games-hero h1 { margin: 0; font-size: clamp(28px, 5vw, 44px); font-weight: 900; background: linear-gradient(135deg, var(--primary), var(--primary-dark)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
          .games-hero p { margin-top: 16px; color: var(--text-muted); max-width: 700px; margin-left: auto; margin-right: auto; line-height: 1.8; font-size: clamp(14px, 2vw, 16px); }
          .games-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 24px; margin-bottom: 40px; }
          .game-card { padding: clamp(18px, 2.5vw, 28px); border-radius: 16px; background: var(--bg-card); border: 1px solid var(--border-color); cursor: pointer; transition: all 0.3s ease; display: flex; flex-direction: column; gap: 16px; min-height: 220px; }
          .game-card .top { display: flex; justify-content: space-between; align-items: flex-start; }
          .game-card .icon { font-size: clamp(32px, 4vw, 48px); }
          .badge { padding: 6px 12px; border-radius: 12px; font-size: 12px; font-weight: 700; }
          .game-card h3 { margin: 0 0 8px 0; font-size: clamp(16px, 2.2vw, 20px); font-weight: 700; color: var(--text-main); }
          .game-card p { margin: 0; color: var(--text-muted); font-size: clamp(13px, 1.6vw, 14px); line-height: 1.6; }
          .card-footer { margin-top: auto; padding-top: 16px; border-top: 1px solid var(--border-color); display: flex; justify-content: space-between; font-size: 13px; color: var(--text-muted); }
          .leader-box { padding: 24px; border-radius: 16px; background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(16, 185, 129, 0.1)); border: 1px solid rgba(59, 130, 246, 0.2); text-align: center; }
          @media (max-width: 480px) {
            .games-main { padding: 18px; }
            .games-grid { gap: 16px; }
            .game-card { min-height: 200px; }
          }
          .admin-controls-box { padding: 24px; border-radius: 16px; background: linear-gradient(135deg, rgba(239, 68, 68, 0.05), rgba(220, 38, 38, 0.02)); border: 1px dashed rgba(239, 68, 68, 0.3); margin-bottom: 40px; text-align: left; }
          .admin-btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; background: var(--bg-card); color: var(--danger, #ef4444); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; transition: all 0.2s ease; cursor: pointer; }
          .admin-btn:hover { background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.5); transform: translateY(-2px); }
        `}</style>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="games-hero"
          style={{ marginBottom: "50px", textAlign: "center" }}
        >
          <h1>🎮 Games Hub</h1>
          <p>
            Challenge yourself with our collection of learning games. Improve your coding skills, boost your memory, and have fun while learning!
          </p>
        </motion.div>

        {isAdmin && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="admin-controls-box"
          >
            <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", color: "var(--danger, #ef4444)" }}>
              🛠️ Admin Controls
            </h3>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <Link to="/admin/manage-games" className="admin-btn">⚙️ Manage Games & Questions</Link>
            </div>
          </motion.div>
        )}

        <div className="games-grid">
          {gamesList.map((game, idx) => (
            <motion.div
              key={game._id || game.id || idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              whileHover={{ y: -8, boxShadow: "0 20px 40px rgba(0,0,0,0.18)" }}
            >
              <Link to={game.route} style={{ textDecoration: "none" }}>
                <div className="game-card">
                  <div className="top">
                    <span className="icon">{game.icon}</span>
                    <span className="badge" style={{ background: `${game.color}20`, color: game.color }}>
                      {game.difficulty}
                    </span>
                  </div>
                  
                  <div>
                    <h3>{game.title}</h3>
                    <p>{game.description}</p>
                  </div>

                  <div className="card-footer">
                    <span>🎮 {game.plays}</span>
                    <span style={{ color: "var(--primary)", fontWeight: "700" }}>Play Now →</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="leader-box"
        >
          <h2 style={{ margin: "0 0 12px 0", fontSize: "22px", fontWeight: "700" }}>🏆 Leaderboard Coming Soon</h2>
          <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "15px" }}>
            Compete with other learners and climb the global rankings. Each game will contribute to your overall score!
          </p>
        </motion.div>
      </main>
    </div>
  );
}

export default Games;
