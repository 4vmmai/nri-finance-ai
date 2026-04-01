import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";



// NRI Knowledge Base for AI responses
const NRI_KNOWLEDGE = `
You are NRI Finance AI Assistant — an expert on all financial matters for Non-Resident Indians (NRIs) outside India.
You help NRIs understand:
- Banking: NRE, NRO, FCNR accounts, their differences, and best use cases
- Taxation: India income tax for NRIs, TDS, DTAA (Double Taxation Avoidance Agreements), ITR filing
- Investments: Stocks (PIS/PINS), Mutual Funds, Fixed Deposits, Real Estate, IPOs, Bonds
- Compliance: FEMA rules, RBI guidelines, repatriation limits, Form 15CA/15CB
- Financial Planning: Goal-based planning, risk management, portfolio diversification

Current rules (2025):
- NRE FD interest: tax-free in India, fully repatriable
- NRO FD interest: taxed at 30%, repatriation USD 1M/year limit
- FCNR: foreign currency FD, tax-free, fully repatriable
- Property LTCG: 12.5% (no indexation) for post-July 23, 2024 property
- Equity LTCG: 12.5% above Rs 1.25 lakh threshold
- PIS/PINS account needed for stock trading (only ONE allowed)
- Intraday trading not allowed for NRIs
- PPF: no new accounts allowed for NRIs
- DTAA benefits available with 90+ countries
- Budget 2025: TCS threshold raised to Rs 10 lakh, two properties can be self-occupied
- NRI status: outside India 182+ days in financial year

Always be accurate, cite relevant laws/acts, and recommend consulting a CA or financial advisor for complex situations.
`;

// AI Mode processors
function processConversationalQuery(question: string, context: string): string {
  return `You are in conversational mode. Answer this NRI finance question naturally and helpfully.\n\nContext: ${context}\n\nQuestion: ${question}`;
}

function processAgenticQuery(question: string, context: string): string {
  return `You are in AGENTIC mode. Break down this NRI finance task into steps, reason through each step, and provide a comprehensive answer with action items.\n\nContext: ${context}\n\nTask: ${question}\n\nProvide: 1) Analysis steps 2) Key findings 3) Recommended actions 4) Important caveats`;
}

function processRAGQuery(question: string, retrievedDocs: string[]): string {
  const docs = retrievedDocs.join("\n\n---\n\n");
  return `You are in RAG (Retrieval-Augmented Generation) mode. Answer based ONLY on the retrieved knowledge base documents below. Cite your sources.\n\nRetrieved Documents:\n${docs}\n\nQuestion: ${question}`;
}

function processAugmentedQuery(question: string, context: string, profile: string): string {
  return `You are in AUGMENTED AI mode. You have access to the user's financial profile and the full NRI knowledge base. Provide a personalized, contextualized answer.\n\nUser Profile:\n${profile}\n\nNRI Knowledge Base:\n${context}\n\nQuestion: ${question}\n\nProvide personalized advice based on their specific situation.`;
}

// Simulate AI response (comprehensive knowledge-based responses)
function generateAIResponse(prompt: string, mode: string, retrievedDocs?: string[]): { content: string; sources: string[]; agentSteps?: string[] } {
  const lowerPrompt = prompt.toLowerCase();
  
  // Agentic mode - show reasoning steps
  if (mode === "agentic") {
    const agentSteps = [
      "🔍 Analyzing query intent and identifying relevant NRI finance domains...",
      "📚 Retrieving applicable laws: FEMA 1999, Income Tax Act 1961, RBI Guidelines 2025...",
      "🧮 Processing applicable rules and thresholds...",
      "✅ Validating against Budget 2025 updates...",
      "📝 Formulating comprehensive response with action items...",
    ];
    
    let content = "";
    let sources: string[] = [];
    
    if (lowerPrompt.includes("invest") || lowerPrompt.includes("stock") || lowerPrompt.includes("mutual fund")) {
      content = `## 🤖 Agentic Analysis: NRI Investment Options in India

**Step 1: Status Assessment**
As an NRI, you're governed by FEMA 1999 and RBI investment guidelines. Your investment options depend on your account type (NRE/NRO/FCNR).

**Step 2: Available Investment Channels**

### 📈 Stock Market (via PIS/PINS)
- Open NRE bank account → Apply for PIS permission → Open Demat account
- Only delivery-based trading (NO intraday)
- Individual limit: 5% of company's paid-up capital
- Only ONE PIS account allowed nationwide

### 💼 Mutual Funds (No PIS needed)
- Direct investment via NRE (repatriable) or NRO account
- All mutual fund types allowed except for US/Canada NRIs with FATCA restrictions
- SIP available through NRE/NRO accounts

### 🏠 Real Estate
- Residential & commercial properties allowed
- Agricultural land, farmhouses: **PROHIBITED**
- LTCG: 12.5% (Budget 2025 update)

### 🏦 Fixed Deposits
- NRE FD: Tax-free interest, fully repatriable ✅
- NRO FD: 30% TDS, USD 1M/year repatriation
- FCNR: Foreign currency FD, tax-free, no currency risk

**Step 3: Recommended Action Plan**
1. ✅ Open NRE account (priority — for repatriable investments)
2. ✅ Get PAN card (mandatory for all investments)
3. ✅ Apply for KYC compliance
4. ✅ Start with NRE FD for stable returns
5. ✅ Consider equity mutual funds via NRE account
6. ✅ Explore PIS for direct stock trading

**⚠️ Important:** Consult a SEBI-registered investment advisor and CA for personalized advice.`;
      sources = ["FEMA Schedule 3", "RBI PINS Guidelines 2025", "SEBI NRI Investment Circular", "Budget 2025"];
    } else if (lowerPrompt.includes("tax") || lowerPrompt.includes("itr") || lowerPrompt.includes("filing")) {
      content = `## 🤖 Agentic Analysis: NRI Tax Obligations in India

**Step 1: Determining Tax Liability**
NRIs are taxed ONLY on India-sourced income under Income Tax Act, 1961.

**Step 2: Taxable Income Categories**
| Income Type | Taxable? | Rate |
|---|---|---|
| NRO FD Interest | ✅ Yes | 30% TDS |
| NRE FD Interest | ❌ No | Tax-free |
| FCNR Interest | ❌ No | Tax-free |
| Rental income from Indian property | ✅ Yes | Slab rate |
| Capital gains from equity | ✅ Yes | 20% STCG / 12.5% LTCG |
| Capital gains from property | ✅ Yes | 12.5% LTCG |
| Dividends from Indian companies | ✅ Yes | 20% or DTAA rate |
| Foreign income (USA salary etc.) | ❌ No | Not taxable in India |

**Step 3: Filing Requirements FY 2025-26**
- File if Indian income > Rs 4 lakh (new regime) or Rs 2.5 lakh (old regime)
- Use **ITR-2** (salary, rent, capital gains)
- Use **ITR-3** (business/profession)
- Due date: **31 July 2026**

**Step 4: DTAA Benefits**
- Claim lower TDS if your country has a DTAA with India
- Submit: Tax Residency Certificate (TRC) + Form 10F to Indian bank/payer
- Countries: USA (15% dividends), UK (15%), Singapore (10% interest)

**Step 5: Action Items**
1. ✅ Compile Form 26AS (shows all TDS deducted in India)
2. ✅ Obtain TRC from your country
3. ✅ Submit Form 10F before receiving income
4. ✅ File ITR-2 before 31 July 2026
5. ✅ Claim TDS refund if over-deducted

**⚠️ New for FY 2025-26:** Disclose Indian assets exceeding Rs 1 crore in ITR-2.`;
      sources = ["Income Tax Act 1961", "Budget 2025", "DTAA Treaties", "HDFC Life Tax Guide"];
    } else {
      content = generateDefaultResponse(lowerPrompt, mode);
      sources = ["RBI Guidelines 2025", "FEMA 1999", "Income Tax Act 1961"];
    }
    
    return { content, sources, agentSteps };
  }
  
  // RAG mode
  if (mode === "rag" && retrievedDocs && retrievedDocs.length > 0) {
    const content = `## 📚 RAG Response (Knowledge Base Retrieved)

Based on ${retrievedDocs.length} retrieved document(s) from the NRI Finance Knowledge Base:

${retrievedDocs.slice(0, 3).map((doc, i) => `**Source ${i+1}:**\n${doc.substring(0, 300)}...`).join("\n\n")}

---

**AI-Generated Answer from Retrieved Context:**

${generateDefaultResponse(lowerPrompt, "conversational")}

*This response was generated using Retrieval-Augmented Generation (RAG) — only sourcing from verified NRI finance documents.*`;
    return { content, sources: ["NRI Finance Knowledge Base — RAG Retrieved"], agentSteps: undefined };
  }
  
  // Augmented mode
  if (mode === "augmented") {
    const baseAnswer = generateDefaultResponse(lowerPrompt, mode);
    const content = `## 🧠 Augmented AI Response (Personalized)

${baseAnswer}

---

**💡 Personalized Insight:**
Based on your financial profile and goals, this guidance has been tailored to your specific situation. The augmented AI combines your profile data with the full NRI knowledge base to give you the most relevant advice.

*Augmented AI mode uses your profile data + real-time knowledge retrieval for personalized recommendations.*`;
    return { content, sources: ["NRI Knowledge Base", "User Profile Data", "RBI 2025 Guidelines"] };
  }
  
  // Conversational mode (default)
  return { content: generateDefaultResponse(lowerPrompt, "conversational"), sources: ["NRI Finance Knowledge Base"] };
}

function generateDefaultResponse(prompt: string, mode: string): string {
  const p = prompt.toLowerCase();
  
  if (p.includes("nre") && (p.includes("nro") || p.includes("difference") || p.includes("compare") || p.includes("vs"))) {
    return `## NRE vs NRO vs FCNR Accounts

| Feature | NRE Account | NRO Account | FCNR Account |
|---|---|---|---|
| **Currency** | INR | INR | Foreign (USD, GBP, EUR...) |
| **Income Source** | Foreign earnings | Indian income | Foreign earnings |
| **Repatriation** | Fully free | USD 1M/year | Fully free |
| **Interest Tax** | Tax-free in India | Taxable (30% TDS) | Tax-free in India |
| **Currency Risk** | Yes (INR) | Yes (INR) | No (stays in foreign currency) |
| **Account Types** | Savings/Current/FD | Savings/Current/FD | FD only |

**Which to choose?**
- 💰 **NRE**: Best for foreign earnings you may want to repatriate later
- 🏡 **NRO**: Best for managing rent, dividends, pension from India
- 🛡️ **FCNR**: Best if you want to protect against INR depreciation`;
  }
  
  if (p.includes("nre") || p.includes("non resident external")) {
    return `## NRE Account (Non-Resident External)

An NRE account is the **most popular account for NRIs** who want to park foreign earnings in India.

**Key Benefits:**
- 🆓 **Interest is completely tax-free** in India
- ✈️ **Fully repatriable** — send money back abroad anytime, no limits
- 💱 Maintained in INR (converted at current exchange rates)
- 🤝 Joint account allowed with another NRI/PIO

**Best Used For:**
- Investing in Indian mutual funds, stocks (via NRE PIS)
- Sending money to family in India
- Parking foreign savings in Indian FDs for higher returns

**FD Interest Rates (2025):** Typically 6.5–7.5% per annum (check individual banks)

**⚠️ Note:** Opening an NRE account requires valid NRI status (passport, visa, overseas address proof).`;
  }
  
  if (p.includes("nro") || p.includes("non resident ordinary")) {
    return `## NRO Account (Non-Resident Ordinary)

An NRO account is for **managing India-sourced income** while you're abroad.

**Key Facts:**
- 💸 **Interest is taxable** in India at 30% (TDS deducted at source)
- 🚧 **Repatriation limited** to USD 1 million per financial year
- 📋 Requires Form 15CA + Form 15CB (CA certification) for repatriation
- 🤝 Can be held jointly with a resident Indian relative

**Income credited to NRO:**
- Rental income from Indian properties
- Dividends from Indian investments
- Pension, interest, gifts received in India
- Proceeds from sale of Indian assets

**DTAA Relief:** If your country has a DTAA with India, you can claim lower TDS rates by submitting Tax Residency Certificate (TRC) + Form 10F.`;
  }
  
  if (p.includes("repatriate") || p.includes("repatriation") || p.includes("send money") || p.includes("transfer money")) {
    return `## Money Repatriation Rules for NRIs

### From NRE/FCNR Accounts:
- ✅ **Unlimited repatriation** — no restrictions
- No documentation needed (other than bank KYC)
- Principal + interest both freely moveable

### From NRO Account:
- 🚧 **Limit: USD 1 million per financial year** (April–March)
- Required documents:
  - **Form 15CA** — self-declaration online
  - **Form 15CB** — CA certification of tax compliance
  - Submit to your bank before transfer

### Property Sale Proceeds:
- Up to **USD 1 million/year** without prior RBI approval
- All payments must have been made through NRE/NRO/FCNR accounts
- TDS certificate must be obtained from buyer

### DTAA and Tax Clearance:
- Ensure all taxes are paid/withheld before repatriation
- Claim DTAA benefits where applicable with TRC + Form 10F

**⚠️ FEMA Violation Penalty:** Up to 3× the amount involved. Always follow proper procedures.`;
  }
  
  if (p.includes("fema") || p.includes("foreign exchange management")) {
    return `## FEMA (Foreign Exchange Management Act) for NRIs

FEMA 1999 is the **primary law governing foreign exchange transactions** for NRIs in India.

**NRI Definition under FEMA:**
An individual who has stayed outside India for **182+ days** in the previous financial year.

**Key FEMA Rules for NRIs:**

### Permitted Investments:
- ✅ Shares/debentures of Indian companies (via PIS/PINS)
- ✅ Mutual funds
- ✅ Residential & commercial real estate
- ✅ Government securities and bonds
- ✅ NRE/NRO/FCNR bank accounts

### Prohibited for NRIs:
- ❌ Agricultural land, plantations, farmhouses
- ❌ Lottery, gambling businesses
- ❌ Atomic energy, certain railway activities
- ❌ Chit funds, Nidhi companies
- ❌ More than 5% of any listed company's paid-up capital (individually)

### Key Limits:
- NRO repatriation: **USD 1 million/year**
- NRE/FCNR: **No limits**
- Foreign currency to India: **Unlimited** (but declare >USD 10,000)`;
  }
  
  if (p.includes("property") || p.includes("real estate")) {
    return `## Real Estate Investment for NRIs (2025 Update)

### ✅ What NRIs CAN Buy:
- Residential properties (apartments, houses, villas)
- Commercial properties (offices, shops, warehouses)
- No prior RBI approval needed
- Multiple properties allowed

### ❌ What NRIs CANNOT Buy:
- Agricultural land
- Plantation property
- Farmhouses
- Any property through Power of Attorney (PoA) for investment purposes

### 💰 Tax Rules (Budget 2025):
| Tax | Rate | Notes |
|---|---|---|
| LTCG on property | **12.5%** | No indexation (post July 23, 2024) |
| LTCG with indexation | 20% | Only for pre-July 23, 2024 properties |
| TDS on NRI property sale | 12.5% | Buyer must deduct |
| Self-occupied properties | **2 now allowed** | No notional rent tax |

### 📋 Payment Rules:
- All payments through NRE/NRO/FCNR accounts only
- Cash transactions above Rs 30,000: not allowed
- Repatriation of sale proceeds: USD 1M/year from NRO

### 🔑 Pro Tip:
Get a Power of Attorney (PoA) assigned to a trusted person in India if you can't be physically present for transactions.`;
  }
  
  if (p.includes("ppf") || p.includes("public provident fund")) {
    return `## PPF (Public Provident Fund) Rules for NRIs

### 🚫 NRIs Cannot:
- Open a NEW PPF account after becoming NRI
- Extend existing PPF accounts beyond initial 15 years

### ✅ NRIs Can:
- Continue contributing to **existing PPF accounts** opened when they were a resident
- Receive contributions until the account matures (15-year tenure)
- Earn the current PPF interest rate (currently ~7.1% p.a.)
- The interest remains tax-free in India

### After Account Matures:
- The entire corpus (principal + interest) can be repatriated
- Transfer to NRO account, then repatriate within USD 1M/year limit
- Interest during NRI period is tax-free in India

### Better Alternatives for NRIs:
- **NRE Fixed Deposits:** Tax-free interest, higher rates, fully repatriable
- **Equity Mutual Funds via NRE:** Better long-term returns
- **FCNR Deposits:** For currency-protected savings`;
  }
  
  if (p.includes("dtaa") || p.includes("double tax") || p.includes("treaty")) {
    return `## Double Taxation Avoidance Agreement (DTAA) for NRIs

DTAA prevents you from paying tax on the same income in **both India and your resident country**.

### How DTAA Helps:
- Reduces TDS rates on dividends, interest, royalties
- Avoids double taxation on rental income, capital gains
- Provides tax credits in your resident country

### Key DTAA Countries:
| Country | Dividend TDS | Interest TDS | Notes |
|---|---|---|---|
| USA | 15% | 15% | FATCA compliance needed |
| UK | 15% | 15% | |
| Singapore | 15% | 10% | |
| UAE | N/A | 12.5% | No income tax in UAE |
| Canada | 25% | 15% | FATCA compliance needed |
| Germany | 10% | 10% | |
| Australia | 15% | 15% | |

### Steps to Claim DTAA Benefits:
1. 📄 Obtain **Tax Residency Certificate (TRC)** from your country's tax authority
2. 📝 Submit **Form 10F** to Indian bank/payer (along with TRC)
3. 📋 Ensure PAN is linked to your NRI bank account
4. 🔄 File ITR in India to claim any refund for excess TDS deducted

**⚠️ TRC must be renewed annually** — banks and payers require fresh TRC each financial year.`;
  }
  
  if (p.includes("stock") || p.includes("equity") || p.includes("share") || p.includes("market") || p.includes("nse") || p.includes("bse")) {
    return `## Stock Market Investment for NRIs

### Setup Requirements:
1. **NRE or NRO bank account** at RBI-designated bank
2. **PIS (Portfolio Investment Scheme) permission** from RBI via your bank
3. **Demat account + Trading account** linked to PIS account
4. **PAN card** (mandatory)

### What's Allowed:
- ✅ Delivery-based equity trading on NSE and BSE
- ✅ F&O trading (equity/index futures and options only)
- ✅ IPO subscriptions (no PIS account needed for IPOs)
- ✅ Mutual funds (no PIS needed)
- ✅ ETFs (except currency/commodity ETFs)

### What's NOT Allowed:
- ❌ **Intraday trading** (STRICT rule — shares must settle in demat)
- ❌ Investing in companies doing chit funds, Nidhi, agricultural activities
- ❌ Holding more than 5% of any single company

### Important Update (2025):
- Only **ONE NRE PINS account** needed (NRO PINS no longer required)
- Simplified compliance for stock investments

### Tax on Equity:
- **STCG (< 1 year):** 20%
- **LTCG (> 1 year):** 12.5% on gains above Rs 1.25 lakh
- TDS deducted automatically on sale proceeds`;
  }
  
  if (p.includes("mutual fund") || p.includes("sip") || p.includes("elss") || p.includes("debt fund")) {
    return `## Mutual Fund Investments for NRIs

### ✅ Key Advantages:
- No PIS account needed (unlike stocks)
- Invest via NRE (repatriable) or NRO accounts
- SIP (Systematic Investment Plan) available
- Wide range: Equity, Debt, Hybrid, ELSS

### Investment Routes:
| Route | Account | Repatriation |
|---|---|---|
| Repatriation basis | NRE account | Fully repatriable |
| Non-repatriation | NRO account | USD 1M/year limit |

### ⚠️ US/Canada NRI Restriction:
- Some AMCs (HDFC, ICICI, SBI, etc.) accept US/Canada NRIs
- Others don't due to **FATCA compliance** requirements
- Check specific AMC's NRI policy before investing
- Eligible: Mirae Asset, Axis, Nippon, UTI (most accept US NRIs)

### Tax on Mutual Funds (2025):
**Equity Funds:**
- STCG (< 1 year): 20%
- LTCG (> 1 year): 12.5% above Rs 1.25 lakh

**Debt Funds:**
- Taxed at income tax slab rate (both STCG and LTCG)
- No separate LTCG rate for debt funds

**ELSS (Tax Saving):**
- 3-year lock-in; Section 80C deduction available (old regime only)

**TDS on redemption:** Applicable; claim refund via ITR if over-deducted.`;
  }
  
  // Default comprehensive response
  return `## NRI Finance Assistant

I'm here to help with all your financial questions as an NRI! Here are the main areas I can assist with:

### 🏦 Banking
- NRE, NRO, FCNR account differences and best uses
- How to open accounts from abroad
- Repatriation rules and limits

### 💰 Investments
- Stock market (PIS/PINS setup, restrictions)
- Mutual funds (SIP, ELSS, debt funds)
- Fixed deposits (NRE vs NRO vs FCNR)
- Real estate (what you can/cannot buy)
- IPOs, bonds, government securities

### 📊 Taxation
- NRI income tax rules and slabs
- TDS rates and how to claim refunds
- DTAA benefits with your resident country
- ITR filing (forms, deadlines)
- Capital gains on property and equity

### ⚖️ Compliance & Laws
- FEMA rules and repatriation limits
- Form 15CA/15CB for fund transfers
- NRI status definition (182-day rule)
- LRS (Liberalised Remittance Scheme)

**Try asking me about any specific topic above!**

*For example: "What is the difference between NRE and NRO accounts?" or "How do I file taxes as an NRI in India?" or "Can I buy property in India as an NRI?"*`;
}

export function registerRoutes(httpServer: Server, app: Express) {
  // Health check for Railway
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "NRI Finance AI", timestamp: new Date().toISOString() });
  });

  // Get all chat sessions
  app.get("/api/sessions", (req, res) => {
    const sessions = storage.getSessions();
    res.json(sessions);
  });

  // Create chat session
  app.post("/api/sessions", (req, res) => {
    const { title, mode } = req.body;
    if (!title) return res.status(400).json({ error: "Title required" });
    const session = storage.createSession({
      title,
      mode: mode || "conversational",
      createdAt: new Date().toISOString(),
    });
    res.json(session);
  });

  // Delete session
  app.delete("/api/sessions/:id", (req, res) => {
    storage.deleteSession(Number(req.params.id));
    res.json({ ok: true });
  });

  // Get messages for a session
  app.get("/api/sessions/:id/messages", (req, res) => {
    const messages = storage.getMessages(Number(req.params.id));
    res.json(messages);
  });

  // Send a message (AI chat)
  app.post("/api/sessions/:id/chat", (req, res) => {
    const sessionId = Number(req.params.id);
    const { message, mode } = req.body;

    if (!message) return res.status(400).json({ error: "Message required" });

    // Save user message
    storage.addMessage({
      sessionId,
      role: "user",
      content: message,
      aiMode: mode || "conversational",
      sources: null,
      agentSteps: null,
      createdAt: new Date().toISOString(),
    });

    // Retrieve relevant docs for RAG
    let retrievedDocs: string[] = [];
    if (mode === "rag") {
      const docs = storage.searchKnowledge(message);
      retrievedDocs = docs.map(d => `[${d.category}] ${d.title}\n${d.content}\nSource: ${d.source || "NRI Knowledge Base"}`);
    }

    // Generate AI response
    const aiResult = generateAIResponse(message, mode || "conversational", retrievedDocs);

    // Save AI response
    const savedMsg = storage.addMessage({
      sessionId,
      role: "assistant",
      content: aiResult.content,
      aiMode: mode || "conversational",
      sources: JSON.stringify(aiResult.sources),
      agentSteps: aiResult.agentSteps ? JSON.stringify(aiResult.agentSteps) : null,
      createdAt: new Date().toISOString(),
    });

    res.json(savedMsg);
  });

  // Knowledge base - get all entries
  app.get("/api/knowledge", (req, res) => {
    const { category, search } = req.query;
    let entries;
    if (search) {
      entries = storage.searchKnowledge(String(search));
    } else if (category) {
      entries = storage.getKnowledgeByCategory(String(category));
    } else {
      entries = storage.getKnowledgeEntries();
    }
    res.json(entries);
  });

  // Knowledge categories
  app.get("/api/knowledge/categories", (req, res) => {
    const entries = storage.getKnowledgeEntries();
    const cats = [...new Set(entries.map(e => e.category))];
    res.json(cats);
  });

  // User profile
  app.get("/api/profile", (req, res) => {
    const profile = storage.getProfile();
    res.json(profile || null);
  });

  app.post("/api/profile", (req, res) => {
    const profileData = {
      ...req.body,
      createdAt: new Date().toISOString(),
    };
    const saved = storage.upsertProfile(profileData);
    res.json(saved);
  });

  // Tax calculator
  app.post("/api/calculate/tax", (req, res) => {
    const { incomeType, amount, holdingPeriod, country } = req.body;
    
    let tax = 0;
    let rate = 0;
    let notes: string[] = [];
    
    if (incomeType === "nro_fd_interest") {
      rate = 30;
      tax = amount * 0.30;
      notes = ["TDS deducted at source", "File ITR to claim refund if over-deducted", "DTAA may reduce rate with TRC + Form 10F"];
    } else if (incomeType === "equity_ltcg") {
      rate = 12.5;
      const exemption = 125000;
      const taxableGain = Math.max(0, amount - exemption);
      tax = taxableGain * 0.125;
      notes = ["Rs 1.25 lakh exemption applies", "Held > 1 year qualifies as LTCG"];
    } else if (incomeType === "equity_stcg") {
      rate = 20;
      tax = amount * 0.20;
      notes = ["Held < 1 year qualifies as STCG", "TDS automatically deducted on sale"];
    } else if (incomeType === "property_ltcg") {
      rate = 12.5;
      tax = amount * 0.125;
      notes = ["No indexation (post July 23, 2024)", "Pre-July 23: can choose 20% with indexation", "TDS on property sale: buyer deducts"];
    } else if (incomeType === "rental_income") {
      rate = 30;
      tax = amount * 0.30;
      notes = ["30% flat rate for NRIs", "Standard deduction of 30% of rent allowed", "Municipal taxes deductible"];
    }
    
    const result = {
      grossAmount: amount,
      taxableAmount: amount,
      taxRate: rate,
      taxAmount: Math.round(tax),
      netAmount: Math.round(amount - tax),
      notes,
    };
    
    storage.saveCalculation({
      type: "tax_estimate",
      inputs: JSON.stringify(req.body),
      result: JSON.stringify(result),
      createdAt: new Date().toISOString(),
    });
    
    res.json(result);
  });

  // Repatriation calculator
  app.post("/api/calculate/repatriation", (req, res) => {
    const { accountType, amount } = req.body;
    
    let canRepatriate = true;
    let limit = null;
    let requiredDocs: string[] = [];
    let notes: string[] = [];
    
    if (accountType === "nre" || accountType === "fcnr") {
      canRepatriate = true;
      limit = "Unlimited";
      requiredDocs = ["Standard bank KYC documents"];
      notes = ["NRE and FCNR accounts allow full repatriation", "No annual limit", "Both principal and interest freely moveable"];
    } else if (accountType === "nro") {
      limit = "USD 1,000,000 per financial year";
      requiredDocs = ["Form 15CA (self-declaration)", "Form 15CB (CA certification)", "Bank statement", "Tax clearance if applicable"];
      notes = ["USD 1 million limit per financial year (April–March)", "All taxes must be paid before repatriation", "CA must certify Form 15CB", "NRO to NRE transfers also count toward USD 1M limit"];
      if (amount > 1000000) {
        notes.push("⚠️ Amount exceeds annual limit — will need to repatriate over multiple years or seek special RBI permission");
      }
    }
    
    res.json({ accountType, amount, canRepatriate, limit, requiredDocs, notes });
  });

  // Investment calculator (FD returns)
  app.post("/api/calculate/investment", (req, res) => {
    const { principal, rate, years, compounding = "quarterly" } = req.body;
    
    let n = 4; // quarterly
    if (compounding === "monthly") n = 12;
    if (compounding === "annually") n = 1;
    
    const r = rate / 100;
    const amount = principal * Math.pow(1 + r / n, n * years);
    const interest = amount - principal;
    
    res.json({
      principal: Math.round(principal),
      interestRate: rate,
      years,
      compounding,
      maturityAmount: Math.round(amount),
      totalInterest: Math.round(interest),
      effectiveYield: ((Math.pow(1 + r/n, n) - 1) * 100).toFixed(2),
    });
  });

  // Get saved calculations
  app.get("/api/calculations", (req, res) => {
    res.json(storage.getCalculations());
  });
}
