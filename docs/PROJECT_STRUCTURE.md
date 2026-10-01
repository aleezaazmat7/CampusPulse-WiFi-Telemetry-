# CampusPulse — Project Structure & Technical Architecture
**Smart Campus Wi-Fi Monitoring & Network Health Dashboard**

CampusPulse turns student and staff devices into real-time crowdsourced network probes, eliminating informal WhatsApp complaints and giving university IT teams instant spatial network telemetry.

---

## 1. Directory Structure

```text
/
├── server.ts                       # Fullstack Express API backend + Vite middleware integration
├── package.json                    # Dependencies & scripts ("dev": "tsx server.ts")
├── metadata.json                   # Applet metadata & Server-side Gemini API capability flag
├── index.html                      # HTML5 entry point with Plus Jakarta Sans & typography
├── docs/
│   └── PROJECT_STRUCTURE.md       # Comprehensive system architecture & implementation guide
├── src/
│   ├── main.tsx                    # React 19 application bootstrapping
│   ├── App.tsx                     # Core state container, routing, live telemetry polling
│   ├── index.css                   # Tailwind CSS styling, animations, custom scrollbars
│   ├── lib/
│   │   ├── types.ts                # TypeScript interfaces (Locations, Tests, Complaints, KPIs)
│   │   ├── health-score.ts         # Central 0-100 weighted network health score formula
│   │   └── speedtest-runner.ts     # Real browser measurement engine (Ping, Download, Upload)
│   └── components/
│       ├── Navbar.tsx              # Sticky header, emergency banner, one-click demo role switcher
│       ├── LandingPage.tsx         # Marketing & pitch showcase with live KPI ticker & flow
│       ├── SpeedTestView.tsx       # Live radial animated gauge with real throughput testing
│       ├── CampusHeatmap.tsx       # Interactive architectural SVG campus map & deep-dive drawer
│       ├── DashboardView.tsx       # Operations dashboard with 8 KPI cards & live stream feeds
│       ├── ComplaintsView.tsx      # Problem reporting with attached test telemetry & AI triage
│       ├── ITSupportView.tsx       # NOC console with active outage monitor & AI incident briefs
│       ├── ManagerView.tsx         # Building comparison matrix, IT SLAs, and CSV report export
│       ├── AdminView.tsx           # Health threshold weights configuration & Pitch Demo simulator
│       ├── MyHistoryView.tsx       # Personal test telemetry history and sparkline trendlines
│       └── DocumentationModal.tsx  # In-app interactive architecture guide for evaluators
```

---

## 2. Real Browser Speed Test Mechanics

The speed test runs **real, un-faked browser measurements** directly against dedicated backend streaming endpoints:

1. **Ping & Jitter (Latency Phase):**
   - The browser executes **10 sequential tiny HTTP requests** to `/api/ping`.
   - Each request has `Cache-Control: no-store` and `Pragma: no-cache` to bypass browser caching.
   - The median latency is calculated to avoid single-packet outliers.
   - **Jitter** is calculated as the mean absolute deviation between successive ping round-trips:
     $$\text{Jitter} = \frac{1}{N-1} \sum_{i=1}^{N-1} |P_{i+1} - P_i|$$
   - **Packet Loss (%)** tracks requests that exceed a 2000ms timeout or fail.

2. **Download Throughput (Multi-Stream Streamed Phase):**
   - The browser initiates **3 parallel streaming connections** to `/api/speedtest/download?size=15`.
   - The server streams raw 64KB binary byte chunks without compression.
   - The browser reads the `ReadableStream` chunk by chunk for 6.0 seconds.
   - Throughput is calculated dynamically:
     $$\text{Download Mbps} = \frac{\text{Bytes Received} \times 8}{\text{Elapsed Seconds} \times 1,000,000}$$

3. **Upload Throughput (Binary Blob Stream Phase):**
   - The client constructs random 256KB binary `Uint8Array` chunks and performs consecutive `POST` requests to `/api/speedtest/upload` for 5.0 seconds.
   - The server consumes the binary stream and calculates elapsed throughput.

4. **Dynamic Gauge Animation:**
   - A 270-degree radial SVG circular gauge smoothly tracks instantaneous throughput and latency across every phase transition.

---

## 3. Network Health Score Formula (`src/lib/health-score.ts`)

Implemented cleanly in `src/lib/health-score.ts` to allow judges and evaluators to inspect the exact math:

### Component Weights:
- **Download Speed:** 30% weight (Target: 50+ Mbps yields 30 pts)
- **Latency / Ping:** 25% weight (Target: $\le 25\text{ms}$ yields 25 pts; drops to 0 at 250ms)
- **Packet Loss:** 20% weight (Target: 0% loss yields 20 pts; loss above 8% drops to 0)
- **Upload Speed:** 15% weight (Target: 20+ Mbps yields 15 pts)
- **Jitter Variance:** 10% weight (Target: $\le 5\text{ms}$ yields 10 pts; drops to 0 at 45ms)

### Recent Distress Penalty:
- Each recent failed test ($<50$ health) in the last hour subtracts **2.0 points**.
- Each open unresolved complaint subtracts **1.5 points** (maximum penalty capped at 18 pts).

### Score-to-Status Mapping:
- **Excellent:** 85 – 100 (Optimal for 4K streaming and high-density exams)
- **Good:** 70 – 84 (Reliable performance with minor latency jitter)
- **Fair:** 50 – 69 (Noticeable congestion during peak hours)
- **Poor:** 30 – 49 (Frequent packet drops and buffering)
- **Critical:** 0 – 29 (Severe hardware/link failure or active outage)

---

## 4. Artificial Intelligence Features (Gemini 3.8 Flash)

CampusPulse uses **Gemini 3.8 Flash** via the official `@google/genai` TypeScript SDK on the server-side:

1. **AI Complaint Triage (`POST /api/complaints`):**
   - When a user submits free text (e.g. *"wifi disconnects in lab 2 while downloading github repo"*), Gemini classifies the category, assigns a severity (`Low` | `Medium` | `High` | `Critical`), identifies the exact probable root cause, and provides immediate IT resolution instructions.
2. **Automatic Outage Detection:**
   - When 3+ degraded tests or 3+ complaints occur within 15 minutes at the same location, an **Outage Alert** is generated automatically and Gemini drafts an executive diagnosis and user advisory.
3. **Rolling Anomaly Detection:**
   - Compares each new test with that location's 14-day rolling average for the same hour. If speed drops by $>40\%$, an automatic anomaly alert flags the event.
4. **AI Incident Brief for IT NOC (`POST /api/ai/incident-brief`):**
   - Correlates client packet loss, throughput, access point model, switch port, and recent user complaints into an actionable NOC diagnostic brief with a step-by-step fix checklist.
5. **Wi-Fi Weather Peak-Hour Forecast (`GET /api/ai/wifi-weather/:id`):**
   - Analyzes historical circadian usage curves to predict best study hours (e.g., *"Best time to study: 8:00 AM – 11:00 AM"*).

---

## 5. End-to-End System Connectivity

```text
[ Browser Client ]
       │
       ├─► (Real Speed Test)  ──► /api/ping, /api/speedtest/download, /api/speedtest/upload
       │
       ├─► (Telemetry Post)   ──► /api/tests  ──────────────┐
       │                                                    ▼
       ├─► (Complaints)       ──► /api/complaints ──► [ In-Memory Store ]
       │                                                    │
       └─► (NOC & AI Brief)   ──► /api/ai/* ────────► [ Gemini 3.8 Flash ]
                                                            │
                                                            ▼
                                                   [ Campus Heatmap & KPIs ]
```

- **Frontend:** React 19 SPA running on Vite, Tailwind CSS v4, Lucide icons, Canvas Confetti.
- **Backend:** Express server running on port 3000 (`server.ts`) with Vite middlewares mounted in development.
- **Data Persistence:** In-memory high-fidelity seed store with 320+ realistic 14-day historical tests, 42 complaints, active outages, and 7 monitored campus locations.
