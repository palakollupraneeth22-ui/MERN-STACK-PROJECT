import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/NavBar";
import { useTheme } from "../useTheme";
import API from "../services/api";
import "./DashBoard.css";
import { 
  Gamepad2, 
  Plus, 
  Sparkles, 
  Trophy, 
  HelpCircle, 
  ChevronLeft, 
  Edit, 
  Trash2, 
  Check, 
  X,
  FileText,
  AlertCircle
} from "lucide-react";

const fallbackGames = [
  { id: "fallback-1", title: "Coding Puzzle", questions: [] },
  { id: "fallback-2", title: "Quick Quiz", questions: [] },
  { id: "fallback-3", title: "Memory Match", questions: [] },
  { id: "fallback-4", title: "Course Trivia", questions: [] },
  { id: "fallback-5", title: "Word Scramble", questions: [] },
  { id: "fallback-6", title: "Speed Type", questions: [] }
];

function AdminManageGames() {
  useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("game");

  // Games State
  const [gamesList, setGamesList] = useState([]);
  const [newGameTitle, setNewGameTitle] = useState("");
  const [editingGameId, setEditingGameId] = useState(null);
  const [editingGameTitle, setEditingGameTitle] = useState("");

  // Questions State
  const [selectedGameId, setSelectedGameId] = useState("");
  const [selectedGame, setSelectedGame] = useState(null);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [questionForm, setQuestionForm] = useState({ text: "", options: "", correctAnswer: "" });
  const [newQuestionForm, setNewQuestionForm] = useState({ text: "", options: "", correctAnswer: "" });

  const fetchGames = async () => {
    try {
      const res = await API.get("/games");
      if (Array.isArray(res.data) && res.data.length > 0) {
        setGamesList(res.data);
      } else {
        setGamesList(fallbackGames);
      }
    } catch (err) {
      console.error("Failed to fetch games:", err);
      setGamesList(fallbackGames);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (!token || !storedUser) {
      navigate("/login");
      return;
    }
    try {
      const parsedUser = JSON.parse(storedUser);
      const isAdmin = parsedUser?.isAdmin || parsedUser?.role === "admin" || parsedUser?.email === "admin@gmail.com";
      if (!isAdmin) {
        navigate("/games");
      }
    } catch (err) {
      console.warn("Failed to parse user", err);
    }

    fetchGames();
  }, [navigate]);

  // Update selectedGame helper whenever gamesList changes
  useEffect(() => {
    if (selectedGameId) {
      const found = gamesList.find(g => (g._id || g.id) === selectedGameId);
      setSelectedGame(found || null);
    } else {
      setSelectedGame(null);
    }
  }, [selectedGameId, gamesList]);

  // CREATE GAME CHANNEL
  const handleAddGameSubmit = async (e) => {
    e.preventDefault();
    if (!newGameTitle.trim()) return;
    try {
      await API.post("/games", { title: newGameTitle.trim() });
      alert("New game channel successfully deployed!");
      setNewGameTitle("");
      fetchGames();
    } catch (err) {
      console.error("Error creating game:", err);
      alert(err.response?.data?.message || "Failed to deploy game channel.");
    }
  };

  // UPDATE GAME TITLE
  const handleUpdateGameTitle = async (gameId) => {
    if (!editingGameTitle.trim()) return;
    try {
      await API.put(`/games/${gameId}`, { title: editingGameTitle.trim() });
      alert("Game channel successfully renamed!");
      setEditingGameId(null);
      setEditingGameTitle("");
      fetchGames();
    } catch (err) {
      console.error("Error updating game title:", err);
      alert(err.response?.data?.message || "Failed to update title.");
    }
  };

  // DELETE GAME CHANNEL
  const handleDeleteGame = async (gameId) => {
    if (!window.confirm("Are you sure you want to delete this game channel and all its questions?")) return;
    try {
      await API.delete(`/games/${gameId}`);
      alert("Game channel successfully removed.");
      if (selectedGameId === gameId) setSelectedGameId("");
      fetchGames();
    } catch (err) {
      console.error("Error deleting game:", err);
      alert(err.response?.data?.message || "Failed to delete game.");
    }
  };

  // INJECT QUESTION IN CONTEXT
  const handleInjectQuestion = async (e) => {
    e.preventDefault();
    if (!selectedGameId) {
      alert("Please select a game channel first.");
      return;
    }
    const { text, options, correctAnswer } = newQuestionForm;
    if (!text.trim() || !options.trim() || !correctAnswer.trim()) {
      alert("All question fields are required.");
      return;
    }

    try {
      const formattedOptions = options.split(",").map(opt => opt.trim());
      await API.post(`/games/${selectedGameId}/questions`, {
        text: text.trim(),
        options: formattedOptions,
        correctAnswer: correctAnswer.trim()
      });
      alert("Question successfully integrated!");
      setNewQuestionForm({ text: "", options: "", correctAnswer: "" });
      fetchGames();
    } catch (err) {
      console.error("Error injecting question:", err);
      alert(err.response?.data?.message || "Failed to save question.");
    }
  };

  // TRIGGER EDIT QUESTION
  const startEditingQuestion = (q) => {
    setEditingQuestionId(q._id || q.id);
    setQuestionForm({
      text: q.text,
      options: q.options ? q.options.join(", ") : "",
      correctAnswer: q.correctAnswer
    });
  };

  // SAVE QUESTION EDITS
  const handleSaveQuestionEdit = async (gameId, questionId) => {
    try {
      const formattedOptions = questionForm.options.split(",").map(opt => opt.trim());
      await API.put(`/games/${gameId}/questions/${questionId}`, {
        text: questionForm.text.trim(),
        options: formattedOptions,
        correctAnswer: questionForm.correctAnswer.trim()
      });
      alert("Question bank item successfully updated!");
      setEditingQuestionId(null);
      fetchGames();
    } catch (err) {
      console.error("Error updating question:", err);
      alert(err.response?.data?.message || "Failed to update question.");
    }
  };

  // DELETE QUESTION
  const handleDeleteQuestion = async (gameId, questionId) => {
    if (!window.confirm("Are you sure you want to remove this question from the bank?")) return;
    try {
      await API.delete(`/games/${gameId}/questions/${questionId}`);
      alert("Question deleted successfully.");
      fetchGames();
    } catch (err) {
      console.error("Error deleting question:", err);
      alert(err.response?.data?.message || "Failed to delete question.");
    }
  };

  const inputStyle = { width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid rgba(255, 255, 255, 0.06)", background: "var(--bg-main)", color: "white", marginBottom: "16px", outline: "none", boxSizing: "border-box", fontSize: "13px" };
  const labelStyle = { display: "block", marginBottom: "8px", fontWeight: "700", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1.5px" };

  return (
    <div className="dashboard-page-wrapper" style={{ minHeight: "100vh" }}>
      
      {/* Ambient background particles */}
      <div className="floating-glow-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
      </div>

      <Navbar />

      <main style={{ maxWidth: "1000px", margin: "40px auto", padding: "0 24px", position: "relative", zIndex: 2 }}>
        
        {/* Back navigation */}
        <button 
          onClick={() => navigate("/admin")}
          style={{ display: "flex", alignItems: "center", gap: "6px", background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "13px", cursor: "pointer", marginBottom: "24px", fontWeight: "700" }}
          onMouseEnter={(e) => e.currentTarget.style.color = "white"}
          onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-muted)"}
        >
          <ChevronLeft size={14} />
          Back to Command Hub
        </button>

        <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <Gamepad2 size={24} color="var(--primary)" />
            <h1 style={{ fontSize: "28px", fontWeight: "900", margin: 0, color: "white" }}>Interactive Games Manager</h1>
          </div>
          <p style={{ color: "var(--text-muted)", marginBottom: "30px", fontSize: "14px" }}>
            Design course channels, review existing question banks, and verify diagnostic configurations.
          </p>
        </motion.div>

        {/* Builder Tab Triggers */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "30px" }}>
          <button
            onClick={() => setActiveTab("game")}
            style={{ flex: 1, padding: "12px", borderRadius: "12px", border: "none", cursor: "pointer", fontWeight: "bold", transition: "all 0.3s", background: activeTab === "game" ? "linear-gradient(135deg, var(--primary), var(--primary-dark))" : "rgba(255,255,255,0.02)", color: "white", fontSize: "13px", border: activeTab === "game" ? "none" : "1px solid rgba(255,255,255,0.05)" }}
          >
            🎮 Games Directory
          </button>
          <button
            onClick={() => setActiveTab("question")}
            style={{ flex: 1, padding: "12px", borderRadius: "12px", border: "none", cursor: "pointer", fontWeight: "bold", transition: "all 0.3s", background: activeTab === "question" ? "linear-gradient(135deg, var(--primary), var(--primary-dark))" : "rgba(255,255,255,0.02)", color: "white", fontSize: "13px", border: activeTab === "question" ? "none" : "1px solid rgba(255,255,255,0.05)" }}
          >
            📝 Dynamic Question Bank
          </button>
        </div>

        {/* Dynamic Builder Panels */}
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -15 }} transition={{ duration: 0.28 }}>
            
            {activeTab === "game" ? (
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "28px" }} className="profile-layout-grid">
                
                {/* Active Games Directory List */}
                <div className="glass-card" style={{ padding: "24px" }}>
                  <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "800", color: "white", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Sparkles size={16} color="var(--primary)" />
                    Active Learning Channels
                  </h3>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {gamesList.map((g) => {
                      const isEditing = editingGameId === (g._id || g.id);
                      return (
                        <div 
                          key={g._id || g.id}
                          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", border: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.01)", borderRadius: "12px" }}
                        >
                          {isEditing ? (
                            <div style={{ display: "flex", gap: "8px", flex: 1, marginRight: "12px" }}>
                              <input 
                                type="text"
                                value={editingGameTitle}
                                onChange={(e) => setEditingGameTitle(e.target.value)}
                                style={{ flex: 1, padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--primary)", background: "var(--bg-main)", color: "white", outline: "none", fontSize: "13px" }}
                              />
                              <button onClick={() => handleUpdateGameTitle(g._id || g.id)} style={{ padding: "8px", background: "#10b981", border: "none", borderRadius: "8px", color: "white", cursor: "pointer" }}>
                                <Check size={14} />
                              </button>
                              <button onClick={() => setEditingGameId(null)} style={{ padding: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "white", cursor: "pointer" }}>
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <div>
                              <h4 style={{ margin: "0 0 4px 0", color: "white", fontWeight: "700", fontSize: "14px" }}>{g.title}</h4>
                              <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "monospace" }}>Questions Bank: {g.questions?.length || 0} items</span>
                            </div>
                          )}

                          {!isEditing && (
                            <div style={{ display: "flex", gap: "6px" }}>
                              <button 
                                onClick={() => { setEditingGameId(g._id || g.id); setEditingGameTitle(g.title); }}
                                style={{ padding: "8px", background: "rgba(99, 102, 241, 0.08)", color: "var(--primary-light)", border: "none", borderRadius: "8px", cursor: "pointer" }}
                                title="Rename Channel"
                              >
                                <Edit size={14} />
                              </button>
                              <button 
                                onClick={() => handleDeleteGame(g._id || g.id)}
                                style={{ padding: "8px", background: "rgba(239, 68, 68, 0.08)", color: "#EF4444", border: "none", borderRadius: "8px", cursor: "pointer" }}
                                title="Delete Channel"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Deploy Form */}
                <form onSubmit={handleAddGameSubmit} className="glass-card" style={{ padding: "24px", height: "fit-content" }}>
                  <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "800", color: "white" }}>
                    ➕ Deploy New Game
                  </h3>
                  
                  <label style={labelStyle}>Game Title / Channel Name</label>
                  <input 
                    required 
                    style={{ ...inputStyle, marginBottom: "20px" }} 
                    placeholder="e.g. Flexbox Layout Master" 
                    value={newGameTitle} 
                    onChange={e => setNewGameTitle(e.target.value)} 
                  />

                  <button 
                    type="submit" 
                    className="action-btn btn-glow" 
                    style={{ padding: "12px", borderRadius: "10px", width: "100%", cursor: "pointer", fontWeight: "bold", fontSize: "13px" }}
                  >
                    Publish Channel Node
                  </button>
                </form>

              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "28px" }} className="profile-layout-grid">
                
                {/* Question bank listing for selected game */}
                <div className="glass-card" style={{ padding: "24px" }}>
                  <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "800", color: "white", display: "flex", alignItems: "center", gap: "8px" }}>
                    <FileText size={16} color="var(--primary)" />
                    Active Questions Bank Explorer
                  </h3>

                  <label style={labelStyle}>Select Active Game Channel</label>
                  <select 
                    value={selectedGameId} 
                    onChange={e => setSelectedGameId(e.target.value)}
                    style={{ ...inputStyle, marginBottom: "20px" }}
                  >
                    <option value="" disabled>-- Select Game Channel --</option>
                    {gamesList.map((g) => (
                      <option key={g._id || g.id} value={g._id || g.id} style={{ background: "#0F172A" }}>{g.title}</option>
                    ))}
                  </select>

                  <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxHeight: "500px", overflowY: "auto", paddingRight: "6px" }}>
                    {selectedGame ? (
                      selectedGame.questions && selectedGame.questions.length > 0 ? (
                        selectedGame.questions.map((q) => {
                          const isEditingQ = editingQuestionId === (q._id || q.id);
                          return (
                            <div 
                              key={q._id || q.id}
                              style={{ padding: "16px", border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.005)", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "10px" }}
                            >
                              {isEditingQ ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                  <label style={{ ...labelStyle, fontSize: "10px" }}>Question Text</label>
                                  <textarea 
                                    value={questionForm.text}
                                    onChange={(e) => setQuestionForm({ ...questionForm, text: e.target.value })}
                                    style={{ ...inputStyle, minHeight: "60px", marginBottom: 0 }}
                                  />
                                  
                                  <label style={{ ...labelStyle, fontSize: "10px" }}>Options (comma separated)</label>
                                  <input 
                                    type="text"
                                    value={questionForm.options}
                                    onChange={(e) => setQuestionForm({ ...questionForm, options: e.target.value })}
                                    style={{ ...inputStyle, marginBottom: 0 }}
                                  />

                                  <label style={{ ...labelStyle, fontSize: "10px" }}>Correct Answer</label>
                                  <input 
                                    type="text"
                                    value={questionForm.correctAnswer}
                                    onChange={(e) => setQuestionForm({ ...questionForm, correctAnswer: e.target.value })}
                                    style={{ ...inputStyle, marginBottom: 0 }}
                                  />

                                  <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                                    <button 
                                      onClick={() => handleSaveQuestionEdit(selectedGameId, q._id || q.id)} 
                                      style={{ padding: "8px 16px", background: "#10b981", border: "none", borderRadius: "8px", color: "white", cursor: "pointer", fontSize: "11px", fontWeight: "bold" }}
                                    >
                                      Save Details
                                    </button>
                                    <button 
                                      onClick={() => setEditingQuestionId(null)} 
                                      style={{ padding: "8px 16px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "white", cursor: "pointer", fontSize: "11px", fontWeight: "bold" }}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                  <div style={{ flex: 1, marginRight: "12px" }}>
                                    <p style={{ margin: "0 0 8px 0", color: "white", fontWeight: "700", fontSize: "13.5px" }}>{q.text}</p>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
                                      {q.options && q.options.map((opt, oIdx) => (
                                        <span key={oIdx} style={{ fontSize: "11px", padding: "3px 8px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", color: "var(--text-muted)", borderRadius: "6px" }}>{opt}</span>
                                      ))}
                                    </div>
                                    <span style={{ fontSize: "11.5px", color: "#10b981", fontWeight: "bold" }}>✓ Correct Answer: {q.correctAnswer}</span>
                                  </div>

                                  <div style={{ display: "flex", gap: "6px" }}>
                                    <button 
                                      onClick={() => startEditingQuestion(q)}
                                      style={{ padding: "7px", background: "rgba(99, 102, 241, 0.08)", color: "var(--primary-light)", border: "none", borderRadius: "6px", cursor: "pointer" }}
                                      title="Edit Question"
                                    >
                                      <Edit size={12} />
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteQuestion(selectedGameId, q._id || q.id)}
                                      style={{ padding: "7px", background: "rgba(239, 68, 68, 0.08)", color: "#EF4444", border: "none", borderRadius: "6px", cursor: "pointer" }}
                                      title="Remove Question"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div style={{ padding: "30px 10px", textAlign: "center", color: "var(--text-muted)" }}>This game channel has no active questions yet.</div>
                      )
                    ) : (
                      <div style={{ padding: "40px 10px", textAlign: "center", color: "var(--text-muted)", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                        <AlertCircle size={24} color="var(--primary)" />
                        Select a game channel from the dropdown above to manage its active question list.
                      </div>
                    )}
                  </div>
                </div>

                {/* Inline Question Injector Form */}
                <div className="glass-card" style={{ padding: "24px", height: "fit-content" }}>
                  <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "800", color: "white" }}>
                    ➕ Inject New Question
                  </h3>
                  
                  <form onSubmit={handleInjectQuestion}>
                    <label style={labelStyle}>Question Content</label>
                    <textarea 
                      required
                      style={{ ...inputStyle, minHeight: "70px", resize: "none" }}
                      placeholder="e.g. Which HTML tag defines a navigation link?"
                      value={newQuestionForm.text}
                      onChange={(e) => setNewQuestionForm({ ...newQuestionForm, text: e.target.value })}
                    />

                    <label style={labelStyle}>Options (Separated by comma)</label>
                    <input 
                      required
                      style={inputStyle}
                      placeholder="e.g. <a>, <nav>, <link>, <href>"
                      value={newQuestionForm.options}
                      onChange={(e) => setNewQuestionForm({ ...newQuestionForm, options: e.target.value })}
                    />

                    <label style={labelStyle}>Correct Answer</label>
                    <input 
                      required
                      style={inputStyle}
                      placeholder="e.g. <a>"
                      value={newQuestionForm.correctAnswer}
                      onChange={(e) => setNewQuestionForm({ ...newQuestionForm, correctAnswer: e.target.value })}
                    />

                    <button 
                      type="submit"
                      disabled={!selectedGameId}
                      className="action-btn btn-glow"
                      style={{ padding: "12px", borderRadius: "10px", width: "100%", cursor: !selectedGameId ? "not-allowed" : "pointer", fontWeight: "bold", fontSize: "13px", opacity: !selectedGameId ? 0.5 : 1 }}
                    >
                      Add Question to Game
                    </button>
                  </form>
                </div>

              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default AdminManageGames;