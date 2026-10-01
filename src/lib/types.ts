export type UserRole = 'student' | 'it_staff' | 'manager' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  accountStatus: 'active' | 'suspended';
}

export type HealthStatus = 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Critical';

export interface CampusLocation {
  id: string;
  name: string;
  building: string;
  floor: string;
  description: string;
  currentStatus: HealthStatus;
  currentHealthScore: number;
  coordinates: { x: number; y: number }; // Percentage on map (0-100)
  accessPointName?: string;
  metrics?: {
    avgDownload: number;
    avgUpload: number;
    avgPing: number;
    avgPacketLoss: number;
    avgJitter: number;
    testsCountToday: number;
    complaintsCountToday: number;
    lastTestedAt?: string;
  };
}

export interface SpeedTestResult {
  id: string;
  userId: string;
  userName?: string;
  locationId: string;
  locationName: string;
  building: string;
  downloadSpeed: number; // in Mbps
  uploadSpeed: number;   // in Mbps
  ping: number;          // in ms
  jitter: number;        // in ms
  packetLoss: number;    // percentage (0-100)
  healthScore: number;   // 0-100
  healthStatus: HealthStatus;
  testedAt: string;      // ISO string
  isAnomaly?: boolean;
  anomalyMessage?: string;
  deviceInfo?: string;
}

export type ComplaintCategory =
  | 'No Internet'
  | 'Slow Internet'
  | 'High Ping'
  | 'Frequent Disconnection'
  | 'Weak Signal'
  | 'Website / Service Unavailable'
  | 'Other';

export type ComplaintSeverity = 'Low' | 'Medium' | 'High' | 'Critical';

export type ComplaintStatus =
  | 'Submitted'
  | 'Reviewed'
  | 'Assigned'
  | 'In Progress'
  | 'Resolved';

export interface MaintenanceNote {
  id: string;
  complaintId: string;
  staffId: string;
  staffName: string;
  note: string;
  createdAt: string;
}

export interface Complaint {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  locationId: string;
  locationName: string;
  building: string;
  complaintType: ComplaintCategory;
  description: string;
  relatedTestId?: string;
  relatedTestMetrics?: {
    downloadSpeed: number;
    uploadSpeed: number;
    ping: number;
    healthScore: number;
  };
  status: ComplaintStatus;
  severity: ComplaintSeverity;
  aiSummary?: string;
  aiLikelyCause?: string;
  aiSuggestedAction?: string;
  assignedStaffId?: string;
  assignedStaffName?: string;
  createdAt: string;
  resolvedAt?: string;
  maintenanceNotes?: MaintenanceNote[];
}

export interface OutageAlert {
  id: string;
  locationId: string;
  locationName: string;
  building: string;
  startedAt: string;
  resolvedAt?: string;
  reason: string;
  status: 'active' | 'investigating' | 'resolved';
  triggerCount: number;
  aiDiagnosis?: string;
  affectedUsersEstimate?: number;
}

export interface HealthThresholds {
  targetDownloadMbps: number; // e.g. 50
  targetUploadMbps: number;   // e.g. 20
  targetPingMs: number;       // e.g. 25
  targetPacketLossPct: number;// e.g. 0
  targetJitterMs: number;     // e.g. 5
  weights: {
    download: number;   // 0.30
    upload: number;     // 0.15
    ping: number;       // 0.25
    packetLoss: number; // 0.20
    jitter: number;     // 0.10
  };
}

export interface HealthScoreCalculation {
  score: number;
  status: HealthStatus;
  breakdown: {
    downloadScore: number; // 0 - 30
    uploadScore: number;   // 0 - 15
    pingScore: number;     // 0 - 25
    packetLossScore: number; // 0 - 20
    jitterScore: number;   // 0 - 10
    recentFailuresPenalty: number;
  };
  dragDownFactor: string;
  explanation: string;
}

export interface AIIncidentBrief {
  locationId: string;
  locationName: string;
  building: string;
  generatedAt: string;
  severity: 'Critical' | 'Warning' | 'Informational';
  executiveSummary: string;
  rootCauseAnalysis: string[];
  recommendedActions: string[];
  affectedHardware: string;
  estimatedResolutionTime: string;
}

export interface WifiWeatherForecast {
  locationId: string;
  locationName: string;
  bestHours: string;
  worstHours: string;
  currentCongestion: 'Low' | 'Moderate' | 'Heavy' | 'Extreme';
  forecastNote: string;
  hourlyTrends: { hour: number; label: string; expectedSpeed: number; congestionScore: number }[];
}

export interface SystemKPIs {
  totalTestsToday: number;
  avgDownload: number;
  avgUpload: number;
  avgPing: number;
  poorLocationsCount: number;
  openComplaintsCount: number;
  resolvedComplaintsCount: number;
  activeOutagesCount: number;
}

export interface TrafficReductionPolicy {
  qosStreamingCap: boolean;        // Limit 4K/UHD streaming to 1080p (saves ~35% bandwidth)
  bandSteering5Ghz: boolean;       // Steer dual-band devices to 5GHz DFS channels (reduces 2.4GHz contention)
  apLoadBalancing: boolean;        // Dynamic roaming handoff to neighboring APs (Min RSSI -70dBm)
  p2pThrottling: boolean;          // Deprioritize BitTorrent/P2P downloads during 8am-5pm peak
  airtimeFairness: boolean;        // Equal time slices so slow legacy clients don't stall the channel
}

export interface FacilityTraffic {
  locationId: string;
  name: string;
  building: string;
  connectedDevices: number;
  maxCapacity: number;
  capacityUtilizationPct: number;
  currentThroughputMbps: number;
  channelAirtimePct: number;
  topAppCategory: string;
  congestionLevel: 'Low' | 'Moderate' | 'High' | 'Severe';
}

export interface CampusTrafficTelemetry {
  totalBackhaulCapacityMbps: number; // e.g. 2500 Mbps
  currentUsageMbps: number;           // e.g. 2140 Mbps
  peakUsageEstimateMbps: number;      // e.g. 2380 Mbps
  totalConnectedDevices: number;      // e.g. 1480
  categoryBreakdown: {
    name: string;
    percentage: number;
    usageMbps: number;
    color: string;
  }[];
  facilityTraffic: FacilityTraffic[];
  policies: TrafficReductionPolicy;
  trafficReductionImpact: {
    bandwidthSavedMbps: number;
    latencyReductionMs: number;
    speedImprovementPct: number;
  };
}

