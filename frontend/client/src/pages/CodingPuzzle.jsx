import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/NavBar";

const puzzles = [
  {
    id: 1,
    title: "Find the Output",
    description: "What does the following code print to the console?",
    code: `const a = [1, 2, 3];\nconst result = a.map((n) => n * 2);\nconsole.log(result);`,
    choices: ["[1, 2, 3]", "[2, 4, 6]", "[1, 4, 9]", "undefined"],
    answerIndex: 1,
    output: "[2, 4, 6]",
  },
  {
    id: 2,
    title: "Bug Hunt",
    description: "Which line contains the mistake in this function?",
    code: `function greet(name) {\n  return \`Hello, ${name}!\`;\n}\n\nconsole.log(greet);`,
    choices: [
      "The function declaration",
      "The template string inside return",
      "The console.log call",
      "There is no mistake"
    ],
    answerIndex: 2,
    output: "It logs the function object rather than a greeting. The code should call greet(name).",
  },
  {
    id: 3,
    title: "Correct Syntax",
    description: "Choose the correct way to declare a constant array in JavaScript.",
    code: `const values = [\n  10,\n  20,\n  30\n];`,
    choices: [
      "const values = (10, 20, 30);",
      "const values = [10, 20, 30];",
      "let values = [10, 20, 30];",
      "var values = {10, 20, 30};"
    ],
    answerIndex: 1,
    output: "const values = [10, 20, 30]; is the correct syntax.",
  },
  {
    id: 4,
    title: "Filter Method",
    description: "What does this filter operation return?",
    code: `const nums = [1, 2, 3, 4, 5, 6];\nconst result = nums.filter(n => n > 3);\nconsole.log(result);`,
    choices: ["[1, 2, 3]", "[4, 5, 6]", "[3, 4, 5, 6]", "[6]"],
    answerIndex: 1,
    output: "[4, 5, 6] - filter keeps only elements that match the condition.",
  },
  {
    id: 5,
    title: "String Methods",
    description: "What is the output of this string method?",
    code: `const text = "JavaScript";\nconst result = text.toLowerCase();\nconsole.log(result);`,
    choices: ["JAVASCRIPT", "javascript", "JavaSript", "jAvAsCrIpT"],
    answerIndex: 1,
    output: "javascript - toLowerCase() converts all characters to lowercase.",
  },
  {
    id: 6,
    title: "Object Access",
    description: "What value is logged to the console?",
    code: `const user = { name: "Alice", age: 25, role: "Developer" };\nconsole.log(user.role);`,
    choices: ["Alice", "25", "Developer", "undefined"],
    answerIndex: 2,
    output: "Developer - accessing the role property of the user object.",
  },
  {
    id: 7,
    title: "Arrow Function Return",
    description: "What does this arrow function return?",
    code: `const square = (x) => x * x;\nconsole.log(square(5));`,
    choices: ["5", "10", "25", "undefined"],
    answerIndex: 2,
    output: "25 - the arrow function multiplies x by itself.",
  },
  {
    id: 8,
    title: "Array Index",
    description: "What value does this access?",
    code: `const items = ["apple", "banana", "orange"];\nconsole.log(items[1]);`,
    choices: ["apple", "banana", "orange", "undefined"],
    answerIndex: 1,
    output: "banana - arrays are zero-indexed, so index 1 is the second element.",
  },
  {
    id: 9,
    title: "Type Coercion",
    description: "What is the result of this operation?",
    code: `console.log("5" + 3);`,
    choices: ["8", "53", "5,3", "NaN"],
    answerIndex: 1,
    output: "53 - when adding a string and number, JavaScript converts the number to a string.",
  },
  {
    id: 10,
    title: "Template Literals",
    description: "What is the output of this template literal?",
    code: `const name = "Alex";\nconst greeting = \`Hello, \${name}!\`;\nconsole.log(greeting);`,
    choices: ["Hello, name!", "Hello, Alex!", "Hello, ${name}!", "undefined"],
    answerIndex: 1,
    output: "Hello, Alex! - template literals use ${} to interpolate variables.",
  },
  {
    id: 11,
    title: "Reduce Method",
    description: "What does this reduce operation return?",
    code: `const nums = [1, 2, 3, 4];\nconst sum = nums.reduce((a, b) => a + b, 0);\nconsole.log(sum);`,
    choices: ["10", "4", "1234", "24"],
    answerIndex: 0,
    output: "10 - reduce sums all elements: 0 + 1 + 2 + 3 + 4 = 10.",
  },
  {
    id: 12,
    title: "Conditional Operator",
    description: "What is the result of this ternary operator?",
    code: `const age = 18;\nconst status = age >= 18 ? "Adult" : "Minor";\nconsole.log(status);`,
    choices: ["18", "Adult", "Minor", "undefined"],
    answerIndex: 1,
    output: "Adult - since age (18) is >= 18, the first value is returned.",
  }
];

function CodingPuzzle() {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [score, setScore] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  const currentPuzzle = puzzles[currentIndex];

  const handleSubmit = () => {
    if (selectedOption === null) return;
    const isCorrect = selectedOption === currentPuzzle.answerIndex;
    setCorrectAnswer(isCorrect);
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }
    setShowFeedback(true);
  };

  const handleNext = () => {
    setSelectedOption(null);
    setShowFeedback(false);
    setCorrectAnswer(false);
    setCurrentIndex((prev) => Math.min(prev + 1, puzzles.length - 1));
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setScore(0);
    setShowFeedback(false);
    setCorrectAnswer(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-main)", color: "var(--text-main)", paddingBottom: "40px" }}>
      <Navbar />
      <main style={{ maxWidth: "960px", margin: "0 auto", padding: "28px 22px" }}>
        <section style={{ marginBottom: "24px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
            <div style={{ fontSize: "32px", fontWeight: "800", lineHeight: 1.1 }}>Coding Puzzle Game</div>
            <span style={{ background: "var(--primary-light)", color: "var(--primary-dark)", borderRadius: "999px", padding: "8px 14px", fontWeight: "700", fontSize: "14px" }}>
              Score: {score}/{puzzles.length}
            </span>
          </div>
          <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "15px", maxWidth: "760px" }}>
            Practice small JavaScript puzzles to build confidence. Pick the correct answer and unlock the next question.
          </p>
        </section>

        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "18px", padding: "22px", boxShadow: "0 18px 50px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "20px", marginBottom: "18px", flexWrap: "wrap" }}>
            <div>
              <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "13px", fontWeight: "700", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                Puzzle {currentIndex + 1} of {puzzles.length}
              </p>
              <h2 style={{ margin: "10px 0 0", fontSize: "24px", fontWeight: "800" }}>{currentPuzzle.title}</h2>
            </div>
            <div style={{ minWidth: "140px", textAlign: "right" }}>
              <span style={{ display: "inline-block", padding: "10px 14px", borderRadius: "14px", background: "rgba(99, 102, 241, 0.1)", color: "var(--primary)", fontWeight: "700" }}>
                {selectedOption === null ? "Choose an answer" : "Ready to submit"}
              </span>
            </div>
          </div>

          <p style={{ margin: "0 0 18px", color: "var(--text-muted)", lineHeight: "1.7" }}>{currentPuzzle.description}</p>
          <pre style={{ margin: 0, borderRadius: "14px", background: "rgba(15, 23, 42, 0.9)", color: "#e2e8f0", padding: "18px", overflowX: "auto", fontSize: "14px", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
            <code>{currentPuzzle.code}</code>
          </pre>

          <div style={{ marginTop: "22px", display: "grid", gap: "12px" }}>
            {currentPuzzle.choices.map((choice, idx) => {
              const isSelected = selectedOption === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => !showFeedback && setSelectedOption(idx)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    borderRadius: "14px",
                    border: isSelected ? "2px solid var(--primary)" : "1px solid var(--border-color)",
                    background: isSelected ? "rgba(59, 130, 246, 0.12)" : "var(--bg-main)",
                    color: "var(--text-main)",
                    padding: "16px 18px",
                    cursor: showFeedback ? "default" : "pointer",
                    fontSize: "15px",
                    fontWeight: "600",
                    transition: "all 0.2s ease"
                  }}
                >
                  <span style={{ display: "inline-block", width: "26px", fontWeight: "bold", marginRight: "12px" }}>
                    {String.fromCharCode(65 + idx)}.
                  </span>
                  {choice}
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: "24px", display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
            {!showFeedback ? (
              <button
                onClick={handleSubmit}
                disabled={selectedOption === null}
                style={{
                  borderRadius: "14px",
                  background: selectedOption === null ? "var(--border-color)" : "var(--primary)",
                  color: selectedOption === null ? "var(--text-muted)" : "white",
                  border: "none",
                  padding: "14px 22px",
                  cursor: selectedOption === null ? "not-allowed" : "pointer",
                  fontWeight: "700",
                  fontSize: "14px"
                }}
              >
                Submit Answer
              </button>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ color: correctAnswer ? "var(--success)" : "var(--danger)", fontWeight: "700", fontSize: "15px" }}>
                    {correctAnswer ? "Correct!" : "Not quite."}
                  </span>
                  <span style={{ color: "var(--text-muted)", fontSize: "14px" }}>
                    Correct answer: {String.fromCharCode(65 + currentPuzzle.answerIndex)}.
                  </span>
                </div>
                <span style={{ color: "var(--text-muted)", fontSize: "14px" }}>
                  Expected output: {currentPuzzle.output}
                </span>
              </div>
            )}

            <button
              onClick={handleNext}
              disabled={!showFeedback || currentIndex === puzzles.length - 1}
              style={{
                borderRadius: "14px",
                background: currentIndex === puzzles.length - 1 ? "var(--border-color)" : "var(--success)",
                color: currentIndex === puzzles.length - 1 ? "var(--text-muted)" : "white",
                border: "none",
                padding: "14px 22px",
                cursor: currentIndex === puzzles.length - 1 ? "not-allowed" : "pointer",
                fontWeight: "700",
                fontSize: "14px"
              }}
            >
              Next Puzzle
            </button>

            <button
              onClick={handleRestart}
              style={{
                borderRadius: "14px",
                background: "transparent",
                color: "var(--text-main)",
                border: "1px solid var(--border-color)",
                padding: "14px 22px",
                cursor: "pointer",
                fontWeight: "700",
                fontSize: "14px"
              }}
            >
              Restart Game
            </button>
          </div>

          {currentIndex === puzzles.length - 1 && showFeedback && (
            <div style={{ marginTop: "24px", padding: "18px 20px", borderRadius: "16px", background: "rgba(16, 185, 129, 0.08)", color: "var(--success)", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
              <p style={{ margin: 0, fontWeight: "700" }}>You finished the game!</p>
              <p style={{ margin: "8px 0 0", color: "var(--text-muted)" }}>
                Your final score is {score}/{puzzles.length}. Keep practicing to improve your code intuition!
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default CodingPuzzle;
