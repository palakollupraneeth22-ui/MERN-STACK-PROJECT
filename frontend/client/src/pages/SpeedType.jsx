import { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "../components/NavBar";
import { useTheme } from "../useTheme";

const codeSnippets = [
  "const sum = (a, b) => a + b;",
  "function multiply(x, y) { return x * y; }",
  "const arr = [1, 2, 3, 4, 5];",
  "if (score > 100) { console.log('Champion!'); }",
  "const user = { name: 'Alex', age: 25 };",
  "for (let i = 0; i < 10; i++) { }",
  "while (true) { console.log('Running...'); }",
  "const isValid = email.includes('@');",
  "const filtered = arr.filter(n => n > 5);",
  "const mapped = arr.map(x => x * 2);",
];

function SpeedType() {
  useTheme();
  const navigate = useNavigate();
  const [gameStarted, setGameStarted] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [gameFinished, setGameFinished] = useState(false);
  const [wpm, setWpm] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const inputRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
  }, [navigate]);

  useEffect(() => {
    if (!gameStarted || gameFinished) return;

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setGameFinished(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [gameStarted, gameFinished]);

  const startGame = () => {
    setGameStarted(true);
    setTimeLeft(60);
    setScore(0);
    setCurrentIdx(0);
    setUserInput("");
    setStartTime(Date.now());
    setGameFinished(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setUserInput(value);

    if (value === codeSnippets[currentIdx] && !gameFinished) {
      setScore(score + 1);
      setCurrentIdx((currentIdx + 1) % codeSnippets.length);
      setUserInput("");
    }
  };

  useEffect(() => {
    const calculateWPM = () => {
      if (!startTime) return 0;
      const timeInMinutes = (60 - timeLeft) / 60;
      const charCount = score * 30;
      return Math.round(charCount / 5 / timeInMinutes) || 0;
    };

    if (gameFinished) {
      setWpm(calculateWPM());
    }
  }, [gameFinished, startTime, timeLeft, score]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-main)", color: "var(--text-main)" }}>
      <Navbar />
      <main style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 20px" }}>
        {!gameStarted ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <h1 style={{ fontSize: "44px", fontWeight: "800", margin: "0 0 16px 0" }}>⌨️ Speed Type</h1>
              <p style={{ color: "var(--text-muted)", fontSize: "16px", marginBottom: "32px", lineHeight: 1.7 }}>
                Type code snippets as fast as you can! You have 60 seconds to type as many snippets as possible.
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
                Start Challenge
              </button>
            </div>
          </motion.div>
        ) : gameFinished ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <h1 style={{ fontSize: "36px", fontWeight: "800", margin: "0 0 16px 0" }}>🏁 Time's Up!</h1>
              <div style={{
                padding: "40px",
                borderRadius: "16px",
                background: "var(--bg-card)",
                border: "2px solid var(--primary)",
                marginBottom: "32px"
              }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                  <div>
                    <div style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "8px" }}>Snippets</div>
                    <div style={{ fontSize: "40px", fontWeight: "900", color: "var(--primary)" }}>{score}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "8px" }}>WPM</div>
                    <div style={{ fontSize: "40px", fontWeight: "900", color: "var(--primary)" }}>{wpm}</div>
                  </div>
                </div>
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
                  Try Again
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
            <div style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
              <h1 style={{ margin: 0, fontSize: "28px", fontWeight: "800" }}>⌨️ Speed Type</h1>
              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                <div style={{ padding: "12px 16px", background: "var(--bg-card)", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Typed</div>
                  <div style={{ fontSize: "20px", fontWeight: "800", color: "var(--primary)" }}>{score}</div>
                </div>
                <div style={{ padding: "12px 16px", background: timeLeft <= 10 ? "rgba(248, 113, 113, 0.1)" : "var(--bg-card)", borderRadius: "12px", border: `1px solid ${timeLeft <= 10 ? "var(--danger)" : "var(--border-color)"}` }}>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Time</div>
                  <div style={{ fontSize: "20px", fontWeight: "800", color: timeLeft <= 10 ? "var(--danger)" : "var(--primary)" }}>{timeLeft}s</div>
                </div>
              </div>
            </div>

            <div style={{
              padding: "28px",
              background: "var(--bg-card)",
              borderRadius: "16px",
              border: "1px solid var(--border-color)",
              marginBottom: "24px"
            }}>
              <p style={{ margin: "0 0 16px 0", color: "var(--text-muted)", fontSize: "14px" }}>Type this code snippet:</p>
              <pre style={{
                background: "var(--bg-main)",
                padding: "16px",
                borderRadius: "12px",
                overflow: "auto",
                fontFamily: "monospace",
                fontSize: "16px",
                fontWeight: "600",
                color: "var(--primary)",
                margin: "0 0 16px 0"
              }}>
                {codeSnippets[currentIdx]}
              </pre>

              <input
                ref={inputRef}
                type="text"
                value={userInput}
                onChange={handleInputChange}
                placeholder="Start typing here..."
                autoFocus
                style={{
                  width: "100%",
                  padding: "16px",
                  borderRadius: "12px",
                  border: userInput === codeSnippets[currentIdx] ? "2px solid var(--success)" : "1px solid var(--border-color)",
                  background: "var(--bg-main)",
                  color: "var(--text-main)",
                  fontSize: "16px",
                  fontFamily: "monospace",
                  fontWeight: "600",
                  boxSizing: "border-box"
                }}
              />

              {userInput.length > 0 && (
                <div style={{ marginTop: "12px", fontSize: "14px", color: userInput === codeSnippets[currentIdx] ? "var(--success)" : "var(--text-muted)" }}>
                  {userInput === codeSnippets[currentIdx] ? "✓ Perfect! Next snippet..." : `${userInput.length}/${codeSnippets[currentIdx].length} characters`}
                </div>
              )}
            </div>

            <div style={{ textAlign: "center" }}>
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
                  Quit Challenge
                </button>
              </Link>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}

export default SpeedType;
