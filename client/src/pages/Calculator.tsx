import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Calculator, IndianRupee, ArrowLeftRight, TrendingUp, CheckCircle, Info, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export default function CalculatorPage() {
  // Tax Calculator state
  const [taxIncomeType, setTaxIncomeType] = useState("nro_fd_interest");
  const [taxAmount, setTaxAmount] = useState("");
  const [taxResult, setTaxResult] = useState<any>(null);

  // Repatriation Calculator state
  const [repatAccountType, setRepatAccountType] = useState("nro");
  const [repatAmount, setRepatAmount] = useState("");
  const [repatResult, setRepatResult] = useState<any>(null);

  // FD Calculator state
  const [fdPrincipal, setFdPrincipal] = useState("");
  const [fdRate, setFdRate] = useState("7");
  const [fdYears, setFdYears] = useState("3");
  const [fdCompounding, setFdCompounding] = useState("quarterly");
  const [fdResult, setFdResult] = useState<any>(null);

  const taxMutation = useMutation({
    mutationFn: async (data: any) => (await apiRequest("POST", "/api/calculate/tax", data)).json(),
    onSuccess: (data: any) => setTaxResult(data),
  });

  const repatMutation = useMutation({
    mutationFn: async (data: any) => (await apiRequest("POST", "/api/calculate/repatriation", data)).json(),
    onSuccess: (data: any) => setRepatResult(data),
  });

  const fdMutation = useMutation({
    mutationFn: async (data: any) => (await apiRequest("POST", "/api/calculate/investment", data)).json(),
    onSuccess: (data: any) => setFdResult(data),
  });

  const INCOME_TYPES = [
    { value: "nro_fd_interest", label: "NRO FD Interest" },
    { value: "equity_ltcg", label: "Equity LTCG (>1 year)" },
    { value: "equity_stcg", label: "Equity STCG (<1 year)" },
    { value: "property_ltcg", label: "Property LTCG" },
    { value: "rental_income", label: "Rental Income" },
  ];

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calculator size={22} className="text-primary" />
            Financial Calculators
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Estimate taxes, calculate FD returns, and understand repatriation rules for NRIs in India.
          </p>
        </div>

        <Tabs defaultValue="tax">
          <TabsList className="mb-6">
            <TabsTrigger value="tax" className="gap-1.5 text-xs" data-testid="tab-tax">
              <IndianRupee size={13} />
              Tax Estimator
            </TabsTrigger>
            <TabsTrigger value="repatriation" className="gap-1.5 text-xs" data-testid="tab-repatriation">
              <ArrowLeftRight size={13} />
              Repatriation
            </TabsTrigger>
            <TabsTrigger value="fd" className="gap-1.5 text-xs" data-testid="tab-fd">
              <TrendingUp size={13} />
              FD Returns
            </TabsTrigger>
            <TabsTrigger value="reference" className="gap-1.5 text-xs" data-testid="tab-reference">
              <Info size={13} />
              Quick Reference
            </TabsTrigger>
          </TabsList>

          {/* Tax Calculator */}
          <TabsContent value="tax">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <IndianRupee size={15} className="text-primary" />
                    NRI Tax Estimator
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Estimate Indian tax on various income types as an NRI</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Income Type</Label>
                    <Select value={taxIncomeType} onValueChange={setTaxIncomeType}>
                      <SelectTrigger className="h-9 text-sm" data-testid="select-income-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {INCOME_TYPES.map(t => (
                          <SelectItem key={t.value} value={t.value} className="text-sm">{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Amount (₹)</Label>
                    <Input
                      type="number"
                      value={taxAmount}
                      onChange={e => setTaxAmount(e.target.value)}
                      placeholder="Enter amount in INR"
                      className="h-9 text-sm"
                      data-testid="input-tax-amount"
                    />
                  </div>
                  <Button
                    onClick={() => taxMutation.mutate({ incomeType: taxIncomeType, amount: Number(taxAmount) })}
                    disabled={!taxAmount || taxMutation.isPending}
                    className="w-full"
                    data-testid="button-calculate-tax"
                  >
                    {taxMutation.isPending ? "Calculating..." : "Calculate Tax"}
                  </Button>
                </CardContent>
              </Card>

              {taxResult && (
                <Card className="border-primary/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-primary">Tax Estimate</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <div className="text-xs text-muted-foreground mb-1">Gross Amount</div>
                        <div className="font-bold text-sm">{formatINR(taxResult.grossAmount)}</div>
                      </div>
                      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
                        <div className="text-xs text-muted-foreground mb-1">Tax ({taxResult.taxRate}%)</div>
                        <div className="font-bold text-sm text-red-600 dark:text-red-400">{formatINR(taxResult.taxAmount)}</div>
                      </div>
                      <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 text-center col-span-2">
                        <div className="text-xs text-muted-foreground mb-1">Net Amount After Tax</div>
                        <div className="font-bold text-lg text-emerald-600 dark:text-emerald-400">{formatINR(taxResult.netAmount)}</div>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      {taxResult.notes.map((note: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <Info size={11} className="mt-0.5 flex-shrink-0 text-primary" />
                          {note}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Repatriation Calculator */}
          <TabsContent value="repatriation">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ArrowLeftRight size={15} className="text-primary" />
                    Repatriation Checker
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Check rules and documentation for sending money from India</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Account Type</Label>
                    <Select value={repatAccountType} onValueChange={setRepatAccountType}>
                      <SelectTrigger className="h-9 text-sm" data-testid="select-account-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nre">NRE Account</SelectItem>
                        <SelectItem value="nro">NRO Account</SelectItem>
                        <SelectItem value="fcnr">FCNR Account</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Amount (USD equivalent)</Label>
                    <Input
                      type="number"
                      value={repatAmount}
                      onChange={e => setRepatAmount(e.target.value)}
                      placeholder="Enter amount in USD"
                      className="h-9 text-sm"
                      data-testid="input-repat-amount"
                    />
                  </div>
                  <Button
                    onClick={() => repatMutation.mutate({ accountType: repatAccountType, amount: Number(repatAmount) })}
                    disabled={!repatAmount || repatMutation.isPending}
                    className="w-full"
                    data-testid="button-calculate-repat"
                  >
                    {repatMutation.isPending ? "Checking..." : "Check Rules"}
                  </Button>
                </CardContent>
              </Card>

              {repatResult && (
                <Card className={cn("border-2", repatResult.accountType === "nro" ? "border-amber-300 dark:border-amber-700" : "border-emerald-300 dark:border-emerald-700")}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CheckCircle size={15} className={repatResult.accountType === "nro" ? "text-amber-500" : "text-emerald-500"} />
                      Repatriation Rules
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className={cn("p-3 rounded-lg text-sm font-semibold", repatResult.accountType === "nro" ? "bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300" : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300")}>
                      Limit: {repatResult.limit}
                    </div>
                    {repatResult.requiredDocs.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold mb-2">Required Documents:</p>
                        <ul className="space-y-1.5">
                          {repatResult.requiredDocs.map((doc: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-xs">
                              <CheckCircle size={11} className="text-primary mt-0.5 flex-shrink-0" />
                              {doc}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="space-y-1.5">
                      {repatResult.notes.map((note: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <AlertCircle size={11} className="mt-0.5 flex-shrink-0 text-amber-500" />
                          {note}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* FD Calculator */}
          <TabsContent value="fd">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp size={15} className="text-primary" />
                    FD Returns Calculator
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Calculate maturity amount for NRE/NRO/FCNR fixed deposits</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Principal Amount (₹)</Label>
                    <Input
                      type="number"
                      value={fdPrincipal}
                      onChange={e => setFdPrincipal(e.target.value)}
                      placeholder="e.g. 500000"
                      className="h-9 text-sm"
                      data-testid="input-fd-principal"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Interest Rate (%)</Label>
                      <Input
                        type="number"
                        value={fdRate}
                        onChange={e => setFdRate(e.target.value)}
                        step="0.1"
                        className="h-9 text-sm"
                        data-testid="input-fd-rate"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Tenure (Years)</Label>
                      <Input
                        type="number"
                        value={fdYears}
                        onChange={e => setFdYears(e.target.value)}
                        className="h-9 text-sm"
                        data-testid="input-fd-years"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Compounding</Label>
                    <Select value={fdCompounding} onValueChange={setFdCompounding}>
                      <SelectTrigger className="h-9 text-sm" data-testid="select-compounding">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="annually">Annually</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={() => fdMutation.mutate({ principal: Number(fdPrincipal), rate: Number(fdRate), years: Number(fdYears), compounding: fdCompounding })}
                    disabled={!fdPrincipal || fdMutation.isPending}
                    className="w-full"
                    data-testid="button-calculate-fd"
                  >
                    {fdMutation.isPending ? "Calculating..." : "Calculate Returns"}
                  </Button>
                </CardContent>
              </Card>

              {fdResult && (
                <Card className="border-primary/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-primary">FD Maturity</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="bg-primary/5 rounded-xl p-4 text-center">
                      <div className="text-xs text-muted-foreground mb-1">Maturity Amount</div>
                      <div className="text-3xl font-bold text-primary">{formatINR(fdResult.maturityAmount)}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-muted/50 rounded-lg p-2.5">
                        <div className="text-[10px] text-muted-foreground mb-0.5">Principal</div>
                        <div className="text-sm font-bold">{formatINR(fdResult.principal)}</div>
                      </div>
                      <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-2.5">
                        <div className="text-[10px] text-muted-foreground mb-0.5">Interest Earned</div>
                        <div className="text-sm font-bold text-emerald-600">{formatINR(fdResult.totalInterest)}</div>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2.5">
                        <div className="text-[10px] text-muted-foreground mb-0.5">Eff. Yield</div>
                        <div className="text-sm font-bold text-blue-600">{fdResult.effectiveYield}%</div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1 p-3 bg-muted/30 rounded-lg">
                      <p>• NRE FD interest is <strong>tax-free</strong> in India — your full {formatINR(fdResult.maturityAmount)} is yours</p>
                      <p>• NRO FD interest taxed at 30% — net maturity: ~{formatINR(fdResult.maturityAmount - fdResult.totalInterest * 0.3)}</p>
                      <p>• Always compare rates across banks: SBI, HDFC, ICICI, Kotak</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Quick Reference */}
          <TabsContent value="reference">
            <div className="grid md:grid-cols-2 gap-4">
              {[
                {
                  title: "TDS Rates for NRIs",
                  icon: IndianRupee,
                  rows: [
                    ["NRO FD Interest", "30%"],
                    ["NRE FD Interest", "NIL (tax-free)"],
                    ["Rental Income", "30%"],
                    ["Equity STCG", "20%"],
                    ["Equity LTCG", "12.5%"],
                    ["Property sale LTCG", "12.5%"],
                    ["Dividends", "20% (or DTAA rate)"],
                  ]
                },
                {
                  title: "Account Repatriation Limits",
                  icon: ArrowLeftRight,
                  rows: [
                    ["NRE Account", "Unlimited"],
                    ["FCNR Account", "Unlimited"],
                    ["NRO Account", "USD 1M/year"],
                    ["NRO → NRE transfer", "Counts in USD 1M"],
                    ["Property proceeds", "USD 1M/year"],
                    ["Inherited property", "USD 1M/year"],
                  ]
                },
                {
                  title: "Key NRI Investment Limits",
                  icon: TrendingUp,
                  rows: [
                    ["Max equity in 1 company", "5% of paid-up capital"],
                    ["NRI collective limit", "10% of paid-up capital"],
                    ["PIS accounts allowed", "Only 1 nationwide"],
                    ["Intraday trading", "NOT allowed"],
                    ["PPF (new accounts)", "NOT allowed for NRIs"],
                    ["Mutual Funds", "Allowed via NRE/NRO"],
                  ]
                },
                {
                  title: "Tax Filing Deadlines",
                  icon: Calculator,
                  rows: [
                    ["ITR due date", "31 July each year"],
                    ["Late filing penalty", "Up to ₹10,000"],
                    ["Belated return window", "31 Dec of AY"],
                    ["Updated return window", "48 months (4 years)"],
                    ["NRI exemption (new)", "₹4 lakh"],
                    ["NRI exemption (old)", "₹2.5 lakh"],
                  ]
                },
              ].map(table => {
                const Icon = table.icon;
                return (
                  <Card key={table.title} className="border-border">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Icon size={14} className="text-primary" />
                        {table.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <table className="w-full text-xs">
                        <tbody>
                          {table.rows.map(([label, value], i) => (
                            <tr key={i} className={cn("border-b border-border last:border-0", i % 2 === 0 ? "" : "bg-muted/30")}>
                              <td className="py-1.5 pr-2 text-muted-foreground">{label}</td>
                              <td className="py-1.5 font-semibold text-right">{value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        <p className="text-xs text-muted-foreground mt-6 text-center">
          ⚠️ These calculators provide estimates for educational purposes only. Consult a Chartered Accountant for accurate tax planning.
        </p>
      </div>
    </div>
  );
}
