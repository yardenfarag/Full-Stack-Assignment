import { Button } from "@/components/ui/button";
import { Bell, User } from "lucide-react";

export function Header() {
  return (
    <header className="h-16 border-b border-border bg-card fixed top-0 left-80 right-0 z-10 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold">Overview</h1>
      </div>
      
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="h-9 w-9 p-0 cursor-pointer">
          <Bell className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted cursor-pointer">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">User</span>
        </div>
      </div>
    </header>
  );
}

