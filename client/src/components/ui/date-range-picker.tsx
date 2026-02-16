import * as React from "react";
import { Input } from "./input";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface DateRangePickerProps {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
  className?: string;
  disabled?: boolean;
}

export function DateRangePicker({ from, to, onChange, className, disabled = false }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [localFrom, setLocalFrom] = React.useState(from);
  const [localTo, setLocalTo] = React.useState(to);

  React.useEffect(() => {
    setLocalFrom(from);
    setLocalTo(to);
  }, [from, to]);

  const handleApply = () => {
    onChange(localFrom, localTo);
    setIsOpen(false);
  };

  const displayValue = from && to ? `${from} to ${to}` : "Select date range";

  return (
    <div className={cn("relative", className)}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
          disabled
            ? "opacity-50 cursor-not-allowed"
            : "cursor-pointer hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        )}
      >
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className={cn("flex-1 text-left", !from || !to ? "text-muted-foreground" : "")}>
          {displayValue}
        </span>
      </div>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 z-20 mt-2 p-4 bg-card border border-border rounded-lg shadow-lg w-80">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">From</label>
                <Input
                  type="date"
                  value={localFrom}
                  onChange={(e) => setLocalFrom(e.target.value)}
                  className="w-40"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">To</label>
                <Input
                  type="date"
                  value={localTo}
                  onChange={(e) => setLocalTo(e.target.value)}
                  className="w-40"
                />
              </div>
              <div className="flex gap-2 pt-2 w-60">
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-40 px-1 py-1.5 text-sm rounded-md border border-input bg-background hover:bg-accent cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApply}
                  className="w-40 px-1 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

