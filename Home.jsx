import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const generateFitnessPlan = async (prompt) => {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Groq API key not configured. Add VITE_GROQ_API_KEY to your .env.local file",
    );
  }

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
            "You are a fitness coach. Always respond with valid JSON only — no markdown, no explanation, just raw JSON.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("Groq API Error:", error);
    throw new Error(error.error?.message || "Failed to generate plan");
  }

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
};

const saveUserVisit = () => {
  const visitorData = {
    visitTime: new Date().toISOString(),
    userAgent: navigator.userAgent,
  };
  
  let visits = JSON.parse(localStorage.getItem("forgebody_visits") || "[]");
  visits.unshift(visitorData);
  visits = visits.slice(0, 100);
  localStorage.setItem("forgebody_visits", JSON.stringify(visits));
  
  let totalVisits = parseInt(localStorage.getItem("forgebody_total_visits") || "0");
  totalVisits++;
  localStorage.setItem("forgebody_total_visits", totalVisits.toString());
  
  return totalVisits;
};

const saveUserProfile = (profileData) => {
  const existing = JSON.parse(localStorage.getItem("forgebody_profile") || "{}");
  const updated = { ...existing, ...profileData, lastUpdated: new Date().toISOString() };
  localStorage.setItem("forgebody_profile", JSON.stringify(updated));
};

const getUserProfile = () => {
  return JSON.parse(localStorage.getItem("forgebody_profile") || "{}");
};

export default function Home() {
  const navigate = useNavigate();
  const [visitCount, setVisitCount] = useState(0);
  const [form, setForm] = useState({
    name: "",
    goal: "",
    fitnessLevel: "beginner",
    daysPerWeek: "3",
    bodyWeight: "",
    weightUnit: "kg",
    heightFt: "",
    heightIn: "",
    heightUnit: "cm",
    age: "",
    includeDiet: false,
    includeSupplements: false,
    includeSteroids: false,
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const count = saveUserVisit();
    setVisitCount(count);
    
    const savedProfile = getUserProfile();
    if (savedProfile.name) {
      setForm(prev => ({ ...prev, name: savedProfile.name }));
    }
  }, []);

  const age = parseInt(form.age) || 0;
  const showSteroidOption = age >= 20;

  const handleSubmit = async () => {
    if (!form.goal.trim()) return;
    setLoading(true);
    setError(null);

    const days = parseInt(form.daysPerWeek);
    const restDays = 7 - days;

    const dietInstruction = form.includeDiet
      ? `Include a detailed diet_plan object tailored to this person's stats (weight: ${form.bodyWeight || "not specified"} ${form.weightUnit}, height: ${form.height || "not specified"} ${form.heightUnit}, age: ${form.age || "not specified"}). Fields: daily_calories (number, calculated based on their stats and goal using TDEE), protein (string, e.g. "180g"), carbs (string), fats (string), total_weekly_price (string estimate), meals (array of objects with: type, items (string array), calories (number), estimated_price (string), prep_instructions (string array)), tips (string array with personalized advice based on their age and stats).`
      : `Set "diet_plan" to null.`;

    const supplementInstruction = form.includeSupplements
      ? `Include a supplements array where each item has: name, benefit, dosage, timing, risk_level ("low", "medium", or "high"), warning.`
      : `Set "supplements" to null.`;

    const steroidInstruction = form.includeSteroids
      ? `Include a "performance_enhancers" array with information about performance-enhancing drugs (PEDs) relevant to their goal. For each item include: name, type (e.g. "anabolic steroid", "SARMs", "peptide"), benefit, typical_dosage, cycle_length, side_effects (array), risk_level ("high" for most steroids), pct_required (boolean - whether post cycle therapy is needed), warning (strong safety warning). Always emphasize these are for informational purposes only and require medical supervision.`
      : `Set "performance_enhancers" to null.`;

    const heightDisplay = form.heightUnit === "ft-in" 
      ? `${form.heightFt || 0}ft ${form.heightIn || 0}in`
      : `${form.height || "not specified"} cm`;

    const prompt = `Generate a personalized 7-day fitness plan for ${form.name || "the user"} with the following details:
- Name: ${form.name || "not specified"}
- Goal: ${form.goal}
- Age: ${form.age || "not specified"}
- Height: ${heightDisplay}
- Body weight: ${form.bodyWeight ? `${form.bodyWeight} ${form.weightUnit}` : "not specified"}
- Fitness Level: ${form.fitnessLevel}
- Workout days per week: ${days} (the other ${restDays} days are rest days)
- Additional notes: ${form.notes || "none"}

Create a workout_plan array with EXACTLY 7 items in this order: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday.
Each item MUST have:
- "day": just the day name like "Monday" or "Tuesday" (no extra words)
- "exercises": array of exercise objects with {name, sets, reps, duration, note} OR empty array [] for rest days
- "calories_burned": number OR 0 for rest days
- "recovery_tip": null OR a short recovery tip string for rest days ONLY

Distribution for ${days} workout days:
${days === 3 ? '- Monday, Wednesday, Friday: workout' : ''}
${days === 4 ? '- Monday, Tuesday, Thursday, Saturday: workout' : ''}
${days === 5 ? '- Monday, Tuesday, Wednesday, Friday, Saturday: workout' : ''}
${days === 6 ? '- Monday, Tuesday, Wednesday, Thursday, Friday, Saturday: workout' : ''}
${days === 7 ? '- All 7 days: workout' : ''}
${days === 2 ? '- Monday, Thursday: workout' : ''}
${days === 1 ? '- Monday: workout' : ''}

${dietInstruction}

${supplementInstruction}

${steroidInstruction}

Also include a motivation_quote string.

Return ONLY a JSON object with exactly these keys: workout_plan, diet_plan, supplements, performance_enhancers, motivation_quote.`;

    try {
      saveUserProfile(form);
      const result = await generateFitnessPlan(prompt);
      sessionStorage.setItem("workoutResult", JSON.stringify(result));
      sessionStorage.setItem("workoutUser", JSON.stringify(form));
      navigate("/plan");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #0a0a0a 0%, #111827 50%, #0a0a0a 100%)",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        color: "#f1f5f9",
        padding: "2rem 1rem",
      }}
    >
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem", marginBottom: "0.5rem" }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m6.5 6.5 11 11"></path>
              <path d="m21 21-1-1"></path>
              <path d="m3 3 1 1"></path>
              <path d="m18 22 4-4"></path>
              <path d="m2 6 4-4"></path>
              <path d="m3 10 4-4"></path>
              <path d="m11 21 4-4"></path>
              <path d="m11 3 4-4"></path>
              <path d="m18 11 4-4"></path>
            </svg>
            <h1
              style={{
                fontSize: "clamp(2.5rem, 6vw, 4rem)",
                fontWeight: "900",
                background: "linear-gradient(90deg, #f97316, #ef4444)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                margin: 0,
                letterSpacing: "-2px",
              }}
            >
              FORGEBODY
            </h1>
          </div>
          <p
            style={{
              color: "#64748b",
              marginTop: "0.5rem",
              fontSize: "1.1rem",
            }}
          >
            AI-powered fitness plans, built for you
          </p>
          <div style={{ marginTop: "1rem", display: "flex", justifyContent: "center", gap: "2rem" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#f97316" }}>{visitCount}</div>
              <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Total Visits</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#f97316" }}>
                {form.name || "Guest"}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Welcome Back</div>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "1.5rem",
            padding: "2rem",
            marginBottom: "2rem",
            backdropFilter: "blur(10px)",
          }}
        >
          <h2
            style={{
              margin: "0 0 1.5rem",
              fontSize: "1.25rem",
              color: "#f97316",
            }}
          >
            Tell us about yourself
          </h2>

          <div style={{ display: "grid", gap: "1.25rem" }}>
            {/* Name */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  color: "#94a3b8",
                  fontSize: "0.875rem",
                }}
              >
                What's your name?
              </label>
              <input
                type="text"
                placeholder="e.g. John"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "0.75rem",
                  color: "#f1f5f9",
                  fontSize: "1rem",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Goal */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  color: "#94a3b8",
                  fontSize: "0.875rem",
                }}
              >
                What's your fitness goal? *
              </label>
              <input
                type="text"
                placeholder="e.g. Lose 10kg, build muscle, run a marathon..."
                value={form.goal}
                onChange={(e) => setForm({ ...form, goal: e.target.value })}
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "0.75rem",
                  color: "#f1f5f9",
                  fontSize: "1rem",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Age + Fitness Level */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    color: "#94a3b8",
                    fontSize: "0.875rem",
                  }}
                >
                  Age
                </label>
                <input
                  type="number"
                  placeholder="e.g. 25"
                  min="10"
                  max="100"
                  value={form.age}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      age: e.target.value,
                      includeSteroids: false,
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: "0.75rem",
                    color: "#f1f5f9",
                    fontSize: "1rem",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    color: "#94a3b8",
                    fontSize: "0.875rem",
                  }}
                >
                  Fitness Level
                </label>
                <select
                  value={form.fitnessLevel}
                  onChange={(e) =>
                    setForm({ ...form, fitnessLevel: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    background: "#0f172a",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: "0.75rem",
                    color: "#f1f5f9",
                    fontSize: "1rem",
                    outline: "none",
                  }}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>

            {/* Height */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  color: "#94a3b8",
                  fontSize: "0.875rem",
                }}
              >
                Height
              </label>
              {form.heightUnit === "cm" ? (
                <input
                  type="number"
                  placeholder="e.g. 175"
                  value={form.height}
                  onChange={(e) => setForm({ ...form, height: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: "0.75rem",
                    color: "#f1f5f9",
                    fontSize: "1rem",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              ) : (
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <input
                    type="number"
                    placeholder="ft"
                    value={form.heightFt}
                    onChange={(e) => setForm({ ...form, heightFt: e.target.value })}
                    style={{
                      flex: 1,
                      padding: "0.75rem 1rem",
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: "0.75rem",
                      color: "#f1f5f9",
                      fontSize: "1rem",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                  <input
                    type="number"
                    placeholder="in"
                    value={form.heightIn}
                    onChange={(e) => setForm({ ...form, heightIn: e.target.value })}
                    style={{
                      flex: 1,
                      padding: "0.75rem 1rem",
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: "0.75rem",
                      color: "#f1f5f9",
                      fontSize: "1rem",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              )}
              <select
                value={form.heightUnit}
                onChange={(e) => setForm({ ...form, heightUnit: e.target.value })}
                style={{
                  marginTop: "0.75rem",
                  padding: "0.5rem 1rem",
                  background: "#0f172a",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "0.75rem",
                  color: "#f1f5f9",
                  fontSize: "0.875rem",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="cm">cm</option>
                <option value="ft-in">ft & in</option>
              </select>
            </div>

            {/* Body Weight */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  color: "#94a3b8",
                  fontSize: "0.875rem",
                }}
              >
                Body Weight
              </label>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <input
                  type="number"
                  placeholder="e.g. 75"
                  value={form.bodyWeight}
                  onChange={(e) =>
                    setForm({ ...form, bodyWeight: e.target.value })
                  }
                  style={{
                    flex: 1,
                    padding: "0.75rem 1rem",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: "0.75rem",
                    color: "#f1f5f9",
                    fontSize: "1rem",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                <select
                  value={form.weightUnit}
                  onChange={(e) =>
                    setForm({ ...form, weightUnit: e.target.value })
                  }
                  style={{
                    padding: "0.75rem 1rem",
                    background: "#0f172a",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: "0.75rem",
                    color: "#f1f5f9",
                    fontSize: "1rem",
                    outline: "none",
                    cursor: "pointer",
                  }}
                >
                  <option value="kg">kg</option>
                  <option value="lbs">lbs</option>
                </select>
              </div>
            </div>

            {/* Days per week */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  color: "#94a3b8",
                  fontSize: "0.875rem",
                }}
              >
                Workout Days per Week
              </label>
              <select
                value={form.daysPerWeek}
                onChange={(e) =>
                  setForm({ ...form, daysPerWeek: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  background: "#0f172a",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "0.75rem",
                  color: "#f1f5f9",
                  fontSize: "1rem",
                  outline: "none",
                }}
              >
                {["1", "2", "3", "4", "5", "6", "7"].map((d) => (
                  <option key={d} value={d}>
                    {d}{" "}
                    {d === "7"
                      ? "days (no rest)"
                      : `days (${7 - parseInt(d)} rest)`}
                  </option>
                ))}
              </select>
            </div>

            {/* Toggles */}
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              {[
                { key: "includeDiet", label: "🥗 Diet Plan" },
                { key: "includeSupplements", label: "💊 Supplements" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setForm({ ...form, [key]: !form[key] })}
                  style={{
                    padding: "0.5rem 1.25rem",
                    borderRadius: "2rem",
                    border: `1px solid ${form[key] ? "#f97316" : "rgba(255,255,255,0.12)"}`,
                    background: form[key]
                      ? "rgba(249,115,22,0.15)"
                      : "transparent",
                    color: form[key] ? "#f97316" : "#94a3b8",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    transition: "all 0.2s",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Steroid option — only shown if age >= 20 */}
            {showSteroidOption && (
              <div
                style={{
                  padding: "1rem 1.25rem",
                  background: "rgba(239,68,68,0.05)",
                  border: `1px solid ${form.includeSteroids ? "rgba(239,68,68,0.4)" : "rgba(239,68,68,0.15)"}`,
                  borderRadius: "0.875rem",
                  transition: "border-color 0.2s",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.75rem",
                  }}
                >
                  <button
                    onClick={() =>
                      setForm({
                        ...form,
                        includeSteroids: !form.includeSteroids,
                      })
                    }
                    style={{
                      flexShrink: 0,
                      marginTop: "0.1rem",
                      width: "20px",
                      height: "20px",
                      borderRadius: "4px",
                      border: `2px solid ${form.includeSteroids ? "#2855c7" : "rgba(239,68,68,0.4)"}`,
                      background: form.includeSteroids
                        ? "rgba(239,68,68,0.2)"
                        : "transparent",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.2s",
                    }}
                  >
                    {form.includeSteroids && (
                      <span
                        style={{
                          color: "#2855c7",
                          fontSize: "12px",
                          fontWeight: "bold",
                        }}
                      >
                        ✓
                      </span>
                    )}
                  </button>
                  <div>
                    <p
                      style={{
                        margin: "0 0 0.25rem",
                        fontWeight: "600",
                        fontSize: "0.9rem",
                        color: "#fca5a5",
                      }}
                    >
                      ⚠️ Include Performance-Enhancing Drugs (PEDs) / Steroids
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.78rem",
                        color: "#64748b",
                        lineHeight: "1.5",
                      }}
                    >
                      For informational purposes only. PEDs carry serious health
                      risks and may be illegal in your country. Always consult a
                      medical professional before use. Not recommended.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  color: "#94a3b8",
                  fontSize: "0.875rem",
                }}
              >
                Additional notes (optional)
              </label>
              <textarea
                placeholder="e.g. I have a bad knee, I only have dumbbells at home..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "0.75rem",
                  color: "#f1f5f9",
                  fontSize: "1rem",
                  outline: "none",
                  resize: "vertical",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                }}
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={loading || !form.goal.trim()}
              style={{
                padding: "1rem 2rem",
                background:
                  loading || !form.goal.trim()
                    ? "rgba(249,115,22,0.3)"
                    : "linear-gradient(90deg, #f97316, #2855c7)",
                border: "none",
                borderRadius: "0.75rem",
                color: "#fff",
                fontSize: "1.1rem",
                fontWeight: "700",
                cursor:
                  loading || !form.goal.trim() ? "not-allowed" : "pointer",
                transition: "opacity 0.2s",
                letterSpacing: "0.5px",
              }}
            >
              {loading ? "⚡ Generating your plan..." : "🔥 Generate My Plan"}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: "1rem",
              padding: "1rem 1.5rem",
              marginBottom: "2rem",
              color: "#fca5a5",
            }}
          >
            ⚠️ {error}
          </div>
        )}

      </div>
    </div>
  );
}
