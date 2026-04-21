import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Dumbbell,
  RotateCcw,
  Flame,
  ChevronDown,
  ChevronUp,
  Play,
  Repeat,
  Zap,
  Clock,
  Plus,
  Loader2,
  Check,
  ShoppingBag,
  Apple,
  Pill,
} from "lucide-react";

// ── Storage ──────────────────────────────────────────────────────────────────
const PLAN_KEY = "forgebody_plan";
const SUPP_KEY = "forgebody_confirmed_supplements";
const PROGRESS_KEY = "forgebody_progress";

function loadPlanData() {
  try {
    return JSON.parse(localStorage.getItem(PLAN_KEY));
  } catch {
    return null;
  }
}
function saveProgress(entry) {
  try {
    const existing = JSON.parse(localStorage.getItem(PROGRESS_KEY)) || [];
    existing.unshift(entry);
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(existing.slice(0, 50)));
  } catch {}
}

// ── API helper ───────────────────────────────────────────────────────────────
async function callGroq(prompt) {
  const isLocal =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";
  const url = isLocal ? "/groq/openai/v1/chat/completions" : "/api/groq";
  const headers = { "Content-Type": "application/json" };
  if (isLocal) {
    const k = import.meta.env.VITE_GROQ_API_KEY;
    if (k) headers["Authorization"] = `Bearer ${k}`;
  }
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are a fitness and nutrition expert. Always respond with valid JSON only — no markdown, no code fences.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.5,
      response_format: { type: "json_object" },
    }),
  });
  if (!response.ok) {
    let msg = "API failed";
    try {
      const e = await response.json();
      msg = e.error?.message || msg;
    } catch {}
    throw new Error(msg);
  }
  const data = await response.json();
  const raw = data.choices[0].message.content || "";
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error("Invalid JSON from AI. Try again.");
  }
}
// ── WorkoutCard ───────────────────────────────────────────────────────────────
function WorkoutCard({
  day,
  exercises,
  warmup,
  index,
  caloriesBurned,
  recoveryTip,
  onStartWorkout,
}) {
  const [expanded, setExpanded] = useState(true);
  const isRest = !exercises?.length || day?.toLowerCase().includes("rest");

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <div
        style={{
          background: isRest
            ? "rgba(99,102,241,0.06)"
            : "rgba(255,255,255,0.04)",
          border: `1px solid ${isRest ? "rgba(99,102,241,0.18)" : "rgba(255,255,255,0.08)"}`,
          borderRadius: "1rem",
          overflow: "hidden",
        }}
      >
        <button
          type="button"
          onClick={() => setExpanded((p) => !p)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.875rem 1.25rem",
            cursor: "pointer",
            border: "none",
            background: isRest
              ? "rgba(99,102,241,0.08)"
              : "linear-gradient(90deg, rgba(249,115,22,0.12), rgba(239,68,68,0.07))",
            borderBottom: `1px solid ${isRest ? "rgba(99,102,241,0.12)" : "rgba(249,115,22,0.1)"}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span>{isRest ? "😴" : "💪"}</span>
            <span
              style={{
                fontWeight: "700",
                color: isRest ? "#818cf8" : "#f97316",
                fontSize: "0.95rem",
              }}
            >
              {day}
            </span>
            {!isRest && caloriesBurned > 0 && (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.2rem",
                  padding: "0.15rem 0.55rem",
                  borderRadius: "2rem",
                  fontSize: "0.7rem",
                  background: "rgba(239,68,68,0.12)",
                  color: "#f87171",
                  border: "1px solid rgba(239,68,68,0.2)",
                }}
              >
                <Flame style={{ width: "10px", height: "10px" }} />~
                {caloriesBurned} kcal
              </span>
            )}
            {isRest && (
              <span
                style={{
                  padding: "0.15rem 0.6rem",
                  borderRadius: "2rem",
                  fontSize: "0.7rem",
                  background: "rgba(99,102,241,0.15)",
                  color: "#818cf8",
                  border: "1px solid rgba(99,102,241,0.25)",
                }}
              >
                Rest Day
              </span>
            )}
          </div>
          {expanded ? (
            <ChevronUp
              style={{ width: "15px", height: "15px", color: "#64748b" }}
            />
          ) : (
            <ChevronDown
              style={{ width: "15px", height: "15px", color: "#64748b" }}
            />
          )}
        </button>

        {expanded && (
          <div style={{ padding: "0.875rem 1.25rem" }}>
            {isRest ? (
              <p
                style={{
                  margin: 0,
                  color: "#64748b",
                  fontSize: "0.875rem",
                  fontStyle: "italic",
                }}
              >
                {recoveryTip ||
                  "Rest up. Hydrate, sleep well, and do light stretching."}
              </p>
            ) : (
              <>
                {/* Exercises */}
                <div
                  style={{
                    display: "grid",
                    gap: "0.5rem",
                    marginBottom: "0.875rem",
                  }}
                >
                  {exercises?.map((ex, j) => (
                    <div
                      key={j}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: "0.75rem",
                        padding: "0.6rem 0.875rem",
                        background: "rgba(255,255,255,0.03)",
                        borderRadius: "0.625rem",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <p
                          style={{
                            margin: 0,
                            fontWeight: "600",
                            fontSize: "0.875rem",
                            color: "#f1f5f9",
                          }}
                        >
                          {ex.name}
                        </p>
                        {ex.note && (
                          <p
                            style={{
                              margin: "0.1rem 0 0",
                              fontSize: "0.75rem",
                              color: "#64748b",
                            }}
                          >
                            {ex.note}
                          </p>
                        )}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.3rem",
                          flexWrap: "wrap",
                          justifyContent: "flex-end",
                        }}
                      >
                        {ex.sets && (
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.2rem",
                              padding: "0.18rem 0.5rem",
                              borderRadius: "0.375rem",
                              background: "rgba(255,255,255,0.07)",
                              fontSize: "0.7rem",
                              color: "#94a3b8",
                            }}
                          >
                            <Repeat style={{ width: "9px", height: "9px" }} />
                            {ex.sets}
                          </span>
                        )}
                        {ex.reps && (
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.2rem",
                              padding: "0.18rem 0.5rem",
                              borderRadius: "0.375rem",
                              background: "rgba(255,255,255,0.07)",
                              fontSize: "0.7rem",
                              color: "#94a3b8",
                            }}
                          >
                            <Zap style={{ width: "9px", height: "9px" }} />
                            {ex.reps}
                          </span>
                        )}
                        {ex.duration && (
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.2rem",
                              padding: "0.18rem 0.5rem",
                              borderRadius: "0.375rem",
                              background: "rgba(255,255,255,0.07)",
                              fontSize: "0.7rem",
                              color: "#94a3b8",
                            }}
                          >
                            <Clock style={{ width: "9px", height: "9px" }} />
                            {ex.duration}
                          </span>
                        )}
                        <a
                          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(ex.name + " exercise tutorial")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.2rem",
                            padding: "0.18rem 0.5rem",
                            borderRadius: "0.375rem",
                            background: "rgba(239,68,68,0.1)",
                            color: "#f87171",
                            fontSize: "0.7rem",
                            fontWeight: "600",
                            textDecoration: "none",
                          }}
                        >
                          <Play style={{ width: "9px", height: "9px" }} />
                          Video
                        </a>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Start Workout button */}
                <button
                  onClick={() => onStartWorkout(day, warmup, exercises)}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    background: "linear-gradient(90deg, #f97316, #ef4444)",
                    border: "none",
                    borderRadius: "0.75rem",
                    color: "#fff",
                    fontWeight: "700",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                  }}
                >
                  <Play style={{ width: "15px", height: "15px" }} /> Start
                  Workout
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── SupplementCard ────────────────────────────────────────────────────────────
function SupplementCard({ sup, selected, onToggle }) {
  const [open, setOpen] = useState(false);
  const rc =
    sup.risk_level === "low"
      ? {
          bg: "rgba(34,197,94,0.12)",
          text: "#86efac",
          border: "rgba(34,197,94,0.3)",
        }
      : sup.risk_level === "medium"
        ? {
            bg: "rgba(251,191,36,0.12)",
            text: "#fcd34d",
            border: "rgba(251,191,36,0.3)",
          }
        : {
            bg: "rgba(239,68,68,0.12)",
            text: "#fca5a5",
            border: "rgba(239,68,68,0.3)",
          };

  return (
    <div
      style={{
        background: selected
          ? "rgba(249,115,22,0.07)"
          : "rgba(255,255,255,0.03)",
        border: `1px solid ${selected ? "rgba(249,115,22,0.35)" : "rgba(255,255,255,0.08)"}`,
        borderRadius: "0.875rem",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          padding: "0.875rem 1rem",
        }}
      >
        <button
          onClick={onToggle}
          style={{
            flexShrink: 0,
            width: "22px",
            height: "22px",
            borderRadius: "6px",
            border: `2px solid ${selected ? "#f97316" : "rgba(255,255,255,0.2)"}`,
            background: selected ? "rgba(249,115,22,0.2)" : "transparent",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {selected && (
            <Check
              style={{ width: "13px", height: "13px", color: "#f97316" }}
            />
          )}
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontWeight: "700",
                fontSize: "0.9rem",
                color: "#f1f5f9",
              }}
            >
              {sup.name}
            </span>
            {sup.risk_level && (
              <span
                style={{
                  padding: "0.1rem 0.55rem",
                  borderRadius: "2rem",
                  fontSize: "0.68rem",
                  background: rc.bg,
                  color: rc.text,
                  border: `1px solid ${rc.border}`,
                }}
              >
                {sup.risk_level} risk
              </span>
            )}
            {sup.timing && (
              <span
                style={{
                  padding: "0.1rem 0.55rem",
                  borderRadius: "2rem",
                  fontSize: "0.68rem",
                  background: "rgba(255,255,255,0.07)",
                  color: "#94a3b8",
                }}
              >
                ⏰ {sup.timing}
              </span>
            )}
          </div>
          <p
            style={{
              margin: "0.2rem 0 0",
              fontSize: "0.78rem",
              color: "#94a3b8",
            }}
          >
            {sup.benefit}
          </p>
        </div>
        <button
          onClick={() => setOpen((p) => !p)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#64748b",
            flexShrink: 0,
          }}
        >
          {open ? (
            <ChevronUp style={{ width: "15px", height: "15px" }} />
          ) : (
            <ChevronDown style={{ width: "15px", height: "15px" }} />
          )}
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: "hidden" }}
          >
            <div
              style={{
                padding: "0 1rem 1rem",
                borderTop: "1px solid rgba(255,255,255,0.06)",
                paddingTop: "0.875rem",
                display: "grid",
                gap: "0.6rem",
              }}
            >
              {[
                { label: "📏 Dosage", val: sup.dosage },
                { label: "📋 How to Use", val: sup.how_to_use },
                { label: "⏰ When to Take", val: sup.when_to_take },
                { label: "🛒 Where to Get", val: sup.where_to_buy },
                { label: "💰 Est. Cost", val: sup.estimated_cost },
              ].map(({ label, val }) =>
                val ? (
                  <div key={label}>
                    <p
                      style={{
                        margin: "0 0 0.2rem",
                        fontSize: "0.72rem",
                        fontWeight: "700",
                        color: "#f97316",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {label}
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.83rem",
                        color: "#cbd5e1",
                      }}
                    >
                      {val}
                    </p>
                  </div>
                ) : null,
              )}
              {sup.warning && (
                <div
                  style={{
                    background: "rgba(239,68,68,0.07)",
                    borderRadius: "0.5rem",
                    padding: "0.5rem 0.75rem",
                  }}
                >
                  <p
                    style={{ margin: 0, fontSize: "0.78rem", color: "#fbbf24" }}
                  >
                    ⚠️ {sup.warning}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── SupplementsPanel ──────────────────────────────────────────────────────────
function SupplementsPanel({ initialSupplements, goal }) {
  const loadSaved = () => {
    try {
      return JSON.parse(localStorage.getItem(SUPP_KEY));
    } catch {
      return null;
    }
  };

  const [pool, setPool] = useState(initialSupplements || []);
  const [selected, setSelected] = useState(new Set());
  const [confirmed, setConfirmed] = useState(() => loadSaved());
  const [extraPool, setExtraPool] = useState([]);
  const [extraSelected, setExtraSelected] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [loadingExtra, setLoadingExtra] = useState(false);
  const [error, setError] = useState(null);

  const toggle = (name, set, setFn) =>
    setFn((prev) => {
      const n = new Set(prev);
      n.has(name) ? n.delete(name) : n.add(name);
      return n;
    });

  const fetchMore = async (forExtra = false) => {
    if (forExtra) setLoadingExtra(true);
    else setLoading(true);
    try {
      const existing = [...pool, ...(confirmed || []), ...extraPool]
        .map((s) => s.name)
        .join(", ");
      const res = await callGroq(
        `Suggest 5 more supplements for goal: "${goal}". Exclude: ${existing}. Return JSON: { "supplements": [{ name, benefit, dosage, timing, risk_level, how_to_use, when_to_take, where_to_buy, estimated_cost, warning }] }`,
      );
      if (res.supplements?.length) {
        if (forExtra) setExtraPool(res.supplements);
        else setPool((prev) => [...prev, ...res.supplements]);
      }
    } catch {
      setError("Failed to load. Try again.");
    } finally {
      if (forExtra) setLoadingExtra(false);
      else setLoading(false);
    }
  };

  const confirm = () => {
    const chosen = pool.filter((s) => selected.has(s.name));
    setConfirmed(chosen);
    localStorage.setItem(SUPP_KEY, JSON.stringify(chosen));
  };

  const addExtra = () => {
    const toAdd = extraPool.filter((s) => extraSelected.has(s.name));
    const updated = [...(confirmed || []), ...toAdd];
    setConfirmed(updated);
    localStorage.setItem(SUPP_KEY, JSON.stringify(updated));
    setExtraPool([]);
    setExtraSelected(new Set());
  };

  // Confirmed view
  if (confirmed)
    return (
      <div style={{ display: "grid", gap: "1.25rem" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "0.75rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <ShoppingBag
              style={{ width: "17px", height: "17px", color: "#f97316" }}
            />
            <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "700" }}>
              Your Stack ({confirmed.length})
            </h3>
          </div>
          <button
            onClick={() => {
              setConfirmed(null);
              setSelected(new Set());
              localStorage.removeItem(SUPP_KEY);
            }}
            style={{
              padding: "0.35rem 0.875rem",
              borderRadius: "2rem",
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#64748b",
              cursor: "pointer",
              fontSize: "0.78rem",
            }}
          >
            ✏️ Edit
          </button>
        </div>
        {confirmed.length === 0 && (
          <p style={{ color: "#64748b", fontSize: "0.875rem" }}>
            No supplements selected.
          </p>
        )}
        <div style={{ display: "grid", gap: "0.625rem" }}>
          {confirmed.map((sup, i) => (
            <SupplementCard
              key={i}
              sup={sup}
              selected={true}
              onToggle={() => {}}
            />
          ))}
        </div>

        {/* Add more */}
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.07)",
            paddingTop: "1.25rem",
          }}
        >
          <p
            style={{
              margin: "0 0 0.875rem",
              fontSize: "0.8rem",
              color: "#64748b",
            }}
          >
            Want to add more to your stack?
          </p>
          {extraPool.length === 0 ? (
            <button
              onClick={() => fetchMore(true)}
              disabled={loadingExtra}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.7rem 1.25rem",
                borderRadius: "0.75rem",
                cursor: "pointer",
                background: "rgba(249,115,22,0.1)",
                border: "1px solid rgba(249,115,22,0.3)",
                color: "#f97316",
                fontWeight: "600",
                fontSize: "0.875rem",
              }}
            >
              {loadingExtra ? (
                <>
                  <Loader2
                    style={{
                      width: "14px",
                      height: "14px",
                      animation: "spin 1s linear infinite",
                    }}
                  />
                  Finding...
                </>
              ) : (
                <>
                  <Plus style={{ width: "14px", height: "14px" }} />
                  Find More Supplements
                </>
              )}
            </button>
          ) : (
            <div style={{ display: "grid", gap: "0.625rem" }}>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "#94a3b8" }}>
                Select what to add:
              </p>
              {extraPool.map((sup, i) => (
                <SupplementCard
                  key={i}
                  sup={sup}
                  selected={extraSelected.has(sup.name)}
                  onToggle={() =>
                    toggle(sup.name, extraSelected, setExtraSelected)
                  }
                />
              ))}
              <div
                style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}
              >
                <button
                  onClick={addExtra}
                  disabled={extraSelected.size === 0}
                  style={{
                    padding: "0.65rem 1.25rem",
                    borderRadius: "0.75rem",
                    background:
                      extraSelected.size > 0
                        ? "linear-gradient(90deg, #f97316, #ef4444)"
                        : "rgba(249,115,22,0.2)",
                    border: "none",
                    color: "#fff",
                    fontWeight: "700",
                    cursor: extraSelected.size > 0 ? "pointer" : "not-allowed",
                    fontSize: "0.875rem",
                  }}
                >
                  ✅ Add {extraSelected.size > 0 ? extraSelected.size : ""} to
                  Stack
                </button>
                <button
                  onClick={() => {
                    setExtraPool([]);
                    setExtraSelected(new Set());
                  }}
                  style={{
                    padding: "0.65rem 1.25rem",
                    borderRadius: "0.75rem",
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#64748b",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );

  // Selection view
  return (
    <div style={{ display: "grid", gap: "1.1rem" }}>
      <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>
        Check supplements you want, expand for full details, then confirm your
        stack.
      </p>
      <div style={{ display: "grid", gap: "0.625rem" }}>
        {pool.map((sup, i) => (
          <SupplementCard
            key={i}
            sup={sup}
            selected={selected.has(sup.name)}
            onToggle={() => toggle(sup.name, selected, setSelected)}
          />
        ))}
      </div>
      <button
        onClick={() => fetchMore(false)}
        disabled={loading}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem",
          padding: "0.7rem 1.25rem",
          borderRadius: "0.75rem",
          cursor: "pointer",
          background: "rgba(249,115,22,0.08)",
          border: "1px solid rgba(249,115,22,0.25)",
          color: "#f97316",
          fontWeight: "600",
          fontSize: "0.875rem",
        }}
      >
        {loading ? (
          <>
            <Loader2
              style={{
                width: "14px",
                height: "14px",
                animation: "spin 1s linear infinite",
              }}
            />
            Loading...
          </>
        ) : (
          <>
            <Plus style={{ width: "14px", height: "14px" }} />
            Get More Supplement Ideas
          </>
        )}
      </button>
      {error && (
        <p style={{ margin: 0, color: "#f87171", fontSize: "0.8rem" }}>
          ⚠️ {error}
        </p>
      )}
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.07)",
          paddingTop: "1rem",
        }}
      >
        {selected.size > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.4rem",
              marginBottom: "0.875rem",
            }}
          >
            {[...selected].map((name) => (
              <span
                key={name}
                style={{
                  padding: "0.2rem 0.7rem",
                  borderRadius: "2rem",
                  background: "rgba(249,115,22,0.12)",
                  border: "1px solid rgba(249,115,22,0.25)",
                  color: "#f97316",
                  fontSize: "0.78rem",
                }}
              >
                ✓ {name}
              </span>
            ))}
          </div>
        )}
        <button
          onClick={confirm}
          disabled={selected.size === 0}
          style={{
            width: "100%",
            padding: "0.875rem",
            borderRadius: "0.875rem",
            background:
              selected.size > 0
                ? "linear-gradient(90deg, #f97316, #ef4444)"
                : "rgba(249,115,22,0.2)",
            border: "none",
            color: "#fff",
            fontWeight: "700",
            fontSize: "1rem",
            cursor: selected.size > 0 ? "pointer" : "not-allowed",
          }}
        >
          {selected.size > 0
            ? `✅ Confirm Stack (${selected.size})`
            : "Select at least one supplement"}
        </button>
      </div>
    </div>
  );
}

// ── DietPanel ─────────────────────────────────────────────────────────────────
function DietPanel({ dietPlan, goal, profile }) {
  const [plan, setPlan] = useState(dietPlan);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNewIdeas = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await callGroq(
        `Suggest a new 1-day meal plan variation for: goal "${goal}", weight ${profile?.bodyWeight || "?"} ${profile?.weightUnit || "kg"}, age ${profile?.age || "?"}. Keep same daily_calories. Return JSON with same structure: { diet_plan: { daily_calories, protein, carbs, fats, meals: [...], tips: [...] } }`,
      );
      if (res.diet_plan) setPlan(res.diet_plan);
    } catch {
      setError("Failed to load. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!plan)
    return (
      <div style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
        <p style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🥗</p>
        <p>
          No diet plan was generated. Go back and enable "Diet Plan" before
          generating.
        </p>
      </div>
    );

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
          gap: "0.875rem",
        }}
      >
        {[
          { label: "Daily Calories", value: `${plan.daily_calories} kcal` },
          { label: "Protein", value: plan.protein },
          { label: "Carbs", value: plan.carbs },
          { label: "Fats", value: plan.fats },
          ...(plan.total_weekly_price
            ? [{ label: "Weekly Cost", value: plan.total_weekly_price }]
            : []),
        ].map((stat, i) => (
          <div
            key={i}
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "0.875rem",
              padding: "0.875rem",
              textAlign: "center",
            }}
          >
            <div
              style={{
                color: "#64748b",
                fontSize: "0.75rem",
                marginBottom: "0.2rem",
              }}
            >
              {stat.label}
            </div>
            <div
              style={{ color: "#f97316", fontWeight: "700", fontSize: "1rem" }}
            >
              {stat.value}
            </div>
          </div>
        ))}
      </div>
      {plan.meals?.map((meal, i) => (
        <div
          key={i}
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "1rem",
            padding: "1.25rem",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "0.75rem",
            }}
          >
            <h3 style={{ margin: 0, color: "#f97316" }}>{meal.type}</h3>
            <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
              {meal.calories && `${meal.calories} kcal`}
              {meal.estimated_price && ` · ${meal.estimated_price}`}
            </span>
          </div>
          {meal.items?.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.5rem",
                marginBottom: "0.75rem",
              }}
            >
              {meal.items.map((item, j) => (
                <span
                  key={j}
                  style={{
                    background: "rgba(249,115,22,0.1)",
                    border: "1px solid rgba(249,115,22,0.2)",
                    borderRadius: "2rem",
                    padding: "0.2rem 0.7rem",
                    fontSize: "0.78rem",
                    color: "#fed7aa",
                  }}
                >
                  {item}
                </span>
              ))}
            </div>
          )}
          {meal.prep_instructions?.length > 0 && (
            <ol
              style={{
                margin: 0,
                paddingLeft: "1.25rem",
                color: "#94a3b8",
                fontSize: "0.85rem",
              }}
            >
              {meal.prep_instructions.map((step, j) => (
                <li key={j}>{step}</li>
              ))}
            </ol>
          )}
        </div>
      ))}
      {plan.tips?.length > 0 && (
        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "1rem",
            padding: "1.25rem",
          }}
        >
          <h3 style={{ margin: "0 0 0.75rem", color: "#f97316" }}>💡 Tips</h3>
          <ul
            style={{
              margin: 0,
              paddingLeft: "1.25rem",
              color: "#94a3b8",
              lineHeight: "1.8",
            }}
          >
            {plan.tips.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        </div>
      )}
      <button
        onClick={fetchNewIdeas}
        disabled={loading}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem",
          padding: "0.75rem 1.5rem",
          borderRadius: "0.75rem",
          cursor: "pointer",
          background: "rgba(249,115,22,0.08)",
          border: "1px solid rgba(249,115,22,0.25)",
          color: "#f97316",
          fontWeight: "600",
          fontSize: "0.875rem",
        }}
      >
        {loading ? (
          <>
            <Loader2
              style={{
                width: "14px",
                height: "14px",
                animation: "spin 1s linear infinite",
              }}
            />
            Loading...
          </>
        ) : (
          <>
            <Plus style={{ width: "14px", height: "14px" }} />
            Get New Meal Ideas
          </>
        )}
      </button>
      {error && (
        <p style={{ margin: 0, color: "#f87171", fontSize: "0.8rem" }}>
          ⚠️ {error}
        </p>
      )}
    </div>
  );
}

// ── Progress Panel ────────────────────────────────────────────────────────────
function ProgressPanel() {
  const [entries, setEntries] = useState([]);
  useEffect(() => {
    try {
      setEntries(JSON.parse(localStorage.getItem(PROGRESS_KEY)) || []);
    } catch {}
  }, []);

  if (entries.length === 0)
    return (
      <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
        <p style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📊</p>
        <p style={{ color: "#64748b" }}>
          No workouts logged yet. Start a workout to track your progress!
        </p>
      </div>
    );

  return (
    <div style={{ display: "grid", gap: "0.75rem" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
          gap: "0.875rem",
          marginBottom: "0.5rem",
        }}
      >
        {[
          { label: "Total Workouts", value: entries.length },
          {
            label: "This Week",
            value: entries.filter(
              (e) => new Date(e.date) > new Date(Date.now() - 7 * 86400000),
            ).length,
          },
          {
            label: "Total Kcal",
            value: entries.reduce((a, e) => a + (e.calories || 0), 0),
          },
        ].map((s, i) => (
          <div
            key={i}
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "0.875rem",
              padding: "1rem",
              textAlign: "center",
            }}
          >
            <div
              style={{
                color: "#64748b",
                fontSize: "0.75rem",
                marginBottom: "0.2rem",
              }}
            >
              {s.label}
            </div>
            <div
              style={{
                color: "#f97316",
                fontWeight: "700",
                fontSize: "1.25rem",
              }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>
      {entries.map((e, i) => (
        <div
          key={i}
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "0.875rem",
            padding: "0.875rem 1rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontWeight: "600",
                color: "#f1f5f9",
                fontSize: "0.9rem",
              }}
            >
              {e.day}
            </p>
            <p
              style={{
                margin: "0.15rem 0 0",
                fontSize: "0.75rem",
                color: "#64748b",
              }}
            >
              {new Date(e.date).toLocaleDateString()}
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            {e.calories > 0 && (
              <p style={{ margin: 0, color: "#f87171", fontSize: "0.85rem" }}>
                🔥 {e.calories} kcal
              </p>
            )}
            <p
              style={{
                margin: "0.1rem 0 0",
                fontSize: "0.75rem",
                color: "#64748b",
              }}
            >
              {e.exerciseCount} exercises
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function WorkoutPlan() {
  const navigate = useNavigate();
  const [planData, setPlanData] = useState(null);
  const [activeTab, setActiveTab] = useState("workout");

  useEffect(() => {
    const data = loadPlanData();
    if (!data) {
      navigate("/");
      return;
    }
    setPlanData(data);
  }, [navigate]);

  if (!planData) return null;

  const { plan, profile } = planData;

  const handleStartWorkout = (day, warmup, exercises) => {
    // Save to session for active workout page
    sessionStorage.setItem(
      "activeWorkout",
      JSON.stringify({ day, warmup, exercises }),
    );
    // Log progress
    const dayPlan = plan.workout_plan?.find((d) => d.day === day);
    saveProgress({
      day,
      date: new Date().toISOString(),
      calories: dayPlan?.calories_burned || 0,
      exerciseCount: exercises?.length || 0,
    });
    navigate("/workout");
  };

  const tabs = [
    { id: "workout", label: "💪 Workout" },
    ...(plan.diet_plan ? [{ id: "diet", label: "🥗 Diet" }] : []),
    ...(plan.supplements?.length
      ? [{ id: "supplements", label: "💊 Supplements" }]
      : []),
    ...(plan.performance_enhancers?.length
      ? [{ id: "peds", label: "⚠️ PEDs" }]
      : []),
    { id: "progress", label: "📊 Progress" },
  ];

  return (
    <>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <div
        style={{
          minHeight: "100vh",
          background:
            "linear-gradient(135deg, #0a0a0a 0%, #111827 50%, #0a0a0a 100%)",
          fontFamily: "'Segoe UI', system-ui, sans-serif",
          color: "#f1f5f9",
        }}
      >
        {/* Header */}
        <div
          style={{
            background:
              "linear-gradient(135deg, rgba(249,115,22,0.2) 0%, rgba(239,68,68,0.15) 100%)",
            borderBottom: "1px solid rgba(249,115,22,0.18)",
          }}
        >
          <div
            style={{
              maxWidth: "1100px",
              margin: "0 auto",
              padding: "1.5rem 1.5rem 2rem",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "1.5rem",
              }}
            >
              <button
                onClick={() => navigate("/")}
                style={{
                  padding: "0.5rem 1.1rem",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "2rem",
                  color: "#f1f5f9",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                }}
              >
                ← Back
              </button>
              <button
                onClick={() => navigate("/")}
                style={{
                  padding: "0.5rem 1.1rem",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "2rem",
                  color: "#f1f5f9",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                }}
              >
                ↺ New Plan
              </button>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div
                style={{
                  padding: "0.625rem",
                  background: "rgba(249,115,22,0.18)",
                  borderRadius: "0.875rem",
                  border: "1px solid rgba(249,115,22,0.28)",
                  flexShrink: 0,
                }}
              >
                <Dumbbell
                  style={{ width: "22px", height: "22px", color: "#f97316" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <h1
                  style={{
                    margin: 0,
                    fontSize: "clamp(1.4rem, 4vw, 2.2rem)",
                    fontWeight: "900",
                    background: "linear-gradient(90deg, #f97316, #ef4444)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    letterSpacing: "-1px",
                  }}
                >
                  {profile?.name ? `${profile.name}'s` : "Your"} Workout Plan
                </h1>
                <p
                  style={{
                    margin: "0.2rem 0 0",
                    color: "#94a3b8",
                    fontSize: "0.85rem",
                  }}
                >
                  {[
                    profile?.daysPerWeek && `${profile.daysPerWeek} days/week`,
                    profile?.fitnessLevel,
                    profile?.goal,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
            </div>
            {plan.motivation_quote && (
              <div
                style={{
                  marginTop: "1.25rem",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.625rem",
                  background: "rgba(255,255,255,0.04)",
                  borderRadius: "0.875rem",
                  padding: "0.875rem 1.1rem",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <span style={{ color: "#f97316", flexShrink: 0 }}>"</span>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.875rem",
                    color: "#cbd5e1",
                    fontStyle: "italic",
                  }}
                >
                  {plan.motivation_quote}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            padding: "2rem 1.5rem",
          }}
        >
          {/* Tabs */}
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              marginBottom: "1.75rem",
              flexWrap: "wrap",
            }}
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "0.55rem 1.2rem",
                  borderRadius: "2rem",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  transition: "all 0.2s",
                  border: `1px solid ${activeTab === tab.id ? (tab.id === "peds" ? "#ef4444" : "#f97316") : "rgba(255,255,255,0.1)"}`,
                  background:
                    activeTab === tab.id
                      ? tab.id === "peds"
                        ? "rgba(239,68,68,0.14)"
                        : "rgba(249,115,22,0.14)"
                      : "transparent",
                  color:
                    activeTab === tab.id
                      ? tab.id === "peds"
                        ? "#f87171"
                        : "#f97316"
                      : "#94a3b8",
                  fontWeight: activeTab === tab.id ? "600" : "400",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Workout */}
          {activeTab === "workout" && (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  marginBottom: "1.25rem",
                }}
              >
                <div
                  style={{
                    padding: "0.5rem",
                    background: "rgba(249,115,22,0.1)",
                    borderRadius: "0.75rem",
                  }}
                >
                  <Dumbbell
                    style={{ width: "17px", height: "17px", color: "#f97316" }}
                  />
                </div>
                <h2
                  style={{ margin: 0, fontSize: "1.2rem", fontWeight: "700" }}
                >
                  Weekly Schedule
                </h2>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                  gap: "1rem",
                }}
              >
                {plan.workout_plan?.map((day, i) => (
                  <WorkoutCard
                    key={i}
                    day={day.day}
                    exercises={day.exercises}
                    warmup={day.warmup}
                    index={i}
                    caloriesBurned={day.calories_burned}
                    recoveryTip={day.recovery_tip}
                    onStartWorkout={handleStartWorkout}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Diet */}
          {activeTab === "diet" && (
            <DietPanel
              dietPlan={plan.diet_plan}
              goal={profile?.goal}
              profile={profile}
            />
          )}

          {/* Supplements */}
          {activeTab === "supplements" &&
            (plan.supplements?.length > 0 ? (
              <SupplementsPanel
                initialSupplements={plan.supplements}
                goal={profile?.goal || "fitness"}
              />
            ) : (
              <div
                style={{
                  textAlign: "center",
                  padding: "3rem",
                  color: "#64748b",
                }}
              >
                No supplements in this plan. Generate a new plan with
                supplements enabled.
              </div>
            ))}

          {/* PEDs */}
          {activeTab === "peds" && plan.performance_enhancers && (
            <div style={{ display: "grid", gap: "1rem" }}>
              <div
                style={{
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.25)",
                  borderRadius: "1rem",
                  padding: "1rem 1.25rem",
                }}
              >
                <p
                  style={{ margin: 0, color: "#fca5a5", fontSize: "0.875rem" }}
                >
                  ⚠️ <strong>Medical Disclaimer:</strong> For educational
                  purposes only. Always consult a doctor.
                </p>
              </div>
              {plan.performance_enhancers.map((ped, i) => (
                <div
                  key={i}
                  style={{
                    background: "rgba(239,68,68,0.05)",
                    border: "1px solid rgba(239,68,68,0.18)",
                    borderRadius: "1rem",
                    padding: "1.25rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "0.75rem",
                    }}
                  >
                    <div>
                      <h3 style={{ margin: "0 0 0.15rem", color: "#f87171" }}>
                        {ped.name}
                      </h3>
                      {ped.type && (
                        <span style={{ fontSize: "0.72rem", color: "#64748b" }}>
                          {ped.type}
                        </span>
                      )}
                    </div>
                    <span
                      style={{
                        padding: "0.15rem 0.65rem",
                        borderRadius: "2rem",
                        fontSize: "0.72rem",
                        background: "rgba(239,68,68,0.14)",
                        color: "#fca5a5",
                        border: "1px solid rgba(239,68,68,0.28)",
                      }}
                    >
                      {ped.risk_level || "high"} risk
                    </span>
                  </div>
                  <p
                    style={{
                      margin: "0 0 0.75rem",
                      color: "#cbd5e1",
                      fontSize: "0.875rem",
                    }}
                  >
                    {ped.benefit}
                  </p>
                  <div
                    style={{
                      display: "flex",
                      gap: "1rem",
                      flexWrap: "wrap",
                      color: "#94a3b8",
                      fontSize: "0.825rem",
                      marginBottom: "0.75rem",
                    }}
                  >
                    {ped.typical_dosage && <span>📏 {ped.typical_dosage}</span>}
                    {ped.cycle_length && <span>🔄 {ped.cycle_length}</span>}
                    {ped.pct_required && (
                      <span style={{ color: "#fbbf24" }}>💊 PCT Required</span>
                    )}
                  </div>
                  {ped.side_effects?.length > 0 && (
                    <div style={{ marginBottom: "0.75rem" }}>
                      <p
                        style={{
                          margin: "0 0 0.3rem",
                          fontSize: "0.75rem",
                          color: "#f87171",
                          fontWeight: "700",
                        }}
                      >
                        Side Effects:
                      </p>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "0.35rem",
                        }}
                      >
                        {ped.side_effects.map((se, j) => (
                          <span
                            key={j}
                            style={{
                              background: "rgba(239,68,68,0.1)",
                              border: "1px solid rgba(239,68,68,0.2)",
                              borderRadius: "2rem",
                              padding: "0.18rem 0.55rem",
                              fontSize: "0.72rem",
                              color: "#fca5a5",
                            }}
                          >
                            {se}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {ped.warning && (
                    <div
                      style={{
                        background: "rgba(239,68,68,0.07)",
                        borderRadius: "0.5rem",
                        padding: "0.6rem 0.875rem",
                        fontSize: "0.78rem",
                        color: "#fbbf24",
                      }}
                    >
                      ⚠️ {ped.warning}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Progress */}
          {activeTab === "progress" && <ProgressPanel />}
        </div>
      </div>
    </>
  );
}
