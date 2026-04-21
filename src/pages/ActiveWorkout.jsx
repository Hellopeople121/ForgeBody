import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Play,
  Pause,
  SkipForward,
  Check,
  Flame,
  Clock,
  ChevronRight,
} from "lucide-react";

export default function ActiveWorkout() {
  const navigate = useNavigate();
  const [workoutData, setWorkoutData] = useState(null);
  const [phase, setPhase] = useState("warmup"); // "warmup" | "workout" | "done"
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timer, setTimer] = useState(0);
  const [running, setRunning] = useState(false);
  const [completedSets, setCompletedSets] = useState({});
  const intervalRef = useRef(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("activeWorkout");
    if (!stored) {
      navigate("/plan");
      return;
    }
    const data = JSON.parse(stored);
    setWorkoutData(data);
    // If no warmup, skip to workout
    if (!data.warmup?.length) setPhase("workout");
  }, [navigate]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  if (!workoutData) return null;

  const warmups = workoutData.warmup || [];
  const exercises = workoutData.exercises || [];
  const currentList = phase === "warmup" ? warmups : exercises;
  const current = currentList[currentIndex];
  const isLast = currentIndex >= currentList.length - 1;

  const formatTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const handleNext = () => {
    if (isLast) {
      if (phase === "warmup") {
        setPhase("workout");
        setCurrentIndex(0);
        setTimer(0);
        setRunning(false);
      } else {
        setPhase("done");
        setRunning(false);
      }
    } else {
      setCurrentIndex((i) => i + 1);
      setTimer(0);
      setRunning(false);
    }
  };

  const toggleSet = (exIdx, setIdx) => {
    const key = `${exIdx}-${setIdx}`;
    setCompletedSets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const phaseColor = phase === "warmup" ? "#818cf8" : "#f97316";
  const phaseBg =
    phase === "warmup" ? "rgba(99,102,241,0.15)" : "rgba(249,115,22,0.15)";

  // ── Done screen ─────────────────────────────────────────────────────────
  if (phase === "done")
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #0a0a0a 0%, #111827 100%)",
          fontFamily: "'Segoe UI', system-ui, sans-serif",
          color: "#f1f5f9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ textAlign: "center", maxWidth: "420px" }}
        >
          <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🎉</div>
          <h1
            style={{
              fontSize: "2.5rem",
              fontWeight: "900",
              background: "linear-gradient(90deg, #f97316, #ef4444)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              margin: "0 0 0.5rem",
            }}
          >
            Workout Done!
          </h1>
          <p style={{ color: "#94a3b8", marginBottom: "2rem" }}>
            You crushed it. Total time:{" "}
            <strong style={{ color: "#f97316" }}>{formatTime(timer)}</strong>
          </p>
          <div style={{ display: "grid", gap: "0.75rem" }}>
            <button
              onClick={() => navigate("/plan")}
              style={{
                padding: "1rem",
                background: "linear-gradient(90deg, #f97316, #ef4444)",
                border: "none",
                borderRadius: "0.875rem",
                color: "#fff",
                fontWeight: "700",
                fontSize: "1rem",
                cursor: "pointer",
              }}
            >
              Back to Plan
            </button>
            <button
              onClick={() => {
                setPhase("warmup");
                setCurrentIndex(0);
                setTimer(0);
                setRunning(false);
                setCompletedSets({});
                if (!warmups.length) setPhase("workout");
              }}
              style={{
                padding: "0.875rem",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "0.875rem",
                color: "#94a3b8",
                cursor: "pointer",
                fontSize: "0.9rem",
              }}
            >
              Repeat Workout
            </button>
          </div>
        </motion.div>
      </div>
    );

  const sets = parseInt(current?.sets) || 3;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a0a0a 0%, #111827 100%)",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        color: "#f1f5f9",
      }}
    >
      {/* Header */}
      <div
        style={{
          background:
            phase === "warmup"
              ? "rgba(99,102,241,0.15)"
              : "linear-gradient(135deg, rgba(249,115,22,0.2), rgba(239,68,68,0.15))",
          borderBottom: `1px solid ${phase === "warmup" ? "rgba(99,102,241,0.2)" : "rgba(249,115,22,0.2)"}`,
          padding: "1.25rem 1.5rem",
        }}
      >
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "1rem",
            }}
          >
            <button
              onClick={() => navigate("/plan")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.5rem 1rem",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "2rem",
                color: "#f1f5f9",
                cursor: "pointer",
                fontSize: "0.85rem",
              }}
            >
              <ArrowLeft style={{ width: "14px", height: "14px" }} /> Exit
            </button>
            <span
              style={{
                padding: "0.3rem 0.875rem",
                borderRadius: "2rem",
                background: phaseBg,
                color: phaseColor,
                fontSize: "0.8rem",
                fontWeight: "700",
                border: `1px solid ${phaseColor}40`,
              }}
            >
              {phase === "warmup" ? "🔥 Warm Up" : "💪 Workout"}
            </span>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                color: "#94a3b8",
                fontSize: "0.875rem",
              }}
            >
              <Clock style={{ width: "14px", height: "14px" }} />
              {formatTime(timer)}
            </div>
          </div>

          {/* Day title */}
          <h2
            style={{
              margin: "0 0 0.75rem",
              fontSize: "1.1rem",
              color: "#f1f5f9",
              fontWeight: "700",
            }}
          >
            {workoutData.day}
          </h2>

          {/* Progress bar */}
          <div style={{ display: "flex", gap: "0.25rem" }}>
            {currentList.map((_, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: "4px",
                  borderRadius: "2px",
                  background:
                    i < currentIndex
                      ? phaseColor
                      : i === currentIndex
                        ? `${phaseColor}80`
                        : "rgba(255,255,255,0.1)",
                  transition: "background 0.3s",
                }}
              />
            ))}
          </div>
          <p
            style={{
              margin: "0.4rem 0 0",
              fontSize: "0.75rem",
              color: "#64748b",
            }}
          >
            {currentIndex + 1} / {currentList.length}
          </p>
        </div>
      </div>

      {/* Main content */}
      <div
        style={{ maxWidth: "600px", margin: "0 auto", padding: "2rem 1.5rem" }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={`${phase}-${currentIndex}`}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
          >
            {/* Exercise name */}
            <div style={{ textAlign: "center", marginBottom: "2rem" }}>
              <p
                style={{
                  margin: "0 0 0.5rem",
                  fontSize: "0.8rem",
                  fontWeight: "700",
                  color: phaseColor,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                {phase === "warmup" ? "Warm Up Exercise" : "Exercise"}
              </p>
              <h1
                style={{
                  margin: 0,
                  fontSize: "clamp(1.75rem, 5vw, 2.5rem)",
                  fontWeight: "900",
                  lineHeight: 1.1,
                }}
              >
                {current?.name}
              </h1>
              {current?.instruction && (
                <p
                  style={{
                    margin: "0.75rem 0 0",
                    color: "#94a3b8",
                    fontSize: "0.9rem",
                  }}
                >
                  {current.instruction}
                </p>
              )}
              {current?.note && (
                <p
                  style={{
                    margin: "0.5rem 0 0",
                    color: "#64748b",
                    fontSize: "0.85rem",
                    fontStyle: "italic",
                  }}
                >
                  {current.note}
                </p>
              )}
            </div>

            {/* Timer */}
            <div style={{ textAlign: "center", marginBottom: "2rem" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "130px",
                  height: "130px",
                  borderRadius: "50%",
                  background: phaseBg,
                  border: `3px solid ${phaseColor}40`,
                  marginBottom: "1rem",
                }}
              >
                <span
                  style={{
                    fontSize: "2.5rem",
                    fontWeight: "900",
                    color: phaseColor,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {formatTime(timer)}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "0.75rem",
                  justifyContent: "center",
                }}
              >
                <button
                  onClick={() => setRunning((r) => !r)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.75rem 1.5rem",
                    background: running ? "rgba(239,68,68,0.15)" : phaseBg,
                    border: `1px solid ${running ? "rgba(239,68,68,0.4)" : phaseColor + "40"}`,
                    borderRadius: "2rem",
                    color: running ? "#f87171" : phaseColor,
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "0.9rem",
                  }}
                >
                  {running ? (
                    <>
                      <Pause style={{ width: "16px", height: "16px" }} />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play style={{ width: "16px", height: "16px" }} />
                      Start Timer
                    </>
                  )}
                </button>
                <button
                  onClick={() => setTimer(0)}
                  style={{
                    padding: "0.75rem 1rem",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "2rem",
                    color: "#64748b",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                  }}
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Details */}
            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                justifyContent: "center",
                marginBottom: "2rem",
                flexWrap: "wrap",
              }}
            >
              {current?.sets && (
                <div
                  style={{
                    padding: "0.5rem 1rem",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "0.75rem",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.7rem",
                      color: "#64748b",
                      marginBottom: "0.2rem",
                    }}
                  >
                    SETS
                  </div>
                  <div style={{ fontWeight: "700", color: "#f1f5f9" }}>
                    {current.sets}
                  </div>
                </div>
              )}
              {current?.reps && (
                <div
                  style={{
                    padding: "0.5rem 1rem",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "0.75rem",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.7rem",
                      color: "#64748b",
                      marginBottom: "0.2rem",
                    }}
                  >
                    REPS
                  </div>
                  <div style={{ fontWeight: "700", color: "#f1f5f9" }}>
                    {current.reps}
                  </div>
                </div>
              )}
              {current?.duration && (
                <div
                  style={{
                    padding: "0.5rem 1rem",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "0.75rem",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.7rem",
                      color: "#64748b",
                      marginBottom: "0.2rem",
                    }}
                  >
                    DURATION
                  </div>
                  <div style={{ fontWeight: "700", color: "#f1f5f9" }}>
                    {current.duration}
                  </div>
                </div>
              )}
            </div>

            {/* Set tracker (workout phase only) */}
            {phase === "workout" && current?.sets && (
              <div style={{ marginBottom: "2rem" }}>
                <p
                  style={{
                    margin: "0 0 0.75rem",
                    fontSize: "0.8rem",
                    color: "#64748b",
                    textAlign: "center",
                  }}
                >
                  Tap each set as you complete it
                </p>
                <div
                  style={{
                    display: "flex",
                    gap: "0.625rem",
                    justifyContent: "center",
                    flexWrap: "wrap",
                  }}
                >
                  {Array.from({ length: sets }).map((_, si) => {
                    const done = completedSets[`${currentIndex}-${si}`];
                    return (
                      <button
                        key={si}
                        onClick={() => toggleSet(currentIndex, si)}
                        style={{
                          width: "52px",
                          height: "52px",
                          borderRadius: "50%",
                          border: `2px solid ${done ? "#f97316" : "rgba(255,255,255,0.15)"}`,
                          background: done
                            ? "rgba(249,115,22,0.2)"
                            : "transparent",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.2s",
                        }}
                      >
                        {done ? (
                          <Check
                            style={{
                              width: "20px",
                              height: "20px",
                              color: "#f97316",
                            }}
                          />
                        ) : (
                          <span style={{ color: "#64748b", fontWeight: "700" }}>
                            {si + 1}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Next button */}
            <button
              onClick={handleNext}
              style={{
                width: "100%",
                padding: "1rem",
                background: "linear-gradient(90deg, #f97316, #ef4444)",
                border: "none",
                borderRadius: "0.875rem",
                color: "#fff",
                fontWeight: "700",
                fontSize: "1.05rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
              }}
            >
              {isLast && phase === "workout" ? (
                "🎉 Finish Workout"
              ) : isLast && phase === "warmup" ? (
                "💪 Start Workout!"
              ) : (
                <>
                  <SkipForward style={{ width: "16px", height: "16px" }} />
                  Next Exercise
                </>
              )}
            </button>

            {/* Exercise list preview */}
            <div style={{ marginTop: "1.5rem" }}>
              <p
                style={{
                  margin: "0 0 0.625rem",
                  fontSize: "0.75rem",
                  color: "#64748b",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                {phase === "warmup" ? "Warm Up" : "Workout"} — Up Next
              </p>
              <div style={{ display: "grid", gap: "0.35rem" }}>
                {currentList
                  .slice(currentIndex + 1, currentIndex + 4)
                  .map((ex, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.5rem 0.75rem",
                        background: "rgba(255,255,255,0.02)",
                        borderRadius: "0.5rem",
                      }}
                    >
                      <ChevronRight
                        style={{
                          width: "12px",
                          height: "12px",
                          color: "#374151",
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ fontSize: "0.82rem", color: "#64748b" }}>
                        {ex.name}
                      </span>
                      {ex.sets && ex.reps && (
                        <span
                          style={{
                            marginLeft: "auto",
                            fontSize: "0.72rem",
                            color: "#374151",
                          }}
                        >
                          {ex.sets}×{ex.reps}
                        </span>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
