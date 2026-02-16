import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ColumnDefinition } from "@/models";

interface ColumnSelectorProps {
  columns: ColumnDefinition[];
  selectedColumns: string[];
  grouping: "campaign" | "ad";
  campaignObjective: string;
  onChange: (selected: string[]) => void;
}

export function ColumnSelector({
  columns,
  selectedColumns,
  grouping,
  campaignObjective,
  onChange,
}: ColumnSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const availableColumns = columns.filter((col) => {
    if (!col.availableFor.includes(grouping)) return false;
    if (col.category === "kpi" && col.objective !== campaignObjective) return false;
    return true;
  });

  const toggleColumn = (columnId: string) => {
    if (selectedColumns.includes(columnId)) {
      onChange(selectedColumns.filter((id) => id !== columnId));
    } else {
      onChange([...selectedColumns, columnId]);
    }
  };

  const selectedCount = selectedColumns.length;

  return (
    <div className="relative">
      <Button variant="outline" onClick={() => setIsOpen(!isOpen)} className="shadow-sm">
        Columns ({selectedCount})
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <Card className="absolute right-0 top-full z-20 mt-2 w-80 border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Select Columns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {["info", "metrics", "kpi"].map((category) => {
                  const categoryColumns = availableColumns.filter(
                    (col) => col.category === category
                  );
                  if (categoryColumns.length === 0) return null;

                  return (
                    <div key={category}>
                      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {category}
                      </h4>
                      <div className="space-y-1">
                        {categoryColumns.map((col) => (
                          <label
                            key={col.id}
                            className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 p-2.5 rounded-lg transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={selectedColumns.includes(col.id)}
                              onChange={() => toggleColumn(col.id)}
                              className="rounded"
                            />
                            <span className="text-sm">{col.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

