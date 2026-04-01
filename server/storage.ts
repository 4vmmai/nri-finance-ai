import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, desc } from "drizzle-orm";
import {
  chatSessions, chatMessages, knowledgeEntries, userProfile, calculations,
  type ChatSession, type ChatMessage, type KnowledgeEntry, type UserProfile, type Calculation,
  type InsertChatSession, type InsertChatMessage, type InsertKnowledgeEntry,
  type InsertUserProfile, type InsertCalculation,
} from "@shared/schema";

// Use /tmp on Railway (writable), local path in dev
const dbPath = process.env.NODE_ENV === "production" ? "/tmp/nri_finance.db" : "nri_finance.db";
const sqlite = new Database(dbPath);
export const db = drizzle(sqlite);

// Create tables
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS chat_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    mode TEXT NOT NULL DEFAULT 'conversational',
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    ai_mode TEXT,
    sources TEXT,
    agent_steps TEXT,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS knowledge_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT NOT NULL,
    source TEXT,
    last_updated TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS user_profile (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    country TEXT NOT NULL DEFAULT '',
    annual_income_abroad TEXT DEFAULT '',
    indian_income TEXT DEFAULT '',
    has_nre_account INTEGER DEFAULT 0,
    has_nro_account INTEGER DEFAULT 0,
    has_fcnr_account INTEGER DEFAULT 0,
    has_property INTEGER DEFAULT 0,
    has_mutual_funds INTEGER DEFAULT 0,
    has_stocks INTEGER DEFAULT 0,
    goals TEXT DEFAULT '',
    risk_appetite TEXT DEFAULT 'moderate',
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS calculations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    inputs TEXT NOT NULL,
    result TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
`);

export interface IStorage {
  // Sessions
  getSessions(): ChatSession[];
  getSession(id: number): ChatSession | undefined;
  createSession(data: InsertChatSession): ChatSession;
  deleteSession(id: number): void;

  // Messages
  getMessages(sessionId: number): ChatMessage[];
  addMessage(data: InsertChatMessage): ChatMessage;

  // Knowledge
  getKnowledgeEntries(): KnowledgeEntry[];
  getKnowledgeByCategory(category: string): KnowledgeEntry[];
  searchKnowledge(query: string): KnowledgeEntry[];
  createKnowledgeEntry(data: InsertKnowledgeEntry): KnowledgeEntry;

  // Profile
  getProfile(): UserProfile | undefined;
  upsertProfile(data: InsertUserProfile): UserProfile;

  // Calculations
  getCalculations(): Calculation[];
  saveCalculation(data: InsertCalculation): Calculation;
}

export const storage: IStorage = {
  getSessions() {
    return db.select().from(chatSessions).orderBy(desc(chatSessions.id)).all();
  },
  getSession(id) {
    return db.select().from(chatSessions).where(eq(chatSessions.id, id)).get();
  },
  createSession(data) {
    return db.insert(chatSessions).values(data).returning().get();
  },
  deleteSession(id) {
    db.delete(chatMessages).where(eq(chatMessages.sessionId, id)).run();
    db.delete(chatSessions).where(eq(chatSessions.id, id)).run();
  },
  getMessages(sessionId) {
    return db.select().from(chatMessages).where(eq(chatMessages.sessionId, sessionId)).all();
  },
  addMessage(data) {
    return db.insert(chatMessages).values(data).returning().get();
  },
  getKnowledgeEntries() {
    return db.select().from(knowledgeEntries).all();
  },
  getKnowledgeByCategory(category) {
    return db.select().from(knowledgeEntries).where(eq(knowledgeEntries.category, category)).all();
  },
  searchKnowledge(query) {
    const all = db.select().from(knowledgeEntries).all();
    const lower = query.toLowerCase();
    return all.filter(e =>
      e.title.toLowerCase().includes(lower) ||
      e.content.toLowerCase().includes(lower) ||
      e.tags.toLowerCase().includes(lower) ||
      e.category.toLowerCase().includes(lower)
    );
  },
  createKnowledgeEntry(data) {
    return db.insert(knowledgeEntries).values(data).returning().get();
  },
  getProfile() {
    return db.select().from(userProfile).get();
  },
  upsertProfile(data) {
    const existing = db.select().from(userProfile).get();
    if (existing) {
      return db.update(userProfile).set(data).where(eq(userProfile.id, existing.id)).returning().get();
    }
    return db.insert(userProfile).values(data).returning().get();
  },
  getCalculations() {
    return db.select().from(calculations).orderBy(desc(calculations.id)).all();
  },
  saveCalculation(data) {
    return db.insert(calculations).values(data).returning().get();
  },
};

// Seed knowledge base if empty
const existing = db.select().from(knowledgeEntries).all();
if (existing.length === 0) {
  const now = new Date().toISOString();
  const entries: InsertKnowledgeEntry[] = [
    {
      category: "Banking",
      title: "NRE Account (Non-Resident External)",
      content: "NRE accounts hold foreign earnings in Indian Rupees. Key features: Fully repatriable (principal + interest), Interest is tax-free in India, Can be opened as Savings/Current/Recurring/FD, Joint holding allowed with another NRI/PIO, Funds from abroad or other NRE/FCNR accounts can be credited. Best for parking foreign earnings you want to invest or repatriate freely.",
      tags: JSON.stringify(["NRE", "banking", "account", "repatriation", "tax-free"]),
      source: "RBI/FEMA Guidelines 2025",
      lastUpdated: now,
    },
    {
      category: "Banking",
      title: "NRO Account (Non-Resident Ordinary)",
      content: "NRO accounts are for managing Indian income such as rent, dividends, pension, or gifts. Key features: Income is taxable in India (30% TDS typically), Repatriation limited to USD 1 million per financial year, Requires Form 15CA + 15CB for repatriation, Can hold INR only, Joint account allowed with resident Indian. Best for receiving and managing income earned within India.",
      tags: JSON.stringify(["NRO", "banking", "account", "taxable", "repatriation", "Form 15CA"]),
      source: "RBI/FEMA Guidelines 2025",
      lastUpdated: now,
    },
    {
      category: "Banking",
      title: "FCNR(B) Account (Foreign Currency Non-Resident)",
      content: "FCNR accounts allow NRIs to hold Fixed Deposits in foreign currencies in India. Key features: Available in USD, GBP, EUR, JPY, CAD, AUD, Fully repatriable with no limits, Interest is tax-free in India, Protected from currency fluctuation risk, Only available as Fixed Deposits, Can be held jointly with another NRI. Ideal for NRIs who want to earn higher interest rates than abroad without currency risk.",
      tags: JSON.stringify(["FCNR", "banking", "foreign currency", "FD", "tax-free", "repatriation"]),
      source: "RBI/FEMA Guidelines 2025",
      lastUpdated: now,
    },
    {
      category: "Taxation",
      title: "NRI Tax Filing Requirements India FY 2025-26",
      content: "NRIs must file ITR if Indian income exceeds: Rs 2.5 lakh (old regime) or Rs 4 lakh (new regime FY 2025-26). Due date: 31st July 2026. Use ITR-2 for salary, rental income, capital gains. Use ITR-3 for business/professional income. NRIs are taxed ONLY on India-sourced income: interest on NRO/FDs, rent, capital gains from property/stocks, dividends from Indian companies. Income from NRE/FCNR accounts is tax-exempt in India. Late filing penalty up to Rs 10,000 under Section 234F.",
      tags: JSON.stringify(["ITR", "tax filing", "income tax", "ITR-2", "ITR-3", "due date"]),
      source: "Income Tax Act 1961 / Budget 2025",
      lastUpdated: now,
    },
    {
      category: "Taxation",
      title: "Double Taxation Avoidance Agreement (DTAA)",
      content: "India has DTAA treaties with 90+ countries to prevent NRIs from paying tax twice. How it works: NRIs can claim credit for taxes paid in India against their foreign country tax liability. To claim DTAA benefits: Obtain Tax Residency Certificate (TRC) from your country, Submit Form 10F to Indian bank/payer, Claim lower withholding rates. Key DTAAs: USA (15% on dividends), UK (15%), UAE (no DTAA but no tax in UAE so India tax applies), Singapore (15% dividends, 10% interest). Always consult a CA for country-specific benefits.",
      tags: JSON.stringify(["DTAA", "double taxation", "TRC", "Form 10F", "tax treaty"]),
      source: "Income Tax Act Section 90/91",
      lastUpdated: now,
    },
    {
      category: "Taxation",
      title: "Capital Gains Tax for NRIs (2025)",
      content: "Property LTCG: 12.5% flat (no indexation) for properties registered after July 23, 2024. Pre-July 23, 2024 properties: choose between 20% with indexation or 12.5% without. TDS on property purchase from NRI: 12.5% of capital gains. Equity STCG (held < 1 year): 20%. Equity LTCG (held > 1 year): 12.5% above Rs 1.25 lakh. Mutual fund STCG: 20% (equity), income tax slab (debt). Mutual fund LTCG: 12.5% (equity), 20% with indexation (debt). Two properties can now be declared self-occupied (no notional rent tax).",
      tags: JSON.stringify(["capital gains", "LTCG", "STCG", "property tax", "equity", "TDS", "indexation"]),
      source: "Budget 2025 / Finance Act",
      lastUpdated: now,
    },
    {
      category: "Investments",
      title: "Stock Market Investment for NRIs (PIS/PINS)",
      content: "NRIs invest in Indian stocks via Portfolio Investment Scheme (PIS/PINS). Steps: 1) Open NRE/NRO bank account, 2) Apply for PIS permission from RBI-designated bank, 3) Open Demat + trading account linked to PIS. Only ONE PIS account allowed nationwide. Permitted: Delivery-based equity trading on NSE/BSE, F&O (equity/index only), IPOs (no PIS needed), Mutual funds (no PIS needed). Restricted: Intraday equity trading, investments in atomic energy/railways/gambling sectors. Individual limit: 5% of any company's paid-up capital. Collective NRI limit: 10%. After 2025: Only NRE PINS account required (NRO PINS no longer needed).",
      tags: JSON.stringify(["stocks", "PIS", "PINS", "equity", "demat", "NSE", "BSE", "delivery trading"]),
      source: "RBI FEMA / SEBI Guidelines 2025",
      lastUpdated: now,
    },
    {
      category: "Investments",
      title: "Mutual Fund Investments for NRIs",
      content: "NRIs can invest in Indian mutual funds directly without a PIS account. Investment via NRE account: fully repatriable returns. Investment via NRO account: limited repatriation (USD 1M/year). KYC mandatory for all investments. PAN card required. FATCA declaration required. Restriction: US and Canada-based NRIs face restrictions with certain AMCs (FATCA compliance). PPF: NRIs cannot open NEW PPF accounts; existing accounts can receive contributions until 15-year maturity but cannot be extended. SIP allowed through NRE/NRO accounts.",
      tags: JSON.stringify(["mutual funds", "SIP", "NRE", "NRO", "KYC", "FATCA", "PPF"]),
      source: "SEBI / AMFI Guidelines",
      lastUpdated: now,
    },
    {
      category: "Investments",
      title: "Real Estate Investment for NRIs (2025)",
      content: "NRIs CAN purchase: Residential properties (apartments, independent houses), Commercial properties (offices, retail). NRIs CANNOT purchase: Agricultural land, plantation property, farmhouses. All payments must go through NRE/NRO/FCNR accounts. Capital gains: LTCG now 12.5% (down from 20%). Two self-occupied properties exempt from notional rent tax. Repatriation of sale proceeds: up to USD 1 million/year from NRO, unlimited from NRE. Form 15CA + 15CB required for NRO repatriation. TDS on property sale: 12.5% of capital gains. Power of Attorney (PoA) can be used for transactions by an NRI not present in India.",
      tags: JSON.stringify(["real estate", "property", "residential", "commercial", "LTCG", "PoA", "TDS"]),
      source: "RBI / Budget 2025 / FEMA",
      lastUpdated: now,
    },
    {
      category: "Compliance",
      title: "FEMA (Foreign Exchange Management Act) Key Rules",
      content: "FEMA 1999 governs all foreign exchange transactions for NRIs. Key rules: NRI definition under FEMA: individual outside India for 182+ days in previous financial year. Repatriation from NRO: USD 1 million/year limit. Repatriation from NRE/FCNR: unlimited. Fund transfer NRO to NRE allowed (counts toward USD 1M limit). Foreign currency can be brought into India freely. Form 15CA (self-declaration) + Form 15CB (CA certification) required for taxable remittances from NRO. Violation of FEMA can result in penalties up to 3x the amount involved.",
      tags: JSON.stringify(["FEMA", "compliance", "repatriation", "Form 15CA", "Form 15CB", "RBI", "penalty"]),
      source: "FEMA Act 1999 / RBI Guidelines",
      lastUpdated: now,
    },
    {
      category: "Compliance",
      title: "NRI Status Definition and Residency Rules",
      content: "Under Income Tax Act: NRI = individual staying in India for less than 182 days in a financial year. Exception: If Indian income exceeds Rs 15 lakh, threshold reduces to 120 days. RNOR (Resident but Not Ordinarily Resident): Has been NRI for 9 out of 10 preceding years, OR has been in India for 729 days or less in preceding 7 years. RNOR is taxed only on Indian income + income received in India. Returning NRIs can maintain RNOR status. Under FEMA: NRI = outside India for more than 182 days. Important: Tax Act and FEMA definitions differ slightly.",
      tags: JSON.stringify(["NRI status", "RNOR", "residency", "182 days", "120 days", "income tax", "FEMA"]),
      source: "Income Tax Act Section 6 / FEMA 1999",
      lastUpdated: now,
    },
    {
      category: "Compliance",
      title: "LRS (Liberalised Remittance Scheme) for NRIs",
      content: "LRS allows resident Indians (not NRIs) to remit up to USD 250,000 per year abroad. For NRIs returning to India temporarily: can use LRS to repatriate funds before acquiring NRI status. TCS (Tax Collected at Source) on LRS: 20% on amounts exceeding Rs 10 lakh per year (increased threshold in Budget 2025, up from Rs 7 lakh). TCS on education loans: completely removed (Budget 2025). TCS can be claimed as credit against final tax liability. NRIs use NRE/FCNR accounts for repatriation, not LRS.",
      tags: JSON.stringify(["LRS", "TCS", "remittance", "USD 250000", "education loan", "resident Indian"]),
      source: "RBI / Budget 2025",
      lastUpdated: now,
    },
    {
      category: "Investments",
      title: "Fixed Deposits for NRIs",
      content: "NRE Fixed Deposits: Interest tax-free in India, fully repatriable, available in INR, minimum 1 year tenure, premature withdrawal possible with interest forfeiture. NRO Fixed Deposits: Interest taxable (TDS at 30%), repatriation up to USD 1M/year, available in INR, joint holding with residents allowed. FCNR(B) Fixed Deposits: Held in foreign currency (USD/GBP/EUR etc.), interest tax-free, fully repatriable, 1-5 year tenure, protected from rupee depreciation. Budget 2025: Small deposits under Rs 10,000 can be withdrawn within 3 months (forfeit interest).",
      tags: JSON.stringify(["FD", "fixed deposit", "NRE", "NRO", "FCNR", "interest", "TDS"]),
      source: "RBI / Budget 2025",
      lastUpdated: now,
    },
    {
      category: "Taxation",
      title: "TDS (Tax Deducted at Source) for NRIs",
      content: "Banks and payers deduct TDS before paying income to NRIs. TDS rates: NRO FD interest: 30%, NRE FD interest: NIL (tax-free), Property rental income: 31.2%, Short-term capital gains equity: 15%, Long-term capital gains equity: 10%, Property sale (LTCG): 12.5%, Dividends: 20% (or DTAA rate). To claim lower TDS under DTAA: Submit TRC + Form 10F to payer. To claim TDS refund: File ITR showing actual tax liability. Form 26AS/AIS shows all TDS deducted. Always reconcile TDS with actual tax liability before filing.",
      tags: JSON.stringify(["TDS", "tax deduction", "NRO", "property", "dividends", "Form 26AS", "DTAA refund"]),
      source: "Income Tax Act / Budget 2025",
      lastUpdated: now,
    },
    // NEW ENTRIES — sourced from incometax.gov.in, ClearTax, RBI, FEMA 2025
    {
      category: "Taxation",
      title: "NRI Tax Slabs FY 2025-26 (Official — incometax.gov.in)",
      content: "Source: incometax.gov.in (official). NRIs must use NEW TAX REGIME by default from FY 2024-25. New Regime slabs: Up to ₹3L: Nil | ₹3L-7L: 5% | ₹7L-10L: 10% | ₹10L-12L: 15% | ₹12L-15L: 20% | Above ₹15L: 30%. Old Regime (optional): Up to ₹2.5L: Nil | ₹2.5L-5L: 5% | ₹5L-10L: 20% | Above ₹10L: 30%. CRITICAL: NRIs do NOT get Section 87A rebate (the ₹12 lakh zero-tax benefit is for residents ONLY). Health & Education Cess: 4% on tax + surcharge. Surcharge: 10% (>₹50L), 15% (>₹1Cr), 25% (>₹2Cr). NRIs use ITR-2 form. ITR-1 and ITR-4 are NOT applicable for NRIs. ITR due date FY 2025-26: 31st July 2026.",
      tags: JSON.stringify(["tax slab", "ITR-2", "new regime", "old regime", "surcharge", "cess", "87A", "rebate"]),
      source: "incometax.gov.in — AY 2025-26",
      lastUpdated: now,
    },
    {
      category: "Taxation",
      title: "NRI ITR Filing — Forms, Deadlines & Disclosure Rules 2025",
      content: "Source: incometax.gov.in + ClearTax. MANDATORY if Indian income exceeds ₹4L (new regime) or ₹2.5L (old regime). Even if below limit, file ITR to claim TDS refund. Correct form: ITR-2 for salary, rental, capital gains, foreign income; ITR-3 for business/profession in India. ITR-1 and ITR-4 NOT allowed for NRIs. Disclosure rules for ITR-2: Must disclose Indian assets >₹1 crore and liabilities >₹50 lakh. Foreign income must be reported in Schedule FSI. Claim DTAA using Form 67 (must file before ITR due date). Documents needed: Form 26AS, AIS, TRC (Tax Residency Certificate) from country of residence, Form 10F, PAN. Updated return window: 48 months (4 years) from end of assessment year.",
      tags: JSON.stringify(["ITR-2", "ITR filing", "deadline", "Form 67", "DTAA", "Form 26AS", "AIS", "TRC", "Form 10F", "disclosure"]),
      source: "incometax.gov.in + ClearTax 2025",
      lastUpdated: now,
    },
    {
      category: "Investments",
      title: "NRI Property Investment & Repatriation Rules 2025",
      content: "Source: RBI FEMA guidelines + Budget 2025. NRIs CAN buy: Residential property, commercial property. NRIs CANNOT buy: Agricultural land, farmhouses, plantation property (can only sell to resident Indian). LTCG on property sale: 12.5% (no indexation, applicable post July 23, 2024). TDS on property purchase FROM NRI: 12.5% of capital gains. REPATRIATION RULES: 1) Property bought with NRE/FCNR funds: Freely repatriable for up to 2 residential properties lifetime; beyond 2 needs RBI approval. 2) Property bought with NRO/Indian income OR resident-era purchase: USD 1 million per financial year from NRO. 3) Inherited property: USD 1 million per year. Required docs for repatriation: Original purchase docs, CA certificate, tax payment proof, Form 15CA/15CB. Exemptions available: Section 54 (buy another house), Section 54EC (NHAI/REC bonds), Section 54F (other long-term assets).",
      tags: JSON.stringify(["property", "real estate", "LTCG", "repatriation", "Section 54", "TDS", "agricultural land", "FCNR", "Form 15CA"]),
      source: "RBI FEMA Guidelines + Budget 2025 Finance Act",
      lastUpdated: now,
    },
    {
      category: "Investments",
      title: "NRI Stock Market & Mutual Fund Rules 2025 (SEBI Updated)",
      content: "Source: SEBI + RBI 2025 updates. STOCKS (via PINS): Only NRE PINS account required (NRO PINS discontinued 2025). One PINS account allowed nationwide. Allowed: Delivery-based equity, F&O (equity/index only), IPOs, ETFs, Mutual Funds. NOT allowed: Intraday equity trading, currency/commodity ETFs, Intraday F&O. Investment limits: Max 5% of any company's paid-up capital per NRI; 10% collective NRI limit. Process: NRE bank account → Apply for PINS → Open Demat account → Link with trading account. MUTUAL FUNDS: No PINS needed. Invest via NRE (repatriable) or NRO account. SIP available. US/Canada NRIs: Restricted by some AMCs due to FATCA but pool expanding. PPF: Cannot open new accounts; existing runs till 15-year maturity. SEBI 2025 NEW RULES: Nomination mandatory for demat — up to 10 nominees (up from 3). REIT investments classified as equity from Jan 1, 2026. Exit load capped at 3% (reduced from 5%).",
      tags: JSON.stringify(["PINS", "PIS", "stocks", "mutual funds", "SEBI", "intraday", "PPF", "REIT", "demat", "nomination", "FATCA", "F&O"]),
      source: "SEBI + RBI Guidelines 2025",
      lastUpdated: now,
    },
    {
      category: "Compliance",
      title: "NRI Residency Rules & RNOR Status — When Do You Become Taxable?",
      content: "Source: Income Tax Act Section 6 + HDFC Life / ClearTax analysis. NRI definition (FEMA): Not in India for 182+ days in the previous financial year. NRI definition (Income Tax): Not in India for 182+ days, OR not in India for 60+ days AND 365+ days in preceding 4 years. RNOR (Resident but Not Ordinarily Resident) — NEW RULE: If Indian income >₹15 lakh AND stayed in India 120+ days (and 365+ days in preceding 4 years) → classified as RNOR. RNOR impact: May lose DTAA benefits, global income may become taxable in India, lose some NRI exemptions. ORDINARY RESIDENT: Stays 182+ days in India → taxed on GLOBAL income. KEY: NRIs only taxed on India-sourced income. Residents taxed on worldwide income. Plan your India visits carefully if income exceeds ₹15 lakh.",
      tags: JSON.stringify(["residency", "RNOR", "182 days", "120 days", "global income", "taxable", "Section 6", "DTAA", "visit days"]),
      source: "Income Tax Act Section 6 + RBI FEMA 1999",
      lastUpdated: now,
    },
    {
      category: "Compliance",
      title: "LRS (Liberalized Remittance Scheme) & TCS Rules 2025",
      content: "Source: RBI + Budget 2025. LRS allows RESIDENTS to remit up to USD 250,000/year abroad for any permitted purpose. NRI RELEVANCE: If you return to India (become resident), LRS applies for sending money abroad. TCS (Tax Collected at Source) on remittances — Budget 2025 update: TCS applies only on amounts EXCEEDING ₹10 lakh per year (raised from ₹7 lakh). TCS rate: 20% on LRS above ₹10L (5% for education/medical from recognized institutions, 0.5% for education loans up to ₹7L). TCS is NOT an extra tax — it's advance tax that can be claimed as credit when filing ITR. Common uses of LRS: Education abroad, foreign investment, travel, maintenance of relatives abroad, medical treatment. NRIs repatriating from NRO: Subject to FEMA limits (USD 1M/year) NOT LRS.",
      tags: JSON.stringify(["LRS", "TCS", "remittance", "USD 250000", "10 lakh", "resident", "education abroad", "foreign investment"]),
      source: "RBI LRS Guidelines + Budget 2025",
      lastUpdated: now,
    },
    {
      category: "Taxation",
      title: "DTAA — How NRIs Avoid Double Taxation (Country-wise Guide)",
      content: "Source: Income Tax Act Sections 90, 90A, 91. India has DTAA with 90+ countries including USA, UK, UAE, Canada, Australia, Singapore, Germany. HOW DTAA WORKS: Reduces or eliminates double taxation on the same income in both countries. CLAIMING DTAA: 1) Get TRC (Tax Residency Certificate) from your country of residence. 2) File Form 10F with the Indian payer/bank. 3) File Form 67 before ITR due date to claim foreign tax credit. KEY DTAA RATES (lower of treaty or India rate applies): USA: FD interest 15%, dividends 25%; UAE: Most income exempt (UAE has no income tax); UK: FD interest 15%, dividends 15%; Canada: FD interest 15%, dividends 25%; Singapore: dividends 15%, capital gains mostly exempt. IMPORTANT: NRE/FCNR interest is tax-free in India regardless of DTAA. DTAA mainly helps with NRO interest, rental income, dividends. Without TRC+Form 10F, full Indian TDS rate applies.",
      tags: JSON.stringify(["DTAA", "double taxation", "TRC", "Form 10F", "Form 67", "USA", "UAE", "UK", "Canada", "Singapore", "foreign tax credit"]),
      source: "Income Tax Act Sections 90/90A/91 + DTAA Treaties",
      lastUpdated: now,
    },
    {
      category: "Compliance",
      title: "Form 15CA & 15CB — Complete Guide for NRI Repatriation",
      content: "Source: Income Tax Act Section 195 + RBI Guidelines. Form 15CA and 15CB are mandatory for remitting money from India to an NRI's foreign account. WHEN REQUIRED: Any remittance from NRO account above certain thresholds. FORM 15CB: Certificate from a Chartered Accountant (CA) confirming tax compliance. Required for most remittances above ₹5 lakh. CA verifies: TDS deducted correctly, DTAA benefits applied if any, source of funds is legitimate. FORM 15CA: Online declaration filed by the remitter on Income Tax e-filing portal. References the 15CB. Parts of 15CA: Part A (<₹5L), Part B (with CA certificate), Part C (>₹5L, with 15CB), Part D (exempt transactions). EXCEPTIONS (15CA/15CB NOT required): Salary, pension repatriation, small FD interest payments. PROCESS: 1) Get 15CB from CA. 2) File 15CA on incometax.gov.in. 3) Submit both to bank for SWIFT transfer. Bank will not process repatriation without these forms for applicable transactions.",
      tags: JSON.stringify(["Form 15CA", "Form 15CB", "repatriation", "CA certificate", "NRO", "SWIFT", "tax compliance", "Section 195"]),
      source: "Income Tax Act Section 195 + RBI FEMA",
      lastUpdated: now,
    },
  ];
  for (const entry of entries) {
    db.insert(knowledgeEntries).values(entry).run();
  }
}
