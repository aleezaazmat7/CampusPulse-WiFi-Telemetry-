# CampusPulse
### Smart Campus Wi-Fi Monitoring & Network Health Dashboard

**CampusPulse** turns every student and staff member's phone or laptop into a live network sensor. Instead of suffering in silence or posting frustrated messages on WhatsApp, users run browser speed tests that report real latency, jitter, packet loss, and throughput directly to an intelligent IT operations dashboard.

---

## 🚀 Live Demo & Core Flow
**The End-to-End Workflow:**
1. **User Selects Location:** e.g., *Computer Lab 2*, *Library Floor 2*, *Hostel Block*.
2. **Runs Real Browser Speed Test:** Sequential cache-busted pings, multi-stream chunked download, and binary payload upload.
3. **Health Score Generated (0–100):** Weighted multi-metric formula in `src/lib/health-score.ts` factoring in recent failure penalties.
4. **Real-time Map & NOC Update:** Crowdsourced campus heatmap updates instantaneously; automatic outage triggers activate if $\ge 3$ degraded tests occur in 15 minutes.
5. **AI Incident Brief:** Server-side Gemini 3.8 Flash correlates real packet data and student complaints into an actionable NOC diagnosis with root cause and fix checklist.

---

## 👥 Demo Accounts (One-Click Switcher)
On any page, click the top-right user pill to switch roles instantly:
- **Student / Staff:** Alex Rivera (`student@campus.edu`)
- **IT Support Engineer:** Marcus Chen (`it@campus.edu`)
- **Network Manager:** Sarah Jenkins (`manager@campus.edu`)
- **Campus Administrator:** Dr. Alan Vance (`admin@campus.edu`)

---

## ⚡ Real Browser Speed Test (Not Simulated Numbers)
- **Ping / Latency:** 10 sequential round-trip requests to `/api/ping` with `Cache-Control: no-store`. Takes the median and calculates jitter (mean absolute deviation).
- **Packet Loss:** Tracks timeouts (>2000ms) or connection drops across ping iterations.
- **Download:** 3 parallel streaming connections to `/api/speedtest/download?size=15` reading stream chunks for 6 seconds; throughput calculated from actual bytes received.
- **Upload:** POSTs binary `Uint8Array` payloads to `/api/speedtest/upload` for 5 seconds.
- **Animated Gauge:** 270-degree SVG radial gauge tracking speed dynamically with smooth phase transitions.

---

## 🧮 Network Health Score Formula (`src/lib/health-score.ts`)
- **Download Speed:** 30% weight (Target: 50+ Mbps)
- **Ping / Latency:** 25% weight (Target: $\le 25\text{ms}$)
- **Packet Loss:** 20% weight (Target: 0%)
- **Upload Speed:** 15% weight (Target: 20+ Mbps)
- **Jitter Variance:** 10% weight (Target: $\le 5\text{ms}$)
- **Distress Penalty:** Subtraction for recent failures and complaints at that location.
- **Status Classification:**
  - `Excellent` (85–100)
  - `Good` (70–84)
  - `Fair` (50–69)
  - `Poor` (30–49)
  - `Critical` (<30)

---

## 🤖 AI Features (Powered by Gemini 3.8 Flash)
1. **AI Complaint Triage:** Classifies free-text tickets into standardized categories, sets severity, and identifies likely cause.
2. **Automatic Outage Detection:** Correlates spatial degradation spikes to alert IT and draft student advisories.
3. **Anomaly & Trend Detection:** Compares test against location's 14-day rolling hourly average; flags drops $>40\%$.
4. **AI Incident Brief for IT NOC:** Generates root-cause analysis, affected hardware (AP model, switch port), and a resolution checklist.
5. **Wi-Fi Weather Peak-Hour Forecast:** Recommends optimal study windows based on historical usage.

---

## 🛠️ Technology Stack
- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Canvas Confetti.
- **Backend:** Express fullstack server running on Node / tsx (`server.ts`).
- **AI SDK:** `@google/genai` (Server-side Gemini 3.8 Flash).
- **Architecture:** Client $\leftrightarrow$ Express API $\leftrightarrow$ In-memory seed database (320+ historical tests, 42 complaints, 7 facilities).

---

## 📦 Local Setup & Deployment

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Variables:**
   Create `.env` based on `.env.example`:
   ```env
   GEMINI_API_KEY="your-gemini-api-key"
   ```

3. **Start Development Server:**
   ```bash
   npm run dev
   ```
   Server will start at `http://localhost:3000`.

4. **Build for Production:**
   ```bash
   npm run build
   npm run start
   ```

---

## 📚 Complete Project Documentation
See [`/docs/PROJECT_STRUCTURE.md`](./docs/PROJECT_STRUCTURE.md) for full folder breakdowns, math formulas, and architectural diagrams.
