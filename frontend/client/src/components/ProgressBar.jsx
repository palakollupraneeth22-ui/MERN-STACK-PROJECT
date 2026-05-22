import { motion } from "framer-motion";

function ProgressBar({ progress }) {
  // Ensure progress is visually capped between 0 and 100
  const clampedProgress = Math.min(100, Math.max(0, progress || 0));

  return (
    <div
      role="progressbar"
      aria-valuenow={clampedProgress}
      aria-valuemin="0"
      aria-valuemax="100"
      style={{
        width: "100%",
        background: "var(--bg-main)",
        border: "1px solid var(--border-color)",
        borderRadius: "8px",
        overflow: "hidden",
        boxShadow: "inset 0 1px 3px rgba(0,0,0,0.1)"
      }}
    >
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${clampedProgress}%` }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        style={{
          background: clampedProgress === 100 
            ? "linear-gradient(90deg, #34d399, #10b981)" 
            : "linear-gradient(90deg, #60A5FA, #3B82F6)",
          boxShadow: clampedProgress === 100 ? "0 0 10px rgba(16, 185, 129, 0.4)" : "0 0 10px rgba(59, 130, 246, 0.4)",
          color: "var(--btn-text)",
          padding: "6px",
          borderRadius: "8px",
          textAlign: "center",
          fontSize: "14px",
          fontWeight: "800",
          textShadow: "0 1px 2px rgba(0,0,0,0.2)",
          minWidth: "40px", // Ensure the text is always visible
          whiteSpace: "nowrap"
        }}
      >
        {clampedProgress}%
      </motion.div>
    </div>
  );
}

export default ProgressBar;
