import { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { ReactNode } from "react";
import type { FilterState, PerformanceData } from "@/models";
import { API_ENDPOINTS } from "@/config";

interface PerformanceContextType {
  data: PerformanceData | null;
  loading: boolean;
  error: string | null;
  grouping: "campaign" | "ad";
  setGrouping: (grouping: "campaign" | "ad") => void;
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  selectedColumns: string[];
  setSelectedColumns: (columns: string[]) => void;
  page: number;
  setPage: (page: number) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  sorting: { field: string; direction: "asc" | "desc" } | null;
  setSorting: (sorting: { field: string; direction: "asc" | "desc" } | null) => void;
  fetchData: () => Promise<void>;
}

const PerformanceContext = createContext<PerformanceContextType | undefined>(undefined);

export function PerformanceProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [grouping, setGrouping] = useState<"campaign" | "ad">("campaign");
  const [filters, setFilters] = useState<FilterState>({
    dateRange: {
      from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      to: new Date().toISOString().split("T")[0],
    },
    campaignObjective: "",
    status: undefined,
    search: undefined,
  });
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sorting, setSorting] = useState<{ field: string; direction: "asc" | "desc" } | null>(null);

  const fetchData = useCallback(async () => {
    if (!filters.campaignObjective || selectedColumns.length === 0) {
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(API_ENDPOINTS.PERFORMANCE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          grouping,
          filters,
          pagination: { page, pageSize },
          sorting: sorting || undefined,
          columns: selectedColumns,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch data";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [grouping, filters, selectedColumns, page, pageSize, sorting]);

  // Auto-fetch when dependencies change (except on initial mount if no objective selected)
  useEffect(() => {
    if (filters.campaignObjective && selectedColumns.length > 0) {
      fetchData();
    }
  }, [grouping, filters, selectedColumns, page, pageSize, sorting, fetchData]);

  return (
    <PerformanceContext.Provider
      value={{
        data,
        loading,
        error,
        grouping,
        setGrouping,
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
        fetchData,
      }}
    >
      {children}
    </PerformanceContext.Provider>
  );
}

export function usePerformance() {
  const context = useContext(PerformanceContext);
  if (context === undefined) {
    throw new Error("usePerformance must be used within a PerformanceProvider");
  }
  return context;
}

