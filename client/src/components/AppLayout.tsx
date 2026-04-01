import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useTheme } from "./ThemeProvider";
import {
  LayoutDashboard, MessageSquare, BookOpen, Calculator, User,
  Sun, Moon, Menu, X, TrendingUp, Globe, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard, desc: "Overview" },
  { path: "/chat", label: "AI Assistant", icon: MessageSquare, desc: "Chat with AI", badge: "4 AI modes" },
  { path: "/knowledge", label: "Knowledge Base", icon: BookOpen, desc: "Laws & Rules" },
  { path: "/calculator", label: "Calculators", icon: Calculator, desc: "Tax & Returns" },
  { path: "/profile", label: "My Profile", icon: User, desc: "Preferences" },
];

const AI_MODES = [
  { id: "conversational", label: "Conversational AI", color: "bg-blue-500", desc: "Natural Q&A" },
  { id: "agentic", label: "Agentic AI", color: "bg-purple-500", desc: "Multi-step reasoning" },
  { id: "rag", label: "RAG AI", color: "bg-emerald-500", desc: "Knowledge retrieval" },
  { id: "augmented", label: "Augmented AI", color: "bg-orange-500", desc: "Personalized advice" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { theme, toggle } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const Sidebar = ({ mobile = false }) => (
    <div className={cn(
      "flex flex-col h-full",
      mobile ? "w-full" : "w-64"
    )}>
      {/* Logo */}
      <div className="p-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-label="NRI Finance AI Logo">
              <circle cx="12" cy="12" r="10" stroke="hsl(222 47% 11%)" strokeWidth="1.5" fill="none"/>
              <path d="M8 16V8l4 5 4-5v8" stroke="hsl(222 47% 11%)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="4" r="1.5" fill="hsl(222 47% 11%)"/>
            </svg>
          </div>
          <div>
            <div className="font-bold text-sidebar-foreground text-sm leading-tight">NRI Finance AI</div>
            <div className="text-sidebar-foreground/50 text-xs">India Finance Intelligence</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="text-xs font-semibold text-sidebar-foreground/40 px-3 py-2 uppercase tracking-wider">Navigation</div>
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const active = item.path === "/" ? location === "/" : location.startsWith(item.path);
          return (
            <Link
              key={item.path}
              href={item.path}
              onClick={() => setSidebarOpen(false)}
              data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground font-semibold"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <Icon size={16} className="flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.badge && !active && (
                <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-sidebar-border text-sidebar-foreground/50">
                  {item.badge}
                </Badge>
              )}
              {active && <ChevronRight size={14} className="opacity-60" />}
            </Link>
          );
        })}

        {/* AI Modes Panel */}
        <div className="mt-6">
          <div className="text-xs font-semibold text-sidebar-foreground/40 px-3 py-2 uppercase tracking-wider">AI Modes</div>
          <div className="space-y-1">
            {AI_MODES.map(mode => (
              <div key={mode.id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-sidebar-foreground/60">
                <div className={cn("w-2 h-2 rounded-full flex-shrink-0", mode.color)} />
                <span className="flex-1 font-medium">{mode.label}</span>
                <span className="text-sidebar-foreground/30">{mode.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center justify-between">
          <div className="text-xs text-sidebar-foreground/40">
            <div className="flex items-center gap-1.5">
              <Globe size={11} />
              <span>NRI Finance AI v2.0</span>
            </div>
            <div className="mt-0.5 text-sidebar-foreground/30">Budget 2025 • Updated</div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            className="h-8 w-8 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex bg-[hsl(var(--sidebar-background))] border-r border-[hsl(var(--sidebar-border))] flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="relative bg-[hsl(var(--sidebar-background))] w-72 h-full z-10">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 text-sidebar-foreground/60 hover:text-sidebar-foreground"
            >
              <X size={20} />
            </button>
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            className="h-8 w-8"
          >
            <Menu size={18} />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center">
              <TrendingUp size={14} className="text-foreground" />
            </div>
            <span className="font-bold text-sm">NRI Finance AI</span>
          </div>
          <div className="ml-auto">
            <Button variant="ghost" size="icon" onClick={toggle} className="h-8 w-8">
              {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
            </Button>
          </div>
        </div>

        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
