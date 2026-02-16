import { createContext, useContext, useState, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { API_ENDPOINTS } from "@/config";
import type { SyncProgress } from "@/models";

interface SyncContextType {
  progress: SyncProgress;
  startSync: () => Promise<void>;
  estimatedTimeRemaining: string | null;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export function SyncProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<SyncProgress>({
    campaigns: { fetched: 0, total: 0 },
    ads: { fetched: 0, total: 0 },
    creatives: { fetched: 0, total: 0 },
    insights: { fetched: 0, total: 0 },
    status: "idle",
  });
  const syncStartTimeRef = useRef<number | null>(null);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<string | null>(null);
  const lastEntityTypeRef = useRef<string | null>(null);
  const lastProgressRef = useRef<number>(0);

  useEffect(() => {
    const eventSource = new EventSource(API_ENDPOINTS.SYNC_STATUS);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data) as SyncProgress;
      setProgress((prevProgress) => {
        // Track when sync starts
        if (prevProgress.status !== "syncing" && data.status === "syncing") {
          syncStartTimeRef.current = Date.now();
        }
        // Clear start time when sync completes or errors
        if (data.status === "completed" || data.status === "error" || data.status === "idle") {
          syncStartTimeRef.current = null;
          setEstimatedTimeRemaining(null);
        }
        return data;
      });
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  // Calculate ETA based on progress
  useEffect(() => {
    if (progress.status !== "syncing" || !syncStartTimeRef.current) {
      return;
    }

    const calculateETA = () => {
      const totalFetched =
        progress.campaigns.fetched +
        progress.creatives.fetched +
        progress.ads.fetched +
        progress.insights.fetched;
      const total =
        progress.campaigns.total +
        progress.creatives.total +
        progress.ads.total +
        progress.insights.total;

      if (total === 0 || totalFetched === 0) {
        setEstimatedTimeRemaining(null);
        lastProgressRef.current = 0;
        return;
      }

      const progressPercent = totalFetched / total;
      if (progressPercent >= 1) {
        setEstimatedTimeRemaining(null);
        return;
      }

      // Determine current phase (campaigns/creatives/ads run in parallel, insights run separately)
      let currentPhase: string | null = null;
      const isInitialPhase = 
        (progress.campaigns.total > 0 && progress.campaigns.fetched < progress.campaigns.total) ||
        (progress.creatives.total > 0 && progress.creatives.fetched < progress.creatives.total) ||
        (progress.ads.total > 0 && progress.ads.fetched < progress.ads.total);
      const isInsightsPhase = progress.insights.total > 0 && progress.insights.fetched < progress.insights.total;
      
      if (isInsightsPhase) {
        currentPhase = "insights";
      } else if (isInitialPhase) {
        currentPhase = "initial"; // campaigns, creatives, ads in parallel
      }

      // Only recalculate ETA if phase changed or progress increased significantly (2% change to reduce fluctuations)
      const progressChanged = Math.abs(progressPercent - lastProgressRef.current) > 0.02; // 2% change
      const phaseChanged = currentPhase !== lastEntityTypeRef.current;

      if (phaseChanged || progressChanged) {
        lastEntityTypeRef.current = currentPhase;
        lastProgressRef.current = progressPercent;

        const elapsed = Date.now() - syncStartTimeRef.current!;
        const estimatedTotal = elapsed / progressPercent;
        const remaining = estimatedTotal - elapsed;

        // Format time remaining
        const seconds = Math.ceil(remaining / 1000);
        if (seconds < 60) {
          setEstimatedTimeRemaining(`about ${seconds}s remaining`);
        } else if (seconds < 3600) {
          const minutes = Math.floor(seconds / 60);
          const secs = seconds % 60;
          setEstimatedTimeRemaining(`about ${minutes}m ${secs}s remaining`);
        } else {
          const hours = Math.floor(seconds / 3600);
          const minutes = Math.floor((seconds % 3600) / 60);
          setEstimatedTimeRemaining(`about ${hours}h ${minutes}m remaining`);
        }
      }
    };

    calculateETA();
    const interval = setInterval(calculateETA, 1000); // Update every second

    return () => clearInterval(interval);
  }, [progress]);

  const startSync = async () => {
    try {
      await fetch(API_ENDPOINTS.SYNC, {
        method: "POST",
      });
    } catch (error) {
      console.error("Failed to start sync:", error);
    }
  };

  return (
    <SyncContext.Provider value={{ progress, startSync, estimatedTimeRemaining }}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error("useSync must be used within a SyncProvider");
  }
  return context;
}

