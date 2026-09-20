# PulseCRM — AI-Powered Micro-CRM

An intelligent co-pilot built for small dental and medical practice owners to help them track prospect interactions, identify who needs follow-up, and take instant action with zero manual administrative overhead.

---

## 💡 Key Product & Engineering Decisions

1. **AI Attention Engine (Dynamic Urgency Scoring 0–100)**
   - Standard CRMs sort by alphabetical name or last update date. PulseCRM calculates a dynamic **Attention Score** based on deal recency, pending buyer requests, multi-location expansion signals, and hard deadlines (e.g., target onboarding before Sept 15).

2. **360° AI Relationship Cockpit**
   - Ingests raw interaction history (calls, emails, demo notes) and synthesizes it into a 2-sentence executive summary, key friction/opportunity tags (e.g., *Dentrix integration*, *60 missed calls/week*), and a clear recommended next step.

3. **One-Click Email Draft Generator**
   - Automatically drafts personalized, context-aware follow-up emails referencing past promises and specific conversation details, ready to copy and send in seconds.

4. **Dynamic Interaction Logging**
   - Includes a **"Log Interaction"** modal allowing business owners to record calls, emails, meetings, or notes on the fly, immediately updating the timeline and refreshing AI insights.

5. **Live Gemini 2.5 & Hybrid Architecture**
   - Powered by Gemini 2.5 Flash via Next.js API route handler (`/api/ai/analyze`) using structured JSON output schemas. Includes a rule-assisted local fallback engine that guarantees instant evaluation response times even without an API key.

---

## 🛠️ Tech Stack & Setup

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **AI SDK:** `@google/genai` (Gemini 2.5 Flash)

### Running Locally
```bash
# 1. Clone or open project folder
cd micro-crm

# 2. Install dependencies
npm install

# 3. Configure Gemini API Key (Optional)
# Create a .env.local file in the root directory:
echo "GEMINI_API_KEY=your_gemini_api_key_here" > .env.local

# 4. Run development server
npm run dev

(Note: If GEMINI_API_KEY is omitted, the app gracefully falls back to the deterministic local engine, ensuring zero-config execution for evaluators out-of-the-box.)
Open http://localhost:3000/ in your browser to view the application.
```

### 📋 Assumptions/Simplifications
1. Dataset Ingestion: Seeded in-memory via TypeScript data modules to guarantee zero-configuration setup for evaluators without needing database migration scripts.

2. Single-User Focus: Tailored for a solo founder or small business manager who prioritizes actionable follow-up cues over complex user role permissions.


### 🔮 Future Enhancements with More Time
1. Database Persistence: Replace in-memory state with SQLite/Prisma or Supabase to persist newly logged interactions across server restarts.

2. Two-Way Communications Sync: Connect Google Workspace, Outlook APIs to auto-log inbound/outbound emails and scheduled calendar events.

3. Proactive Morning Digests: Schedule daily morning Slack/SMS notifications highlighting top-priority deals requiring action.