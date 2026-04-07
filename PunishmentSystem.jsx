import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, X, Trophy, AlertTriangle, Zap, Coffee, Target, Clock } from "lucide-react";

const PUNISHMENT_STORAGE_KEY = "forgebody_workout_punishment";

const getDefaultState = () => ({
  streak: 0,
  missedDays: 0,
  totalWorkouts: 0,
  lastWorkoutDate: null,
  weeklyPlan: [],
  completedDays: [],
  punishments: [],
});

const loadPunishmentState = () => {
  try {
    const stored = localStorage.getItem(PUNISHMENT_STORAGE_KEY);
    return stored ? JSON.parse(stored) : getDefaultState();
  } catch {
    return getDefaultState();
  }
};

const savePunishmentState = (state) => {
  localStorage.setItem(PUNISHMENT_STORAGE_KEY, JSON.stringify(state));
};

const PUNISHMENTS = [
  { type: "extra_cardio", name: "Extra Cardio Day", desc: "Add 20 minutes of cardio to your next workout", intensity: 1 },
  { type: "water_intake", name: "Hydration Challenge", desc: "Drink 1 gallon of water today", intensity: 1 },
  { type: "no_sugar", name: "Sugar Cut", desc: "No sugar for the next 48 hours", intensity: 2 },
  { type: "early_workout", name: "Early Bird", desc: "Complete your next workout before 8 AM", intensity: 2 },
  { type: "double_reps", name: "Double Trouble", desc: "Add 2 extra sets to every exercise next session", intensity: 3 },
  { type: "no_music", name: "Silent Workout", desc: "Complete your next workout without music/headphones", intensity: 2 },
  { type: "cold_shower", name: "Cold Shower", desc: "End your next shower with 2 minutes of cold water", intensity: 3 },
  { type: "plank_challenge", name: "Plank Marathon", desc: "Hold a 2-minute plank after your next workout", intensity: 2 },
  { type: "stretch_punishment", name: "Mandatory Stretch", desc: "Complete 30 minutes of stretching/foam rolling", intensity: 1 },
  { type: "no_cheat", name: "Clean Eating", desc: "No cheat meals for the next 3 days", intensity: 3 },
];

const getRandomPunishment = (intensity = null) => {
  const filtered = intensity ? PUNISHMENTS.filter(p => p.intensity <= intensity) : PUNISHMENTS;
  return filtered[Math.floor(Math.random() * filtered.length)];
};

export default function PunishmentSystem({ workoutPlan, userName, onComplete }) {
  const [state, setState] = useState(loadPunishmentState);
  const [showPunishment, setShowPunishment] = useState(false);
  const [currentPunishment, setCurrentPunishment] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [punishmentCompleted, setPunishmentCompleted] = useState(false);

  useEffect(() => {
    checkForMissedWorkout();
  }, []);

  const checkForMissedWorkout = () => {
    const today = new Date();
    const todayName = today.toLocaleDateString('en-US', { weekday: 'long' });
    const todayStr = today.toISOString().split('T')[0];
    
    if (!workoutPlan?.workout_plan) return;

    const workoutDays = workoutPlan.workout_plan
      .filter(day => day.exercises?.length > 0)
      .map(day => day.day);

    const isWorkoutDay = workoutDays.includes(todayName);
    const wasAlreadyChecked = state.completedDays?.includes(todayStr);
    
    if (isWorkoutDay && !wasAlreadyChecked) {
      const lastVisit = state.lastWorkoutDate;
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (lastVisit && new Date(lastVisit) < yesterday) {
        applyPunishment();
      } else if (!lastVisit) {
        const yesterdayName = yesterday.toLocaleDateString('en-US', { weekday: 'long' });
        if (workoutDays.includes(yesterdayName)) {
          applyPunishment();
        }
      }
    }

    if (workoutPlan.workout_plan) {
      const updatedState = {
        ...state,
        weeklyPlan: workoutDays,
      };
      savePunishmentState(updatedState);
      setState(updatedState);
    }
  };

  const applyPunishment = () => {
    const intensity = Math.min(3, 1 + Math.floor(state.missedDays / 2));
    const punishment = getRandomPunishment(intensity);
    setCurrentPunishment(punishment);
    setShowPunishment(true);
    setPunishmentCompleted(false);
    
    const newState = {
      ...state,
      missedDays: state.missedDays + 1,
      streak: 0,
      punishments: [...(state.punishments || []), {
        ...punishment,
        date: new Date().toISOString(),
        completed: false,
      }],
    };
    savePunishmentState(newState);
    setState(newState);
  };

  const completeWorkout = () => {
    const today = new Date().toISOString().split('T')[0];
    const newState = {
      ...state,
      streak: state.streak + 1,
      totalWorkouts: state.totalWorkouts + 1,
      lastWorkoutDate: new Date().toISOString(),
      completedDays: [...(state.completedDays || []), today],
    };
    savePunishmentState(newState);
    setState(newState);
    onComplete?.();
  };

  const dismissPunishment = () => {
    setShowPunishment(false);
  };

  const markPunishmentDone = () => {
    const updatedPunishments = state.punishments.map((p, i) => 
      i === state.punishments.length - 1 ? { ...p, completed: true } : p
    );
    const newState = { ...state, punishments: updatedPunishments };
    savePunishmentState(newState);
    setState(newState);
    setShowPunishment(false);
    setPunishmentCompleted(true);
  };

  const getStreakMessage = () => {
    if (state.streak === 0) return "Start your streak today!";
    if (state.streak === 1) return "1 day streak! Keep going!";
    if (state.streak < 7) return `${state.streak} day streak!`;
    if (state.streak < 30) return `Amazing! ${state.streak} day streak!`;
    return `Legendary! ${state.streak} day streak!`;
  };

  const getIntensityColor = (intensity) => {
    switch (intensity) {
      case 1: return { bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.3)", text: "#86efac" };
      case 2: return { bg: "rgba(251,191,36,0.1)", border: "rgba(251,191,36,0.3)", text: "#fcd34d" };
      case 3: return { bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.3)", text: "#fca5a5" };
      default: return { bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.1)", text: "#94a3b8" };
    }
  };

  return (
    <>
      {/* Stats Toggle Button */}
      <button
        onClick={() => setShowStats(!showStats)}
        style={{
          position: "fixed",
          bottom: "1.5rem",
          right: "1.5rem",
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          background: state.streak > 0 
            ? "linear-gradient(135deg, #f97316, #ef4444)" 
            : "rgba(255,255,255,0.1)",
          border: "2px solid rgba(255,255,255,0.2)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          zIndex: 40,
          transition: "transform 0.2s",
        }}
      >
        <Trophy style={{ width: "24px", height: "24px", color: "#fff" }} />
        {state.streak > 0 && (
          <span style={{
            position: "absolute",
            top: "-4px",
            right: "-4px",
            background: "#10b981",
            color: "#fff",
            fontSize: "10px",
            fontWeight: "bold",
            padding: "2px 6px",
            borderRadius: "10px",
          }}>
            {state.streak}
          </span>
        )}
      </button>

      {/* Stats Panel */}
      <AnimatePresence>
        {showStats && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            style={{
              position: "fixed",
              bottom: "5rem",
              right: "1.5rem",
              width: "300px",
              background: "#ffffff",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "1rem",
              padding: "1.25rem",
              zIndex: 50,
              boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
              <Trophy style={{ width: "20px", height: "20px", color: "#f97316" }} />
              <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: "bold", color: "#f1f5f9" }}>
                Your Progress
              </h3>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
              <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: "0.75rem", padding: "0.75rem", textAlign: "center" }}>
                <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#f97316" }}>{state.streak}</div>
                <div style={{ fontSize: "0.7rem", color: "#64748b" }}>Day Streak</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: "0.75rem", padding: "0.75rem", textAlign: "center" }}>
                <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#10b981" }}>{state.totalWorkouts}</div>
                <div style={{ fontSize: "0.7rem", color: "#64748b" }}>Workouts</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: "0.75rem", padding: "0.75rem", textAlign: "center" }}>
                <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#ef4444" }}>{state.missedDays}</div>
                <div style={{ fontSize: "0.7rem", color: "#64748b" }}>Missed</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: "0.75rem", padding: "0.75rem", textAlign: "center" }}>
                <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#f97316" }}>{state.punishments?.filter(p => p.completed).length || 0}</div>
                <div style={{ fontSize: "0.7rem", color: "#64748b" }}>Punishments Done</div>
              </div>
            </div>

            <p style={{ margin: 0, fontSize: "0.8rem", color: "#94a3b8", textAlign: "center", fontStyle: "italic" }}>
              {getStreakMessage()}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Missed Workout Punishment Banner */}
      <AnimatePresence>
        {showPunishment && currentPunishment && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "90%",
              maxWidth: "450px",
              background: "#ffffff",
              border: `2px solid ${getIntensityColor(currentPunishment.intensity).border}`,
              borderRadius: "1.5rem",
              padding: "2rem",
              zIndex: 100,
              boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              <div style={{ 
                width: "60px", 
                height: "60px", 
                borderRadius: "50%", 
                background: getIntensityColor(currentPunishment.intensity).bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1rem"
              }}>
                <AlertTriangle style={{ width: "30px", height: "30px", color: getIntensityColor(currentPunishment.intensity).text }} />
              </div>
              <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.5rem", fontWeight: "900", color: "#ef4444" }}>
                WORKOUT MISSED!
              </h2>
              <p style={{ margin: 0, fontSize: "0.9rem", color: "#64748b" }}>
                {userName || "You"} skipped a workout day. Here's your punishment:
              </p>
            </div>

            <div style={{ 
              background: getIntensityColor(currentPunishment.intensity).bg, 
              border: `1px solid ${getIntensityColor(currentPunishment.intensity).border}`,
              borderRadius: "1rem",
              padding: "1.25rem",
              marginBottom: "1.5rem",
              textAlign: "center"
            }}>
              <div style={{ 
                fontSize: "0.7rem", 
                fontWeight: "bold", 
                color: getIntensityColor(currentPunishment.intensity).text,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: "0.5rem"
              }}>
                {currentPunishment.name}
              </div>
              <p style={{ margin: 0, fontSize: "1rem", color: "#f1f5f9", fontWeight: "600" }}>
                {currentPunishment.desc}
              </p>
            </div>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                onClick={markPunishmentDone}
                style={{
                  flex: 1,
                  padding: "0.875rem",
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  border: "none",
                  borderRadius: "0.75rem",
                  color: "#fff",
                  fontWeight: "700",
                  fontSize: "0.9rem",
                  cursor: "pointer",
                }}
              >
                I'll Do It!
              </button>
              <button
                onClick={dismissPunishment}
                style={{
                  flex: 1,
                  padding: "0.875rem",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "0.75rem",
                  color: "#94a3b8",
                  fontWeight: "600",
                  fontSize: "0.9rem",
                  cursor: "pointer",
                }}
              >
                Later
              </button>
            </div>

            {state.missedDays > 1 && (
              <p style={{ margin: "1rem 0 0", fontSize: "0.75rem", color: "#ef4444", textAlign: "center" }}>
                You've missed {state.missedDays} workouts total. Stay consistent!
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Complete Workout Button */}
      <button
        onClick={completeWorkout}
        style={{
          position: "fixed",
          bottom: "1.5rem",
          left: "1.5rem",
          padding: "0.875rem 1.5rem",
          background: "linear-gradient(135deg, #10b981, #059669)",
          border: "none",
          borderRadius: "2rem",
          color: "#fff",
          fontWeight: "700",
          fontSize: "0.9rem",
          cursor: "pointer",
          boxShadow: "0 4px 20px rgba(16,185,129,0.4)",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          zIndex: 40,
        }}
      >
        <Zap style={{ width: "18px", height: "18px" }} />
        Complete Workout
      </button>
    </>
  );
}
