import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Dumbbell,
  Quote,
  RotateCcw,
  Repeat,
  Zap,
  Clock,
  Play,
  ChevronDown,
  ChevronUp,
  Flame,
  Plus,
  Loader2,
  Check,
  ShoppingBag,
} from "lucide-react";

// ── Login tracker (inline, fixed) ──────────────────────────────────────────
const TRACKER_KEY = "fitnessTracker";
function getLoginCount() {
  try {
    const store = JSON.parse(localStorage.getItem(TRACKER_KEY)) || {};
    const today = new Date().toISOString().split("T")[0];
    // Only increment once per day
    if (store.lastLoginDate === today) return store.loginCount || 1;
    const newCount = (store.loginCount || 0) + 1;
    localStorage.setItem(
      TRACKER_KEY,
      JSON.stringify({ ...store, loginCount: newCount, lastLoginDate: today }),
    );
    return newCount;
  } catch {
    return 1;
  }
}

// ── Groq API helper ─────────────────────────────────────────────────────────
async function callGroq(prompt) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  const response = await fetch("/groq/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content:
            "You are a fitness and nutrition expert. Always respond with valid JSON only — no markdown, no explanation.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    }),
  });
  if (!response.ok) throw new Error("API request failed");
  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

// ── WorkoutCard ─────────────────────────────────────────────────────────────
function WorkoutCard({ day, exercises, index, caloriesBurned, recoveryTip }) {
  const [expanded, setExpanded] = useState(true);
  const isRest =
    !exercises || exercises.length === 0 || day?.toLowerCase().includes("rest");

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
                  "Rest up. Focus on hydration, sleep, and light stretching."}
              </p>
            ) : (
              <div style={{ display: "grid", gap: "0.5rem" }}>
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
                    <div style={{ flex: 1, minWidth: 0 }}>
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
                        gap: "0.35rem",
                        flexShrink: 0,
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
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── SupplementCard ──────────────────────────────────────────────────────────
function SupplementCard({ sup, selected, onToggle, showDetails }) {
  const [open, setOpen] = useState(false);
  const riskColor =
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
        transition: "border-color 0.2s",
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          padding: "0.875rem 1rem",
        }}
      >
        {/* Checkbox */}
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
            transition: "all 0.2s",
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
                fontSize: "0.95rem",
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
                  background: riskColor.bg,
                  color: riskColor.text,
                  border: `1px solid ${riskColor.border}`,
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
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                ⏰ {sup.timing}
              </span>
            )}
          </div>
          <p
            style={{
              margin: "0.2rem 0 0",
              fontSize: "0.8rem",
              color: "#94a3b8",
            }}
          >
            {sup.benefit}
          </p>
        </div>

        {showDetails && (
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
        )}
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {open && showDetails && (
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
                gap: "0.75rem",
              }}
            >
              {sup.dosage && (
                <div>
                  <p
                    style={{
                      margin: "0 0 0.25rem",
                      fontSize: "0.75rem",
                      fontWeight: "700",
                      color: "#f97316",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    📏 Dosage
                  </p>
                  <p
                    style={{ margin: 0, fontSize: "0.85rem", color: "#cbd5e1" }}
                  >
                    {sup.dosage}
                  </p>
                </div>
              )}
              {sup.how_to_use && (
                <div>
                  <p
                    style={{
                      margin: "0 0 0.25rem",
                      fontSize: "0.75rem",
                      fontWeight: "700",
                      color: "#f97316",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    📋 How to Use
                  </p>
                  <p
                    style={{ margin: 0, fontSize: "0.85rem", color: "#cbd5e1" }}
                  >
                    {sup.how_to_use}
                  </p>
                </div>
              )}
              {sup.when_to_take && (
                <div>
                  <p
                    style={{
                      margin: "0 0 0.25rem",
                      fontSize: "0.75rem",
                      fontWeight: "700",
                      color: "#f97316",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    ⏰ When to Take
                  </p>
                  <p
                    style={{ margin: 0, fontSize: "0.85rem", color: "#cbd5e1" }}
                  >
                    {sup.when_to_take}
                  </p>
                </div>
              )}
              {sup.where_to_buy && (
                <div>
                  <p
                    style={{
                      margin: "0 0 0.25rem",
                      fontSize: "0.75rem",
                      fontWeight: "700",
                      color: "#f97316",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    🛒 Where to Get It
                  </p>
                  <p
                    style={{ margin: 0, fontSize: "0.85rem", color: "#cbd5e1" }}
                  >
                    {sup.where_to_buy}
                  </p>
                </div>
              )}
              {sup.estimated_cost && (
                <div>
                  <p
                    style={{
                      margin: "0 0 0.25rem",
                      fontSize: "0.75rem",
                      fontWeight: "700",
                      color: "#f97316",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    💰 Estimated Cost
                  </p>
                  <p
                    style={{ margin: 0, fontSize: "0.85rem", color: "#cbd5e1" }}
                  >
                    {sup.estimated_cost}
                  </p>
                </div>
              )}
              {sup.warning && (
                <div
                  style={{
                    background: "rgba(239,68,68,0.07)",
                    borderRadius: "0.5rem",
                    padding: "0.6rem 0.875rem",
                  }}
                >
                  <p
                    style={{ margin: 0, fontSize: "0.8rem", color: "#fbbf24" }}
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

// ── SupplementsPanel ────────────────────────────────────────────────────────
const SUPP_STORAGE_KEY = "forgebody_confirmed_supplements";

function SupplementsPanel({ supplements: initial, goal }) {
  // Load previously confirmed supplements from localStorage
  const loadSaved = () => {
    try {
      return JSON.parse(localStorage.getItem(SUPP_STORAGE_KEY)) || null;
    } catch {
      return null;
    }
  };

  const [supplements, setSupplements] = useState(initial || []);
  const [selected, setSelected] = useState(new Set());
  const [confirmed, setConfirmed] = useState(() => loadSaved()); // null = not confirmed yet
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState(null);
  // Extra supplements added after confirmation
  const [extraPool, setExtraPool] = useState([]);
  const [extraSelected, setExtraSelected] = useState(new Set());
  const [loadingExtra, setLoadingExtra] = useState(false);
  const [extraError, setExtraError] = useState(null);

  const toggleSelected = (name) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const toggleExtra = (name) => {
    setExtraSelected((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const handleConfirm = () => {
    const chosen = supplements.filter((s) => selected.has(s.name));
    setConfirmed(chosen);
    localStorage.setItem(SUPP_STORAGE_KEY, JSON.stringify(chosen));
  };

  const handleReset = () => {
    setConfirmed(null);
    setSelected(new Set());
    setExtraPool([]);
    setExtraSelected(new Set());
    localStorage.removeItem(SUPP_STORAGE_KEY);
  };

  const addExtraToStack = () => {
    const toAdd = extraPool.filter((s) => extraSelected.has(s.name));
    const updated = [...confirmed, ...toAdd];
    setConfirmed(updated);
    localStorage.setItem(SUPP_STORAGE_KEY, JSON.stringify(updated));
    setExtraPool([]);
    setExtraSelected(new Set());
  };

  const fetchMoreSupplements = async (forConfirmed = false) => {
    if (forConfirmed) {
      setLoadingExtra(true);
      setExtraError(null);
    } else {
      setLoadingMore(true);
      setMoreError(null);
    }
    try {
      const existing = [...supplements, ...(confirmed || []), ...extraPool]
        .map((s) => s.name)
        .join(", ");
      const result =
        await callGroq(`Suggest 5 more supplement ideas for someone with the goal: "${goal}".
Do NOT include these already suggested: ${existing}.
For each supplement return: name, benefit, dosage, timing, risk_level ("low"/"medium"/"high"), how_to_use, when_to_take, where_to_buy, estimated_cost, warning.
Return JSON: { "supplements": [ ... ] }`);
      if (result.supplements?.length) {
        if (forConfirmed) setExtraPool(result.supplements);
        else setSupplements((prev) => [...prev, ...result.supplements]);
      }
    } catch {
      if (forConfirmed) setExtraError("Failed to load. Try again.");
      else setMoreError("Failed to load more supplements. Try again.");
    } finally {
      if (forConfirmed) setLoadingExtra(false);
      else setLoadingMore(false);
    }
  };

  // ── CONFIRMED VIEW ──────────────────────────────────────────────────────
  if (confirmed) {
    return (
      <div style={{ display: "grid", gap: "1.5rem" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "0.75rem",
          }}
        >
          <div
            style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}
          >
            <ShoppingBag
              style={{ width: "18px", height: "18px", color: "#f97316" }}
            />
            <h2
              style={{
                margin: 0,
                fontSize: "1.15rem",
                fontWeight: "700",
                color: "#f1f5f9",
              }}
            >
              Your Supplement Stack ({confirmed.length})
            </h2>
          </div>
          <button
            onClick={handleReset}
            style={{
              padding: "0.4rem 0.9rem",
              borderRadius: "2rem",
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#64748b",
              cursor: "pointer",
              fontSize: "0.78rem",
            }}
          >
            ✏️ Edit Selection
          </button>
        </div>

        {confirmed.length === 0 ? (
          <p style={{ color: "#64748b", fontSize: "0.875rem" }}>
            No supplements selected. Click "Edit Selection" to pick some.
          </p>
        ) : (
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {confirmed.map((sup, i) => (
              <SupplementCard
                key={sup.name + i}
                sup={sup}
                selected={true}
                onToggle={() => {}}
                showDetails={true}
              />
            ))}
          </div>
        )}

        {/* Add more supplements section */}
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.07)",
            paddingTop: "1.25rem",
          }}
        >
          <p
            style={{
              margin: "0 0 0.875rem",
              fontSize: "0.825rem",
              color: "#64748b",
            }}
          >
            Want to add more supplements to your stack?
          </p>

          {extraPool.length === 0 ? (
            <button
              onClick={() => fetchMoreSupplements(true)}
              disabled={loadingExtra}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                padding: "0.75rem 1.5rem",
                borderRadius: "0.75rem",
                cursor: loadingExtra ? "not-allowed" : "pointer",
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
                      width: "15px",
                      height: "15px",
                      animation: "spin 1s linear infinite",
                    }}
                  />
                  Finding more...
                </>
              ) : (
                <>
                  <Plus style={{ width: "15px", height: "15px" }} />
                  Find More Supplements
                </>
              )}
            </button>
          ) : (
            <div style={{ display: "grid", gap: "0.75rem" }}>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "#94a3b8" }}>
                Select the ones you want to add:
              </p>
              {extraPool.map((sup, i) => (
                <SupplementCard
                  key={sup.name + i}
                  sup={sup}
                  selected={extraSelected.has(sup.name)}
                  onToggle={() => toggleExtra(sup.name)}
                  showDetails={true}
                />
              ))}
              <div
                style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}
              >
                <button
                  onClick={addExtraToStack}
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
                  ✅ Add{" "}
                  {extraSelected.size > 0 ? `${extraSelected.size} ` : ""}to My
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
              <button
                onClick={() => fetchMoreSupplements(true)}
                disabled={loadingExtra}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  background: "none",
                  border: "none",
                  color: "#64748b",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                  padding: 0,
                }}
              >
                <Plus style={{ width: "12px", height: "12px" }} /> Show
                different suggestions
              </button>
            </div>
          )}
          {extraError && (
            <p
              style={{
                margin: "0.5rem 0 0",
                color: "#f87171",
                fontSize: "0.8rem",
              }}
            >
              ⚠️ {extraError}
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── SELECTION VIEW ──────────────────────────────────────────────────────
  const selectedList = supplements.filter((s) => selected.has(s.name));

  return (
    <div style={{ display: "grid", gap: "1.25rem" }}>
      <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>
        ✅ Check the supplements you want — expand each one to see full details.
        Then confirm your stack to save it.
      </p>

      <div style={{ display: "grid", gap: "0.625rem" }}>
        {supplements.map((sup, i) => (
          <SupplementCard
            key={sup.name + i}
            sup={sup}
            selected={selected.has(sup.name)}
            onToggle={() => toggleSelected(sup.name)}
            showDetails={true}
          />
        ))}
      </div>

      {/* Get more ideas */}
      <button
        onClick={() => fetchMoreSupplements(false)}
        disabled={loadingMore}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem",
          padding: "0.75rem 1.5rem",
          borderRadius: "0.75rem",
          cursor: loadingMore ? "not-allowed" : "pointer",
          background: "rgba(249,115,22,0.08)",
          border: "1px solid rgba(249,115,22,0.25)",
          color: "#f97316",
          fontWeight: "600",
          fontSize: "0.875rem",
        }}
      >
        {loadingMore ? (
          <>
            <Loader2
              style={{
                width: "15px",
                height: "15px",
                animation: "spin 1s linear infinite",
              }}
            />
            Loading...
          </>
        ) : (
          <>
            <Plus style={{ width: "15px", height: "15px" }} />
            Get More Supplement Ideas
          </>
        )}
      </button>
      {moreError && (
        <p style={{ margin: 0, color: "#f87171", fontSize: "0.8rem" }}>
          ⚠️ {moreError}
        </p>
      )}

      {/* Confirm button */}
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.07)",
          paddingTop: "1.25rem",
        }}
      >
        {selectedList.length > 0 && (
          <div
            style={{
              marginBottom: "0.875rem",
              display: "flex",
              flexWrap: "wrap",
              gap: "0.4rem",
            }}
          >
            {selectedList.map((s, i) => (
              <span
                key={i}
                style={{
                  padding: "0.2rem 0.7rem",
                  borderRadius: "2rem",
                  background: "rgba(249,115,22,0.12)",
                  border: "1px solid rgba(249,115,22,0.25)",
                  color: "#f97316",
                  fontSize: "0.78rem",
                  fontWeight: "600",
                }}
              >
                ✓ {s.name}
              </span>
            ))}
          </div>
        )}
        <button
          onClick={handleConfirm}
          disabled={selectedList.length === 0}
          style={{
            width: "100%",
            padding: "0.875rem",
            borderRadius: "0.875rem",
            background:
              selectedList.length > 0
                ? "linear-gradient(90deg, #f97316, #ef4444)"
                : "rgba(249,115,22,0.2)",
            border: "none",
            color: "#fff",
            fontWeight: "700",
            fontSize: "1rem",
            cursor: selectedList.length > 0 ? "pointer" : "not-allowed",
            letterSpacing: "0.3px",
          }}
        >
          {selectedList.length > 0
            ? `✅ Confirm My Stack (${selectedList.length} supplement${selectedList.length > 1 ? "s" : ""})`
            : "Select at least one supplement"}
        </button>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────
export default function WorkoutPlan() {
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [user, setUser] = useState(null);
  const [loginCount, setLoginCount] = useState(0);
  const [missedChallenge, setMissedChallenge] = useState(null);
  const [activeTab, setActiveTab] = useState("workout");

  useEffect(() => {
    const stored = sessionStorage.getItem("workoutResult");
    const storedUser = sessionStorage.getItem("workoutUser");
    if (!stored) {
      navigate("/");
      return;
    }
    setResult(JSON.parse(stored));
    if (storedUser) setUser(JSON.parse(storedUser));
    // Fix: get count AFTER page load, not during initial render
    setLoginCount(getLoginCount());
  }, [navigate]);

  if (!result) return null;

  const tabs = [
    { id: "workout", label: "💪 Workout" },
    ...(result.diet_plan ? [{ id: "diet", label: "🥗 Diet Plan" }] : []),
    ...(result.supplements?.length || user?.includeSupplements
      ? [{ id: "supplements", label: "💊 Supplements" }]
      : []),
    ...(result.performance_enhancers?.length
      ? [{ id: "peds", label: "⚠️ PEDs" }]
      : []),
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
        {/* ── Header ── */}
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
            {/* Nav */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "1.5rem",
              }}
            >
              {[
                { label: "← Back", onClick: () => navigate("/") },
                { label: "↺ New Plan", onClick: () => navigate("/") },
              ].map((btn, i) => (
                <button
                  key={i}
                  onClick={btn.onClick}
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
                  {btn.label}
                </button>
              ))}
            </div>

            {/* Title */}
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
                  {user?.name ? `${user.name}'s` : "Your"} Workout Plan
                </h1>
                <p
                  style={{
                    margin: "0.2rem 0 0",
                    color: "#94a3b8",
                    fontSize: "0.85rem",
                  }}
                >
                  {[
                    user?.daysPerWeek && `${user.daysPerWeek} days/week`,
                    user?.fitnessLevel,
                    user?.goal?.replace(/_/g, " "),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              {/* Login count — fixed: only counts unique days */}
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <p
                  style={{
                    margin: 0,
                    color: "#64748b",
                    fontSize: "0.68rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Total Logins
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: "2rem",
                    fontWeight: "900",
                    background: "linear-gradient(90deg, #f97316, #ef4444)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    lineHeight: 1,
                  }}
                >
                  {loginCount}
                </p>
              </div>
            </div>

            {/* Quote */}
            {result.motivation_quote && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
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
                <Quote
                  style={{
                    width: "14px",
                    height: "14px",
                    color: "#f97316",
                    flexShrink: 0,
                    marginTop: "2px",
                  }}
                />
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.875rem",
                    color: "#cbd5e1",
                    fontStyle: "italic",
                  }}
                >
                  {result.motivation_quote}
                </p>
              </motion.div>
            )}
          </div>
        </div>

        {/* ── Content ── */}
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            padding: "2rem 1.5rem",
          }}
        >
          {/* Missed workout banner */}
          {missedChallenge && (
            <div
              style={{
                marginBottom: "1.5rem",
                background:
                  "linear-gradient(90deg, rgba(239,68,68,0.1), rgba(249,115,22,0.08))",
                border: "1px solid rgba(239,68,68,0.22)",
                borderRadius: "1rem",
                padding: "1rem 1.25rem",
                display: "flex",
                alignItems: "flex-start",
                gap: "0.875rem",
              }}
            >
              <Flame
                style={{
                  width: "18px",
                  height: "18px",
                  color: "#ef4444",
                  flexShrink: 0,
                  marginTop: "2px",
                }}
              />
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    margin: "0 0 0.2rem",
                    fontSize: "0.68rem",
                    fontWeight: "700",
                    color: "#ef4444",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  Missed workout!
                </p>
                <p
                  style={{
                    margin: "0 0 0.15rem",
                    fontWeight: "700",
                    color: "#f1f5f9",
                  }}
                >
                  {missedChallenge.title}
                </p>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#94a3b8" }}>
                  {missedChallenge.desc}
                </p>
              </div>
              <button
                onClick={() => setMissedChallenge(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#64748b",
                  cursor: "pointer",
                  fontSize: "1.1rem",
                }}
              >
                ✕
              </button>
            </div>
          )}

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

          {/* Workout Tab */}
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
                  Weekly Workout Schedule
                </h2>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                  gap: "1rem",
                }}
              >
                {result.workout_plan?.map((day, i) => (
                  <WorkoutCard
                    key={i}
                    day={day.day}
                    exercises={day.exercises}
                    index={i}
                    caloriesBurned={day.calories_burned}
                    recoveryTip={day.recovery_tip}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Diet Tab */}
          {activeTab === "diet" && result.diet_plan && (
            <div style={{ display: "grid", gap: "1rem" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                  gap: "0.875rem",
                }}
              >
                {[
                  {
                    label: "Daily Calories",
                    value: `${result.diet_plan.daily_calories} kcal`,
                  },
                  { label: "Protein", value: result.diet_plan.protein },
                  { label: "Carbs", value: result.diet_plan.carbs },
                  { label: "Fats", value: result.diet_plan.fats },
                  ...(result.diet_plan.total_weekly_price
                    ? [
                        {
                          label: "Weekly Cost",
                          value: result.diet_plan.total_weekly_price,
                        },
                      ]
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
                      style={{
                        color: "#f97316",
                        fontWeight: "700",
                        fontSize: "1rem",
                      }}
                    >
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>
              {result.diet_plan.meals?.map((meal, i) => (
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
              {result.diet_plan.tips?.length > 0 && (
                <div
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "1rem",
                    padding: "1.25rem",
                  }}
                >
                  <h3 style={{ margin: "0 0 0.75rem", color: "#f97316" }}>
                    💡 Tips
                  </h3>
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: "1.25rem",
                      color: "#94a3b8",
                      lineHeight: "1.8",
                    }}
                  >
                    {result.diet_plan.tips.map((tip, i) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Supplements Tab */}
          {activeTab === "supplements" &&
            (result.supplements?.length > 0 ? (
              <SupplementsPanel
                supplements={result.supplements}
                goal={user?.goal || "fitness"}
              />
            ) : (
              <div
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "1rem",
                  padding: "2rem",
                  textAlign: "center",
                }}
              >
                <p style={{ margin: "0 0 0.5rem", fontSize: "1.5rem" }}>💊</p>
                <p
                  style={{
                    margin: "0 0 0.75rem",
                    color: "#94a3b8",
                    fontSize: "0.9rem",
                  }}
                >
                  No supplements were included in this plan.
                </p>
                <p style={{ margin: 0, color: "#64748b", fontSize: "0.8rem" }}>
                  Generate a new plan and toggle on Include Supplements to get
                  recommendations.
                </p>
              </div>
            ))}

          {/* PEDs Tab */}
          {activeTab === "peds" && result.performance_enhancers && (
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
                  style={{
                    margin: 0,
                    color: "#fca5a5",
                    fontSize: "0.875rem",
                    lineHeight: "1.6",
                  }}
                >
                  ⚠️ <strong>Medical Disclaimer:</strong> For educational
                  purposes only. PEDs carry serious health risks. Always consult
                  a medical professional before use.
                </p>
              </div>
              {result.performance_enhancers.map((ped, i) => (
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
        </div>
      </div>
    </>
  );
}
