import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";
import KnowledgeBase from "./pages/KnowledgeBase";
import Calculator from "./pages/Calculator";
import Profile from "./pages/Profile";
import NotFound from "./pages/not-found";
import { ThemeProvider } from "./components/ThemeProvider";
import AppLayout from "./components/AppLayout";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Router hook={useHashLocation}>
          <AppLayout>
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/chat" component={Chat} />
              <Route path="/chat/:id" component={Chat} />
              <Route path="/knowledge" component={KnowledgeBase} />
              <Route path="/calculator" component={Calculator} />
              <Route path="/profile" component={Profile} />
              <Route component={NotFound} />
            </Switch>
          </AppLayout>
          <Toaster />
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
