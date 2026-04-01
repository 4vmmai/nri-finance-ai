import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  MessageSquare, BookOpen, Calculator, TrendingUp, Shield,
  Building2, IndianRupee, Globe, ArrowRight, Brain, Layers, Search, Zap, AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ChatSession, KnowledgeEntry } from "@shared/schema";

const QUICK_TOPICS = [
  { label: "NRE vs NRO vs FCNR", category: "Banking", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  { label: "Income Tax Filing", category: "Taxation", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
  { label: "Property Investment", category: "Investments", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" },
  { label: "FEMA Compliance", category: "Compliance", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" },
  { label: "DTAA Benefits", category: "Taxation", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
  { label: "Stock Market PIS", category: "Investments", color: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300" },
];

const AI_MODES_INFO = [
  {
    id: "conversational",
    name: "Conversational AI",
    icon: MessageSquare,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-200 dark:border-blue-800",
    desc: "Natural conversational answers to your NRI finance questions. Great for quick explanations and how-to guides.",
    badge: "Chat",
  },
  {
    id: "agentic",
    name: "Agentic AI",
    icon: Brain,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-900/20",
    border: "border-purple-200 dark:border-purple-800",
    desc: "Multi-step reasoning agent that breaks complex tasks into steps, analyzes each angle, and provides action plans.",
    badge: "Multi-step",
  },
  {
    id: "rag",
    name: "RAG AI",
    icon: Search,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    border: "border-emerald-200 dark:border-emerald-800",
    desc: "Retrieval-Augmented Generation — answers sourced directly from the verified NRI Finance Knowledge Base.",
    badge: "Knowledge-backed",
  },
  {
    id: "augmented",
    name: "Augmented AI",
    icon: Zap,
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-900/20",
    border: "border-orange-200 dark:border-orange-800",
    desc: "Combines your personal financial profile with AI to deliver personalized, context-aware investment guidance.",
    badge: "Personalized",
  },
];

const NEWS_UPDATES = [
  { title: "Budget 2025: LTCG on property reduced to 12.5%", category: "Tax", date: "2025" },
  { title: "Two self-occupied properties now exempt from notional rent", category: "Property", date: "2025" },
  { title: "TCS threshold raised to ₹10 lakh under LRS", category: "Remittance", date: "2025" },
  { title: "NRE-only PINS account required (NRO PINS discontinued)", category: "Investment", date: "2025" },
];

export default function Dashboard() {
  const { data: sessions } = useQuery<ChatSession[]>({
    queryKey: ["/api/sessions"],
  });
  const { data: knowledge } = useQuery<KnowledgeEntry[]>({
    queryKey: ["/api/knowledge"],
  });

  const sessionCount = sessions?.length || 0;
  const knowledgeCount = knowledge?.length || 0;

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-secondary/20 text-secondary-foreground border-secondary/30 text-xs">
              Budget 2025 Updated
            </Badge>
            <Badge variant="outline" className="text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 inline-block" />
              AI Ready
            </Badge>
          </div>
          <h1 className="text-3xl font-bold text-foreground leading-tight">
            NRI Finance AI Platform
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Your comprehensive AI-powered guide to managing finances in India — covering banking, taxation, investments, and FEMA compliance for Non-Resident Indians worldwide.
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "AI Modes", value: "4", icon: Brain, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20" },
            { label: "Knowledge Articles", value: String(knowledgeCount), icon: BookOpen, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
            { label: "Finance Topics", value: "20+", icon: Layers, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
            { label: "Chat Sessions", value: String(sessionCount), icon: MessageSquare, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-900/20" },
          ].map(stat => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon size={16} className={stat.color} />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <div className="text-xs text-muted-foreground">{stat.label}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: AI Modes + Quick Actions */}
          <div className="lg:col-span-2 space-y-6">
            {/* AI Modes */}
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Brain size={16} className="text-primary" />
                  4 AI Intelligence Modes
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  This platform uses Agentic AI, Augmented AI, RAG, and Conversational AI — each optimized for different query types.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {AI_MODES_INFO.map(mode => {
                  const Icon = mode.icon;
                  return (
                    <div
                      key={mode.id}
                      className={`flex gap-3 p-3 rounded-lg border ${mode.bg} ${mode.border}`}
                    >
                      <div className={`w-8 h-8 rounded-lg bg-white/60 dark:bg-black/20 flex items-center justify-center flex-shrink-0`}>
                        <Icon size={16} className={mode.color} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">{mode.name}</span>
                          <Badge variant="outline" className="text-[10px] py-0 h-4">{mode.badge}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{mode.desc}</p>
                      </div>
                    </div>
                  );
                })}
                <Link href="/chat">
                  <Button className="w-full mt-2 gap-2">
                    <MessageSquare size={15} />
                    Start AI Chat Session
                    <ArrowRight size={13} />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Quick Topic Access */}
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Search size={16} className="text-primary" />
                  Quick Finance Topics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  {QUICK_TOPICS.map(topic => (
                    <Link key={topic.label} href={`/knowledge?search=${encodeURIComponent(topic.label)}`}>
                      <Badge
                        className={`cursor-pointer text-xs py-1 px-2.5 hover:opacity-80 transition-opacity ${topic.color}`}
                        data-testid={`topic-${topic.label}`}
                      >
                        {topic.label}
                      </Badge>
                    </Link>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { icon: Building2, label: "Banking", href: "/knowledge?category=Banking" },
                    { icon: IndianRupee, label: "Taxation", href: "/knowledge?category=Taxation" },
                    { icon: TrendingUp, label: "Investments", href: "/knowledge?category=Investments" },
                    { icon: Shield, label: "Compliance", href: "/knowledge?category=Compliance" },
                    { icon: Calculator, label: "Calculators", href: "/calculator" },
                    { icon: Globe, label: "FEMA Rules", href: "/knowledge?search=FEMA" },
                  ].map(item => {
                    const Icon = item.icon;
                    return (
                      <Link key={item.label} href={item.href}>
                        <button
                          className="w-full p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors text-center group"
                          data-testid={`quick-${item.label.toLowerCase()}`}
                        >
                          <Icon size={18} className="mx-auto mb-1 text-primary group-hover:scale-110 transition-transform" />
                          <div className="text-xs font-medium">{item.label}</div>
                        </button>
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Updates + Links */}
          <div className="space-y-5">
            {/* Budget 2025 Updates */}
            <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-amber-800 dark:text-amber-300">
                  <AlertCircle size={14} />
                  Budget 2025 Key Updates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {NEWS_UPDATES.map((item, i) => (
                  <div key={i} className="flex gap-2.5">
                    <div className="w-1 bg-amber-400 rounded-full flex-shrink-0 mt-1.5" style={{height: "calc(100% - 6px)", minHeight: 8}} />
                    <div>
                      <div className="text-xs font-medium leading-snug">{item.title}</div>
                      <Badge variant="outline" className="text-[10px] mt-0.5 py-0 h-4 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400">
                        {item.category}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Key Topics by Category */}
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Finance Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { label: "Banking & Accounts", sub: "NRE, NRO, FCNR", icon: Building2, href: "/knowledge?category=Banking", color: "text-blue-600" },
                  { label: "Tax & Compliance", sub: "ITR, TDS, DTAA", icon: Shield, href: "/knowledge?category=Taxation", color: "text-red-600" },
                  { label: "Investments", sub: "Stocks, MF, Property", icon: TrendingUp, href: "/knowledge?category=Investments", color: "text-emerald-600" },
                  { label: "Legal & FEMA", sub: "Repatriation, Laws", icon: Globe, href: "/knowledge?category=Compliance", color: "text-purple-600" },
                ].map(cat => {
                  const Icon = cat.icon;
                  return (
                    <Link key={cat.label} href={cat.href}>
                      <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
                        <Icon size={15} className={cat.color} />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold">{cat.label}</div>
                          <div className="text-xs text-muted-foreground">{cat.sub}</div>
                        </div>
                        <ArrowRight size={12} className="text-muted-foreground/50 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </Link>
                  );
                })}
              </CardContent>
            </Card>

            {/* Calculators CTA */}
            <Card className="border-border bg-primary/5 dark:bg-primary/10">
              <CardContent className="p-4">
                <Calculator size={24} className="text-primary mb-2" />
                <h3 className="font-semibold text-sm mb-1">Financial Calculators</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Estimate taxes, calculate FD returns, check repatriation limits and more.
                </p>
                <Link href="/calculator">
                  <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs">
                    Open Calculators
                    <ArrowRight size={12} />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
