import { useState, useEffect, Fragment, useCallback } from "react";
import Navbar from "../components/NavBar";
import API from "../services/api";
import { useTheme } from "../useTheme";
import { io } from "socket.io-client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import "./DashBoard.css";

function LogNotesEditor({ log, course, onSave }) {
  const [notes, setNotes] = useState(log.notes || "");
  const [saveStatus, setSaveStatus] = useState("");

  useEffect(() => {
    if (!course || !Array.isArray(course.studyLogs)) return;
    if (notes === (log.notes || "")) return;
    const timer = setTimeout(async () => {
      setSaveStatus("Saving...");
      const updatedLogs = course.studyLogs.map((l, idx) => 
         (l._id === log.originalLogId || (!l._id && `${course._id}-${idx}` === log._id)) 
            ? { ...l, notes } 
            : l
      );
      try {
        await API.put(`/courses/${course._id}`, { studyLogs: updatedLogs });
        onSave(course._id, updatedLogs);
        setSaveStatus("Saved!");
        setTimeout(() => setSaveStatus(""), 2000);
      } catch (e) {
        console.error(e);
        setSaveStatus("Error saving");
      }
    }, 1000); 
    return () => clearTimeout(timer);
  }, [notes, log.notes, log._id, log.originalLogId, course, onSave]);

  return (
    <div style={{ padding: "16px 24px", background: "var(--bg-card)", borderTop: "1px dashed var(--border-color)", borderLeft: "4px solid var(--primary)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <span style={{ fontWeight: "600", fontSize: "14px", color: "var(--text-main)" }}>Session Notes</span>
        <span style={{ fontSize: "12px", color: saveStatus === "Error saving" ? "var(--danger)" : "var(--success)", fontWeight: "bold" }}>{saveStatus}</span>
      </div>
      <textarea 
        value={notes} 
        onChange={(e) => setNotes(e.target.value)} 
        placeholder="Jot down key takeaways from this session..." 
        style={{ 
          width: "100%", 
          minHeight: "120px", 
          padding: "12px", 
          borderRadius: "8px", 
          border: "1px solid var(--border-color)", 
          background: "var(--bg-main)", 
          color: "var(--text-main)", 
          fontSize: "14px", 
          outline: "none", 
          resize: "vertical",
          fontFamily: "inherit" 
        }} 
      />
    </div>
  );
}

export default function StudyLogs() {
  const [courses, setCourses] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter State
  const [filterCourse, setFilterCourse] = useState("All");
  const [filterDate, setFilterDate] = useState("");

  // Analytics State
  const [weeklyData, setWeeklyData] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);
  const [activeTimeData, setActiveTimeData] = useState([]);
  const [completionPrediction, setCompletionPrediction] = useState([]);

  useTheme(); // Initialize theme

  const fetchCoursesAndLogs = async () => {
    try {
      setLoading(true);
      const res = await API.get("/courses");
      const coursesData = Array.isArray(res.data) ? res.data : [];
      console.log("Study logs courses fetched:", coursesData);
      setCourses(coursesData);
      
      const allLogs = [];
      coursesData.forEach(course => {
        if (course.studyLogs && Array.isArray(course.studyLogs)) {
          course.studyLogs.forEach((log, idx) => {
            const d = new Date(log.date);
            allLogs.push({
              _id: log._id || `${course._id}-${idx}`,
              originalLogId: log._id,
              courseId: course._id,
              courseName: course.title,
              date: isNaN(d.getTime()) ? new Date() : d,
              duration: log.duration,
              notes: log.notes || ""
            });
          });
        }
      });
      allLogs.sort((a, b) => b.date - a.date);
      setLogs(allLogs);
    } catch (err) {
      console.error("Error fetching study logs:", err);
      if (err.response?.status !== 401) {
        setCourses([]);
        setLogs([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoursesAndLogs();

    const token = localStorage.getItem("token");
    if (!token) return;

    const socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || "http://localhost:5000", {
      auth: { token }
    });

    socket.on("courseUpdated", () => {
      fetchCoursesAndLogs();
    });

    socket.on("courseAdded", () => {
      fetchCoursesAndLogs();
    });

    socket.on("courseDeleted", () => {
      fetchCoursesAndLogs();
    });

    return () => socket.disconnect();
  }, []);

  const calculateAnalytics = useCallback(() => {
    if (!logs.length) {
      setWeeklyData([]);
      setHeatmapData([]);
      setActiveTimeData([]);
      setCompletionPrediction([]);
      return;
    }

    // Weekly learning graphs
    const weeklyMap = {};
    logs.forEach(log => {
      const weekStart = new Date(log.date);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      weeklyMap[weekKey] = (weeklyMap[weekKey] || 0) + log.duration;
    });
    const weekly = Object.entries(weeklyMap).map(([week, minutes]) => ({
      week: new Date(week).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      minutes: Math.round(minutes),
      hours: Math.round(minutes / 60 * 10) / 10
    })).slice(-8); // Last 8 weeks
    setWeeklyData(weekly);

    // Productivity heatmaps (last 30 days)
    const heatmap = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayLogs = logs.filter(log => log.date.toISOString().split('T')[0] === dateStr);
      const totalMinutes = dayLogs.reduce((sum, log) => sum + log.duration, 0);
      heatmap.push({
        date: dateStr,
        day: date.toLocaleDateString(undefined, { weekday: 'short' }),
        value: totalMinutes
      });
    }
    setHeatmapData(heatmap);

    // Most active study time (by hour)
    const hourMap = {};
    logs.forEach(log => {
      const hour = log.date.getHours();
      hourMap[hour] = (hourMap[hour] || 0) + log.duration;
    });
    const activeTimes = Object.entries(hourMap).map(([hour, minutes]) => ({
      hour: `${hour}:00`,
      minutes: Math.round(minutes),
      label: `${hour}:00 - ${hour + 1}:00`
    })).sort((a, b) => b.minutes - a.minutes).slice(0, 8);
    setActiveTimeData(activeTimes);

    // Course completion prediction (simple trend)
    const courseProgress = {};
    courses.forEach(course => {
      const courseLogs = logs.filter(log => log.courseId === course._id);
      const totalMinutes = courseLogs.reduce((sum, log) => sum + log.duration, 0);
      const weeksStudied = Math.max(1, Math.ceil((Date.now() - Math.min(...courseLogs.map(l => l.date.getTime()))) / (7 * 24 * 60 * 60 * 1000)));
      const weeklyAverage = totalMinutes / weeksStudied;
      const remainingMinutes = Math.max(0, (course.totalDuration || 0) - totalMinutes);
      const weeksToComplete = remainingMinutes / weeklyAverage;
      courseProgress[course.title] = {
        currentProgress: Math.round((totalMinutes / (course.totalDuration || 1)) * 100),
        weeksToComplete: isFinite(weeksToComplete) ? Math.round(weeksToComplete) : 'N/A',
        weeklyAverage: Math.round(weeklyAverage)
      };
    });
    setCompletionPrediction(Object.entries(courseProgress).map(([course, data]) => ({
      course,
      ...data
    })));
  }, [logs, courses]);

  useEffect(() => {
    calculateAnalytics();
  }, [calculateAnalytics]);

  const filteredLogs = logs.filter(log => {
    let matchCourse = filterCourse === "All" || log.courseId === filterCourse;
    let matchDate = !filterDate || (log.date && !isNaN(log.date.getTime()) && log.date.toISOString().split('T')[0] === filterDate);
    return matchCourse && matchDate;
  });

  const [expandedLogId, setExpandedLogId] = useState(null);

  const handleNotesSave = useCallback((courseId, updatedStudyLogs) => {
    // This function provides an optimistic UI update.
    // The socket event will provide the final source of truth from the server.
    setCourses(prevCourses => prevCourses.map(c => c._id === courseId ? { ...c, studyLogs: updatedStudyLogs } : c));
    setLogs(prevLogs => prevLogs.map(l => {
      if (l.courseId === courseId) {
        const updatedLog = updatedStudyLogs.find((ul, idx) => ul._id === l.originalLogId || (!ul._id && `${courseId}-${idx}` === l._id));
        if (updatedLog) return { ...l, notes: updatedLog.notes };
      }
      return l;
    }));
  }, []); // Dependency array is empty as setters from useState are stable.

  const handleDeleteLog = async (logId, courseId, originalLogId) => {
    if (!window.confirm("Are you sure you want to delete this study log? The logged time will be removed from your course total.")) return;
    
    const course = courses.find(c => c._id === courseId);
    if (!course || !Array.isArray(course.studyLogs)) return;
    
    const logToDelete = course.studyLogs.find((l, idx) => l._id === originalLogId || (!l._id && `${courseId}-${idx}` === logId));
    if (!logToDelete) return;
    
    const durationSeconds = (Number(logToDelete.duration) || 0) * 60;
    const newTimeSpent = Math.max(0, (course.timeSpent || 0) - durationSeconds);
    const updatedLogs = course.studyLogs.filter((l, idx) => !(l._id === originalLogId || (!l._id && `${courseId}-${idx}` === logId)));
    
    try {
      await API.put(`/courses/${courseId}`, {
        timeSpent: newTimeSpent,
        studyLogs: updatedLogs
      });
      
      fetchCoursesAndLogs();
    } catch (err) {
      console.error(err);
      alert("Failed to delete study log.");
    }
  };

  return (
    <div className="dashboard-page-wrapper" style={{ color: "var(--text-main)" }}>
      {/* Add styles to handle ReactQuill's default theme in dark mode */}
      <style>{`
        .action-btn { transition: all 0.2s ease; }
        .action-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 8px rgba(0,0,0,0.15); }
        .action-btn:active:not(:disabled) { transform: translateY(0); }
        @media (max-width: 768px) {
          .logs-container { padding: 20px 15px !important; }
          .log-form-inputs { flex-direction: column !important; align-items: stretch !important; }
          .log-form-inputs > div { width: 100%; flex: none !important; }
        }
        .analytics-card {
          animation: fadeInUp 0.6s ease-out forwards;
          opacity: 0;
          transform: translateY(20px);
          min-width: 0;
        }
        .analytics-card:nth-child(1) { animation-delay: 0.1s; }
        .analytics-card:nth-child(2) { animation-delay: 0.2s; }
        .analytics-card:nth-child(3) { animation-delay: 0.3s; }
        .analytics-card:nth-child(4) { animation-delay: 0.4s; }
        @keyframes fadeInUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .chart-container {
          transition: all 0.3s ease;
          width: 100%;
          min-width: 0;
          min-height: 240px;
        }
        .heatmap-wrap {
          width: 100%;
          max-width: 100%;
          overflow-x: auto;
          padding-bottom: 6px;
        }
        .heatmap-grid {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          gap: 4px;
          width: 100%;
        }
        .heatmap-cell {
          min-width: 0;
        }
        .analytics-card h3 {
          word-break: break-word;
        }
        @media (max-width: 768px) {
          .analytics-card { padding: 18px; }
          .chart-container { min-height: 260px; }
          .heatmap-grid { gap: 3px; }
          .analytics-card h3 { font-size: 16px; }
        }
        .chart-container:hover {
          transform: scale(1.02);
        }
        .heatmap-cell {
          transition: all 0.2s ease;
        }
        .heatmap-cell:hover {
          transform: scale(1.1);
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        .progress-bar {
          transition: width 0.8s ease-out;
        }
      `}</style>
      <Navbar />
      <div className="logs-container" style={{ padding: "40px 20px", maxWidth: "1000px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "32px", fontWeight: "700", marginBottom: "20px" }}>Study Logs</h1>
        <p style={{ fontSize: "16px", color: "var(--text-muted)", marginBottom: "30px" }}>
          View your automatically tracked study sessions and history.
        </p>

        {/* ANALYTICS DASHBOARD */}
        <h2 style={{ margin: "0 0 20px 0", fontSize: "24px", fontWeight: "700" }}>📊 Smart Analytics Dashboard</h2>
          
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px", marginBottom: "30px" }}>
            
            {/* Weekly Learning Graphs */}
            <div className="analytics-card" style={{ background: "var(--bg-card)", padding: "24px", borderRadius: "16px", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-md)", minWidth: 0 }}>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: "600" }}>📈 Weekly Learning Progress</h3>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis dataKey="week" stroke="var(--text-muted)" fontSize={12} />
                    <YAxis stroke="var(--text-muted)" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', backdropFilter: 'blur(8px)', borderColor: 'rgba(255,255,255,0.1)', color: '#FFFFFF', borderRadius: '12px' }}
                      labelStyle={{ color: "var(--text-main)" }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="hours" 
                      stroke="var(--primary)" 
                      strokeWidth={3}
                      dot={{ fill: "var(--primary)", strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: "var(--primary)", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Productivity Heatmap */}
            <div className="analytics-card" style={{ background: "var(--bg-card)", padding: "24px", borderRadius: "16px", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-md)" }}>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: "600" }}>🔥 Productivity Heatmap (Last 30 Days)</h3>
              <div className="heatmap-wrap" style={{ width: "100%", maxWidth: "100%", overflowX: "auto" }}>
                <div className="heatmap-grid" style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: "4px", width: "100%" }}>
                  {heatmapData.map((day) => {
                    const intensity = Math.min(day.value / 120, 1); // Max 2 hours = full intensity
                  return (
                    <div
                      key={day.date}
                      className="heatmap-cell"
                      style={{
                        width: "100%",
                        aspectRatio: "1",
                        backgroundColor: `rgba(59, 130, 246, ${intensity})`,
                        borderRadius: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "10px",
                        color: intensity > 0.5 ? "white" : "var(--text-muted)",
                        fontWeight: "bold",
                        cursor: "pointer"
                      }}
                      title={`${day.day} ${new Date(day.date).toLocaleDateString()}: ${Math.round(day.value)} minutes`}
                    >
                      {day.day.charAt(0)}
                    </div>
                  );
                })}
              </div>
            </div>
              <div style={{ marginTop: "12px", fontSize: "12px", color: "var(--text-muted)" }}>
                Less <span style={{ color: "rgba(59, 130, 246, 0.2)" }}>■</span> 
                <span style={{ color: "rgba(59, 130, 246, 0.5)" }}>■</span> 
                <span style={{ color: "rgba(59, 130, 246, 0.8)" }}>■</span> More
              </div>
            </div>

            {/* Most Active Study Time */}
            <div className="analytics-card" style={{ background: "var(--bg-card)", padding: "24px", borderRadius: "16px", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-md)" }}>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: "600" }}>⏰ Most Active Study Times</h3>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={activeTimeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis dataKey="hour" stroke="var(--text-muted)" fontSize={12} />
                    <YAxis stroke="var(--text-muted)" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', backdropFilter: 'blur(8px)', borderColor: 'rgba(255,255,255,0.1)', color: '#FFFFFF', borderRadius: '12px' }}
                      labelStyle={{ color: "var(--text-main)" }}
                    />
                    <Bar dataKey="minutes" fill="var(--success)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Course Completion Prediction */}
            <div className="analytics-card" style={{ background: "var(--bg-card)", padding: "24px", borderRadius: "16px", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-md)" }}>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: "600" }}>🎯 Course Completion Prediction</h3>
              <div style={{ maxHeight: "250px", overflowY: "auto" }}>
                {completionPrediction.map((course) => (
                  <div key={course.course} style={{ marginBottom: "16px", padding: "12px", background: "var(--bg-main)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <span style={{ fontWeight: "600", fontSize: "14px" }}>{course.course}</span>
                      <span style={{ fontSize: "12px", color: "var(--primary)", fontWeight: "bold" }}>{course.currentProgress}% Complete</span>
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                      Weekly Average: {course.weeklyAverage} min<br/>
                      Estimated Completion: {course.weeksToComplete} weeks
                    </div>
                    <div style={{ width: "100%", height: "8px", background: "var(--border-color)", borderRadius: "4px", marginTop: "8px", overflow: "hidden" }}>
                      <div className="progress-bar" style={{ width: `${course.currentProgress}%`, height: "100%", background: "var(--primary)", borderRadius: "4px" }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
        </div>

        {/* LOGS TABLE AND FILTERS */}
        <div style={{ background: "var(--bg-card)", padding: "24px", borderRadius: "16px", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-md)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "15px" }}>
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "700" }}>Study History</h2>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <select value={filterCourse} onChange={(e) => setFilterCourse(e.target.value)} style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-main)", color: "var(--text-main)", fontSize: "14px", outline: "none" }}>
                <option value="All">All Courses</option>
                {courses.map(course => <option key={course._id} value={course._id}>{course.title}</option>)}
              </select>
              <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-main)", color: "var(--text-main)", fontSize: "14px", outline: "none" }} />
              {filterDate && <button className="action-btn" onClick={() => setFilterDate("")} style={{ padding: "8px 12px", backgroundColor: "transparent", color: "var(--danger)", border: "1px solid var(--danger)", borderRadius: "6px", cursor: "pointer", fontSize: "14px" }}>Clear Date</button>}
            </div>
          </div>
          
          {loading ? (
            <p style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Loading study history...</p>
          ) : filteredLogs.length > 0 ? (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead><tr style={{ borderBottom: "2px solid var(--border-color)", backgroundColor: "var(--bg-main)" }}><th style={{ padding: "12px", fontWeight: "bold" }}>Date</th><th style={{ padding: "12px", fontWeight: "bold" }}>Course</th><th style={{ padding: "12px", fontWeight: "bold" }}>Duration</th><th style={{ padding: "12px", fontWeight: "bold", textAlign: "right" }}>Actions</th></tr></thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <Fragment key={log._id}>
                      <tr style={{ borderBottom: expandedLogId === log._id ? "none" : "1px solid var(--border-color)", backgroundColor: expandedLogId === log._id ? "var(--bg-main)" : "transparent" }}>
                        <td style={{ padding: "12px", color: "var(--text-muted)" }}>{log.date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                        <td style={{ padding: "12px", fontWeight: "500" }}>{log.courseName}</td>
                        <td style={{ padding: "12px", color: "var(--primary)", fontWeight: "bold" }}>{log.duration >= 60 ? `${Math.floor(log.duration / 60)}h ${log.duration % 60}m` : `${log.duration}m`}</td>
                        <td style={{ padding: "12px", textAlign: "right" }}>
                          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                            <button 
                              className="action-btn"
                              onClick={() => setExpandedLogId(expandedLogId === log._id ? null : log._id)}
                              style={{ padding: "6px 12px", background: expandedLogId === log._id ? "var(--border-color)" : "var(--primary-light)", color: expandedLogId === log._id ? "var(--text-main)" : "var(--primary-dark)", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "bold" }}
                            >
                              {expandedLogId === log._id ? "Close" : (log.notes ? "📝 Edit Notes" : "➕ Add Notes")}
                            </button>
                            <button className="action-btn"
                              onClick={() => handleDeleteLog(log._id, log.courseId, log.originalLogId)}
                              style={{ padding: "6px 12px", background: "transparent", color: "var(--danger)", border: "1px solid var(--danger)", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "bold", transition: "all 0.2s ease", display: "flex", alignItems: "center", justifyContent: "center" }}
                              title="Delete Log"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedLogId === log._id && courses.find(c => c._id === log.courseId) && (
                        <tr style={{ borderBottom: "1px solid var(--border-color)", backgroundColor: "var(--bg-main)" }}>
                          <td colSpan="4" style={{ padding: 0 }}>
                            <LogNotesEditor log={log} course={courses.find(c => c._id === log.courseId)} onSave={handleNotesSave} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)", backgroundColor: "var(--bg-main)", borderRadius: "8px" }}><p style={{ margin: 0 }}>No study sessions found matching the filters.</p></div>
          )}
        </div>
      </div>
    </div>
  );
}
