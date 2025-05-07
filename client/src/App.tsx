import { useEffect } from "react";
import { Switch, Route, useLocation, useRoute } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { isAuthenticated } from "./lib/auth";

// Pages
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Attendees from "@/pages/Attendees";
import Mentors from "@/pages/Mentors";
import Feedback from "@/pages/Feedback";
import Tasks from "@/pages/Tasks";
import Reports from "@/pages/Reports";
import NotFound from "@/pages/not-found";

// Protected route component
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    if (!isAuthenticated()) {
      setLocation('/login');
    }
  }, [setLocation]);
  
  return isAuthenticated() ? <Component /> : null;
}

function Router() {
  const [match] = useRoute("/");
  
  useEffect(() => {
    if (match && !isAuthenticated()) {
      window.location.href = "/login";
    }
  }, [match]);
  
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/attendees" component={() => <ProtectedRoute component={Attendees} />} />
      <Route path="/mentors" component={() => <ProtectedRoute component={Mentors} />} />
      <Route path="/feedback" component={() => <ProtectedRoute component={Feedback} />} />
      <Route path="/tasks" component={() => <ProtectedRoute component={Tasks} />} />
      <Route path="/reports" component={() => <ProtectedRoute component={Reports} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
