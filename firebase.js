import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const isFirebaseConfigured = firebaseConfig.apiKey && firebaseConfig.apiKey !== "your-api-key";

let app = null;
let auth = null;
let googleProvider = null;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
  } catch (error) {
    console.warn("Firebase initialization failed:", error);
  }
}

export const isFirebaseReady = isFirebaseConfigured && auth !== null;

export const signInWithGoogle = async () => {
  if (!isFirebaseReady) {
    throw new Error("Firebase not configured. Please add Firebase credentials to .env.local");
  }
  
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    const loginData = {
      email: user.email,
      name: user.displayName,
      photoURL: user.photoURL,
      uid: user.uid,
      lastLogin: new Date().toISOString(),
    };
    
    saveLoginData(loginData);
    return user;
  } catch (error) {
    console.error("Google sign-in error:", error);
    throw error;
  }
};

const saveLoginData = (loginData) => {
  let loginHistory = JSON.parse(localStorage.getItem("forgebody_login_history") || "[]");
  loginHistory.unshift({
    ...loginData,
    loginTime: new Date().toISOString(),
  });
  localStorage.setItem("forgebody_login_history", JSON.stringify(loginHistory));
  localStorage.setItem("forgebody_user", JSON.stringify(loginData));
};

export const logoutWithGoogle = async () => {
  if (auth) {
    try {
      await signOut(auth);
    } catch (error) {
      console.warn("Firebase sign out warning:", error);
    }
  }
  localStorage.removeItem("forgebody_user");
};

export const getStoredUser = () => {
  const stored = localStorage.getItem("forgebody_user");
  return stored ? JSON.parse(stored) : null;
};

export const getLoginHistory = () => {
  const stored = localStorage.getItem("forgebody_login_history");
  return stored ? JSON.parse(stored) : [];
};

export const getLoginCount = () => {
  return getLoginHistory().length;
};

export { onAuthStateChanged };
