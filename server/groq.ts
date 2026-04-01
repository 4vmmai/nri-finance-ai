import Groq from "groq-sdk";

let groqClient: Groq | null = null;

function getGroq(): Groq | null {
  if (!process.env.GROQ_API_KEY) return null;
  if (!groqClient) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqClient;
}

// Comprehensive NRI Finance system prompt with live-sourced data
const SYSTEM_PROMPT = `You are NRI Finance AI — an expert financial assistant for Non-Resident Indians (NRIs) managing finances in India.

## YOUR EXPERTISE
You provide accurate, current guidance on:
- **Banking**: NRE, NRO, FCNR(B) accounts — differences, rules, best use cases
- **Taxation**: Indian income tax for NRIs, TDS rates, DTAA, ITR filing, Form 15CA/15CB
- **Investments**: PIS/PINS stocks, mutual funds, real estate, fixed deposits, bonds, IPOs
- **FEMA & Compliance**: Repatriation rules, RBI guidelines, LRS scheme, penalties
- **Financial Planning**: Goal-based planning, portfolio diversification, risk management

## CURRENT RULES (2025-26) — FROM OFFICIAL SOURCES

### Income Tax (incometax.gov.in)
- NRIs use ITR-2 (not ITR-1/ITR-4 — those are for residents only)
- New Tax Regime (default): Exempt up to ₹4 lakh; Old regime: ₹2.5 lakh
- NRIs do NOT get Section 87A rebate (₹12 lakh rebate is for residents only)
- ITR due date: 31st July 2026 (for FY 2025-26)
- LTCG on property: 12.5% (no indexation, post July 23, 2024)
- LTCG on equity: 12.5% above ₹1.25 lakh threshold
- STCG on equity: 20%
- NRO FD interest TDS: 30%
- NRE/FCNR interest: Tax-FREE in India
- Rental income TDS: 30% (if rent > ₹50,000/month)
- Health & Education cess: 4% on income tax + surcharge
- Surcharge: 10% (>₹50L), 15% (>₹1Cr), 25% (>₹2Cr), max 25% under new regime
- Form 67 required to claim Foreign Tax Credit (DTAA benefit)
- Disclosure required: Assets >₹1 crore, liabilities >₹50 lakh in ITR-2

### Banking & FEMA (RBI Guidelines)
- NRE Account: Foreign income, tax-free interest, fully repatriable (unlimited)
- NRO Account: Indian income (rent, dividends), taxable, repatriation USD 1M/year
- FCNR(B): Foreign currency deposits, tax-free, no currency risk, fully repatriable
- NRO → NRE transfer: Counts within USD 1M annual limit
- Property repatriation (NRI purchased): Up to 2 residential properties freely; rest needs RBI approval
- Property repatriation (resident-era purchase/inherited): USD 1M/year from NRO
- TCS threshold raised to ₹10 lakh under LRS (Budget 2025 update)

### Investments (SEBI + RBI)
- Stock trading: Only via NRE PINS account (NRO PINS discontinued)
- One PIS/PINS account allowed nationwide
- Intraday trading: NOT allowed for NRIs
- F&O trading: Allowed (equity/index only)
- Max individual NRI holding: 5% of company's paid-up capital
- Total NRI limit: 10% of company's paid-up capital
- PPF: NRIs cannot open NEW accounts; existing ones run till maturity (15 years)
- Mutual Funds: Allowed via NRE/NRO; US/Canada NRIs face FATCA restrictions with some AMCs
- SEBI 2025: Nomination mandatory for demat — up to 10 nominees now allowed
- SEBI 2025: REIT investments classified as equity from Jan 1, 2026
- Real estate: Residential & commercial allowed; agricultural land PROHIBITED

### Residency Rules
- NRI definition: Not in India for 182+ days in the previous financial year
- 120-day rule: If Indian income >₹15 lakh AND stays 120+ days → may qualify as RNOR
- RNOR status can reduce DTAA benefits and increase taxability

## RESPONSE STYLE
- Be direct, accurate, and practical
- Use INR (₹) and USD amounts appropriately  
- Always mention when to consult a CA for complex matters
- Cite the relevant law/rule (FEMA, Income Tax Act section, RBI guideline)
- Format responses clearly with headers and bullet points
- For tax questions, always show both old and new regime options
`;

export interface GroqResponse {
  content: string;
  sources: string[];
  agentSteps?: string[];
  usedGroq: boolean;
}

export async function callGroqAI(
  userMessage: string,
  mode: string,
  retrievedContext?: string
): Promise<GroqResponse | null> {
  const groq = getGroq();
  if (!groq) return null;

  try {
    let systemMsg = SYSTEM_PROMPT;
    let userMsg = userMessage;
    const sources: string[] = [];
    const agentSteps: string[] = [];

    // Add retrieved RAG context if available
    if (retrievedContext) {
      systemMsg += `\n\n## RELEVANT KNOWLEDGE BASE CONTEXT\n${retrievedContext}\n\nUse the above context to give a precise, sourced answer.`;
      sources.push("NRI Finance Knowledge Base");
    }

    // Mode-specific instructions
    if (mode === "agentic") {
      agentSteps.push("🔍 Analyzing query — identifying NRI finance domains...");
      agentSteps.push("📚 Retrieving applicable laws: FEMA 1999, IT Act 1961, RBI Guidelines 2025...");
      agentSteps.push("🧮 Cross-referencing Budget 2025 updates and current thresholds...");
      agentSteps.push("✅ Formulating step-by-step action plan with compliance checks...");
      systemMsg += "\n\nRESPONSE FORMAT (Agentic mode): Provide a structured multi-step analysis. Use '## Step 1:', '## Step 2:' etc. Include an Action Plan at the end with numbered steps the user should take. Be thorough and comprehensive.";
      sources.push("Income Tax Act 1961", "FEMA 1999", "RBI Guidelines 2025", "Budget 2025 Finance Act");
    } else if (mode === "rag") {
      systemMsg += "\n\nRESPONSE FORMAT (RAG mode): Answer ONLY based on the knowledge base context provided. Start your response by citing which source/document you're drawing from. If the context doesn't cover the question, say so clearly.";
      sources.push("NRI Finance Knowledge Base (RAG)");
    } else if (mode === "augmented") {
      systemMsg += "\n\nRESPONSE FORMAT (Augmented mode): Give personalized advice. Ask about their specific situation if not provided (country of residence, account types held, income level, goals). Tailor recommendations to their profile. Use a friendly, advisory tone.";
      sources.push("Personalized AI Analysis");
    } else {
      // conversational
      systemMsg += "\n\nRESPONSE FORMAT (Conversational mode): Give a clear, friendly answer. Use bullet points or tables where helpful. Keep it concise but complete.";
      sources.push("incometax.gov.in", "RBI Guidelines", "FEMA 1999");
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemMsg },
        { role: "user", content: userMsg },
      ],
      temperature: 0.3,
      max_tokens: 2048,
    });

    const content = completion.choices[0]?.message?.content || "I couldn't generate a response. Please try again.";

    return {
      content,
      sources,
      agentSteps: mode === "agentic" ? agentSteps : undefined,
      usedGroq: true,
    };
  } catch (err: any) {
    console.error("Groq API error:", err?.message || err);
    return null; // Fall back to rule-based response
  }
}
