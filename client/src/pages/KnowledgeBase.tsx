import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearch } from "wouter";
import { BookOpen, Search, Tag, ChevronRight, Building2, Shield, TrendingUp, Scale, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { KnowledgeEntry } from "@shared/schema";

const CATEGORY_META: Record<string, { icon: typeof BookOpen; color: string; bg: string }> = {
  Banking: { icon: Building2, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
  Taxation: { icon: Shield, color: "text-red-600", bg: "bg-red-50 dark:bg-red-900/20" },
  Investments: { icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
  Compliance: { icon: Scale, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20" },
};

export default function KnowledgeBase() {
  const searchStr = useSearch();
  const urlSearch = new URLSearchParams(searchStr);
  const initialSearch = urlSearch.get("search") || "";
  const initialCategory = urlSearch.get("category") || "";

  const [search, setSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedEntry, setSelectedEntry] = useState<KnowledgeEntry | null>(null);

  const { data: entries = [], isLoading } = useQuery<KnowledgeEntry[]>({
    queryKey: ["/api/knowledge"],
  });

  const categories = useMemo(() => {
    return [...new Set(entries.map(e => e.category))];
  }, [entries]);

  const filtered = useMemo(() => {
    let result = entries;
    if (selectedCategory) result = result.filter(e => e.category === selectedCategory);
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(e =>
        e.title.toLowerCase().includes(s) ||
        e.content.toLowerCase().includes(s) ||
        e.tags.toLowerCase().includes(s)
      );
    }
    return result;
  }, [entries, selectedCategory, search]);

  return (
    <div className="h-full flex overflow-hidden">
      {/* Left: List */}
      <div className="w-full md:w-80 flex-shrink-0 flex flex-col border-r border-border">
        {/* Search */}
        <div className="p-4 border-b border-border space-y-3">
          <div>
            <h2 className="font-bold text-base flex items-center gap-2">
              <BookOpen size={16} className="text-primary" />
              NRI Knowledge Base
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">{entries.length} verified articles</p>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search topics, laws, rules..."
              className="pl-8 h-8 text-xs"
              data-testid="input-knowledge-search"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X size={12} />
              </button>
            )}
          </div>

          {/* Category filters */}
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedCategory("")}
              className={cn(
                "text-xs px-2 py-0.5 rounded-full border transition-colors",
                !selectedCategory
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-primary/50"
              )}
            >
              All
            </button>
            {categories.map(cat => {
              const meta = CATEGORY_META[cat];
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat === selectedCategory ? "" : cat)}
                  className={cn(
                    "text-xs px-2 py-0.5 rounded-full border transition-colors",
                    selectedCategory === cat
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  )}
                  data-testid={`filter-${cat}`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Entry List */}
        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">
              No articles found for "{search}"
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {filtered.map(entry => {
                const meta = CATEGORY_META[entry.category] || CATEGORY_META["Banking"];
                const Icon = meta.icon;
                const active = selectedEntry?.id === entry.id;
                return (
                  <button
                    key={entry.id}
                    onClick={() => setSelectedEntry(entry)}
                    className={cn(
                      "w-full text-left p-3 rounded-xl border transition-all group",
                      active
                        ? "border-primary/40 bg-primary/5"
                        : "border-transparent hover:border-border hover:bg-muted/30"
                    )}
                    data-testid={`entry-${entry.id}`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5", meta.bg)}>
                        <Icon size={13} className={meta.color} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold leading-snug truncate">{entry.title}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Badge variant="outline" className="text-[9px] py-0 h-4">{entry.category}</Badge>
                          <span className="text-[10px] text-muted-foreground truncate">{entry.source}</span>
                        </div>
                      </div>
                      <ChevronRight size={12} className="text-muted-foreground/40 flex-shrink-0 mt-1 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Right: Detail */}
      <div className="flex-1 hidden md:flex flex-col overflow-hidden">
        {selectedEntry ? (
          <ScrollArea className="flex-1">
            <div className="p-6 max-w-3xl">
              {(() => {
                const meta = CATEGORY_META[selectedEntry.category] || CATEGORY_META["Banking"];
                const Icon = meta.icon;
                const tags: string[] = JSON.parse(selectedEntry.tags || "[]");
                return (
                  <>
                    {/* Header */}
                    <div className="flex items-start gap-4 mb-6">
                      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0", meta.bg)}>
                        <Icon size={22} className={meta.color} />
                      </div>
                      <div>
                        <Badge variant="outline" className="mb-1.5 text-xs">{selectedEntry.category}</Badge>
                        <h2 className="text-xl font-bold">{selectedEntry.title}</h2>
                        <p className="text-xs text-muted-foreground mt-1">
                          Source: {selectedEntry.source} • Updated: {new Date(selectedEntry.lastUpdated).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Content */}
                    <Card className="border-border mb-4">
                      <CardContent className="p-5">
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          {selectedEntry.content.split('\n').map((line, i) => {
                            if (line.startsWith('###')) return <h3 key={i} className="font-bold text-sm mt-3 mb-1">{line.replace('###', '')}</h3>;
                            if (line.startsWith('##')) return <h2 key={i} className="font-bold text-base mt-4 mb-2">{line.replace('##', '')}</h2>;
                            if (line.startsWith('-')) return <li key={i} className="text-sm ml-4 list-disc">{line.slice(1)}</li>;
                            if (line.trim() === '') return <br key={i} />;
                            return <p key={i} className="text-sm leading-relaxed">{line}</p>;
                          })}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Tags */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                        <Tag size={11} />
                        Related Tags
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {tags.map(tag => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-xs cursor-pointer hover:bg-primary/10"
                            onClick={() => setSearch(tag)}
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center p-8">
            <div>
              <BookOpen size={40} className="text-muted-foreground/30 mx-auto mb-3" />
              <h3 className="font-semibold text-muted-foreground mb-1">Select an Article</h3>
              <p className="text-sm text-muted-foreground/70 max-w-xs">
                Choose from the list to read detailed NRI finance rules, laws, and guidelines.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Mobile: show selected entry as modal-like */}
      {selectedEntry && (
        <div className="md:hidden fixed inset-0 z-50 bg-background overflow-y-auto">
          <div className="p-4">
            <button
              onClick={() => setSelectedEntry(null)}
              className="flex items-center gap-1.5 text-sm text-primary mb-4"
            >
              <ChevronRight size={14} className="rotate-180" />
              Back to list
            </button>
            {(() => {
              const meta = CATEGORY_META[selectedEntry.category] || CATEGORY_META["Banking"];
              const tags: string[] = JSON.parse(selectedEntry.tags || "[]");
              return (
                <div>
                  <Badge variant="outline" className="mb-2">{selectedEntry.category}</Badge>
                  <h2 className="text-lg font-bold mb-1">{selectedEntry.title}</h2>
                  <p className="text-xs text-muted-foreground mb-4">{selectedEntry.source}</p>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap bg-muted/30 rounded-xl p-4 mb-4">
                    {selectedEntry.content}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map(tag => <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>)}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
