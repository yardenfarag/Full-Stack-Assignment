import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { DataSync } from "./components/DataSync";
import { PerformanceTable } from "./components/PerformanceTable";
import { Card, CardContent } from "./components/ui/card";
import { AlertCircle } from "lucide-react";
import { useColumns } from "./contexts/ColumnsContext";

function App() {
  const { loading: columnsLoading, error: columnsError } = useColumns();

  const serverConnected = !columnsError && !columnsLoading;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="ml-80">
        <Header />
        <main className="pt-16 p-6">
          {serverConnected === false && (
            <Card className="mb-6 border-destructive bg-destructive/10">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-destructive">Unable to Load Data</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      We're experiencing issues connecting to the server. Please try refreshing the page.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      If the problem persists, please contact your system administrator for assistance.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="mb-6">
            <DataSync />
          </div>

          <PerformanceTable />
        </main>
      </div>
    </div>
  );
}

export default App;
