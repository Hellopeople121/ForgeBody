/**
 * Login & missed workout tracker using localStorage.
 *
 * Stores:
 * - loginCount
 * - lastLoginDate
 * - workoutDaysOfWeek: array of day-of-week numbers (0=Sun) that are workout days
 * - missedChallenge: { active, challengeIndex } - a pending challenge if user missed a workout day
 */

const KEY = "fitnessTracker";

function getStore() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}

function setStore(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

// Pool of varied challenges - each miss gets a different one
const CHALLENGES = [
  {
    title: "Extra Burnout Round 🔥",
    desc: "Add 1 full extra set to every exercise today.",
  },
  {
    title: "No Rest Between Sets 💪",
    desc: "Reduce rest periods to 20 seconds max between all sets.",
  },
  {
    title: "Slow Reps Challenge 🐢",
    desc: "Do every rep with a 3-second down, 3-second up tempo.",
  },
  {
    title: "Double Cardio Finisher 🏃",
    desc: "Add 10 minutes of high-intensity cardio at the end of today's session.",
  },
  {
    title: "Superset Everything ⚡",
    desc: "Pair every exercise with the next one into supersets with no rest in between.",
  },
  {
    title: "20% More Reps 📈",
    desc: "Add 20% more reps to every exercise this session.",
  },
  {
    title: "Drop Set Finish 💥",
    desc: "On your last set of each exercise, immediately drop the weight and do 10 more reps.",
  },
  {
    title: "Core Penalty 🏋️",
    desc: "Start the session with 3 rounds of: 20 crunches, 30s plank, 15 leg raises.",
  },
];

/**
 * Call on app load. Returns:
 * { loginCount, missedChallenge: { title, desc } | null }
 */
export function trackLogin(daysPerWeek) {
  const store = getStore();
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const lastLogin = store.lastLoginDate;

  // Increment login count
  const loginCount = (store.loginCount || 0) + 1;

  // Determine if yesterday was a workout day AND user didn't log in
  let missedChallenge = null;

  if (lastLogin && lastLogin !== todayStr) {
    const last = new Date(lastLogin);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    // Check each day between lastLogin and today (exclusive)
    // We only care about WORKOUT days being skipped (not rest days)
    // We use the stored workoutDays array (set when a plan is generated)
    const workoutDays = store.workoutDays || []; // array of "YYYY-MM-DD" strings of scheduled workout days

    // Find any scheduled workout days between lastLogin (exclusive) and today (exclusive)
    const missedWorkoutDays = workoutDays.filter(
      (d) => d > lastLogin && d < todayStr,
    );

    if (missedWorkoutDays.length > 0) {
      // Pick a challenge - rotate based on how many total misses have happened
      const missCount = store.totalMisses || 0;
      const challengeIndex = missCount % CHALLENGES.length;
      missedChallenge = CHALLENGES[challengeIndex];

      setStore({
        ...store,
        loginCount,
        lastLoginDate: todayStr,
        totalMisses: missCount + 1,
      });
      return { loginCount, missedChallenge };
    }
  }

  setStore({ ...store, loginCount, lastLoginDate: todayStr });
  return { loginCount, missedChallenge: null };
}

/**
 * Call after generating a plan to register upcoming workout days.
 * daysPerWeek: number (e.g. 3)
 * Schedules workout days starting from today for the next 7 days.
 */
export function registerWorkoutDays(daysPerWeek) {
  const store = getStore();
  const today = new Date();
  const days = parseInt(daysPerWeek);
  const workoutDays = [];

  // Spread workout days evenly across the next 7 days
  // e.g. 3 days → days 0, 2, 4 (every other day roughly)
  const gap = Math.max(1, Math.floor(7 / days));
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i * gap);
    workoutDays.push(d.toISOString().split("T")[0]);
  }

  setStore({ ...store, workoutDays });
}

export function getLoginCount() {
  return getStore().loginCount || 0;
}
