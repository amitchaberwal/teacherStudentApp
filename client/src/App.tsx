import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "./hooks/use-auth";
import NotFound from "@/pages/not-found";
import Header from "./components/Header";
import Footer from "./components/Footer";
import RoleSelection from "./pages/role-selection";
import { AuthProvider } from "./context/auth-context";

// Teacher pages
import TeacherDashboard from "./pages/teacher/teacher-dashboard";
import CreateClass from "./pages/teacher/create-class";

// Student pages
import StudentDashboard from "./pages/student/student-dashboard";
import JoinClass from "./pages/student/join-class";
import ToastNotification from "./components/ui/toast-notification";

function Router() {
  const { user, isAuthenticated } = useAuth();

  return (
    <Switch>
      <Route path="/" component={RoleSelection} />
      
      {/* Teacher routes */}
      <Route path="/teacher/dashboard">
        {isAuthenticated && user?.role === "teacher" ? <TeacherDashboard /> : <RoleSelection />}
      </Route>
      <Route path="/teacher/create-class">
        {isAuthenticated && user?.role === "teacher" ? <CreateClass /> : <RoleSelection />}
      </Route>
      
      {/* Student routes */}
      <Route path="/student/dashboard">
        {isAuthenticated && user?.role === "student" ? <StudentDashboard /> : <RoleSelection />}
      </Route>
      <Route path="/student/join-class">
        {isAuthenticated && user?.role === "student" ? <JoinClass /> : <RoleSelection />}
      </Route>
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <TooltipProvider>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">
            <ToastNotification />
            <Router />
          </main>
          <Footer />
        </div>
        <Toaster />
      </TooltipProvider>
    </AuthProvider>
  );
}

export default App;
