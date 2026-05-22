import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "../components/NavBar";
import { useTheme } from "../useTheme";

const memoryPairs = [
  { id: 1, pair: 0, emoji: "🎯", label: "Target" },
  { id: 2, pair: 0, emoji: "🎯", label: "Target" },
  { id: 3, pair: 1, emoji: "💻", label: "Code" },
  { id: 4, pair: 1, emoji: "💻", label: "Code" },
  { id: 5, pair: 2, emoji: "📚", label: "Learn" },
  { id: 6, pair: 2, emoji: "📚", label: "Learn" },
  { id: 7, pair: 3, emoji: "⚡", label: "Speed" },
  { id: 8, pair: 3, emoji: "⚡", label: "Speed" },
  { id: 9, pair: 4, emoji: "🏆", label: "Win" },
  { id: 10, pair: 4, emoji: "🏆", label: "Win" },
  { id: 11, pair: 5, emoji: "🧠", label: "Brain" },
  { id: 12, pair: 5, emoji: "🧠", label: "Brain" },
  { id: 13, pair: 6, emoji: "🚀", label: "Launch" },
  { id: 14, pair: 6, emoji: "🚀", label: "Launch" },
  { id: 15, pair: 7, emoji: "✨", label: "Star" },
  { id: 16, pair: 7, emoji: "✨", label: "Star" },
];

function MemoryGame() {
  useTheme();
  const navigate = useNavigate();
  const [gameStarted, setGameStarted] = useState(false);
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState(new Set());
  const [matched, setMatched] = useState(new Set());
  const [moves, setMoves] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
  }, [navigate]);

  useEffect(() => {
    if (!gameStarted) return;
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [gameStarted, startTime]);

  const startGame = () => {
    const shuffled = [...memoryPairs].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setFlipped(new Set());
    setMatched(new Set());
    setMoves(0);
    setGameWon(false);
    setStartTime(Date.now());
    setElapsedTime(0);
    setGameStarted(true);
  };

  const handleCardClick = (index) => {
    if (matched.has(index) || flipped.has(index)) return;
    
    const newFlipped = new Set(flipped);
    newFlipped.add(index);
    setFlipped(newFlipped);

    if (newFlipped.size === 2) {
      const [first, second] = Array.from(newFlipped);
      setMoves(moves + 1);

      if (cards[first].pair === cards[second].pair) {
        const newMatched = new Set(matched);
        newMatched.add(first);
        newMatched.add(second);
        setMatched(newMatched);
        setFlipped(new Set());

        if (newMatched.size === cards.length) {
          setGameWon(true);
        }
      } else {
        setTimeout(() => setFlipped(new Set()), 800);
      }
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-main)", color: "var(--text-main)" }}>
      <Navbar />
      <main style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 20px" }}>
        {!gameStarted ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <h1 style={{ fontSize: "44px", fontWeight: "800", margin: "0 0 16px 0" }}>🧠 Memory Match</h1>
              <p style={{ color: "var(--text-muted)", fontSize: "16px", marginBottom: "32px", lineHeight: 1.7 }}>
                Find matching pairs by flipping cards. The fewer moves you take, the better!
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "16px", marginBottom: "32px" }}>
                <div style={{ padding: "24px", borderRadius: "12px", background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
                  <div style={{ fontSize: "24px", fontWeight: "800", color: "var(--primary)" }}>8</div>
                  <div style={{ fontSize: "14px", color: "var(--text-muted)" }}>Total Pairs</div>
                </div>
                <div style={{ padding: "24px", borderRadius: "12px", background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
                  <div style={{ fontSize: "24px", fontWeight: "800", color: "var(--primary)" }}>16</div>
                  <div style={{ fontSize: "14px", color: "var(--text-muted)" }}>Cards</div>
                </div>
              </div>
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
        ) : gameWon ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <h1 style={{ fontSize: "36px", fontWeight: "800", margin: "0 0 16px 0" }}>🎉 You Won!</h1>
              <div style={{
                padding: "40px",
                borderRadius: "16px",
                background: "var(--bg-card)",
                border: "2px solid var(--primary)",
                marginBottom: "32px"
              }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                  <div>
                    <div style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "8px" }}>Moves</div>
                    <div style={{ fontSize: "40px", fontWeight: "900", color: "var(--primary)" }}>{moves}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "8px" }}>Time</div>
                    <div style={{ fontSize: "40px", fontWeight: "900", color: "var(--primary)" }}>{elapsedTime}s</div>
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
                  Play Again
                </button>
                <Link to="/games" style={{ textDecoration: "none" }}>
                  <button
                    style={{
                      padding: "12px 24px",
                      background: "var(--bg-card)",
                      color: "var(--text-main)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "12px",
                      fontWeight: "700",
                      cursor: "pointer"
                    }}
                  >
                    Back to Games
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
              <div>
                <h1 style={{ margin: 0, fontSize: "28px", fontWeight: "800" }}>🧠 Memory Match</h1>
              </div>
              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                <div style={{ padding: "12px 16px", background: "var(--bg-card)", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Moves</div>
                  <div style={{ fontSize: "20px", fontWeight: "800", color: "var(--primary)" }}>{moves}</div>
                </div>
                <div style={{ padding: "12px 16px", background: "var(--bg-card)", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Time</div>
                  <div style={{ fontSize: "20px", fontWeight: "800", color: "var(--primary)" }}>{elapsedTime}s</div>
                </div>
                <div style={{ padding: "12px 16px", background: "var(--bg-card)", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Matched</div>
                  <div style={{ fontSize: "20px", fontWeight: "800", color: "var(--primary)" }}>{matched.size / 2}/8</div>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
              {cards.map((card, index) => (
                <motion.button
                  key={index}
                  onClick={() => handleCardClick(index)}
                  whileHover={!flipped.has(index) && !matched.has(index) ? { scale: 1.05 } : {}}
                  whileTap={!flipped.has(index) && !matched.has(index) ? { scale: 0.95 } : {}}
                  style={{
                    aspectRatio: "1",
                    borderRadius: "12px",
                    border: "2px solid var(--border-color)",
                    background: matched.has(index) ? "var(--primary-light)" : flipped.has(index) ? "var(--bg-card)" : "var(--bg-card)",
                    color: "var(--text-main)",
                    fontSize: "40px",
                    fontWeight: "800",
                    cursor: matched.has(index) ? "default" : "pointer",
                    transition: "all 0.3s ease",
                    opacity: matched.has(index) ? 0.7 : 1
                  }}
                >
                  {flipped.has(index) || matched.has(index) ? card.emoji : "?"}
                </motion.button>
              ))}
            </div>

            <div style={{ marginTop: "32px", textAlign: "center" }}>
              <Link to="/games" style={{ textDecoration: "none" }}>
                <button
                  style={{
                    padding: "12px 24px",
                    background: "var(--bg-card)",
                    color: "var(--text-main)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "12px",
                    fontWeight: "700",
                    cursor: "pointer"
                  }}
                >
                  Back to Games
                </button>
              </Link>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}

export default MemoryGame;
