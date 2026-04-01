import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, Globe, Building2, TrendingUp, Shield, Check, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { UserProfile } from "@shared/schema";

const COUNTRIES = [
  "United States", "United Kingdom", "Canada", "Australia", "Singapore", "UAE",
  "Germany", "Netherlands", "New Zealand", "Hong Kong", "Japan", "Other"
];

const GOALS = [
  "Retire in India", "Buy property in India", "Save for children education",
  "Build investment portfolio", "Repatriate funds", "Tax optimization",
  "Send money to family", "Business investment"
];

export default function Profile() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: profile } = useQuery<UserProfile | null>({
    queryKey: ["/api/profile"],
    queryFn: async () => (await apiRequest("GET", "/api/profile")).json(),
  });

  const [form, setForm] = useState({
    country: profile?.country || "",
    annualIncomeAbroad: profile?.annualIncomeAbroad || "",
    indianIncome: profile?.indianIncome || "",
    hasNreAccount: profile?.hasNreAccount || false,
    hasNroAccount: profile?.hasNroAccount || false,
    hasFcnrAccount: profile?.hasFcnrAccount || false,
    hasProperty: profile?.hasProperty || false,
    hasMutualFunds: profile?.hasMutualFunds || false,
    hasStocks: profile?.hasStocks || false,
    riskAppetite: profile?.riskAppetite || "moderate",
    goals: profile?.goals ? JSON.parse(profile.goals as string) : [] as string[],
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => (await apiRequest("POST", "/api/profile", { ...data, goals: JSON.stringify(data.goals) })).json(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({ title: "Profile saved", description: "Your financial profile has been updated." });
    },
  });

  const toggleGoal = (goal: string) => {
    setForm(f => ({
      ...f,
      goals: f.goals.includes(goal)
        ? f.goals.filter((g: string) => g !== goal)
        : [...f.goals, goal],
    }));
  };

  const ACCOUNT_SWITCHES = [
    { key: "hasNreAccount", label: "NRE Account", desc: "Foreign earnings, tax-free interest" },
    { key: "hasNroAccount", label: "NRO Account", desc: "Indian income management" },
    { key: "hasFcnrAccount", label: "FCNR Account", desc: "Foreign currency deposits" },
    { key: "hasProperty", label: "Property in India", desc: "Residential/commercial" },
    { key: "hasMutualFunds", label: "Mutual Funds", desc: "Indian MF investments" },
    { key: "hasStocks", label: "Indian Stocks", desc: "Via PIS/PINS account" },
  ];

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <User size={22} className="text-primary" />
            My Financial Profile
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your profile helps the Augmented AI mode give personalized financial advice.
          </p>
        </div>

        <div className="space-y-5">
          {/* Personal Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Globe size={15} className="text-primary" />
                Location & Income
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Country of Residence</Label>
                <Select value={form.country} onValueChange={v => setForm(f => ({ ...f, country: v }))}>
                  <SelectTrigger className="h-9 text-sm" data-testid="select-country">
                    <SelectValue placeholder="Select country..." />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Annual Income Abroad (USD)</Label>
                  <Input
                    value={form.annualIncomeAbroad}
                    onChange={e => setForm(f => ({ ...f, annualIncomeAbroad: e.target.value }))}
                    placeholder="e.g. 120,000"
                    className="h-9 text-sm"
                    data-testid="input-income-abroad"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Indian Income (₹/year)</Label>
                  <Input
                    value={form.indianIncome}
                    onChange={e => setForm(f => ({ ...f, indianIncome: e.target.value }))}
                    placeholder="e.g. 5,00,000"
                    className="h-9 text-sm"
                    data-testid="input-income-india"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Risk Appetite</Label>
                <Select value={form.riskAppetite} onValueChange={v => setForm(f => ({ ...f, riskAppetite: v }))}>
                  <SelectTrigger className="h-9 text-sm" data-testid="select-risk">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Conservative (Low Risk)</SelectItem>
                    <SelectItem value="moderate">Balanced (Moderate Risk)</SelectItem>
                    <SelectItem value="high">Aggressive (High Risk)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Accounts & Investments */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 size={15} className="text-primary" />
                Accounts & Investments
              </CardTitle>
              <p className="text-xs text-muted-foreground">Tell us what you currently have in India</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {ACCOUNT_SWITCHES.map(sw => (
                  <div key={sw.key} className="flex items-center justify-between py-1">
                    <div>
                      <div className="text-sm font-medium">{sw.label}</div>
                      <div className="text-xs text-muted-foreground">{sw.desc}</div>
                    </div>
                    <Switch
                      checked={(form as any)[sw.key]}
                      onCheckedChange={v => setForm(f => ({ ...f, [sw.key]: v }))}
                      data-testid={`switch-${sw.key}`}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Financial Goals */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp size={15} className="text-primary" />
                Financial Goals
              </CardTitle>
              <p className="text-xs text-muted-foreground">Select all that apply — helps AI provide relevant advice</p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {GOALS.map(goal => {
                  const selected = form.goals.includes(goal);
                  return (
                    <button
                      key={goal}
                      onClick={() => toggleGoal(goal)}
                      className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                        selected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                      }`}
                      data-testid={`goal-${goal}`}
                    >
                      {selected && <Check size={10} className="inline mr-1" />}
                      {goal}
                    </button>
                  );
                })}
              </div>
              {form.goals.length > 0 && (
                <p className="text-xs text-muted-foreground mt-3">
                  {form.goals.length} goal{form.goals.length > 1 ? "s" : ""} selected
                </p>
              )}
            </CardContent>
          </Card>

          {/* AI Personalization Info */}
          <Card className="border-primary/20 bg-primary/5 dark:bg-primary/10">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Shield size={18} className="text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold mb-1">How your profile is used</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• <strong>Augmented AI mode</strong> uses your profile for personalized advice</li>
                    <li>• Your country affects DTAA recommendations</li>
                    <li>• Your accounts determine relevant repatriation guidance</li>
                    <li>• Risk appetite shapes investment suggestions</li>
                    <li>• All data stored locally — never shared externally</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={() => saveMutation.mutate(form)}
            disabled={saveMutation.isPending}
            className="w-full gap-2"
            size="lg"
            data-testid="button-save-profile"
          >
            <Save size={16} />
            {saveMutation.isPending ? "Saving..." : "Save Profile"}
          </Button>
        </div>
      </div>
    </div>
  );
}
