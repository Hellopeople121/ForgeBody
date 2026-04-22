import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// ─── Storage ──────────────────────────────────────────────────────────────────
const PLAN_KEY = "forgebody_plan";
const PROFILE_KEY = "forgebody_profile";

function saveAll(plan, profile) {
  try {
    localStorage.setItem(PLAN_KEY, JSON.stringify({ plan, profile, savedAt: new Date().toISOString() }));
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (e) { console.error("Save failed", e); }
}
function loadProfile() {
  try { return JSON.parse(localStorage.getItem(PROFILE_KEY)) || {}; } catch { return {}; }
}

// ─── API ──────────────────────────────────────────────────────────────────────
async function callGroq(messages) {
  const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  const url = isLocal ? "/groq/openai/v1/chat/completions" : "/api/groq";
  const headers = { "Content-Type": "application/json" };
  if (isLocal) {
    const k = import.meta.env.VITE_GROQ_API_KEY;
    if (!k) throw new Error("Add VITE_GROQ_API_KEY to your .env.local file");
    headers["Authorization"] = `Bearer ${k}`;
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages,
      temperature: 0.3,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    let msg = `Server error (${res.status})`;
    try { const e = await res.json(); msg = e.error?.message || msg; } catch {}
    throw new Error(msg);
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content || "";

  // Strip markdown fences if model wrapped it
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();

  let parsed;
  try { parsed = JSON.parse(cleaned); }
  catch { throw new Error("AI returned malformed JSON — retrying..."); }

  // Unwrap if model nested under a key
  return parsed.fitness_plan || parsed.plan || parsed.result || parsed;
}

function buildWorkoutPrompt(form) {
  const days = parseInt(form.daysPerWeek);
  const restDays = 7 - days;
  const dayNames = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

  // Decide which days are workout vs rest
  const gap = Math.ceil(7 / days);
  const workoutDayIndexes = [];
  for (let i = 0; i < 7 && workoutDayIndexes.length < days; i++) {
    if (workoutDayIndexes.length === 0 || i >= workoutDayIndexes[workoutDayIndexes.length-1] + gap) {
      workoutDayIndexes.push(i);
    }
  }
  // Fill remaining
  for (let i = 0; i < 7 && workoutDayIndexes.length < days; i++) {
    if (!workoutDayIndexes.includes(i)) workoutDayIndexes.push(i);
  }
  workoutDayIndexes.sort((a,b) => a-b);

  const schedule = dayNames.map((name, i) => {
    const isWorkout = workoutDayIndexes.includes(i);
    return `- ${name}: ${isWorkout ? "WORKOUT DAY" : "REST DAY"}`;
  }).join("\n");

  return `Create a 7-day workout plan. Return ONLY JSON, no other text.

Person: goal="${form.goal}", level="${form.fitnessLevel}", age=${form.age||"?"}, weight=${form.bodyWeight||"?"}${form.weightUnit}, height=${form.heightUnit==="cm"?form.heightCm+"cm":form.heightFt+"ft "+form.heightIn+"in"}.
${form.notes ? `
IMPORTANT CONSTRAINTS - you MUST follow these strictly:
"${form.notes}"
These constraints override everything else. If the person says no equipment, ALL exercises must be bodyweight only. If they mention an injury, avoid those movements completely.` : ""}

Schedule (follow this EXACTLY):
${schedule}

JSON format:
{
  "workout_plan": [
    {
      "day": "Monday",
      "is_rest": false,
      "warmup": [{"name":"...","duration":"5 min","instruction":"..."},{"name":"...","duration":"3 min","instruction":"..."},{"name":"...","duration":"2 min","instruction":"..."}],
      "exercises": [{"name":"...","sets":"3","reps":"10","duration":null,"note":"..."}],
      "calories_burned": 350
    },
    {
      "day": "Tuesday",
      "is_rest": true,
      "warmup": [],
      "exercises": [],
      "calories_burned": 0,
      "recovery_tip": "Light stretching and hydration."
    }
  ],
  "motivation_quote": "..."
}

Rules:
- EXACTLY 7 days in workout_plan
- Workout days: 3-5 exercises, 3 warmup items, calories_burned > 0
- Rest days: empty exercises and warmup arrays, calories_burned=0, include recovery_tip
- Follow the schedule above exactly
${form.notes ? `- CRITICAL: "${form.notes}" — this is a hard requirement, not a suggestion` : ""}`;
}

function buildDietPrompt(form) {
  const heightStr = form.heightUnit === "cm"
    ? (form.heightCm ? form.heightCm+"cm" : "unknown")
    : ((form.heightFt||"?")+"ft "+(form.heightIn||"0")+"in");

  return `Create a diet plan. Return ONLY JSON, no other text.

Person: goal="${form.goal}", weight=${form.bodyWeight||"?"}${form.weightUnit}, height=${heightStr}, age=${form.age||"25"}.
${form.notes ? `Important dietary notes: "${form.notes}"` : ""}

JSON format:
{
  "diet_plan": {
    "daily_calories": 2200,
    "protein": "165g",
    "carbs": "220g",
    "fats": "73g",
    "total_weekly_price": "$70-90",
    "meals": [
      {"type":"Breakfast","items":["Oats 80g","Banana","Eggs x2","Milk 200ml"],"calories":550,"estimated_price":"$3-4","prep_instructions":["Boil oats","Slice banana on top","Scramble eggs separately"]},
      {"type":"Lunch","items":["Chicken breast 150g","Brown rice 100g","Broccoli 100g","Olive oil"],"calories":600,"estimated_price":"$5-6","prep_instructions":["Grill chicken","Cook rice","Steam broccoli"]},
      {"type":"Dinner","items":["Salmon 150g","Sweet potato 150g","Spinach","Lemon"],"calories":650,"estimated_price":"$6-8","prep_instructions":["Bake salmon 20min","Roast potato","Wilt spinach"]},
      {"type":"Snack","items":["Greek yogurt","Almonds 30g","Berries"],"calories":300,"estimated_price":"$2-3","prep_instructions":["Mix and serve"]}
    ],
    "tips": ["Drink 3L water daily","Eat protein within 30min after workout","Prep meals on Sunday"]
  }
}

Calculate daily_calories using TDEE for their stats and goal. Customize macros for their specific goal.`;
}

function buildSupplementsPrompt(form) {
  return `List 5 supplements for goal="${form.goal}", fitness level="${form.fitnessLevel}"${form.notes ? `, notes: "${form.notes}"` : ""}. Return ONLY JSON, no other text.

JSON format:
{
  "supplements": [
    {
      "name": "Creatine Monohydrate",
      "benefit": "Increases strength and muscle mass",
      "dosage": "5g per day",
      "timing": "Post-workout",
      "risk_level": "low",
      "how_to_use": "Mix 5g with water or shake",
      "when_to_take": "30 minutes after workout",
      "where_to_buy": "Amazon, GNC, Walmart",
      "estimated_cost": "$20-30 for 60 servings",
      "warning": "Stay hydrated, drink extra water"
    }
  ]
}`;
}

function buildPEDsPrompt(form) {
  return `List 3 performance enhancing drugs/steroids relevant to goal="${form.goal}". Return ONLY JSON.

JSON format:
{
  "performance_enhancers": [
    {
      "name": "...",
      "type": "anabolic steroid",
      "benefit": "...",
      "typical_dosage": "...",
      "cycle_length": "...",
      "side_effects": ["...", "..."],
      "risk_level": "high",
      "pct_required": true,
      "warning": "Requires medical supervision..."
    }
  ]
}`;
}

function validateAndFix(workout, diet, supplements, peds, form) {
  const days = parseInt(form.daysPerWeek);
  const dayNames = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

  let wp = Array.isArray(workout?.workout_plan) ? workout.workout_plan : [];

  // Ensure exactly 7 days
  while (wp.length < 7) {
    wp.push({ day: dayNames[wp.length], is_rest: true, exercises: [], warmup: [], calories_burned: 0, recovery_tip: "Rest and recover." });
  }
  wp = wp.slice(0, 7);

  // Clean each day
  wp = wp.map((d, i) => {
    const isRest = d.is_rest || !d.exercises?.length || (d.day||"").toLowerCase().includes("rest");
    return {
      day: d.day || dayNames[i],
      is_rest: isRest,
      warmup: Array.isArray(d.warmup) ? d.warmup : [],
      exercises: isRest ? [] : (Array.isArray(d.exercises) ? d.exercises.map(e => ({
        name: e.name || "Exercise",
        sets: e.sets || null,
        reps: e.reps || null,
        duration: e.duration || null,
        note: e.note || null,
      })) : []),
      calories_burned: isRest ? 0 : (d.calories_burned || 300),
      recovery_tip: isRest ? (d.recovery_tip || "Rest, stretch, and hydrate.") : null,
    };
  });

  return {
    workout_plan: wp,
    diet_plan: diet?.diet_plan || null,
    supplements: supplements?.supplements || null,
    performance_enhancers: peds?.performance_enhancers || null,
    motivation_quote: workout?.motivation_quote || "Push yourself — no one else will do it for you.",
  };
}

async function generatePlan(form) {
  // Run all API calls — some in parallel for speed
  const workoutPromise = callGroq([
    { role: "system", content: "You are a fitness coach. Return ONLY valid JSON. No markdown, no explanation." },
    { role: "user", content: buildWorkoutPrompt(form) },
  ]);

  const dietPromise = form.includeDiet ? callGroq([
    { role: "system", content: "You are a nutrition expert. Return ONLY valid JSON. No markdown, no explanation." },
    { role: "user", content: buildDietPrompt(form) },
  ]) : Promise.resolve(null);

  const suppPromise = form.includeSupplements ? callGroq([
    { role: "system", content: "You are a fitness supplement expert. Return ONLY valid JSON. No markdown, no explanation." },
    { role: "user", content: buildSupplementsPrompt(form) },
  ]) : Promise.resolve(null);

  const pedPromise = form.includeSteroids ? callGroq([
    { role: "system", content: "You are a pharmacology expert. Return ONLY valid JSON. No markdown, no explanation." },
    { role: "user", content: buildPEDsPrompt(form) },
  ]) : Promise.resolve(null);

  // Wait for all, retry individually if needed
  const [workout, diet, supplements, peds] = await Promise.all([
    workoutPromise,
    dietPromise,
    suppPromise,
    pedPromise,
  ]);

  return validateAndFix(workout, diet, supplements, peds, form);
}


// ─── Styles ───────────────────────────────────────────────────────────────────
const iS = { width: "100%", padding: "0.75rem 1rem", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "0.75rem", color: "#f1f5f9", fontSize: "1rem", outline: "none", boxSizing: "border-box", fontFamily: "inherit" };
const sS = { ...iS, background: "#1e293b", cursor: "pointer" };
const lS = { display: "block", marginBottom: "0.5rem", color: "#94a3b8", fontSize: "0.875rem" };

// ─── Component ────────────────────────────────────────────────────────────────
export default function Home() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "", goal: "", fitnessLevel: "beginner", daysPerWeek: "3",
    bodyWeight: "", weightUnit: "kg",
    heightCm: "", heightFt: "", heightIn: "", heightUnit: "cm",
    age: "", includeDiet: false, includeSupplements: false,
    includeSteroids: false, notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [error, setError] = useState(null);
  const [hasPlan, setHasPlan] = useState(false);

  useEffect(() => {
    const saved = loadProfile();
    if (saved && Object.keys(saved).length > 0) setForm(f => ({ ...f, ...saved }));
    setHasPlan(!!localStorage.getItem(PLAN_KEY));
  }, []);

  const age = parseInt(form.age) || 0;
  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async () => {
    if (!form.goal.trim()) return;
    setLoading(true);
    setError(null);
    setLoadingMsg("Building your personalized plan...");

    try {
      setLoadingMsg("Generating your plan...");
      const plan = await generatePlan(form);
      setLoadingMsg("Saving...");
      saveAll(plan, form);
      setHasPlan(true);
      navigate("/plan");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingMsg("");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0a0a0a 0%, #111827 50%, #0a0a0a 100%)", fontFamily: "'Segoe UI', system-ui, sans-serif", color: "#f1f5f9", padding: "2rem 1rem" }}>
      <div style={{ maxWidth: "680px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <h1 style={{ fontSize: "clamp(2.5rem, 8vw, 4rem)", fontWeight: "900", background: "linear-gradient(90deg, #f97316, #ef4444)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: 0, letterSpacing: "-2px" }}>FORGEBODY</h1>
          <p style={{ color: "#94a3b8", marginTop: "0.5rem", fontSize: "1rem" }}>AI-powered fitness plans, built for you</p>
        </div>

        {/* View existing plan */}
        {hasPlan && (
          <button onClick={() => navigate("/plan")} style={{ width: "100%", marginBottom: "1.25rem", padding: "0.875rem", background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.3)", borderRadius: "0.875rem", color: "#f97316", fontWeight: "600", cursor: "pointer", fontSize: "0.9rem" }}>
            📋 View Your Current Plan →
          </button>
        )}

        {/* Form card */}
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "1.5rem", padding: "2rem" }}>
          <h2 style={{ margin: "0 0 1.5rem", fontSize: "1.2rem", color: "#f97316" }}>Tell us about yourself</h2>
          <div style={{ display: "grid", gap: "1.1rem" }}>

            {/* Name */}
            <div>
              <label style={lS}>Your Name</label>
              <input type="text" placeholder="e.g. Alex" value={form.name} onChange={e => f("name", e.target.value)} style={iS} />
            </div>

            {/* Goal */}
            <div>
              <label style={lS}>Fitness Goal *</label>
              <input type="text" placeholder="e.g. Lose weight, build muscle, run a marathon..." value={form.goal} onChange={e => f("goal", e.target.value)} style={iS} />
            </div>

            {/* Age + Level */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={lS}>Age</label>
                <input type="number" placeholder="e.g. 25" min="10" max="100" value={form.age} onChange={e => f("age", e.target.value)} style={iS} />
              </div>
              <div>
                <label style={lS}>Fitness Level</label>
                <select value={form.fitnessLevel} onChange={e => f("fitnessLevel", e.target.value)} style={sS}>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>

            {/* Height */}
            <div>
              <label style={lS}>Height</label>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <select value={form.heightUnit} onChange={e => f("heightUnit", e.target.value)} style={{ ...sS, width: "auto", flexShrink: 0 }}>
                  <option value="cm">cm</option>
                  <option value="ftin">ft / in</option>
                </select>
                {form.heightUnit === "cm"
                  ? <input type="number" placeholder="e.g. 175" value={form.heightCm} onChange={e => f("heightCm", e.target.value)} style={{ ...iS, flex: 1 }} />
                  : <>
                      <input type="number" placeholder="ft" min="3" max="8" value={form.heightFt} onChange={e => f("heightFt", e.target.value)} style={{ ...iS, flex: 1, minWidth: "70px" }} />
                      <input type="number" placeholder="in" min="0" max="11" value={form.heightIn} onChange={e => f("heightIn", e.target.value)} style={{ ...iS, flex: 1, minWidth: "70px" }} />
                    </>
                }
              </div>
            </div>

            {/* Weight */}
            <div>
              <label style={lS}>Body Weight</label>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <input type="number" placeholder="e.g. 75" value={form.bodyWeight} onChange={e => f("bodyWeight", e.target.value)} style={{ ...iS, flex: 1 }} />
                <select value={form.weightUnit} onChange={e => f("weightUnit", e.target.value)} style={{ ...sS, width: "auto" }}>
                  <option value="kg">kg</option>
                  <option value="lbs">lbs</option>
                </select>
              </div>
            </div>

            {/* Days per week */}
            <div>
              <label style={lS}>Workout Days per Week</label>
              <select value={form.daysPerWeek} onChange={e => f("daysPerWeek", e.target.value)} style={sS}>
                {["1","2","3","4","5","6","7"].map(d => (
                  <option key={d} value={d}>{d} {d === "7" ? "days (no rest)" : `days · ${7 - parseInt(d)} rest`}</option>
                ))}
              </select>
            </div>

            {/* Optional toggles */}
            <div>
              <label style={lS}>Optional extras</label>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                {[
                  { key: "includeDiet", label: "🥗 Diet Plan" },
                  { key: "includeSupplements", label: "💊 Supplements" },
                ].map(({ key, label }) => (
                  <button key={key} onClick={() => f(key, !form[key])} style={{ padding: "0.5rem 1.1rem", borderRadius: "2rem", border: `1px solid ${form[key] ? "#f97316" : "rgba(255,255,255,0.12)"}`, background: form[key] ? "rgba(249,115,22,0.15)" : "transparent", color: form[key] ? "#f97316" : "#94a3b8", cursor: "pointer", fontSize: "0.875rem", fontWeight: form[key] ? "600" : "400" }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* PEDs — 20+ only */}
            {age >= 20 && (
              <div style={{ padding: "1rem", background: "rgba(239,68,68,0.05)", border: `1px solid ${form.includeSteroids ? "rgba(239,68,68,0.4)" : "rgba(239,68,68,0.15)"}`, borderRadius: "0.875rem" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                  <button onClick={() => f("includeSteroids", !form.includeSteroids)} style={{ flexShrink: 0, marginTop: "2px", width: "20px", height: "20px", borderRadius: "4px", border: `2px solid ${form.includeSteroids ? "#ef4444" : "rgba(239,68,68,0.4)"}`, background: form.includeSteroids ? "rgba(239,68,68,0.2)" : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {form.includeSteroids && <span style={{ color: "#ef4444", fontSize: "11px", fontWeight: "bold" }}>✓</span>}
                  </button>
                  <div>
                    <p style={{ margin: "0 0 0.2rem", fontWeight: "600", fontSize: "0.85rem", color: "#fca5a5" }}>⚠️ Include PEDs / Steroids Info</p>
                    <p style={{ margin: 0, fontSize: "0.73rem", color: "#64748b" }}>For educational purposes only. Consult a doctor before use.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label style={lS}>Additional Notes (optional)</label>
              <textarea placeholder="e.g. bad knee, no gym equipment, vegetarian..." value={form.notes} onChange={e => f("notes", e.target.value)} rows={3} style={{ ...iS, resize: "vertical" }} />
            </div>

            {/* Error */}
            {error && (
              <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "0.75rem", padding: "0.875rem 1rem", color: "#fca5a5", fontSize: "0.875rem" }}>
                ⚠️ {error}
                <button onClick={handleSubmit} style={{ display: "block", marginTop: "0.5rem", padding: "0.4rem 0.875rem", background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: "0.5rem", color: "#fca5a5", cursor: "pointer", fontSize: "0.8rem" }}>
                  🔄 Try Again
                </button>
              </div>
            )}

            {/* Submit */}
            <button onClick={handleSubmit} disabled={loading || !form.goal.trim()} style={{ padding: "1rem", background: loading || !form.goal.trim() ? "rgba(249,115,22,0.3)" : "linear-gradient(90deg, #f97316, #ef4444)", border: "none", borderRadius: "0.875rem", color: "#fff", fontSize: "1.05rem", fontWeight: "700", cursor: loading || !form.goal.trim() ? "not-allowed" : "pointer" }}>
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                  <span style={{ width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />
                  {loadingMsg || "Generating..."}
                </span>
              ) : "🔥 Generate My Plan"}
            </button>

          </div>
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
