import { useState, useEffect } from "react";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Target, Filter, RefreshCw, BarChart3, AlertCircle } from "lucide-react";
import { usePerformance } from "@/contexts/PerformanceContext";
import { useSync } from "@/contexts/SyncContext";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DATE_PRESETS, OBJECTIVES } from "@/config";
import type { FilterState } from "@/models";

export function Sidebar() {
  const { filters, setFilters, grouping, setGrouping } = usePerformance();
  const { progress: syncProgress } = useSync();
  const isSyncing = syncProgress.status === "syncing";
  
  // Local state for pending filter changes
  const [pendingFilters, setPendingFilters] = useState<FilterState>(filters);
  const [pendingGrouping, setPendingGrouping] = useState<"campaign" | "ad">(grouping);

  // Sync local state when context filters/grouping change externally
  useEffect(() => {
    setPendingFilters(filters);
  }, [filters]);

  useEffect(() => {
    setPendingGrouping(grouping);
  }, [grouping]);

  const applyDatePreset = (days: number) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);

    setPendingFilters({
      ...pendingFilters,
      dateRange: {
        from: from.toISOString().split("T")[0],
        to: to.toISOString().split("T")[0],
      },
    });
  };

  const handleApplyFilters = () => {
    // Apply pending changes to context
    setFilters(pendingFilters);
    setGrouping(pendingGrouping);
    // fetchData will be triggered automatically by the useEffect in PerformanceContext
  };

  return (
    <div className="w-80 bg-card border-r border-border h-screen fixed left-0 top-0 overflow-y-auto">
      <div className="p-6 space-y-6 pb-24">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8 pt-4">
          <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <BarChart3 className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-bold text-lg">Dashboard</h2>
            <p className="text-xs text-muted-foreground">Ad Performance</p>
          </div>
        </div>

        {/* Sync Warning */}
        {isSyncing && (
          <div className="rounded-lg bg-muted/50 border border-border p-3 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              Filters are disabled while data is syncing. Please wait for sync to complete.
            </p>
          </div>
        )}

        {/* Grouping Selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground tracking-wide">View Mode</label>
          <div className="flex gap-2">
            <Button
              variant={pendingGrouping === "campaign" ? "default" : "outline"}
              onClick={() => setPendingGrouping("campaign")}
              className="flex-1 cursor-pointer"
              size="sm"
              disabled={isSyncing}
            >
              Campaign
            </Button>
            <Button
              variant={pendingGrouping === "ad" ? "default" : "outline"}
              onClick={() => setPendingGrouping("ad")}
              className="flex-1 cursor-pointer"
              size="sm"
              disabled={isSyncing}
            >
              Ad
            </Button>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {pendingGrouping === "campaign" 
              ? "Each row shows one campaign with metrics aggregated across all ads in that campaign."
              : "Each row shows one ad with its individual metrics. Includes ad name and creative type."}
          </p>
        </div>

        {/* Date Range */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-muted-foreground tracking-wide flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Date Range
          </label>
          <div className="space-y-3">
            <Select
              onChange={(e) => {
                if (e.target.value) {
                  applyDatePreset(Number(e.target.value));
                }
              }}
              className="w-full"
              disabled={isSyncing}
            >
              <option value="">Custom Range</option>
              {DATE_PRESETS.map((preset) => (
                <option key={preset.label} value={preset.days}>
                  {preset.label}
                </option>
              ))}
            </Select>
            <DateRangePicker
              from={pendingFilters.dateRange.from}
              to={pendingFilters.dateRange.to}
              onChange={(from, to) =>
                setPendingFilters({
                  ...pendingFilters,
                  dateRange: { from, to },
                })
              }
              disabled={isSyncing}
            />
          </div>
        </div>

        {/* Campaign Objective */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground tracking-wide flex items-center gap-2">
            <Target className="h-4 w-4" />
            Campaign Objective <span className="text-destructive">*</span>
          </label>
          <Select
            value={pendingFilters.campaignObjective}
            onChange={(e) =>
              setPendingFilters({
                ...pendingFilters,
                campaignObjective: e.target.value,
              })
            }
            className="w-full"
            disabled={isSyncing}
          >
            <option value="">Select objective...</option>
            {OBJECTIVES.map((obj) => (
              <option key={obj} value={obj}>
                {obj}
              </option>
            ))}
          </Select>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground tracking-wide flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Status
          </label>
          <Select
            value={pendingFilters.status || ""}
            onChange={(e) =>
              setPendingFilters({
                ...pendingFilters,
                status: e.target.value ? (e.target.value as "active" | "inactive") : undefined,
              })
            }
            className="w-full"
            disabled={isSyncing}
          >
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </div>


        {/* Active Filters */}
        {pendingFilters.status && (
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground tracking-wide">Active Filters</label>
            <div className="flex flex-wrap gap-2">
              {pendingFilters.status && (
                <Badge variant="secondary">Status: {pendingFilters.status}</Badge>
              )}
            </div>
          </div>
        )}

        {/* Apply Button */}
        <Button
          onClick={handleApplyFilters}
          disabled={!pendingFilters.campaignObjective || isSyncing}
          className="w-full gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Apply Filters
        </Button>
      </div>
    </div>
  );
}

