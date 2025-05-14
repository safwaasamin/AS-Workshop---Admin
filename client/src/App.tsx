import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";

// Pages
import Dashboard from "@/pages/Dashboard";
import Attendees from "@/pages/Attendees";
import Mentors from "@/pages/Mentors";
import Feedback from "@/pages/Feedback";
import Tasks from "@/pages/Tasks";
import Reports from "@/pages/Reports";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/attendees" component={Attendees} />
      <ProtectedRoute path="/mentors" component={Mentors} />
      <ProtectedRoute path="/feedback" component={Feedback} />
      <ProtectedRoute path="/tasks" component={Tasks} />
      <ProtectedRoute path="/reports" component={Reports} />
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
