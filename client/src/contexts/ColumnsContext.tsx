import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import type { ColumnDefinition } from "@/models";
import { API_ENDPOINTS } from "@/config";

interface ColumnsContextType {
  columns: ColumnDefinition[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const ColumnsContext = createContext<ColumnsContextType | undefined>(undefined);

export function ColumnsProvider({ children }: { children: ReactNode }) {
  const [columns, setColumns] = useState<ColumnDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchColumns = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_ENDPOINTS.COLUMNS);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setColumns(data.columns);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch columns";
      setError(errorMessage);
      console.error("Failed to fetch columns:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchColumns();
  }, []);

  return (
    <ColumnsContext.Provider value={{ columns, loading, error, refetch: fetchColumns }}>
      {children}
    </ColumnsContext.Provider>
  );
}

export function useColumns() {
  const context = useContext(ColumnsContext);
  if (context === undefined) {
    throw new Error("useColumns must be used within a ColumnsProvider");
  }
  return context;
}

