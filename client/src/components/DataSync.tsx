import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RefreshCw, Database, CheckCircle2, AlertCircle } from "lucide-react";
import { useSync } from "@/contexts/SyncContext";

export function DataSync() {
  const { progress, startSync, estimatedTimeRemaining } = useSync();

  const isSyncing = progress.status === "syncing";

  const getTotalProgress = () => {
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
    return total > 0 ? Math.min((totalFetched / total) * 100, 100) : 0;
  };

  const totalProgress = getTotalProgress();

  // Determine which entities are currently being loaded
  const getCurrentLoadingEntities = () => {
    if (progress.status !== "syncing") return [];
    
    const loading: string[] = [];
    
    // Check if insights are being loaded (runs last, after campaigns/creatives/ads)
    if (progress.insights.total > 0 && progress.insights.fetched < progress.insights.total) {
      loading.push("insights");
    }
    
    // Check if campaigns, creatives, or ads are being loaded (run in parallel)
    // Only show these if insights haven't started yet
    if (loading.length === 0) {
      if (progress.campaigns.total > 0 && progress.campaigns.fetched < progress.campaigns.total) {
        loading.push("campaigns");
      }
      if (progress.creatives.total > 0 && progress.creatives.fetched < progress.creatives.total) {
        loading.push("creatives");
      }
      if (progress.ads.total > 0 && progress.ads.fetched < progress.ads.total) {
        loading.push("ads");
      }
    }
    
    return loading;
  };

  const currentLoadingEntities = getCurrentLoadingEntities();
  const loadingEntityLabel = currentLoadingEntities.length > 0
    ? currentLoadingEntities.map(e => e.charAt(0).toUpperCase() + e.slice(1)).join(", ")
    : null;

  return (
    <Card className="mt-4 mb-4 border-border/50 shadow-sm">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground flex-shrink-0">
              <Database className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold">Data Sync</span>
                {progress.status === "completed" && (
                  <CheckCircle2 className="h-4 w-4 text-accent" />
                )}
                {progress.status === "error" && (
                  <AlertCircle className="h-4 w-4 text-destructive" />
                )}
              </div>
              {progress.status === "syncing" && (
                <div className="space-y-1.5">
                  <Progress value={totalProgress} className="h-1.5" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                      <span className={currentLoadingEntities.includes("campaigns") ? "font-medium text-foreground" : ""}>
                        Campaigns: {progress.campaigns.fetched}
                      </span>
                      <span className={currentLoadingEntities.includes("creatives") ? "font-medium text-foreground" : ""}>
                        Creatives: {progress.creatives.fetched}
                      </span>
                      <span className={currentLoadingEntities.includes("ads") ? "font-medium text-foreground" : ""}>
                        Ads: {progress.ads.fetched}
                      </span>
                      <span className={currentLoadingEntities.includes("insights") ? "font-medium text-foreground" : ""}>
                        Insights: {progress.insights.fetched}
                      </span>
                      {loadingEntityLabel && (
                        <span className="text-xs font-medium text-primary">
                          Loading {loadingEntityLabel}...
                        </span>
                      )}
                    </div>
                    {estimatedTimeRemaining && (
                      <span className="text-xs text-muted-foreground font-medium">
                        {estimatedTimeRemaining}
                      </span>
                    )}
                  </div>
                </div>
              )}
              {progress.status === "completed" && (
                <p className="text-xs text-muted-foreground">All data synced successfully</p>
              )}
              {progress.status === "error" && (
                <p className="text-xs text-destructive">Error: {progress.error}</p>
              )}
              {progress.status === "idle" && (
                <p className="text-xs text-muted-foreground">Ready to sync data</p>
              )}
            </div>
          </div>
          <Button
            onClick={startSync}
            disabled={isSyncing}
            variant={progress.status === "completed" ? "outline" : "default"}
            size="sm"
            className="gap-2 flex-shrink-0 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "Syncing..." : progress.status === "completed" ? "Re-sync" : "Sync"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

