import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClerkProvider, useUser } from "@clerk/clerk-react";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Leads from "@/pages/leads";
import Team from "@/pages/team";
import Attendance from "@/pages/attendance";
import ActivityLogs from "@/pages/activity-logs";
import AppLayout from "@/components/layout/app-layout";

function Router() {
  const { isSignedIn, isLoaded, user } = useUser();

  // Debug logging
  console.log('Router state:', { 
    isSignedIn, 
    isLoaded, 
    hasUser: !!user,
    userId: user?.id 
  });

  return (
    <Switch>
      {!isLoaded ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading...</p>
          </div>
        </div>
      ) : !isSignedIn ? (
        <Route path="/" component={Landing} />
      ) : (
        <AppLayout>
          <Route path="/" component={Dashboard} />
          <Route path="/leads" component={Leads} />
          <Route path="/team" component={Team} />
          <Route path="/attendance" component={Attendance} />
          <Route path="/activity-logs" component={ActivityLogs} />
        </AppLayout>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  
  console.log('Clerk publishable key:', publishableKey);
  
  if (!publishableKey) {
    throw new Error("Missing Publishable Key");
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default App;
