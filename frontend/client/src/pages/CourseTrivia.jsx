import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "../components/NavBar";
import { useTheme } from "../useTheme";

const triviaQuestions = [
  { q: "What is the primary purpose of version control systems like Git?", opts: ["Store files in cloud", "Track changes and collaborate", "Compile code", "Backup data only"], ans: 1 },
  { q: "Which design pattern is commonly used for state management in React?", opts: ["Factory", "Redux", "Adapter", "Bridge"], ans: 1 },
  { q: "What does REST stand for?", opts: ["Rapid Exchange System", "Representational State Transfer", "Remote Server Transfer", "Reliable Exchange Syntax"], ans: 1 },
  { q: "Which is the most important principle of DRY?", opts: ["Data Replication Yellow", "Don't Repeat Yourself", "Dynamic Runtime Yellow", "Data Recovery Yield"], ans: 1 },
  { q: "What is Big O notation used for?", opts: ["Time zones", "Algorithm complexity", "Database size", "Server capacity"], ans: 1 },
  { q: "Which database is best for unstructured data?", opts: ["PostgreSQL", "MySQL", "MongoDB", "SQLite"], ans: 2 },
  { q: "What does SOLID stand for in software design?", opts: ["Storage Over Load", "Single Responsibility, Open/Closed, Liskov, Interface Segregation, Dependency Inversion", "System Output Logic", "Server Optimization Layout"], ans: 1 },
  { q: "Which is not a JavaScript framework?", opts: ["React", "Vue", "Django", "Angular"], ans: 2 },
];

function CourseTrivia() {
  useTheme();
  const navigate = useNavigate();
  const [gameStarted, setGameStarted] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selectedAns, setSelectedAns] = useState(null);
  const [gameFinished, setGameFinished] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
  }, [navigate]);

  const handleAnswer = (idx) => {
    if (answered) return;
    setSelectedAns(idx);
    setAnswered(true);
    if (idx === triviaQuestions[currentIdx].ans) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (currentIdx < triviaQuestions.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setAnswered(false);
      setSelectedAns(null);
    } else {
      setGameFinished(true);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-main)", color: "var(--text-main)" }}>
      <Navbar />
      <main style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 20px" }}>
        {!gameStarted ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <h1 style={{ fontSize: "44px", fontWeight: "800", margin: "0 0 16px 0" }}>🎯 Course Trivia</h1>
              <p style={{ color: "var(--text-muted)", fontSize: "16px", marginBottom: "32px", lineHeight: 1.7 }}>
                Test your knowledge about programming concepts, best practices, and software development principles!
              </p>
              <button
                onClick={() => setGameStarted(true)}
                style={{
                  padding: "14px 32px",
                  background: "var(--primary)",
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  fontWeight: "700",
                  fontSize: "16px",
                  cursor: "pointer"
                }}
              >
                Start Trivia
              </button>
            </div>
          </motion.div>
        ) : gameFinished ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <h1 style={{ fontSize: "36px", fontWeight: "800", margin: "0 0 16px 0" }}>✅ Trivia Complete!</h1>
              <div style={{
                padding: "40px",
                borderRadius: "16px",
                background: "var(--bg-card)",
                border: "2px solid var(--primary)",
                marginBottom: "32px"
              }}>
                <div style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "8px" }}>Final Score</div>
                <div style={{ fontSize: "56px", fontWeight: "900", color: "var(--primary)" }}>{score}/{triviaQuestions.length}</div>
              </div>
              <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                <button
                  onClick={() => {
                    setGameStarted(false);
                    setCurrentIdx(0);
                    setScore(0);
                    setGameFinished(false);
                    setAnswered(false);
                    setSelectedAns(null);
                  }}
                  style={{
                    padding: "12px 24px",
                    background: "var(--primary)",
                    color: "white",
                    border: "none",
                    borderRadius: "12px",
                    fontWeight: "700",
                    cursor: "pointer"
                  }}
                >
                  Play Again
                </button>
                <Link to="/games" style={{ textDecoration: "none" }}>
                  <button style={{
                    padding: "12px 24px",
                    background: "var(--bg-card)",
                    color: "var(--text-main)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "12px",
                    fontWeight: "700",
                    cursor: "pointer"
                  }}>
                    Back to Games
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div style={{ marginBottom: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span style={{ fontSize: "14px", color: "var(--text-muted)" }}>
                  Question {currentIdx + 1}/{triviaQuestions.length}
                </span>
                <span style={{ fontSize: "16px", fontWeight: "700", color: "var(--primary)" }}>
                  Score: {score}
                </span>
              </div>
              <div style={{ height: "6px", background: "var(--bg-card)", borderRadius: "999px", overflow: "hidden" }}>
                <div style={{ height: "100%", background: "var(--primary)", width: `${((currentIdx + 1) / triviaQuestions.length) * 100}%`, transition: "width 0.3s ease" }} />
              </div>
            </div>

            <div style={{
              padding: "28px",
              background: "var(--bg-card)",
              borderRadius: "16px",
              border: "1px solid var(--border-color)",
              marginBottom: "24px"
            }}>
              <h2 style={{ margin: "0 0 24px 0", fontSize: "20px", fontWeight: "700" }}>
                {triviaQuestions[currentIdx].q}
              </h2>

              <div style={{ display: "grid", gap: "12px" }}>
                {triviaQuestions[currentIdx].opts.map((opt, idx) => (
                  <motion.button
                    key={idx}
                    onClick={() => handleAnswer(idx)}
                    disabled={answered}
                    whileHover={!answered ? { scale: 1.02 } : {}}
                    style={{
                      padding: "16px",
                      textAlign: "left",
                      borderRadius: "12px",
                      border: "1px solid var(--border-color)",
                      background: answered ? (idx === triviaQuestions[currentIdx].ans ? "rgba(16, 185, 129, 0.1)" : idx === selectedAns ? "rgba(248, 113, 113, 0.1)" : "var(--bg-card)") : "var(--bg-card)",
                      color: "var(--text-main)",
                      cursor: answered ? "default" : "pointer",
                      fontWeight: "600",
                      fontSize: "15px"
                    }}
                  >
                    {opt}
                    {answered && idx === triviaQuestions[currentIdx].ans && " ✓"}
                    {answered && idx === selectedAns && idx !== triviaQuestions[currentIdx].ans && " ✗"}
                  </motion.button>
                ))}
              </div>
            </div>

            {answered && (
              <motion.button
                onClick={handleNext}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  width: "100%",
                  padding: "14px",
                  background: "var(--primary)",
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  fontWeight: "700",
                  cursor: "pointer",
                  fontSize: "16px"
                }}
              >
                {currentIdx === triviaQuestions.length - 1 ? "Finish" : "Next Question"}
              </motion.button>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
}

export default CourseTrivia;
