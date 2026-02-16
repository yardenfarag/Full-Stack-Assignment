// API Configuration
export const API_BASE_URL = "http://localhost:3000";

// API Endpoints
export const API_ENDPOINTS = {
  COLUMNS: `${API_BASE_URL}/api/columns`,
  PERFORMANCE: `${API_BASE_URL}/api/performance`,
  SYNC: `${API_BASE_URL}/api/sync`,
  SYNC_STATUS: `${API_BASE_URL}/api/sync/status`,
} as const;

// Date Range Presets
export const DATE_PRESETS = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 14 days", days: 14 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 60 days", days: 60 },
  { label: "Last 90 days", days: 90 },
] as const;

// Campaign Objectives
export const OBJECTIVES = ["AWARENESS", "TRAFFIC", "ENGAGEMENT", "LEADS", "SALES"] as const;

