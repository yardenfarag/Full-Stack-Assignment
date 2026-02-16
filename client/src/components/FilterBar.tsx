import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Calendar, Target } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { DATE_PRESETS, OBJECTIVES } from "@/config";
import type { FilterState } from "@/models";

interface FilterBarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onApply: () => void;
}

export function FilterBar({ filters, onChange, onApply }: FilterBarProps) {
  const [localSearch, setLocalSearch] = useState(filters.search || "");
  const debouncedSearch = useDebounce(localSearch, 500);

  // Update filters when debounced search changes
  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      onChange({
        ...filters,
        search: debouncedSearch || undefined,
      });
    }
  }, [debouncedSearch]);

  const applyDatePreset = (days: number) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);

    onChange({
      ...filters,
      dateRange: {
        from: from.toISOString().split("T")[0],
        to: to.toISOString().split("T")[0],
      },
    });
  };

  const handleSearchChange = (value: string) => {
    setLocalSearch(value);
  };

  return (
    <Card className="mb-6 border-border/50 shadow-sm">
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date Range
            </h3>
            <div className="flex flex-wrap gap-2">
              {DATE_PRESETS.map((preset) => (
                <Button
                  key={preset.label}
                  variant="outline"
                  size="sm"
                  onClick={() => applyDatePreset(preset.days)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
            <div className="flex gap-2 mt-3">
              <Input
                type="date"
                value={filters.dateRange.from}
                onChange={(e) =>
                  onChange({
                    ...filters,
                    dateRange: { ...filters.dateRange, from: e.target.value },
                  })
                }
                className="flex-1"
              />
              <span className="self-center text-muted-foreground">to</span>
              <Input
                type="date"
                value={filters.dateRange.to}
                onChange={(e) =>
                  onChange({
                    ...filters,
                    dateRange: { ...filters.dateRange, to: e.target.value },
                  })
                }
                className="flex-1"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <Target className="h-4 w-4 text-muted-foreground" />
              Campaign Objective <span className="text-destructive">*</span>
            </label>
            <Select
              value={filters.campaignObjective}
              onChange={(e) =>
                onChange({
                  ...filters,
                  campaignObjective: e.target.value,
                })
              }
            >
              <option value="">Select objective...</option>
              {OBJECTIVES.map((obj) => (
                <option key={obj} value={obj}>
                  {obj}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Status <span className="text-muted-foreground font-normal">(Optional)</span>
            </label>
            <Select
              value={filters.status || ""}
              onChange={(e) =>
                onChange({
                  ...filters,
                  status: e.target.value ? (e.target.value as "active" | "inactive") : undefined,
                })
              }
            >
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Search <span className="text-muted-foreground font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search campaigns or ads..."
                value={localSearch}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={onApply} disabled={!filters.campaignObjective} className="gap-2">
              <Filter className="h-4 w-4" />
              Apply Filters
            </Button>
            {filters.search && (
              <Badge variant="secondary" className="gap-1">
                Search: {filters.search}
              </Badge>
            )}
            {filters.status && (
              <Badge variant="secondary">Status: {filters.status}</Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

