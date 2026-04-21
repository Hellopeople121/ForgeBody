import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@/lib/query-client";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import PageNotFound from "./lib/PageNotFound";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import UserNotRegisteredError from "@/components/UserNotRegisteredError";
import Home from "./pages/Home";
import WorkoutPlan from "./pages/WorkoutPlan";
import ActiveWorkout from "./pages/ActiveWorkout";

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } =
    useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-orange-900 border-t-orange-500 rounded-full animate-spin"></div>
          <p className="text-slate-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === "user_not_registered")
      return <UserNotRegisteredError />;
    if (authError.type === "auth_required") {
      navigateToLogin();
      return null;
    }
    console.error("Auth error:", authError);
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/plan" element={<WorkoutPlan />} />
      <Route path="/workout" element={<ActiveWorkout />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}
