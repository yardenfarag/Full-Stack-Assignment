import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { BarChart3, Zap, FileText, ChevronUp, ChevronDown, Loader2, Inbox, Search } from "lucide-react";
import { usePerformance } from "@/contexts/PerformanceContext";
import { useColumns } from "@/contexts/ColumnsContext";
import { useDebounce } from "@/hooks/useDebounce";
import { ColumnSelector } from "./ColumnSelector";
import type { ColumnDefinition } from "@/models";

export function PerformanceTable() {
  const {
    data,
    loading,
    error,
    grouping,
    filters,
    setFilters,
    selectedColumns,
    setSelectedColumns,
    page,
    setPage,
    pageSize,
    setPageSize,
    sorting,
    setSorting,
  } = usePerformance();
  const { columns } = useColumns();
  const [localSearch, setLocalSearch] = useState(filters.search || "");
  const debouncedSearch = useDebounce(localSearch, 500);
  const prevGroupingRef = useRef<"campaign" | "ad">(grouping);

  // Helper function to get default columns for a grouping
  const getDefaultColumns = (grouping: "campaign" | "ad") => {
    return columns
      .filter((col) => {
        if (!col.availableFor.includes(grouping)) return false;
        if (col.category === "info") {
          // Always include campaign info columns
          if (["campaign_name", "campaign_objective", "status"].includes(col.id)) return true;
          // Include ad-specific columns only in ad mode
          if (grouping === "ad" && ["ad_name", "creative_type", "thumbnail_url"].includes(col.id)) return true;
          return false;
        }
        if (col.category === "metrics") {
          return ["impressions", "clicks", "spend"].includes(col.id);
        }
        return false;
      })
      .map((col) => col.id);
  };

  // Initialize default columns when columns are first loaded
  useEffect(() => {
    if (columns.length > 0 && selectedColumns.length === 0) {
      setSelectedColumns(getDefaultColumns(grouping));
    }
  }, [columns, grouping, selectedColumns.length, setSelectedColumns]);

  // Update columns when grouping changes
  useEffect(() => {
    if (columns.length === 0) return;
    
    // Only update if grouping actually changed
    if (prevGroupingRef.current !== grouping) {
      prevGroupingRef.current = grouping;
      
      // Filter out columns that are no longer available for the current grouping
      const validColumns = selectedColumns.filter((colId: string) => {
        const col = columns.find((c) => c.id === colId);
        return col && col.availableFor.includes(grouping);
      });

      // If switching to ad mode, ensure thumbnail_url is included if not already present
      if (grouping === "ad" && !validColumns.includes("thumbnail_url")) {
        const thumbnailCol = columns.find((c) => c.id === "thumbnail_url");
        if (thumbnailCol && thumbnailCol.availableFor.includes("ad")) {
          validColumns.push("thumbnail_url");
        }
      }

      // If we have valid columns, use them; otherwise set defaults
      setSelectedColumns(validColumns.length > 0 ? validColumns : getDefaultColumns(grouping));
    }
  }, [grouping, columns, selectedColumns, setSelectedColumns]);

  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      setFilters({
        ...filters,
        search: debouncedSearch || undefined,
      });
    }
  }, [debouncedSearch]);

  const handleSort = (field: string) => {
    if (sorting?.field === field) {
      setSorting({
        field,
        direction: sorting.direction === "asc" ? "desc" : "asc",
      });
    } else {
      setSorting({ field, direction: "asc" });
    }
  };

  const formatValue = (value: any, column: ColumnDefinition | undefined) => {
    if (value === null || value === undefined) return "-";
    if (!column) return String(value);

    switch (column.type) {
      case "currency":
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 2,
        }).format(value);
      case "percentage":
        return `${Number(value).toFixed(2)}%`;
      case "ratio":
        return `${Number(value).toFixed(2)}x`;
      case "number":
        return new Intl.NumberFormat("en-US").format(value);
      default:
        return String(value);
    }
  };

  if (!filters.campaignObjective) {
    return (
      <Card className="border-border/50 shadow-sm">
        <CardContent className="py-16 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
              <Zap className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground mb-1">Select Campaign Objective</p>
              <p className="text-sm text-muted-foreground">Choose an objective to view performance data</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (selectedColumns.length === 0) {
    return (
      <Card className="border-border/50 shadow-sm">
        <CardContent className="py-16 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground mb-1">Select Columns</p>
              <p className="text-sm text-muted-foreground">Choose at least one column to display</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground">
              <BarChart3 className="h-4 w-4" />
            </div>
            Performance Data
          </CardTitle>
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search campaigns or ads..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <ColumnSelector
              columns={columns}
              selectedColumns={selectedColumns}
              grouping={grouping}
              campaignObjective={filters.campaignObjective}
              onChange={setSelectedColumns}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="py-16 text-center">
            <div className="inline-flex items-center gap-3 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading data...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-destructive/10 p-4 text-destructive">
            Error: {error}
          </div>
        )}

        {!loading && !error && data && (
          <>
            <div className="mb-4 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {selectedColumns.map((colId) => {
                      const column = columns.find((c) => c.id === colId);
                      if (!column) return null;

                      const isSorted = sorting?.field === colId;
                      return (
                        <TableHead
                          key={colId}
                          className="cursor-pointer select-none hover:bg-muted/50"
                          onClick={() => handleSort(colId)}
                        >
                          <div className="flex items-center gap-2">
                            {column.label}
                            {isSorted && (
                              sorting.direction === "asc" ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )
                            )}
                          </div>
                        </TableHead>
                      );
                    })}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={selectedColumns.length}
                        className="text-center text-muted-foreground py-16"
                      >
                        <div className="flex flex-col items-center gap-3">
                          <Inbox className="h-12 w-12 text-muted-foreground/50" />
                          <p className="font-medium">No data found</p>
                          <p className="text-sm">Try adjusting your filters</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.data.map((row, idx) => (
                      <TableRow key={idx}>
                        {selectedColumns.map((colId) => {
                          const column = columns.find((c) => c.id === colId);
                          return (
                            <TableCell key={colId}>
                              {colId === "thumbnail_url" ? (
                                row[colId] ? (
                                  <img
                                    src={row[colId]}
                                    alt="Ad thumbnail"
                                    className="h-12 w-12 object-cover rounded border border-border"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = "none";
                                    }}
                                  />
                                ) : (
                                  <span className="text-muted-foreground text-xs">No image</span>
                                )
                              ) : (
                                formatValue(row[colId], column)
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  Showing {data.data.length} of {data.meta.totalRows} rows
                </span>
                <Select
                  value={pageSize.toString()}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="w-24"
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {data.meta.page} of {data.meta.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.min(data.meta.totalPages, page + 1))}
                  disabled={page >= data.meta.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

