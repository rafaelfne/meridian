import { Badge } from "@/components/ui/badge";

export function DatadogStatusBadge({ status }: { status: string | null }) {
  switch (status) {
    case "OK":
      return <Badge variant="outline" className="text-green-600 border-green-400">OK</Badge>;
    case "WARN":
      return <Badge variant="outline" className="text-yellow-600 border-yellow-400">Warn</Badge>;
    case "ALERT":
      return <Badge variant="destructive">Alert</Badge>;
    case "NO_DATA":
      return <Badge variant="secondary">No Data</Badge>;
    case "NOT_FOUND":
      return <Badge variant="outline" className="text-yellow-600 border-yellow-400">Not monitored</Badge>;
    default:
      return <span className="text-sm text-muted-foreground">—</span>;
  }
}
