import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "../components/NavBar";
import { useTheme } from "../useTheme";

const wordList = [
  { word: "JAVASCRIPT", hint: "Popular web programming language" },
  { word: "DATABASE", hint: "Organized data storage system" },
  { word: "ALGORITHM", hint: "Step-by-step procedure for solving a problem" },
  { word: "VARIABLE", hint: "Container for storing data values" },
  { word: "FUNCTION", hint: "Reusable block of code" },
  { word: "COMPILE", hint: "Convert source code to machine code" },
  { word: "FRAMEWORK", hint: "Structured platform for building applications" },
  { word: "DEBUGGING", hint: "Process of finding and fixing errors" },
  { word: "RECURSION", hint: "Function calling itself" },
  { word: "INTERFACE", hint: "User interaction point" },
];

const scrambleWord = (word) => word.split("").sort(() => Math.random() - 0.5).join("");

function WordScramble() {
  useTheme();
  const navigate = useNavigate();
  const [gameStarted, setGameStarted] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [answered, setAnswered] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);
  const [scrambled, setScrambled] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
  }, [navigate]);

  useEffect(() => {
    if (gameStarted) {
      setScrambled(scrambleWord(wordList[currentIdx].word));
    }
  }, [currentIdx, gameStarted]);

  const handleSubmit = () => {
    if (!userAnswer.trim()) return;
    setAnswered(true);
    if (userAnswer.toUpperCase() === wordList[currentIdx].word) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (currentIdx < wordList.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setUserAnswer("");
      setAnswered(false);
    } else {
      setGameFinished(true);
    }
  };

  const startGame = () => {
    setGameStarted(true);
    setCurrentIdx(0);
    setScore(0);
    setUserAnswer("");
    setAnswered(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-main)", color: "var(--text-main)" }}>
      <Navbar />
      <main style={{ maxWidth: "700px", margin: "0 auto", padding: "40px 20px" }}>
        {!gameStarted ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <h1 style={{ fontSize: "44px", fontWeight: "800", margin: "0 0 16px 0" }}>🔤 Word Scramble</h1>
              <p style={{ color: "var(--text-muted)", fontSize: "16px", marginBottom: "32px", lineHeight: 1.7 }}>
                Unscramble the letters to reveal the programming term. Use the hint if you get stuck!
              </p>
              <button
                onClick={startGame}
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
                Start Game
              </button>
            </div>
          </motion.div>
        ) : gameFinished ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <h1 style={{ fontSize: "36px", fontWeight: "800", margin: "0 0 16px 0" }}>🎉 Game Over!</h1>
              <div style={{
                padding: "40px",
                borderRadius: "16px",
                background: "var(--bg-card)",
                border: "2px solid var(--primary)",
                marginBottom: "32px"
              }}>
                <div style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "8px" }}>Final Score</div>
                <div style={{ fontSize: "56px", fontWeight: "900", color: "var(--primary)" }}>{score}/{wordList.length}</div>
              </div>
              <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                <button
                  onClick={startGame}
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
                  Word {currentIdx + 1}/{wordList.length}
                </span>
                <span style={{ fontSize: "16px", fontWeight: "700", color: "var(--primary)" }}>
                  Score: {score}
                </span>
              </div>
              <div style={{ height: "6px", background: "var(--bg-card)", borderRadius: "999px", overflow: "hidden" }}>
                <div style={{ height: "100%", background: "var(--primary)", width: `${((currentIdx + 1) / wordList.length) * 100}%`, transition: "width 0.3s ease" }} />
              </div>
            </div>

            <div style={{
              padding: "40px",
              background: "var(--bg-card)",
              borderRadius: "16px",
              border: "1px solid var(--border-color)",
              marginBottom: "24px",
              textAlign: "center"
            }}>
              <p style={{ margin: "0 0 16px 0", color: "var(--text-muted)", fontSize: "14px" }}>Unscramble this word:</p>
              <div style={{
                fontSize: "48px",
                fontWeight: "900",
                letterSpacing: "8px",
                color: "var(--primary)",
                marginBottom: "24px",
                fontFamily: "monospace"
              }}>
                {scrambled}
              </div>

              <p style={{ margin: "0 0 16px 0", color: "var(--text-muted)", fontSize: "14px" }}>
                💡 Hint: {wordList[currentIdx].hint}
              </p>

              <input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && !answered && handleSubmit()}
                placeholder="Type your answer..."
                disabled={answered}
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "12px",
                  border: "1px solid var(--border-color)",
                  background: "var(--bg-main)",
                  color: "var(--text-main)",
                  fontSize: "16px",
                  fontWeight: "600",
                  marginBottom: "16px",
                  boxSizing: "border-box"
                }}
              />

              {answered && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    padding: "12px",
                    borderRadius: "12px",
                    background: userAnswer.toUpperCase() === wordList[currentIdx].word ? "rgba(16, 185, 129, 0.1)" : "rgba(248, 113, 113, 0.1)",
                    color: userAnswer.toUpperCase() === wordList[currentIdx].word ? "var(--success)" : "var(--danger)",
                    fontWeight: "700",
                    marginBottom: "16px"
                  }}
                >
                  {userAnswer.toUpperCase() === wordList[currentIdx].word ? "✓ Correct!" : `✗ The answer is: ${wordList[currentIdx].word}`}
                </motion.div>
              )}
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              {!answered ? (
                <button
                  onClick={handleSubmit}
                  disabled={!userAnswer.trim()}
                  style={{
                    flex: 1,
                    padding: "14px",
                    background: userAnswer.trim() ? "var(--primary)" : "var(--border-color)",
                    color: "white",
                    border: "none",
                    borderRadius: "12px",
                    fontWeight: "700",
                    cursor: userAnswer.trim() ? "pointer" : "not-allowed",
                    fontSize: "16px"
                  }}
                >
                  Submit
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  style={{
                    flex: 1,
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
                  {currentIdx === wordList.length - 1 ? "Finish" : "Next"}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}

export default WordScramble;
