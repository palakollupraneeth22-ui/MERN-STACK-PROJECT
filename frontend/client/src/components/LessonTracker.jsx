import { useState } from "react";

export default function LessonTracker({ courseId, courseTitle, modules, isUpdating, onLessonToggle, onPlayVideo }) {
  const [lessonQuizzes, setLessonQuizzes] = useState({});
  const [moduleQuizzes, setModuleQuizzes] = useState({});
  const [expandedQuiz, setExpandedQuiz] = useState(null);

  if (!modules || modules.length === 0) return null;

  const normalizeText = (text) => (text || "this topic").trim();

  const createAIQuiz = ({ promptType, lessonTitle, moduleTitle, lessonCount }) => {
    const titleText = normalizeText(lessonTitle || moduleTitle || courseTitle);
    const moduleText = normalizeText(moduleTitle);
    const courseText = normalizeText(courseTitle);
    const baseContext = moduleTitle ? `${courseText} / ${moduleText}` : courseText;

    if (promptType === "lesson") {
      return [
        {
          question: `What is the most likely primary focus of the lesson titled "${titleText}"?`,
          options: [
            `A short introduction to ${titleText}`,
            `A deep dive into ${titleText}`,
            `An unrelated topic outside ${baseContext}`,
            `A recap of general learning habits`
          ],
          answer: `A deep dive into ${titleText}`
        },
        {
          question: `Which of the following is most likely covered in the lesson "${titleText}"?`,
          options: [
            `Key concepts and practical steps`,`A fictional story about learning`,`A discussion of unrelated tools`,`A summary of course grading policies`
          ],
          answer: `Key concepts and practical steps`
        },
        {
          question: `True or false: The lesson "${titleText}" is designed to help reinforce understanding of ${baseContext}.`,
          options: ["True", "False"],
          answer: "True"
        }
      ];
    }

    const moduleLessons = Array.isArray(lessonCount) ? lessonCount : [];
    return [
      {
        question: `What is the main goal of the completed module "${moduleText}"?`,
        options: [
          `To review the lessons in ${moduleText}`,
          `To introduce a new unrelated subject`,`To provide a sequence of connected lessons`,`To test platform account setup`
        ],
        answer: `To provide a sequence of connected lessons`
      },
      {
        question: `Which statement best describes the module "${moduleText}"?`,
        options: [
          `It groups lessons that build on the same skill`,`It is a single independent lesson`,`It is only about course administration`,`It is an unrelated side topic`
        ],
        answer: `It groups lessons that build on the same skill`
      },
      {
        question: `Which lesson is most likely part of this module?`,
        options: [
          `${moduleLessons[0] || "Lesson 1"}`, `${moduleLessons[1] || "Lesson 2"}`, `Random unrelated title`, `A course introduction lesson`],
        answer: `${moduleLessons[0] || "Lesson 1"}`
      },
      {
        question: `True or false: Completing module "${moduleText}" indicates you have finished all lessons inside that module.`,
        options: ["True", "False"],
        answer: "True"
      }
    ];
  };

  const generateLessonQuiz = (moduleIndex, lessonIndex, lesson, modTitle) => {
    const key = `${moduleIndex}-${lessonIndex}`;
    const quiz = createAIQuiz({ promptType: "lesson", lessonTitle: lesson.title, moduleTitle: modTitle });
    setLessonQuizzes((prev) => ({ ...prev, [key]: quiz }));
    setExpandedQuiz({ type: "lesson", key });
  };

  const generateModuleQuiz = (moduleIndex, mod) => {
    const key = `module-${moduleIndex}`;
    const lessonTitles = mod.lessons ? mod.lessons.slice(0, 3).map((l) => l.title) : [];
    const quiz = createAIQuiz({ promptType: "module", moduleTitle: mod.title, lessonCount: lessonTitles });
    setModuleQuizzes((prev) => ({ ...prev, [key]: quiz }));
    setExpandedQuiz({ type: "module", key });
  };

  const renderQuiz = (quiz, label) => {
    if (!quiz || quiz.length === 0) return null;
    return (
      <div style={{ marginTop: "12px", padding: "16px", borderRadius: "12px", background: "#1E293B", border: "1px solid rgba(255,255,255,0.08)" }}>
        <h4 style={{ margin: "0 0 10px 0", fontSize: "16px", fontWeight: "700", color: "#FFFFFF" }}>{label}</h4>
        {quiz.map((item, idx) => (
          <div key={idx} style={{ marginBottom: idx === quiz.length - 1 ? 0 : "14px" }}>
            <p style={{ margin: 0, fontSize: "15px", fontWeight: "600", color: "#F5F7FA" }}>Q{idx + 1}. {item.question}</p>
            {item.options && (
              <ul style={{ margin: "8px 0 0 18px", padding: 0, listStyleType: "disc", color: "#D1D5DB", fontSize: "14px" }}>
                {item.options.map((option, optionIdx) => (
                  <li key={optionIdx} style={{ marginBottom: "4px" }}>{option}</li>
                ))}
              </ul>
            )}
            <p style={{ margin: "8px 0 0 0", fontSize: "14px", color: "#10B981", fontWeight: "700" }}>Answer: {item.answer}</p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
      {modules.map((mod, mIndex) => {
        let totalModDuration = 0;
        let compModDuration = 0;
        let totalModLessons = 0;
        let compModLessons = 0;
        if (mod.lessons) {
          mod.lessons.forEach(l => {
            totalModLessons++;
            const dur = Number(l.duration) || 0;
            totalModDuration += dur;
            if (l.completed) {
              compModLessons++;
              compModDuration += dur;
            }
          });
        }
        
        const modProgress = totalModDuration > 0 
          ? Math.round((compModDuration / totalModDuration) * 100) 
          : totalModLessons > 0 
            ? Math.round((compModLessons / totalModLessons) * 100) 
            : 0;
            
        return (
        <div key={mIndex} style={{ background: "#0F172A", padding: "18px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h5 style={{ margin: 0, color: "#FFFFFF", fontSize: "16px", fontWeight: "700", paddingRight: "10px" }}>{mod.title}</h5>
              {modProgress === 100 && (
                <button
                  type="button"
                  onClick={() => generateModuleQuiz(mIndex, mod)}
                  style={{
                    padding: "6px 12px",
                    background: "rgba(59, 130, 246, 0.15)",
                    color: "#60A5FA",
                    border: "1px solid rgba(59, 130, 246, 0.3)",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: "600"
                  }}
                >
                  🧠 Generate module quiz
                </button>
              )}
            </div>
            {totalModLessons > 0 && (
              <span style={{ fontSize: "13px", fontWeight: "700", color: modProgress === 100 ? "#10B981" : "#60A5FA", background: modProgress === 100 ? "rgba(16, 185, 129, 0.15)" : "rgba(59, 130, 246, 0.15)", padding: "4px 10px", borderRadius: "12px", border: `1px solid ${modProgress === 100 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(59, 130, 246, 0.3)'}` }}>
                {compModLessons}/{totalModLessons} Lessons ({modProgress}%)
              </span>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {mod.lessons.map((lesson, lIndex) => {
              const quizKey = `${mIndex}-${lIndex}`;
              const lessonQuiz = lessonQuizzes[quizKey];
              return (
                <div key={`lesson-container-${lIndex}`}>
                  <div 
                    key={lIndex} 
                    onClick={() => {
                      if (lesson.videoUrl && !isUpdating) {
                        onPlayVideo({ url: lesson.videoUrl, mIndex, lIndex });
                      }
                    }}
                    title={lesson.videoUrl ? "Click to watch video" : "No video available"}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", padding: "14px", borderRadius: "8px", background: lesson.completed ? "rgba(16, 185, 129, 0.05)" : "#1E293B", border: lesson.completed ? "1px solid rgba(16, 185, 129, 0.2)" : "1px solid rgba(255,255,255,0.08)", transition: "all 0.2s ease", cursor: lesson.videoUrl && !isUpdating ? "pointer" : "default" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
                      <input 
                        type="checkbox" 
                        id={`lesson-${courseId}-${mIndex}-${lIndex}`}
                        checked={lesson.completed || false} 
                        onChange={() => {
                          if (lesson.videoUrl) {
                            if (!lesson.completed) {
                              alert("Please watch the complete video to mark this lesson as complete.");
                            }
                            return;
                          }
                          if (!isUpdating) onLessonToggle(mIndex, lIndex);
                        }} 
                        disabled={isUpdating} 
                        style={{ cursor: (isUpdating || lesson.videoUrl) ? "not-allowed" : "pointer", width: "18px", height: "18px", accentColor: "#3B82F6" }} 
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div
                        style={{
                          color: lesson.completed ? "#9CA3AF" : "#FFFFFF",
                          textDecoration: lesson.completed ? "line-through" : "none",
                          fontSize: "15px",
                          fontWeight: "600",
                          cursor: lesson.videoUrl && !isUpdating ? "pointer" : "default",
                          padding: "0",
                          transition: "color 0.2s ease",
                          textAlign: "left",
                        }}
                      >
                        {lesson.videoUrl && !lesson.completed && (
                          <span style={{ marginRight: "8px", color: "#3B82F6" }}>▶</span>
                        )}
                        {lesson.title} <span style={{ fontSize: "13px", color: "#D1D5DB", fontWeight: "500", marginLeft: "6px" }}>({lesson.duration}m)</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-end" }}>
                      {lesson.videoUrl && !lesson.completed && (
                        <span style={{ fontSize: "12px", color: "#FFFFFF", fontWeight: "600", background: "#3B82F6", padding: "6px 12px", borderRadius: "6px", whiteSpace: "nowrap", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
                          Click to watch
                        </span>
                      )}
                      {lesson.completed && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            generateLessonQuiz(mIndex, lIndex, lesson, mod.title);
                          }}
                          style={{
                            padding: "6px 12px",
                            background: "rgba(255,255,255,0.05)",
                            color: "#FFFFFF",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontSize: "12px",
                            fontWeight: "600"
                          }}
                        >
                          🧠 Lesson quiz
                        </button>
                      )}
                    </div>
                  </div>
                  {lessonQuiz && expandedQuiz?.type === "lesson" && expandedQuiz.key === quizKey && renderQuiz(lessonQuiz, `Quiz for lesson: ${lesson.title}`)}
                </div>
              );
            })}
          </div>
          {moduleQuizzes[`module-${mIndex}`] && expandedQuiz?.type === "module" && expandedQuiz.key === `module-${mIndex}` && renderQuiz(moduleQuizzes[`module-${mIndex}`], `Quiz for module: ${mod.title}`)}
        </div>
      )})}
    </div>
  );
}
