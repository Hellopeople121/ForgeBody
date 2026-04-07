import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trophy, AlertTriangle, Zap, Play, SkipForward, Clock, 
  CheckCircle, Flame, Dumbbell, Heart, ChevronRight, 
  Wind, Coffee, Target, ArrowRight, RotateCcw, X 
} from "lucide-react";

const PUNISHMENT_STORAGE_KEY = "forgebody_workout_punishment";

const getDefaultState = () => ({
  streak: 0,
  missedDays: 0,
  totalWorkouts: 0,
  lastWorkoutDate: null,
  completedWorkouts: [],
  skippedWorkouts: [],
  currentDayIndex: 0,
  currentPhase: 'idle',
  difficultyMultiplier: 1,
  workoutHistory: [],
});

const loadState = () => {
  try {
    const stored = localStorage.getItem(PUNISHMENT_STORAGE_KEY);
    return stored ? JSON.parse(stored) : getDefaultState();
  } catch {
    return getDefaultState();
  }
};

const saveState = (state) => {
  localStorage.setItem(PUNISHMENT_STORAGE_KEY, JSON.stringify(state));
};

const WARMUP_EXERCISES = [
  "Jumping Jacks",
  "High Knees",
  "Arm Circles",
  "Bodyweight Squats",
  "Lunges",
  "Butt Kicks",
  "Torso Twists",
  "Neck Rolls",
];

const COOLDOWN_EXERCISES = [
  "Child's Pose - 30 seconds",
  "Cat-Cow Stretch - 30 seconds",
  "Standing Forward Fold - 30 seconds",
  "Quad Stretch (each leg) - 30 seconds",
  "Tricep Stretch (each arm) - 30 seconds",
  "Deep Breathing - 1 minute",
];

export default function WorkoutTracker({ workoutPlan }) {
  const [state, setState] = useState(loadState);
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [workoutPhase, setWorkoutPhase] = useState('idle');
  const [currentExercise, setCurrentExercise] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showSkipWarning, setShowSkipWarning] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const timerRef = useRef(null);

  const isRestDay = (dayIndex) => {
    const day = workoutPlan?.workout_plan?.[dayIndex];
    return !day?.exercises || day.exercises.length === 0;
  };

  const isWorkoutDay = (dayIndex) => {
    return !isRestDay(dayIndex);
  };

  const isToday = (dayIndex) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = days[new Date().getDay()];
    return workoutPlan?.workout_plan?.[dayIndex]?.day === today;
  };

  const isCompleted = (dayIndex) => {
    return state.completedWorkouts?.includes(dayIndex) || 
           state.completedWorkouts?.includes(workoutPlan?.workout_plan?.[dayIndex]?.day);
  };

  const isSkipped = (dayIndex) => {
    return state.skippedWorkouts?.includes(dayIndex) || 
           state.skippedWorkouts?.includes(workoutPlan?.workout_plan?.[dayIndex]?.day);
  };

  const canStartWorkout = (dayIndex) => {
    if (!isWorkoutDay(dayIndex)) return false;
    if (isCompleted(dayIndex)) return false;
    
    const day = workoutPlan?.workout_plan?.[dayIndex];
    const dayName = day?.day;
    
    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const currentDayIndex = dayOrder.indexOf(dayName);
    const todayIndex = dayOrder.indexOf(['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()]);
    
    return currentDayIndex <= todayIndex;
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startWarmup = (dayIndex) => {
    setActiveWorkout({
      dayIndex,
      dayName: workoutPlan.workout_plan[dayIndex].day,
      exercises: [
        ...WARMUP_EXERCISES.map(name => ({
          name,
          duration: 30,
          type: 'warmup'
        })),
        ...workoutPlan.workout_plan[dayIndex].exercises.map(ex => ({
          name: ex.name,
          sets: ex.sets,
          reps: ex.reps,
          duration: ex.duration,
          note: ex.note,
          type: 'main'
        })),
        ...COOLDOWN_EXERCISES.map(name => ({
          name,
          duration: 30,
          type: 'cooldown'
        }))
      ],
      currentDifficulty: state.difficultyMultiplier
    });
    setWorkoutPhase('warmup');
    setCurrentExercise(0);
    setTimeRemaining(30);
    startTimer();
  };

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleExerciseComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleExerciseComplete = () => {
    const workout = activeWorkout;
    if (currentExercise >= workout.exercises.length - 1) {
      completeWorkout();
    } else {
      setCurrentExercise(prev => prev + 1);
      const nextExercise = workout.exercises[currentExercise + 1];
      setTimeRemaining(nextExercise.duration || 30);
    }
  };

  const skipExercise = () => {
    handleExerciseComplete();
  };

  const completeWorkout = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    const completedEntry = {
      dayIndex: activeWorkout.dayIndex,
      dayName: activeWorkout.dayName,
      date: new Date().toISOString(),
      difficulty: activeWorkout.currentDifficulty,
    };

    const newState = {
      ...state,
      streak: state.streak + 1,
      totalWorkouts: (state.totalWorkouts || 0) + 1,
      lastWorkoutDate: new Date().toISOString(),
      completedWorkouts: [...(state.completedWorkouts || []), activeWorkout.dayIndex],
      workoutHistory: [...(state.workoutHistory || []), completedEntry],
    };
    
    saveState(newState);
    setState(newState);
    setWorkoutPhase('completed');
    setShowCompletion(true);
  };

  const handleSkipWorkout = () => {
    setShowSkipWarning(true);
  };

  const confirmSkip = () => {
    const newDifficulty = Math.min(3, state.difficultyMultiplier + 0.2);
    
    const skippedEntry = {
      dayIndex: activeWorkout.dayIndex,
      dayName: activeWorkout.dayName,
      date: new Date().toISOString(),
      newDifficulty,
    };

    const newState = {
      ...state,
      streak: 0,
      missedDays: (state.missedDays || 0) + 1,
      skippedWorkouts: [...(state.skippedWorkouts || []), activeWorkout.dayIndex],
      difficultyMultiplier: newDifficulty,
      workoutHistory: [...(state.workoutHistory || []), skippedEntry],
    };
    
    saveState(newState);
    setState(newState);
    
    if (timerRef.current) clearInterval(timerRef.current);
    setActiveWorkout(null);
    setWorkoutPhase('idle');
    setShowSkipWarning(false);
  };

  const closeCompletion = () => {
    setShowCompletion(false);
    setActiveWorkout(null);
    setWorkoutPhase('idle');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPhaseColor = (type) => {
    switch (type) {
      case 'warmup': return { bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.4)', text: '#60a5fa' };
      case 'cooldown': return { bg: 'rgba(34, 197, 94, 0.15)', border: 'rgba(34, 197, 94, 0.4)', text: '#4ade80' };
      default: return { bg: 'rgba(249, 115, 22, 0.15)', border: 'rgba(249, 115, 22, 0.4)', text: '#f97316' };
    }
  };

  const getPhaseLabel = (type) => {
    switch (type) {
      case 'warmup': return 'WARM UP';
      case 'cooldown': return 'COOL DOWN';
      default: return 'MAIN WORKOUT';
    }
  };

  if (!workoutPlan?.workout_plan) return null;

  return (
    <>
      {/* Stats Toggle Button */}
      <button
        onClick={() => setShowStats(!showStats)}
        style={{
          position: "fixed",
          top: "1.5rem",
          right: "1.5rem",
          width: "48px",
          height: "48px",
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
        }}
      >
        <Trophy style={{ width: "22px", height: "22px", color: "#fff" }} />
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
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: "fixed",
              top: "5rem",
              right: "1.5rem",
              width: "280px",
              background: "rgba(15,23,42,0.98)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "1rem",
              padding: "1.25rem",
              zIndex: 50,
              boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: "bold", color: "#f1f5f9", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Trophy style={{ width: "18px", height: "18px", color: "#f97316" }} />
                Progress
              </h3>
              <button onClick={() => setShowStats(false)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer" }}>
                <X style={{ width: "18px", height: "18px" }} />
              </button>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
              <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: "0.75rem", padding: "0.75rem", textAlign: "center" }}>
                <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#f97316" }}>{state.streak}</div>
                <div style={{ fontSize: "0.7rem", color: "#64748b" }}>Day Streak</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: "0.75rem", padding: "0.75rem", textAlign: "center" }}>
                <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#10b981" }}>{state.totalWorkouts || 0}</div>
                <div style={{ fontSize: "0.7rem", color: "#64748b" }}>Completed</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: "0.75rem", padding: "0.75rem", textAlign: "center" }}>
                <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#ef4444" }}>{state.missedDays || 0}</div>
                <div style={{ fontSize: "0.7rem", color: "#64748b" }}>Skipped</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: "0.75rem", padding: "0.75rem", textAlign: "center" }}>
                <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#f97316" }}>
                  {state.difficultyMultiplier ? `${Math.round(state.difficultyMultiplier * 100)}%` : '100%'}
                </div>
                <div style={{ fontSize: "0.7rem", color: "#64748b" }}>Difficulty</div>
              </div>
            </div>

            {state.streak > 0 && (
              <p style={{ margin: 0, fontSize: "0.8rem", color: "#86efac", textAlign: "center", fontWeight: "600" }}>
                🔥 {state.streak} day streak! Keep going!
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Workout Modal */}
      <AnimatePresence>
        {activeWorkout && workoutPhase !== 'completed' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 100,
              padding: "1rem",
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              style={{
                width: "100%",
                maxWidth: "500px",
                background: "rgba(15,23,42,0.98)",
                border: `1px solid ${getPhaseColor(activeWorkout.exercises[currentExercise]?.type).border}`,
                borderRadius: "1.5rem",
                padding: "2rem",
                textAlign: "center",
              }}
            >
              <div style={{ marginBottom: "1.5rem" }}>
                <span style={{
                  padding: "0.3rem 0.75rem",
                  borderRadius: "2rem",
                  fontSize: "0.7rem",
                  fontWeight: "bold",
                  background: getPhaseColor(activeWorkout.exercises[currentExercise]?.type).bg,
                  color: getPhaseColor(activeWorkout.exercises[currentExercise]?.type).text,
                  border: `1px solid ${getPhaseColor(activeWorkout.exercises[currentExercise]?.type).border}`,
                }}>
                  {getPhaseLabel(activeWorkout.exercises[currentExercise]?.type)}
                </span>
                <h2 style={{ margin: "1rem 0 0.5rem", fontSize: "1.25rem", fontWeight: "bold", color: "#f1f5f9" }}>
                  {activeWorkout.exercises[currentExercise]?.name}
                </h2>
                {activeWorkout.exercises[currentExercise]?.type === 'main' && (
                  <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>
                    {activeWorkout.exercises[currentExercise]?.sets} × {activeWorkout.exercises[currentExercise]?.reps}
                    {activeWorkout.exercises[currentExercise]?.duration && ` • ${activeWorkout.exercises[currentExercise].duration}`}
                  </p>
                )}
              </div>

              <div style={{ 
                fontSize: "4rem", 
                fontWeight: "bold", 
                color: "#f97316",
                margin: "2rem 0",
                fontFamily: "monospace",
              }}>
                {formatTime(timeRemaining)}
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <div style={{ 
                  width: "100%", 
                  height: "8px", 
                  background: "rgba(255,255,255,0.1)", 
                  borderRadius: "4px",
                  overflow: "hidden"
                }}>
                  <div style={{
                    width: `${((currentExercise + 1) / activeWorkout.exercises.length) * 100}%`,
                    height: "100%",
                    background: "linear-gradient(90deg, #f97316, #ef4444)",
                    borderRadius: "4px",
                    transition: "width 0.3s",
                  }} />
                </div>
                <p style={{ margin: "0.5rem 0 0", fontSize: "0.75rem", color: "#64748b" }}>
                  {currentExercise + 1} of {activeWorkout.exercises.length}
                </p>
              </div>

              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  onClick={skipExercise}
                  style={{
                    flex: 1,
                    padding: "0.875rem",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "0.75rem",
                    color: "#94a3b8",
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                  }}
                >
                  <SkipForward style={{ width: "18px", height: "18px" }} />
                  Skip
                </button>
                <button
                  onClick={completeWorkout}
                  style={{
                    flex: 2,
                    padding: "0.875rem",
                    background: "linear-gradient(135deg, #f97316, #ef4444)",
                    border: "none",
                    borderRadius: "0.75rem",
                    color: "#fff",
                    fontWeight: "700",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                  }}
                >
                  <CheckCircle style={{ width: "18px", height: "18px" }} />
                  Finish Workout
                </button>
              </div>

              <button
                onClick={() => {
                  if (timerRef.current) clearInterval(timerRef.current);
                  setActiveWorkout(null);
                  setWorkoutPhase('idle');
                  handleSkipWorkout();
                }}
                style={{
                  marginTop: "1rem",
                  background: "none",
                  border: "none",
                  color: "#ef4444",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Exit & Skip This Workout
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skip Warning Modal */}
      <AnimatePresence>
        {showSkipWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 100,
              padding: "1rem",
            }}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              style={{
                width: "100%",
                maxWidth: "400px",
                background: "rgba(15,23,42,0.98)",
                border: "2px solid rgba(239,68,68,0.5)",
                borderRadius: "1.5rem",
                padding: "2rem",
                textAlign: "center",
              }}
            >
              <div style={{ 
                width: "60px", 
                height: "60px", 
                borderRadius: "50%", 
                background: "rgba(239,68,68,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1rem"
              }}>
                <AlertTriangle style={{ width: "30px", height: "30px", color: "#ef4444" }} />
              </div>
              
              <h2 style={{ margin: "0 0 1rem", fontSize: "1.5rem", fontWeight: "bold", color: "#ef4444" }}>
                Skip This Workout?
              </h2>
              
              <p style={{ margin: "0 0 1.5rem", color: "#94a3b8", lineHeight: 1.6 }}>
                If you skip, <strong style={{ color: "#f1f5f9" }}>tomorrow's workout will be harder!</strong>
                <br /><br />
                Your streak will reset and the next workout difficulty increases by 20%.
              </p>

              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  onClick={() => setShowSkipWarning(false)}
                  style={{
                    flex: 1,
                    padding: "0.875rem",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "0.75rem",
                    color: "#94a3b8",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Go Back
                </button>
                <button
                  onClick={confirmSkip}
                  style={{
                    flex: 1,
                    padding: "0.875rem",
                    background: "rgba(239,68,68,0.15)",
                    border: "1px solid rgba(239,68,68,0.4)",
                    borderRadius: "0.75rem",
                    color: "#ef4444",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                >
                  Skip Anyway
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Workout Completion Modal */}
      <AnimatePresence>
        {showCompletion && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 100,
              padding: "1rem",
            }}
          >
            <motion.div
              style={{
                width: "100%",
                maxWidth: "450px",
                background: "linear-gradient(135deg, rgba(16,185,129,0.1), rgba(5,150,105,0.1))",
                border: "2px solid rgba(16,185,129,0.5)",
                borderRadius: "1.5rem",
                padding: "2.5rem",
                textAlign: "center",
              }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                style={{ 
                  width: "80px", 
                  height: "80px", 
                  borderRadius: "50%", 
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 1.5rem"
                }}
              >
                <CheckCircle style={{ width: "40px", height: "40px", color: "#fff" }} />
              </motion.div>
              
              <h2 style={{ margin: "0 0 0.5rem", fontSize: "2rem", fontWeight: "bold", color: "#10b981" }}>
                Workout Complete!
              </h2>
              
              <p style={{ margin: "0 0 0.5rem", color: "#f1f5f9", fontSize: "1.25rem", fontWeight: "600" }}>
                {activeWorkout?.dayName}
              </p>

              <p style={{ margin: "0 0 1.5rem", color: "#94a3b8" }}>
                Great job! Your streak is now <strong style={{ color: "#f97316" }}>{state.streak} days</strong>
              </p>

              <div style={{ 
                display: "flex", 
                justifyContent: "center", 
                gap: "1rem",
                marginBottom: "1.5rem",
              }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#10b981" }}>🔥</div>
                  <div style={{ fontSize: "0.7rem", color: "#64748b" }}>Streak</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#10b981" }}>✓</div>
                  <div style={{ fontSize: "0.7rem", color: "#64748b" }}>Completed</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#10b981" }}>💪</div>
                  <div style={{ fontSize: "0.7rem", color: "#64748b" }}>Keep Going!</div>
                </div>
              </div>

              <button
                onClick={closeCompletion}
                style={{
                  width: "100%",
                  padding: "1rem",
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  border: "none",
                  borderRadius: "0.875rem",
                  color: "#fff",
                  fontWeight: "700",
                  fontSize: "1rem",
                  cursor: "pointer",
                }}
              >
                Continue
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Workout Day Cards */}
      <div style={{ marginTop: "2rem" }}>
        <h3 style={{ margin: "0 0 1rem", fontSize: "1rem", fontWeight: "bold", color: "#f1f5f9", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Dumbbell style={{ width: "18px", height: "18px", color: "#f97316" }} />
          Weekly Schedule
        </h3>
        
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {workoutPlan.workout_plan.map((day, index) => {
            const rest = isRestDay(index);
            const completed = isCompleted(index);
            const skipped = isSkipped(index);
            const canStart = canStartWorkout(index);
            const today = isToday(index);

            return (
              <div
                key={index}
                style={{
                  background: completed 
                    ? "rgba(16,185,129,0.08)" 
                    : rest 
                      ? "rgba(99,102,241,0.05)"
                      : canStart
                        ? "rgba(249,115,22,0.08)"
                        : "rgba(255,255,255,0.03)",
                  border: `1px solid ${completed 
                    ? "rgba(16,185,129,0.2)" 
                    : rest 
                      ? "rgba(99,102,241,0.15)"
                      : canStart
                        ? "rgba(249,115,22,0.25)"
                      : "rgba(255,255,255,0.06)"}`,
                  borderRadius: "1rem",
                  padding: "1rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    background: completed 
                      ? "rgba(16,185,129,0.2)" 
                      : rest 
                        ? "rgba(99,102,241,0.2)"
                        : canStart
                          ? "rgba(249,115,22,0.2)"
                          : "rgba(255,255,255,0.05)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    {completed ? (
                      <CheckCircle style={{ width: "20px", height: "20px", color: "#10b981" }} />
                    ) : rest ? (
                      <Coffee style={{ width: "18px", height: "18px", color: "#818cf8" }} />
                    ) : skipped ? (
                      <SkipForward style={{ width: "18px", height: "18px", color: "#ef4444" }} />
                    ) : canStart ? (
                      <Play style={{ width: "18px", height: "18px", color: "#f97316" }} />
                    ) : (
                      <Clock style={{ width: "18px", height: "18px", color: "#64748b" }} />
                    )}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: "600", color: "#f1f5f9", fontSize: "0.9rem" }}>
                      {day.day}
                      {today && <span style={{ color: "#f97316", marginLeft: "0.5rem", fontSize: "0.75rem" }}>• Today</span>}
                    </p>
                    <p style={{ margin: 0, fontSize: "0.75rem", color: "#64748b" }}>
                      {rest ? "Rest Day" : completed ? "Completed ✓" : skipped ? "Skipped (harder tomorrow!)" : canStart ? "Ready to start" : "Not available yet"}
                    </p>
                  </div>
                </div>

                {!rest && canStart && !completed && !skipped && (
                  <button
                    onClick={() => startWarmup(index)}
                    style={{
                      padding: "0.5rem 1rem",
                      background: "linear-gradient(135deg, #f97316, #ef4444)",
                      border: "none",
                      borderRadius: "2rem",
                      color: "#fff",
                      fontWeight: "600",
                      fontSize: "0.8rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem",
                    }}
                  >
                    <Play style={{ width: "14px", height: "14px" }} />
                    Start
                  </button>
                )}
                
                {rest && (
                  <span style={{
                    padding: "0.3rem 0.8rem",
                    background: "rgba(99,102,241,0.15)",
                    borderRadius: "2rem",
                    fontSize: "0.75rem",
                    color: "#818cf8",
                  }}>
                    Rest
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
