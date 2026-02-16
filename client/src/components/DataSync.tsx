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
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Campaigns: {progress.campaigns.fetched}</span>
                      <span>Creatives: {progress.creatives.fetched}</span>
                      <span>Ads: {progress.ads.fetched}</span>
                      <span>Insights: {progress.insights.fetched}</span>
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

