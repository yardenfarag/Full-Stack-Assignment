// Filter State
export interface FilterState {
  dateRange: {
    from: string;
    to: string;
  };
  campaignObjective: string;
  status?: "active" | "inactive";
  search?: string;
}

// Column Definition
export interface ColumnDefinition {
  id: string;
  label: string;
  category: "info" | "metrics" | "kpi";
  type: "string" | "number" | "currency" | "percentage" | "ratio";
  availableFor: ("campaign" | "ad")[];
  objective?: "AWARENESS" | "TRAFFIC" | "ENGAGEMENT" | "LEADS" | "SALES";
}

// Performance Data
export interface PerformanceData {
  data: Record<string, any>[];
  meta: {
    totalRows: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

// Sync Progress
export interface SyncProgress {
  campaigns: { fetched: number; total: number };
  ads: { fetched: number; total: number };
  creatives: { fetched: number; total: number };
  insights: { fetched: number; total: number };
  status: "idle" | "syncing" | "completed" | "error";
  error?: string;
}

