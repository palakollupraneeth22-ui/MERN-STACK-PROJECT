import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "../components/NavBar";
import { useTheme } from "../useTheme";

const quickQuizQuestions = [
  { q: "What does DOM stand for?", options: ["Data Object Model", "Document Object Model", "Digital Operating Method", "Data Oriented Module"], ans: 1 },
  { q: "Which is not a JavaScript data type?", options: ["String", "Number", "Boolean", "Float"], ans: 3 },
  { q: "What keyword is used to declare a constant?", options: ["let", "var", "const", "constant"], ans: 2 },
  { q: "Which method adds elements to the end of an array?", options: ["shift()", "unshift()", "push()", "pop()"], ans: 2 },
  { q: "What does CSS stand for?", options: ["Cascading Style Sheets", "Computer Style Syntax", "Creative Sheet System", "Cascading System Sheet"], ans: 0 },
  { q: "How do you select an element by ID in CSS?", options: [".id", "#id", "@id", ":id"], ans: 1 },
  { q: "What is the correct JSON syntax?", options: ["{'name': 'John'}", '{"name": "John"}', "{'name': \\'John\\'}", '["name": "John"]'], ans: 1 },
  { q: "Which HTTP method is used to submit data?", options: ["GET", "POST", "RETRIEVE", "SEND"], ans: 1 },
  { q: "What does API stand for?", options: ["Application Process Interface", "Application Programming Interface", "Application Protocol Interface", "Application Platform Interface"], ans: 1 },
  { q: "Which is a NoSQL database?", options: ["PostgreSQL", "MySQL", "MongoDB", "SQLite"], ans: 2 },
];

function QuickQuiz() {
  useTheme();
  const navigate = useNavigate();
  const [gameStarted, setGameStarted] = useState(false);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
  }, [navigate]);

  const handleTimeUp = useCallback(() => {
    setAnswered(true);
    setTimeout(() => {
      setCurrentQuestionIdx((prev) => {
        if (prev < quickQuizQuestions.length - 1) {
          setSelectedAnswer(null);
          setAnswered(false);
          setTimeLeft(30);
          return prev + 1;
        } else {
          setGameFinished(true);
          return prev;
        }
      });
    }, 1500);
  }, []);

  useEffect(() => {
    if (!gameStarted || gameFinished) return;
    
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [gameStarted, gameFinished, handleTimeUp]);

  const handleAnswerSelect = (idx) => {
    if (answered) return;
    setSelectedAnswer(idx);
    setAnswered(true);
    if (idx === quickQuizQuestions[currentQuestionIdx].ans) {
      setScore(score + 1);
    }
    setTimeout(() => {
      if (currentQuestionIdx < quickQuizQuestions.length - 1) {
        setCurrentQuestionIdx(currentQuestionIdx + 1);
        setSelectedAnswer(null);
        setAnswered(false);
        setTimeLeft(30);
      } else {
        setGameFinished(true);
      }
    }, 1500);
  };

  const currentQuestion = quickQuizQuestions[currentQuestionIdx];
  const timePercentage = (timeLeft / 30) * 100;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-main)", color: "var(--text-main)" }}>
      <Navbar />
      <main style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 20px" }}>
        {!gameStarted ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <h1 style={{ fontSize: "44px", fontWeight: "800", margin: "0 0 16px 0" }}>⚡ Quick Quiz</h1>
              <p style={{ color: "var(--text-muted)", fontSize: "16px", marginBottom: "32px", lineHeight: 1.7 }}>
                Answer as many questions as you can within the time limit! You have 30 seconds per question.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "32px" }}>
                <div style={{ padding: "24px", borderRadius: "12px", background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
                  <div style={{ fontSize: "24px", fontWeight: "800", color: "var(--primary)" }}>{quickQuizQuestions.length}</div>
                  <div style={{ fontSize: "14px", color: "var(--text-muted)" }}>Total Questions</div>
                </div>
                <div style={{ padding: "24px", borderRadius: "12px", background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
                  <div style={{ fontSize: "24px", fontWeight: "800", color: "var(--primary)" }}>30s</div>
                  <div style={{ fontSize: "14px", color: "var(--text-muted)" }}>Per Question</div>
                </div>
              </div>
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
                Start Quiz
              </button>
            </div>
          </motion.div>
        ) : gameFinished ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <h1 style={{ fontSize: "36px", fontWeight: "800", margin: "0 0 16px 0" }}>🏁 Quiz Complete!</h1>
              <div style={{
                padding: "40px",
                borderRadius: "16px",
                background: "var(--bg-card)",
                border: "2px solid var(--primary)",
                marginBottom: "32px"
              }}>
                <div style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "8px" }}>Your Score</div>
                <div style={{ fontSize: "56px", fontWeight: "900", color: "var(--primary)" }}>{score}/{quickQuizQuestions.length}</div>
                <div style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "8px" }}>Accuracy: {Math.round((score / quickQuizQuestions.length) * 100)}%</div>
              </div>
              <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                <button
                  onClick={() => {
                    setGameStarted(false);
                    setCurrentQuestionIdx(0);
                    setScore(0);
                    setGameFinished(false);
                    setTimeLeft(30);
                    setSelectedAnswer(null);
                    setAnswered(false);
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
                  Try Again
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
            <div style={{ marginBottom: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span style={{ fontSize: "14px", color: "var(--text-muted)" }}>
                  Question {currentQuestionIdx + 1}/{quickQuizQuestions.length}
                </span>
                <span style={{ fontSize: "24px", fontWeight: "800", color: timeLeft <= 10 ? "var(--danger)" : "var(--primary)" }}>
                  ⏱️ {timeLeft}s
                </span>
              </div>
              <div style={{
                height: "6px",
                background: "var(--bg-card)",
                borderRadius: "999px",
                overflow: "hidden"
              }}>
                <div style={{
                  height: "100%",
                  background: timeLeft <= 10 ? "var(--danger)" : "var(--primary)",
                  width: `${timePercentage}%`,
                  transition: "width 0.3s ease"
                }} />
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
                {currentQuestion.q}
              </h2>

              <div style={{ display: "grid", gap: "12px" }}>
                {currentQuestion.options.map((option, idx) => (
                  <motion.button
                    key={idx}
                    onClick={() => handleAnswerSelect(idx)}
                    disabled={answered}
                    whileHover={!answered ? { scale: 1.02 } : {}}
                    whileTap={!answered ? { scale: 0.98 } : {}}
                    style={{
                      padding: "16px",
                      textAlign: "left",
                      borderRadius: "12px",
                      border: "1px solid var(--border-color)",
                      background: answered ? (idx === quickQuizQuestions[currentQuestionIdx].ans ? "rgba(16, 185, 129, 0.1)" : idx === selectedAnswer ? "rgba(248, 113, 113, 0.1)" : "var(--bg-card)") : "var(--bg-card)",
                      color: "var(--text-main)",
                      cursor: answered ? "default" : "pointer",
                      fontWeight: "600",
                      fontSize: "15px",
                      opacity: answered && idx !== selectedAnswer && idx !== quickQuizQuestions[currentQuestionIdx].ans ? 0.5 : 1,
                      transition: "all 0.3s ease"
                    }}
                  >
                    {option}
                    {answered && idx === quickQuizQuestions[currentQuestionIdx].ans && " ✓"}
                    {answered && idx === selectedAnswer && idx !== quickQuizQuestions[currentQuestionIdx].ans && " ✗"}
                  </motion.button>
                ))}
              </div>
            </div>

            <div style={{
              padding: "16px",
              background: "var(--bg-card)",
              borderRadius: "12px",
              border: "1px solid var(--border-color)",
              textAlign: "center",
              fontSize: "14px",
              color: "var(--text-muted)"
            }}>
              Current Score: <span style={{ color: "var(--primary)", fontWeight: "700", fontSize: "16px" }}>{score}/{quickQuizQuestions.length}</span>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}

export default QuickQuiz;
