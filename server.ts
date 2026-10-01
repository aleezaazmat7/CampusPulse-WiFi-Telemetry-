import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import {
  CampusLocation,
  SpeedTestResult,
  Complaint,
  OutageAlert,
  User,
  HealthThresholds,
  MaintenanceNote,
  SystemKPIs,
} from './src/lib/types';
import { calculateHealthScore, DEFAULT_HEALTH_THRESHOLDS } from './src/lib/health-score';

dotenv.config();

const app = express();
const PORT = 3000;

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.raw({ type: 'application/octet-stream', limit: '50mb' }));

// Initialize Gemini Client
let geminiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  geminiClient = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// ============================================================================
// IN-MEMORY DATABASE & SEED DATA
// ============================================================================

let healthThresholds: HealthThresholds = { ...DEFAULT_HEALTH_THRESHOLDS };

const users: User[] = [
  {
    id: 'user-student',
    name: 'Alex Rivera',
    email: 'student@campus.edu',
    role: 'student',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    accountStatus: 'active',
  },
  {
    id: 'user-it',
    name: 'Marcus Chen',
    email: 'it@campus.edu',
    role: 'it_staff',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    accountStatus: 'active',
  },
  {
    id: 'user-manager',
    name: 'Sarah Jenkins',
    email: 'manager@campus.edu',
    role: 'manager',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
    accountStatus: 'active',
  },
  {
    id: 'user-admin',
    name: 'Dr. Alan Vance',
    email: 'admin@campus.edu',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    accountStatus: 'active',
  },
];

const INITIAL_LOCATIONS: CampusLocation[] = [
  {
    id: 'loc-lab1',
    name: 'Computer Lab 1',
    building: 'Science & Technology Block',
    floor: 'Floor 1, East Wing',
    description: 'High-density lab with 45 dual-monitor desktop workstations and gigabit Ethernet drops.',
    currentStatus: 'Excellent',
    currentHealthScore: 92,
    coordinates: { x: 22, y: 35 },
    accessPointName: 'AP-SCI-101-Cisco-9130',
  },
  {
    id: 'loc-lab2',
    name: 'Computer Lab 2',
    building: 'Science & Technology Block',
    floor: 'Floor 2, West Wing',
    description: 'AI & Data Science lab with specialized GPU rigs and IoT testbeds.',
    currentStatus: 'Good',
    currentHealthScore: 78,
    coordinates: { x: 30, y: 30 },
    accessPointName: 'AP-SCI-204-Aruba-635',
  },
  {
    id: 'loc-lib1',
    name: 'Library Floor 1',
    building: 'Central Library',
    floor: 'Ground Floor, Circulation & Commons',
    description: 'Active discussion zone, circulation desk, printing hub, and study carrels.',
    currentStatus: 'Fair',
    currentHealthScore: 66,
    coordinates: { x: 50, y: 22 },
    accessPointName: 'AP-LIB-G01-Meraki-MR56',
  },
  {
    id: 'loc-lib2',
    name: 'Library Floor 2',
    building: 'Central Library',
    floor: 'Upper Level, Silent Study Area',
    description: 'Quiet study tables, dissertation cubicles, and historical archive stacks.',
    currentStatus: 'Poor',
    currentHealthScore: 41,
    coordinates: { x: 58, y: 18 },
    accessPointName: 'AP-LIB-203-Meraki-MR56',
  },
  {
    id: 'loc-cafe',
    name: 'Cafeteria',
    building: 'Student Activity Center',
    floor: 'Ground Floor, Dining Hall',
    description: 'High peak-capacity dining hall and social lounge with massive lunchtime concurrency.',
    currentStatus: 'Fair',
    currentHealthScore: 54,
    coordinates: { x: 42, y: 68 },
    accessPointName: 'AP-SAC-CAFE-Aruba-555',
  },
  {
    id: 'loc-admin',
    name: 'Administration Block',
    building: 'Admin & Registry Hall',
    floor: 'Floor 1, Academic Affairs',
    description: 'Registrar, admissions counters, executive conference rooms, and financial aid desks.',
    currentStatus: 'Good',
    currentHealthScore: 84,
    coordinates: { x: 74, y: 45 },
    accessPointName: 'AP-ADM-102-Cisco-9120',
  },
  {
    id: 'loc-hostel',
    name: 'Hostel Block',
    building: 'Residential Quad A & B',
    floor: 'Floors 1-4, Dormitories',
    description: 'Student dormitories with heavy evening video streaming, gaming, and peer downloads.',
    currentStatus: 'Fair',
    currentHealthScore: 58,
    coordinates: { x: 80, y: 78 },
    accessPointName: 'AP-HOS-QUAD-Cisco-9105',
  },
];

let locations: CampusLocation[] = JSON.parse(JSON.stringify(INITIAL_LOCATIONS));
let speedTests: SpeedTestResult[] = [];
let complaints: Complaint[] = [];
let outages: OutageAlert[] = [];

// Helper: Seed realistic 14-day history (300+ tests, 40+ complaints)
function seedDatabase() {
  locations = JSON.parse(JSON.stringify(INITIAL_LOCATIONS));
  speedTests = [];
  complaints = [];
  outages = [];

  const now = Date.now();
  const ONE_HOUR = 3600 * 1000;
  const ONE_DAY = 24 * ONE_HOUR;

  // Generate 320 speed tests across 14 days
  for (let i = 0; i < 320; i++) {
    // Spread across past 14 days, with more tests recently
    const dayOffset = Math.pow(Math.random(), 1.5) * 14;
    const hour = Math.floor(Math.random() * 24);
    const minute = Math.floor(Math.random() * 60);
    const timestamp = new Date(now - dayOffset * ONE_DAY + (hour - 12) * ONE_HOUR + minute * 60000);

    const loc = locations[Math.floor(Math.random() * locations.length)];
    const isPeakHour = (hour >= 11 && hour <= 15) || (loc.id === 'loc-hostel' && hour >= 20 && hour <= 23);

    let baseDownload = 48;
    let baseUpload = 22;
    let basePing = 24;
    let baseLoss = 0;
    let baseJitter = 3;

    // Location-specific tendencies
    if (loc.id === 'loc-lab1') {
      baseDownload = 75;
      baseUpload = 40;
      basePing = 16;
    } else if (loc.id === 'loc-lab2') {
      baseDownload = 55;
      baseUpload = 28;
      basePing = 22;
    } else if (loc.id === 'loc-lib1') {
      baseDownload = 35;
      baseUpload = 14;
      basePing = 35;
    } else if (loc.id === 'loc-lib2') {
      // Chronic problem location in prompt
      baseDownload = 12;
      baseUpload = 4;
      basePing = 110;
      baseLoss = 4;
      baseJitter = 22;
    } else if (loc.id === 'loc-cafe') {
      baseDownload = isPeakHour ? 8 : 45;
      baseUpload = isPeakHour ? 3 : 18;
      basePing = isPeakHour ? 75 : 28;
      baseLoss = isPeakHour ? 2 : 0;
    } else if (loc.id === 'loc-admin') {
      baseDownload = 60;
      baseUpload = 30;
      basePing = 18;
    } else if (loc.id === 'loc-hostel') {
      baseDownload = isPeakHour ? 14 : 50;
      baseUpload = isPeakHour ? 6 : 20;
      basePing = isPeakHour ? 68 : 26;
      baseLoss = isPeakHour ? 2.5 : 0;
    }

    // Add noise
    const download = Math.max(1.2, +(baseDownload * (0.8 + Math.random() * 0.4)).toFixed(1));
    const upload = Math.max(0.6, +(baseUpload * (0.8 + Math.random() * 0.4)).toFixed(1));
    const ping = Math.max(8, +(basePing * (0.85 + Math.random() * 0.3)).toFixed(0));
    const packetLoss = +(baseLoss * (Math.random() > 0.6 ? 1.5 : 0.4)).toFixed(1);
    const jitter = Math.max(1, +(baseJitter * (0.8 + Math.random() * 0.5)).toFixed(1));

    const health = calculateHealthScore({
      downloadSpeed: download,
      uploadSpeed: upload,
      ping,
      packetLoss,
      jitter,
    });

    const studentNames = [
      'Alex Rivera', 'Maya Lin', 'Jordan Taylor', 'Ethan Hunt', 'Chloe Bennett',
      'Liam Vance', 'Sophia Patel', 'Noah Clark', 'Emma Watson', 'Aria Chen'
    ];
    const user = studentNames[i % studentNames.length];

    speedTests.push({
      id: `test-${1000 + i}`,
      userId: `user-gen-${i % 15}`,
      userName: user,
      locationId: loc.id,
      locationName: loc.name,
      building: loc.building,
      downloadSpeed: download,
      uploadSpeed: upload,
      ping,
      jitter,
      packetLoss,
      healthScore: health.score,
      healthStatus: health.status,
      testedAt: timestamp.toISOString(),
      isAnomaly: health.score < 40 && loc.id !== 'loc-lib2',
    });
  }

  // Sort tests chronologically descending
  speedTests.sort((a, b) => new Date(b.testedAt).getTime() - new Date(a.testedAt).getTime());

  // Generate 42 realistic complaints across varied statuses
  const complaintSeeds = [
    {
      locId: 'loc-lib2',
      type: 'Frequent Disconnection',
      desc: 'Wi-Fi disconnects every 5 minutes on the 2nd floor silent study carrels. Unable to submit online research assignment.',
      status: 'In Progress',
      severity: 'High',
      aiSummary: 'Intermittent RF drops caused by 5GHz co-channel interference and AP-LIB-203 transceiver thermal throttling.',
      aiCause: 'AP-LIB-203 hardware beacon drop & channel 36 congestion.',
      daysAgo: 0.1,
    },
    {
      locId: 'loc-lib2',
      type: 'Slow Internet',
      desc: 'Speed test shows only 2.1 Mbps in Library Floor 2. Page loads timeout constantly.',
      status: 'Assigned',
      severity: 'High',
      aiSummary: 'Severe bandwidth throttling and elevated ping exceeding 150ms during peak study hours.',
      aiCause: 'Uplink gigabit port negotiating down to 100Mbps half-duplex.',
      daysAgo: 0.3,
    },
    {
      locId: 'loc-lib2',
      type: 'High Ping',
      desc: 'Ping is over 180ms right now in Library 2nd floor, making web calls impossible.',
      status: 'Submitted',
      severity: 'High',
      aiSummary: 'Bufferbloat and high round-trip packet queueing.',
      aiCause: 'Local switch queue buffer exhaustion.',
      daysAgo: 0.05,
    },
    {
      locId: 'loc-cafe',
      type: 'Slow Internet',
      desc: 'During lunch hour (12-2pm), the Wi-Fi in the cafeteria essentially grinds to a halt. Can barely load Google Docs.',
      status: 'Reviewed',
      severity: 'Medium',
      aiSummary: 'DHCP pool exhaustion and channel saturation due to 200+ concurrent smartphone associations.',
      aiCause: 'Client density exceeds single AP capacity without load balancing.',
      daysAgo: 1.2,
    },
    {
      locId: 'loc-cafe',
      type: 'Weak Signal',
      desc: 'Signal drops to 1 bar in the outdoor patio section of the cafeteria.',
      status: 'Resolved',
      severity: 'Low',
      aiSummary: 'Coverage boundary attenuation through double-glazed exterior glass doors.',
      aiCause: 'Exterior perimeter lacks dedicated outdoor access point.',
      daysAgo: 4.5,
    },
    {
      locId: 'loc-hostel',
      type: 'Frequent Disconnection',
      desc: 'Every night between 9 PM and 11 PM, the connection drops while streaming study lectures.',
      status: 'In Progress',
      severity: 'Medium',
      aiSummary: 'Bandwidth saturation and dynamic rate limiting trigger in residential subnet.',
      aiCause: 'Per-user QoS bandwidth cap policy enforcement required.',
      daysAgo: 1.8,
    },
    {
      locId: 'loc-lab2',
      type: 'Website / Service Unavailable',
      desc: 'Cannot clone GitHub repositories in Lab 2; SSH connections keep dropping.',
      status: 'Resolved',
      severity: 'High',
      aiSummary: 'Firewall DPI rule misconfiguration inspecting outbound port 22.',
      aiCause: 'Campus border firewall deep packet inspection timeout.',
      daysAgo: 3.1,
    },
    {
      locId: 'loc-admin',
      type: 'No Internet',
      desc: 'The visitor Wi-Fi network SSID was unavailable in the main lobby this morning.',
      status: 'Resolved',
      severity: 'Medium',
      aiSummary: 'VLAN tagging issue on guest portal trunk line.',
      aiCause: 'Switch port trunk VLAN 20 was unmapped after scheduled switch upgrade.',
      daysAgo: 5.0,
    },
    {
      locId: 'loc-lab1',
      type: 'High Ping',
      desc: 'Packet loss reached 5% during the computer science programming exam.',
      status: 'Resolved',
      severity: 'Critical',
      aiSummary: 'Local switch loop caused by rogue unmanaged hub plugged into student desk.',
      aiCause: 'STP BPDU guard triggered port shutdown on switch port Gi1/0/14.',
      daysAgo: 6.2,
    },
  ];

  // Populate base complaints + generated complaints up to 42
  for (let c = 0; c < 42; c++) {
    const seed = complaintSeeds[c % complaintSeeds.length];
    const loc = locations.find((l) => l.id === seed.locId) || locations[c % locations.length];
    const daysAgo = seed.daysAgo + Math.floor(c / complaintSeeds.length) * 1.5;
    const createdAt = new Date(now - daysAgo * ONE_DAY).toISOString();

    const relatedTest = speedTests.find((t) => t.locationId === loc.id);

    const statuses: Complaint['status'][] = ['Submitted', 'Reviewed', 'Assigned', 'In Progress', 'Resolved'];
    const assignedStaff = c % 2 === 0 ? 'Marcus Chen' : 'Sarah Jenkins';

    const complaint: Complaint = {
      id: `comp-${2000 + c}`,
      userId: `user-stu-${c % 10}`,
      userName: `Student #${100 + (c % 18)}`,
      userEmail: `student${100 + (c % 18)}@campus.edu`,
      locationId: loc.id,
      locationName: loc.name,
      building: loc.building,
      complaintType: seed.type as any,
      description: seed.desc,
      status: (c < 8 ? seed.status : statuses[c % statuses.length]) as any,
      severity: seed.severity as any,
      aiSummary: seed.aiSummary,
      aiLikelyCause: seed.aiCause,
      aiSuggestedAction: 'Inspect AP channel allocation, check PoE budget, and review client SNR logs.',
      assignedStaffId: c % 3 === 0 ? undefined : 'user-it',
      assignedStaffName: c % 3 === 0 ? undefined : assignedStaff,
      createdAt,
      resolvedAt: seed.status === 'Resolved' ? new Date(new Date(createdAt).getTime() + 4 * ONE_HOUR).toISOString() : undefined,
      relatedTestId: relatedTest?.id,
      relatedTestMetrics: relatedTest
        ? {
            downloadSpeed: relatedTest.downloadSpeed,
            uploadSpeed: relatedTest.uploadSpeed,
            ping: relatedTest.ping,
            healthScore: relatedTest.healthScore,
          }
        : undefined,
      maintenanceNotes:
        seed.status !== 'Submitted'
          ? [
              {
                id: `note-${3000 + c}`,
                complaintId: `comp-${2000 + c}`,
                staffId: 'user-it',
                staffName: 'Marcus Chen',
                note: 'Dispatched on-site technician to inspect AP Ethernet drop and verify power levels over PoE switch.',
                createdAt: new Date(new Date(createdAt).getTime() + 30 * 60000).toISOString(),
              },
            ]
          : [],
    };

    complaints.push(complaint);
  }

  // Active Outage in Library Floor 2 (fits prompt problem scenario)
  outages = [
    {
      id: 'outage-active-lib2',
      locationId: 'loc-lib2',
      locationName: 'Library Floor 2',
      building: 'Central Library',
      startedAt: new Date(now - 45 * 60000).toISOString(),
      reason: 'Elevated packet loss (12%) and ping spikes exceeding 180ms across 14 consecutive student tests.',
      status: 'active',
      triggerCount: 8,
      aiDiagnosis:
        'AP-LIB-203 has entered thermal throttling state following power fluctuations on PoE switch SW-LIB-FL2. Client retry rates at 64% with co-channel interference on 5GHz channel 36.',
      affectedUsersEstimate: 65,
    },
    {
      id: 'outage-hist-lab1',
      locationId: 'loc-lab1',
      locationName: 'Computer Lab 1',
      building: 'Science & Technology Block',
      startedAt: new Date(now - 5 * ONE_DAY).toISOString(),
      resolvedAt: new Date(now - 5 * ONE_DAY + 2 * ONE_HOUR).toISOString(),
      reason: 'Firmware upgrade reboot cycle caused 25-minute outage on primary lab gateway.',
      status: 'resolved',
      triggerCount: 5,
      aiDiagnosis: 'Planned firmware patch applied by IT; gateway returned to healthy state with 1 Gbps backhaul.',
      affectedUsersEstimate: 45,
    },
  ];

  recalculateLocationAggregates();
}

// Recalculate location metrics from tests & complaints
function recalculateLocationAggregates() {
  const ONE_DAY = 24 * 3600 * 1000;
  const now = Date.now();

  for (const loc of locations) {
    const locTests = speedTests.filter((t) => t.locationId === loc.id);
    const recentTestsToday = locTests.filter((t) => now - new Date(t.testedAt).getTime() <= ONE_DAY);
    const recentComplaintsToday = complaints.filter(
      (c) => c.locationId === loc.id && now - new Date(c.createdAt).getTime() <= ONE_DAY
    );

    const testsToAvg = recentTestsToday.length > 0 ? recentTestsToday : locTests.slice(0, 10);

    let avgDl = 0;
    let avgUl = 0;
    let avgPing = 0;
    let avgLoss = 0;
    let avgJitter = 0;

    if (testsToAvg.length > 0) {
      avgDl = testsToAvg.reduce((acc, t) => acc + t.downloadSpeed, 0) / testsToAvg.length;
      avgUl = testsToAvg.reduce((acc, t) => acc + t.uploadSpeed, 0) / testsToAvg.length;
      avgPing = testsToAvg.reduce((acc, t) => acc + t.ping, 0) / testsToAvg.length;
      avgLoss = testsToAvg.reduce((acc, t) => acc + t.packetLoss, 0) / testsToAvg.length;
      avgJitter = testsToAvg.reduce((acc, t) => acc + t.jitter, 0) / testsToAvg.length;
    }

    const latestTest = locTests[0];

    // Check recent failures & complaints penalty
    const recentFailures = recentTestsToday.filter((t) => t.healthStatus === 'Poor' || t.healthStatus === 'Critical').length;
    const openComplaints = complaints.filter((c) => c.locationId === loc.id && c.status !== 'Resolved').length;

    const health = calculateHealthScore(
      {
        downloadSpeed: avgDl || 30,
        uploadSpeed: avgUl || 12,
        ping: avgPing || 30,
        packetLoss: avgLoss || 0,
        jitter: avgJitter || 4,
      },
      {
        recentFailuresCount: recentFailures,
        recentComplaintsCount: openComplaints,
      },
      healthThresholds
    );

    // If an active outage exists for this location, enforce Critical
    const hasActiveOutage = outages.some((o) => o.locationId === loc.id && o.status === 'active');
    if (hasActiveOutage) {
      loc.currentStatus = 'Critical';
      loc.currentHealthScore = Math.min(28, health.score);
    } else {
      loc.currentHealthScore = health.score;
      loc.currentStatus = health.status;
    }

    loc.metrics = {
      avgDownload: Math.round(avgDl * 10) / 10,
      avgUpload: Math.round(avgUl * 10) / 10,
      avgPing: Math.round(avgPing),
      avgPacketLoss: Math.round(avgLoss * 10) / 10,
      avgJitter: Math.round(avgJitter * 10) / 10,
      testsCountToday: recentTestsToday.length,
      complaintsCountToday: recentComplaintsToday.length,
      lastTestedAt: latestTest ? latestTest.testedAt : undefined,
    };
  }
}

// Initial seed
seedDatabase();

// ============================================================================
// REAL SPEED TEST MEASUREMENT ENDPOINTS
// ============================================================================

/**
 * Ping / Latency probe endpoint
 * Tiny response with no-cache headers for accurate round-trip time.
 */
app.get('/api/ping', (_req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.json({
    status: 'ok',
    timestamp: Date.now(),
  });
});

/**
 * Download throughput measurement endpoint
 * Streams real byte payload for client bandwidth measurement.
 */
app.get('/api/speedtest/download', (req: Request, res: Response) => {
  const sizeMb = Math.min(30, Math.max(1, parseInt(req.query.size as string, 10) || 10));
  const totalBytes = sizeMb * 1024 * 1024;
  const chunkSize = 64 * 1024; // 64KB chunk

  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Length', totalBytes.toString());
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Content-Disposition', 'attachment; filename="speedtest.bin"');

  // Fill a reusable 64KB buffer
  const chunkBuffer = Buffer.alloc(chunkSize);
  for (let i = 0; i < chunkSize; i += 64) {
    chunkBuffer[i] = (i * 31) % 256;
  }

  let sentBytes = 0;
  const writeMore = () => {
    let ok = true;
    while (ok && sentBytes < totalBytes) {
      const bytesRemaining = totalBytes - sentBytes;
      const currentChunk = bytesRemaining < chunkSize ? chunkBuffer.subarray(0, bytesRemaining) : chunkBuffer;
      sentBytes += currentChunk.length;
      ok = res.write(currentChunk);
    }
    if (sentBytes >= totalBytes) {
      res.end();
    } else {
      res.once('drain', writeMore);
    }
  };

  writeMore();
});

/**
 * Upload throughput measurement endpoint
 * Receives raw binary stream and returns telemetry.
 */
app.post('/api/speedtest/upload', (req: Request, res: Response) => {
  const receivedBytes = Buffer.isBuffer(req.body) ? req.body.length : 0;
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.json({
    status: 'success',
    receivedBytes,
    serverTime: Date.now(),
  });
});

// ============================================================================
// DATA & TELEMETRY API ROUTES
// ============================================================================

// Users
app.get('/api/users/current', (req: Request, res: Response) => {
  const role = (req.query.role as string) || 'student';
  const user = users.find((u) => u.role === role) || users[0];
  res.json(user);
});

// Locations
app.get('/api/locations', (_req: Request, res: Response) => {
  recalculateLocationAggregates();
  res.json(locations);
});

app.get('/api/locations/:id', (req: Request, res: Response) => {
  const loc = locations.find((l) => l.id === req.params.id);
  if (!loc) {
    return res.status(404).json({ error: 'Location not found' });
  }

  // Calculate 24h hourly stats for this location
  const ONE_DAY = 24 * 3600 * 1000;
  const now = Date.now();
  const locTests = speedTests.filter((t) => t.locationId === loc.id && now - new Date(t.testedAt).getTime() <= ONE_DAY);

  const hourly = Array.from({ length: 24 }, (_, hour) => {
    const testsInHour = locTests.filter((t) => new Date(t.testedAt).getHours() === hour);
    const avgDl = testsInHour.length > 0 ? testsInHour.reduce((a, b) => a + b.downloadSpeed, 0) / testsInHour.length : 0;
    const avgPing = testsInHour.length > 0 ? testsInHour.reduce((a, b) => a + b.ping, 0) / testsInHour.length : 0;

    return {
      hour,
      label: `${hour.toString().padStart(2, '0')}:00`,
      avgDownload: Math.round(avgDl * 10) / 10,
      avgPing: Math.round(avgPing),
      count: testsInHour.length,
    };
  });

  res.json({
    location: loc,
    hourly,
    recentTests: speedTests.filter((t) => t.locationId === loc.id).slice(0, 10),
    activeOutage: outages.find((o) => o.locationId === loc.id && o.status === 'active'),
  });
});

// Speed Tests
app.get('/api/tests', (req: Request, res: Response) => {
  let filtered = [...speedTests];
  if (req.query.locationId) {
    filtered = filtered.filter((t) => t.locationId === req.query.locationId);
  }
  if (req.query.building) {
    filtered = filtered.filter((t) => t.building === req.query.building);
  }
  if (req.query.status) {
    filtered = filtered.filter((t) => t.healthStatus === req.query.status);
  }
  if (req.query.limit) {
    const limit = parseInt(req.query.limit as string, 10) || 50;
    filtered = filtered.slice(0, limit);
  }
  res.json(filtered);
});

app.post('/api/tests', (req: Request, res: Response) => {
  const { locationId, downloadSpeed, uploadSpeed, ping, jitter, packetLoss, userId, userName } = req.body;

  const loc = locations.find((l) => l.id === locationId);
  if (!loc) {
    return res.status(400).json({ error: 'Invalid locationId' });
  }

  // Calculate recent context
  const fifteenMinsAgo = Date.now() - 15 * 60 * 1000;
  const recentTests = speedTests.filter(
    (t) => t.locationId === locationId && new Date(t.testedAt).getTime() >= fifteenMinsAgo
  );
  const recentComplaints = complaints.filter(
    (c) => c.locationId === locationId && new Date(c.createdAt).getTime() >= fifteenMinsAgo
  );

  const recentFailures = recentTests.filter((t) => t.healthStatus === 'Poor' || t.healthStatus === 'Critical').length;

  const healthCalc = calculateHealthScore(
    {
      downloadSpeed: Number(downloadSpeed),
      uploadSpeed: Number(uploadSpeed),
      ping: Number(ping),
      jitter: Number(jitter),
      packetLoss: Number(packetLoss),
    },
    {
      recentFailuresCount: recentFailures,
      recentComplaintsCount: recentComplaints.length,
    },
    healthThresholds
  );

  // Anomaly / Trend Detection: compare with rolling average for this hour
  const currentHour = new Date().getHours();
  const historicalSameHourTests = speedTests.filter(
    (t) => t.locationId === locationId && new Date(t.testedAt).getHours() === currentHour
  );

  let isAnomaly = false;
  let anomalyMessage = '';
  if (historicalSameHourTests.length >= 3) {
    const avgHistoricalDl =
      historicalSameHourTests.reduce((a, b) => a + b.downloadSpeed, 0) / historicalSameHourTests.length;
    if (avgHistoricalDl > 10 && Number(downloadSpeed) < avgHistoricalDl * 0.6) {
      const dropPct = Math.round(((avgHistoricalDl - Number(downloadSpeed)) / avgHistoricalDl) * 100);
      isAnomaly = true;
      anomalyMessage = `Network performance is ${dropPct}% lower than the usual average (${avgHistoricalDl.toFixed(1)} Mbps) for ${loc.name} at this hour.`;
    }
  }

  const newTest: SpeedTestResult = {
    id: `test-${Date.now()}`,
    userId: userId || 'user-student',
    userName: userName || 'Alex Rivera',
    locationId: loc.id,
    locationName: loc.name,
    building: loc.building,
    downloadSpeed: Number(downloadSpeed),
    uploadSpeed: Number(uploadSpeed),
    ping: Number(ping),
    jitter: Number(jitter),
    packetLoss: Number(packetLoss),
    healthScore: healthCalc.score,
    healthStatus: healthCalc.status,
    testedAt: new Date().toISOString(),
    isAnomaly,
    anomalyMessage: isAnomaly ? anomalyMessage : undefined,
  };

  speedTests.unshift(newTest);

  // AUTOMATIC OUTAGE DETECTION:
  // If 3+ poor/critical tests or 3+ complaints happen at this location within 15 minutes, trigger outage alert!
  const poorTestsInWindow = recentTests.filter((t) => t.healthStatus === 'Poor' || t.healthStatus === 'Critical').length + (healthCalc.status === 'Poor' || healthCalc.status === 'Critical' ? 1 : 0);
  const complaintsInWindow = recentComplaints.length;

  if (poorTestsInWindow >= 3 || complaintsInWindow >= 3) {
    const existingOutage = outages.find((o) => o.locationId === locationId && o.status === 'active');
    if (!existingOutage) {
      outages.unshift({
        id: `outage-${Date.now()}`,
        locationId: loc.id,
        locationName: loc.name,
        building: loc.building,
        startedAt: new Date().toISOString(),
        reason: `Automatic Outage Trigger: ${poorTestsInWindow} degraded tests and ${complaintsInWindow} complaints logged in past 15 minutes.`,
        status: 'active',
        triggerCount: poorTestsInWindow + complaintsInWindow,
        aiDiagnosis: `High concentration of degraded test packets detected in ${loc.name}. Potential uplink saturation or AP hardware degradation on ${loc.accessPointName || 'local AP'}.`,
        affectedUsersEstimate: 40,
      });
    }
  }

  recalculateLocationAggregates();

  res.status(201).json({
    test: newTest,
    healthCalculation: healthCalc,
    isAnomaly,
    anomalyMessage,
  });
});

// Complaints
app.get('/api/complaints', (req: Request, res: Response) => {
  let filtered = [...complaints];
  if (req.query.status) {
    filtered = filtered.filter((c) => c.status === req.query.status);
  }
  if (req.query.severity) {
    filtered = filtered.filter((c) => c.severity === req.query.severity);
  }
  if (req.query.locationId) {
    filtered = filtered.filter((c) => c.locationId === req.query.locationId);
  }
  if (req.query.building) {
    filtered = filtered.filter((c) => c.building === req.query.building);
  }
  if (req.query.type) {
    filtered = filtered.filter((c) => c.complaintType === req.query.type);
  }
  res.json(filtered);
});

app.post('/api/complaints', async (req: Request, res: Response) => {
  const { locationId, description, complaintType, relatedTestId, userId, userName, userEmail } = req.body;

  const loc = locations.find((l) => l.id === locationId);
  if (!loc) {
    return res.status(400).json({ error: 'Invalid locationId' });
  }

  const relatedTest = relatedTestId ? speedTests.find((t) => t.id === relatedTestId) : undefined;

  // AI Complaint Triage via Gemini 3.8 Flash
  let aiCategory = complaintType || 'Slow Internet';
  let aiSeverity = 'Medium';
  let aiSummary = 'User reported connectivity degradation.';
  let aiLikelyCause = 'Local RF interference or access point congestion.';
  let aiSuggestedAction = 'Review AP client count and restart radio interface if needed.';

  if (geminiClient && description) {
    try {
      const triagePrompt = `You are an expert campus network engineer analyzing a student/staff Wi-Fi complaint.
Campus Location: ${loc.name} (${loc.building}, ${loc.floor})
Access Point: ${loc.accessPointName || 'Campus AP'}
User Description: "${description}"
${relatedTest ? `Attached Speed Test: Download ${relatedTest.downloadSpeed} Mbps, Upload ${relatedTest.uploadSpeed} Mbps, Ping ${relatedTest.ping} ms, Loss ${relatedTest.packetLoss}%, Health: ${relatedTest.healthScore}/100 (${relatedTest.healthStatus})` : 'No speed test attached.'}

Please triage this complaint and respond with a strictly formatted JSON object:
{
  "category": "No Internet" | "Slow Internet" | "High Ping" | "Frequent Disconnection" | "Weak Signal" | "Website / Service Unavailable" | "Other",
  "severity": "Low" | "Medium" | "High" | "Critical",
  "aiSummary": "1-2 sentence executive technical summary",
  "likelyCause": "Specific technical hypothesis (e.g. 5GHz co-channel interference, DHCP lease exhaustion, faulty patch cable)",
  "suggestedAction": "Immediate step-by-step IT resolution recommendation"
}`;

      const response = await geminiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: triagePrompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text.trim());
        if (parsed.category) aiCategory = parsed.category;
        if (parsed.severity) aiSeverity = parsed.severity;
        if (parsed.aiSummary) aiSummary = parsed.aiSummary;
        if (parsed.likelyCause) aiLikelyCause = parsed.likelyCause;
        if (parsed.suggestedAction) aiSuggestedAction = parsed.suggestedAction;
      }
    } catch (err) {
      console.warn('Gemini triage fallback triggered:', err);
    }
  }

  const newComplaint: Complaint = {
    id: `comp-${Date.now()}`,
    userId: userId || 'user-student',
    userName: userName || 'Alex Rivera',
    userEmail: userEmail || 'student@campus.edu',
    locationId: loc.id,
    locationName: loc.name,
    building: loc.building,
    complaintType: aiCategory as any,
    description,
    status: 'Submitted',
    severity: aiSeverity as any,
    aiSummary,
    aiLikelyCause,
    aiSuggestedAction,
    createdAt: new Date().toISOString(),
    relatedTestId: relatedTest?.id,
    relatedTestMetrics: relatedTest
      ? {
          downloadSpeed: relatedTest.downloadSpeed,
          uploadSpeed: relatedTest.uploadSpeed,
          ping: relatedTest.ping,
          healthScore: relatedTest.healthScore,
        }
      : undefined,
    maintenanceNotes: [],
  };

  complaints.unshift(newComplaint);

  // Check Outage Trigger: 3+ complaints at same location in 15 minutes
  const fifteenMinsAgo = Date.now() - 15 * 60 * 1000;
  const recentLocationComplaints = complaints.filter(
    (c) => c.locationId === locationId && new Date(c.createdAt).getTime() >= fifteenMinsAgo
  );

  if (recentLocationComplaints.length >= 3) {
    const activeOutage = outages.find((o) => o.locationId === locationId && o.status === 'active');
    if (!activeOutage) {
      outages.unshift({
        id: `outage-${Date.now()}`,
        locationId: loc.id,
        locationName: loc.name,
        building: loc.building,
        startedAt: new Date().toISOString(),
        reason: `Outage warning: ${recentLocationComplaints.length} user complaints logged within 15 minutes in ${loc.name}.`,
        status: 'active',
        triggerCount: recentLocationComplaints.length,
        aiDiagnosis: `Surge of user complaints (${recentLocationComplaints.length} in 15m) indicates local AP offline or severe RF dead zone in ${loc.name}.`,
        affectedUsersEstimate: 50,
      });
    }
  }

  recalculateLocationAggregates();

  res.status(201).json(newComplaint);
});

// Update Complaint Status / Assign Staff / Add Note
app.patch('/api/complaints/:id', (req: Request, res: Response) => {
  const complaint = complaints.find((c) => c.id === req.params.id);
  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found' });
  }

  const { status, assignedStaffId, assignedStaffName, maintenanceNote, staffId, staffName } = req.body;

  if (status) {
    complaint.status = status;
    if (status === 'Resolved') {
      complaint.resolvedAt = new Date().toISOString();
    }
  }

  if (assignedStaffId !== undefined) {
    complaint.assignedStaffId = assignedStaffId;
    complaint.assignedStaffName = assignedStaffName;
  }

  if (maintenanceNote) {
    const note: MaintenanceNote = {
      id: `note-${Date.now()}`,
      complaintId: complaint.id,
      staffId: staffId || 'user-it',
      staffName: staffName || 'Marcus Chen',
      note: maintenanceNote,
      createdAt: new Date().toISOString(),
    };
    complaint.maintenanceNotes = complaint.maintenanceNotes || [];
    complaint.maintenanceNotes.unshift(note);
  }

  recalculateLocationAggregates();
  res.json(complaint);
});

// Outages
app.get('/api/outages', (_req: Request, res: Response) => {
  res.json(outages);
});

app.post('/api/outages/:id/resolve', (req: Request, res: Response) => {
  const outage = outages.find((o) => o.id === req.params.id);
  if (!outage) {
    return res.status(404).json({ error: 'Outage not found' });
  }

  outage.status = 'resolved';
  outage.resolvedAt = new Date().toISOString();
  recalculateLocationAggregates();
  res.json(outage);
});

// KPIs Summary
app.get('/api/stats', (_req: Request, res: Response) => {
  recalculateLocationAggregates();

  const ONE_DAY = 24 * 3600 * 1000;
  const now = Date.now();
  const testsToday = speedTests.filter((t) => now - new Date(t.testedAt).getTime() <= ONE_DAY);

  const avgDownload =
    testsToday.length > 0 ? testsToday.reduce((a, b) => a + b.downloadSpeed, 0) / testsToday.length : 42.5;
  const avgUpload =
    testsToday.length > 0 ? testsToday.reduce((a, b) => a + b.uploadSpeed, 0) / testsToday.length : 18.2;
  const avgPing = testsToday.length > 0 ? testsToday.reduce((a, b) => a + b.ping, 0) / testsToday.length : 32.1;

  const poorLocations = locations.filter((l) => l.currentStatus === 'Poor' || l.currentStatus === 'Critical');
  const openComplaints = complaints.filter((c) => c.status !== 'Resolved');
  const resolvedComplaints = complaints.filter((c) => c.status === 'Resolved');
  const activeOutages = outages.filter((o) => o.status === 'active');

  const stats: SystemKPIs = {
    totalTestsToday: testsToday.length,
    avgDownload: Math.round(avgDownload * 10) / 10,
    avgUpload: Math.round(avgUpload * 10) / 10,
    avgPing: Math.round(avgPing),
    poorLocationsCount: poorLocations.length,
    openComplaintsCount: openComplaints.length,
    resolvedComplaintsCount: resolvedComplaints.length,
    activeOutagesCount: activeOutages.length,
  };

  res.json(stats);
});

// Admin Health Thresholds
app.get('/api/admin/settings', (_req: Request, res: Response) => {
  res.json(healthThresholds);
});

app.put('/api/admin/settings', (req: Request, res: Response) => {
  healthThresholds = { ...healthThresholds, ...req.body };
  recalculateLocationAggregates();
  res.json({ status: 'updated', healthThresholds });
});

// ============================================================================
// TRAFFIC MONITORING & OPTIMIZATION / REDUCTION ENDPOINTS
// ============================================================================

let trafficPolicies = {
  qosStreamingCap: false,
  bandSteering5Ghz: false,
  apLoadBalancing: false,
  p2pThrottling: false,
  airtimeFairness: false,
};

app.get('/api/traffic', (_req: Request, res: Response) => {
  // Calculate dynamic traffic reduction based on active policies
  let savedBandwidth = 0;
  let latencyReduction = 0;
  let speedImprovement = 0;

  if (trafficPolicies.qosStreamingCap) {
    savedBandwidth += 360;
    speedImprovement += 18;
  }
  if (trafficPolicies.bandSteering5Ghz) {
    savedBandwidth += 240;
    latencyReduction += 35;
    speedImprovement += 15;
  }
  if (trafficPolicies.apLoadBalancing) {
    savedBandwidth += 180;
    latencyReduction += 28;
    speedImprovement += 12;
  }
  if (trafficPolicies.p2pThrottling) {
    savedBandwidth += 290;
    speedImprovement += 14;
  }
  if (trafficPolicies.airtimeFairness) {
    savedBandwidth += 110;
    latencyReduction += 18;
    speedImprovement += 10;
  }

  const baseUsage = 2160;
  const currentUsage = Math.max(950, baseUsage - savedBandwidth);

  const facilityTraffic = locations.map((loc) => {
    let devices = 120;
    let maxCap = 250;
    let airtime = 55;
    let topApp = 'Web Browsing & Canvas LMS';
    let congestion: 'Low' | 'Moderate' | 'High' | 'Severe' = 'Moderate';

    if (loc.id === 'loc-lib2') {
      devices = trafficPolicies.apLoadBalancing ? 140 : 235;
      maxCap = 250;
      airtime = trafficPolicies.bandSteering5Ghz ? 52 : 92;
      topApp = 'YouTube & Video Streaming (4K)';
      congestion = trafficPolicies.qosStreamingCap && trafficPolicies.apLoadBalancing ? 'Moderate' : 'Severe';
    } else if (loc.id === 'loc-cafe') {
      devices = trafficPolicies.apLoadBalancing ? 160 : 220;
      maxCap = 250;
      airtime = trafficPolicies.qosStreamingCap ? 48 : 88;
      topApp = 'Social Media & Video Shorts';
      congestion = trafficPolicies.qosStreamingCap ? 'Low' : 'High';
    } else if (loc.id === 'loc-hostel') {
      devices = trafficPolicies.p2pThrottling ? 150 : 210;
      maxCap = 250;
      airtime = trafficPolicies.p2pThrottling ? 50 : 84;
      topApp = 'Online Gaming & File Downloads';
      congestion = trafficPolicies.p2pThrottling ? 'Moderate' : 'High';
    } else if (loc.id === 'loc-lab1') {
      devices = 65;
      maxCap = 150;
      airtime = 32;
      topApp = 'Programming & GitHub SSH';
      congestion = 'Low';
    } else if (loc.id === 'loc-lab2') {
      devices = 85;
      maxCap = 150;
      airtime = 44;
      topApp = 'AI Model Downloads & Docker';
      congestion = 'Low';
    } else if (loc.id === 'loc-admin') {
      devices = 45;
      maxCap = 100;
      airtime = 24;
      topApp = 'Administrative ERP & Portal';
      congestion = 'Low';
    }

    const utilPct = Math.round((devices / maxCap) * 100);
    const throughput = Math.round((devices * (loc.metrics?.avgDownload || 20) * 0.25) * 10) / 10;

    return {
      locationId: loc.id,
      name: loc.name,
      building: loc.building,
      connectedDevices: devices,
      maxCapacity: maxCap,
      capacityUtilizationPct: utilPct,
      currentThroughputMbps: throughput,
      channelAirtimePct: airtime,
      topAppCategory: topApp,
      congestionLevel: congestion,
    };
  });

  const totalDevices = facilityTraffic.reduce((acc, f) => acc + f.connectedDevices, 0);

  const trafficData = {
    totalBackhaulCapacityMbps: 2500,
    currentUsageMbps: currentUsage,
    peakUsageEstimateMbps: 2420,
    totalConnectedDevices: totalDevices,
    categoryBreakdown: [
      { name: '4K/HD Video Streaming (YouTube, Netflix, TikTok)', percentage: trafficPolicies.qosStreamingCap ? 26 : 42, usageMbps: Math.round(currentUsage * (trafficPolicies.qosStreamingCap ? 0.26 : 0.42)), color: '#ef4444' },
      { name: 'Social Media & Gaming (Discord, Steam, Games)', percentage: trafficPolicies.p2pThrottling ? 18 : 26, usageMbps: Math.round(currentUsage * (trafficPolicies.p2pThrottling ? 0.18 : 0.26)), color: '#f59e0b' },
      { name: 'Academic Research & LMS (Canvas, Zoom, GitHub)', percentage: trafficPolicies.qosStreamingCap ? 38 : 22, usageMbps: Math.round(currentUsage * (trafficPolicies.qosStreamingCap ? 0.38 : 0.22)), color: '#10b981' },
      { name: 'OS Background Sync & Cloud Backups', percentage: 10, usageMbps: Math.round(currentUsage * 0.10), color: '#6366f1' },
    ],
    facilityTraffic,
    policies: trafficPolicies,
    trafficReductionImpact: {
      bandwidthSavedMbps: savedBandwidth,
      latencyReductionMs: latencyReduction,
      speedImprovementPct: speedImprovement,
    },
  };

  res.json(trafficData);
});

app.post('/api/traffic/policy', (req: Request, res: Response) => {
  trafficPolicies = { ...trafficPolicies, ...req.body };
  res.json({ status: 'updated', policies: trafficPolicies });
});


// ============================================================================
// AI ENDPOINTS (GEMINI 3.8 FLASH)
// ============================================================================

/**
 * AI Incident Brief for IT Support
 * Generates plain-English diagnosis from real location telemetry.
 */
app.post('/api/ai/incident-brief', async (req: Request, res: Response) => {
  const { locationId } = req.body;
  const loc = locations.find((l) => l.id === locationId);
  if (!loc) {
    return res.status(404).json({ error: 'Location not found' });
  }

  const recentLocTests = speedTests.filter((t) => t.locationId === loc.id).slice(0, 15);
  const recentLocComplaints = complaints.filter((c) => c.locationId === loc.id).slice(0, 10);
  const activeOutage = outages.find((o) => o.locationId === loc.id && o.status === 'active');

  const avgDl =
    recentLocTests.length > 0 ? recentLocTests.reduce((a, b) => a + b.downloadSpeed, 0) / recentLocTests.length : 15;
  const avgPing =
    recentLocTests.length > 0 ? recentLocTests.reduce((a, b) => a + b.ping, 0) / recentLocTests.length : 60;
  const avgLoss =
    recentLocTests.length > 0 ? recentLocTests.reduce((a, b) => a + b.packetLoss, 0) / recentLocTests.length : 2;

  let brief = {
    locationId: loc.id,
    locationName: loc.name,
    building: loc.building,
    generatedAt: new Date().toISOString(),
    severity: (loc.currentStatus === 'Critical' ? 'Critical' : loc.currentStatus === 'Poor' ? 'Warning' : 'Informational') as any,
    executiveSummary: `${loc.name} has recorded ${recentLocComplaints.length} complaints with an average download of ${avgDl.toFixed(1)} Mbps and latency of ${Math.round(avgPing)}ms. Telemetry matches an overloaded access point or thermal throttling event.`,
    rootCauseAnalysis: [
      `High channel utilization (over 80%) on 5GHz channel 36 from dense student devices`,
      `PoE switch port negotiation downgrade or CRC packet error rate exceeding 4%`,
      `DHCP lease time of 24h leading to IP pool exhaustion during class transitions`,
    ],
    recommendedActions: [
      `Check PoE status and reboot access point ${loc.accessPointName || 'AP-PRIMARY'}`,
      `Enable dynamic channel assignment (DCA) to shift 5GHz channels to 52 (DFS) or 149`,
      `Reduce DHCP lease time on VLAN to 2 hours for high-density campus areas`,
      `Dispatch field technician to inspect physical patch cable and RJ-45 termination`,
    ],
    affectedHardware: `${loc.accessPointName || 'AP-CENTRAL'}, Switch Port Gi1/0/22`,
    estimatedResolutionTime: '25-45 minutes',
  };

  if (geminiClient) {
    try {
      const prompt = `You are a Senior Network Operations Center (NOC) Engineer generating an AI Incident Brief for campus IT staff.
Location: ${loc.name} (${loc.building}, ${loc.floor})
Access Point: ${loc.accessPointName}
Current Health Score: ${loc.currentHealthScore}/100 (${loc.currentStatus})
Average Download: ${avgDl.toFixed(1)} Mbps
Average Latency: ${Math.round(avgPing)} ms
Average Packet Loss: ${avgLoss.toFixed(1)}%
Active Outage: ${activeOutage ? activeOutage.reason : 'None'}
Recent Complaints (${recentLocComplaints.length}):
${recentLocComplaints.map((c) => `- [${c.severity}] ${c.complaintType}: ${c.description}`).join('\n')}

Generate a comprehensive technical incident brief for campus IT technicians. Return strictly JSON:
{
  "severity": "Critical" | "Warning" | "Informational",
  "executiveSummary": "Concise high-level summary citing exact statistics",
  "rootCauseAnalysis": ["Root cause 1", "Root cause 2", "Root cause 3"],
  "recommendedActions": ["Step 1", "Step 2", "Step 3", "Step 4"],
  "affectedHardware": "Specific AP and switch hardware reference",
  "estimatedResolutionTime": "e.g. 30 minutes"
}`;

      const response = await geminiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text.trim());
        brief = {
          ...brief,
          ...parsed,
          locationId: loc.id,
          locationName: loc.name,
          building: loc.building,
          generatedAt: new Date().toISOString(),
        };
      }
    } catch (err) {
      console.warn('Gemini incident brief fallback:', err);
    }
  }

  res.json(brief);
});

/**
 * AI Wi-Fi Weather Forecast for students
 * Hourly congestion prediction and best study hours.
 */
app.get('/api/ai/wifi-weather/:id', async (req: Request, res: Response) => {
  const loc = locations.find((l) => l.id === req.params.id);
  if (!loc) {
    return res.status(404).json({ error: 'Location not found' });
  }

  // Calculate historical hourly patterns
  const locTests = speedTests.filter((t) => t.locationId === loc.id);
  const hourlyTrends = Array.from({ length: 24 }, (_, hour) => {
    const tests = locTests.filter((t) => new Date(t.testedAt).getHours() === hour);
    const avgSpeed = tests.length > 0 ? tests.reduce((a, b) => a + b.downloadSpeed, 0) / tests.length : (loc.metrics?.avgDownload || 40);
    // Congestion is inversely proportional to speed
    const congestionScore = Math.max(10, Math.min(100, Math.round(110 - avgSpeed * 1.4)));
    return {
      hour,
      label: `${hour.toString().padStart(2, '0')}:00`,
      expectedSpeed: Math.round(avgSpeed * 10) / 10,
      congestionScore,
    };
  });

  const bestSlot = loc.id === 'loc-cafe' ? '8:00 AM - 11:00 AM' : loc.id === 'loc-hostel' ? '7:00 AM - 12:00 PM' : '8:00 AM - 11:30 AM';
  const worstSlot = loc.id === 'loc-cafe' ? '12:00 PM - 2:30 PM' : loc.id === 'loc-hostel' ? '8:00 PM - 11:30 PM' : '1:30 PM - 4:30 PM';

  const forecast = {
    locationId: loc.id,
    locationName: loc.name,
    bestHours: bestSlot,
    worstHours: worstSlot,
    currentCongestion: (loc.currentStatus === 'Critical' ? 'Extreme' : loc.currentStatus === 'Poor' ? 'Heavy' : loc.currentStatus === 'Fair' ? 'Moderate' : 'Low') as any,
    forecastNote: `Best time for uninterrupted study and file uploads is ${bestSlot}. Peak congestion occurs around ${worstSlot}.`,
    hourlyTrends,
  };

  res.json(forecast);
});

// ============================================================================
// HACKATHON DEMO MODE SIMULATOR
// ============================================================================

/**
 * Simulates a sudden outage in Library Floor 2
 * Injects degraded tests, complaints, triggers outage alert and changes heatmap color to red!
 */
app.post('/api/demo/simulate-outage', async (_req: Request, res: Response) => {
  const libLoc = locations.find((l) => l.id === 'loc-lib2');
  if (!libLoc) return res.status(404).json({ error: 'Library Floor 2 not found' });

  const now = Date.now();

  // 1. Inject 4 degraded speed tests within the last 5 minutes
  const injectedUsers = ['Liam Vance', 'Maya Lin', 'Aria Chen', 'Ethan Hunt'];
  for (let i = 0; i < 4; i++) {
    const test: SpeedTestResult = {
      id: `demo-spike-test-${now}-${i}`,
      userId: `user-sim-${i}`,
      userName: injectedUsers[i],
      locationId: libLoc.id,
      locationName: libLoc.name,
      building: libLoc.building,
      downloadSpeed: +(1.8 + Math.random() * 1.5).toFixed(1),
      uploadSpeed: +(0.4 + Math.random() * 0.5).toFixed(1),
      ping: Math.floor(165 + Math.random() * 50),
      jitter: +(18 + Math.random() * 10).toFixed(1),
      packetLoss: Math.floor(10 + Math.random() * 8),
      healthScore: 18,
      healthStatus: 'Critical',
      testedAt: new Date(now - i * 60000).toISOString(),
      isAnomaly: true,
      anomalyMessage: 'Severe bandwidth collapse: 88% below historical baseline.',
    };
    speedTests.unshift(test);
  }

  // 2. Inject 3 frantic complaints
  const complaintDescriptions = [
    'Wi-Fi completely dropped on Floor 2 west desks. My exam submission timed out!',
    'Getting "No Internet, secured" error in Library Floor 2. Ping is over 200ms.',
    'Entire study group in room 204 lost connection simultaneously.',
  ];

  for (let j = 0; j < 3; j++) {
    const comp: Complaint = {
      id: `demo-comp-${now}-${j}`,
      userId: `user-sim-${j}`,
      userName: injectedUsers[j],
      userEmail: `${injectedUsers[j].toLowerCase().replace(' ', '.')}@campus.edu`,
      locationId: libLoc.id,
      locationName: libLoc.name,
      building: libLoc.building,
      complaintType: j === 0 ? 'No Internet' : j === 1 ? 'Frequent Disconnection' : 'Slow Internet',
      description: complaintDescriptions[j],
      status: 'Submitted',
      severity: 'Critical',
      aiSummary: 'Sudden multi-user Wi-Fi collapse detected in Library Floor 2.',
      aiLikelyCause: 'Power supply failure on PoE Switch SW-LIB-02 or severed fiber patch cable.',
      aiSuggestedAction: 'Dispatch immediate on-site engineer to Library MDF room. Reboot AP-LIB-203.',
      createdAt: new Date(now - j * 45000).toISOString(),
    };
    complaints.unshift(comp);
  }

  // 3. Create or update active outage
  let activeOutage = outages.find((o) => o.locationId === libLoc.id && o.status === 'active');
  if (!activeOutage) {
    activeOutage = {
      id: `outage-demo-${now}`,
      locationId: libLoc.id,
      locationName: libLoc.name,
      building: libLoc.building,
      startedAt: new Date().toISOString(),
      reason: 'Automated Outage Trigger: Critical drop in bandwidth across 4 student tests and 3 urgent complaints.',
      status: 'active',
      triggerCount: 7,
      aiDiagnosis:
        'Immediate severity: AP-LIB-203 is unresponsive on port Gi1/0/22. Over 65 students in silent study hall experiencing complete loss of connectivity.',
      affectedUsersEstimate: 65,
    };
    outages.unshift(activeOutage);
  } else {
    activeOutage.triggerCount += 7;
  }

  recalculateLocationAggregates();

  res.json({
    message: 'Demo Outage Simulated Successfully! Heatmap node turned Critical, alerts fired.',
    location: locations.find((l) => l.id === libLoc.id),
    activeOutage,
  });
});

/**
 * Reset Demo Data
 */
app.post('/api/demo/reset', (_req: Request, res: Response) => {
  seedDatabase();
  res.json({ message: 'CampusPulse database reset to default pristine seed state.' });
});

// ============================================================================
// CSV EXPORT ENDPOINTS
// ============================================================================

app.get('/api/export/tests', (_req: Request, res: Response) => {
  const headers = ['Test ID', 'User', 'Location', 'Building', 'Download (Mbps)', 'Upload (Mbps)', 'Ping (ms)', 'Packet Loss (%)', 'Jitter (ms)', 'Health Score', 'Status', 'Date'];
  const rows = speedTests.map((t) => [
    t.id,
    `"${t.userName || 'Anonymous'}"`,
    `"${t.locationName}"`,
    `"${t.building}"`,
    t.downloadSpeed,
    t.uploadSpeed,
    t.ping,
    t.packetLoss,
    t.jitter,
    t.healthScore,
    t.healthStatus,
    t.testedAt,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="campus_wifi_speed_tests.csv"');
  res.send(csvContent);
});

app.get('/api/export/complaints', (_req: Request, res: Response) => {
  const headers = ['Complaint ID', 'User', 'Location', 'Building', 'Category', 'Severity', 'Status', 'Assigned Staff', 'Created At', 'Description', 'AI Diagnosis'];
  const rows = complaints.map((c) => [
    c.id,
    `"${c.userName}"`,
    `"${c.locationName}"`,
    `"${c.building}"`,
    `"${c.complaintType}"`,
    c.severity,
    c.status,
    `"${c.assignedStaffName || 'Unassigned'}"`,
    c.createdAt,
    `"${c.description.replace(/"/g, '""')}"`,
    `"${(c.aiSummary || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="campus_wifi_complaints.csv"');
  res.send(csvContent);
});

// ============================================================================
// VITE DEV MIDDLEWARE / STATIC FILES
// ============================================================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[CampusPulse] Fullstack Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
