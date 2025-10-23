import { ScrollArea } from "@/components/ui/scroll-area";
import GlassCard from "./GlassCard";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface LogEntry {
  id: string;
  timestamp: Date;
  friendUsername: string;
  action: string;
  status: 'info' | 'success' | 'error' | 'warning';
}

interface ActivityLogPanelProps {
  logs: LogEntry[];
}

const statusColors = {
  info: "text-muted-foreground",
  success: "text-green-400",
  error: "text-destructive",
  warning: "text-amber-400",
};

export default function ActivityLogPanel({ logs }: ActivityLogPanelProps) {
  return (
    <GlassCard className="h-[600px] flex flex-col">
      <h2 className="text-xl font-semibold mb-4">Activity Log</h2>
      
      <ScrollArea className="flex-1 pr-4">
        <div className="space-y-3">
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No activity yet. Start processing to see logs.
            </p>
          ) : (
            logs.map((log, index) => (
              <div
                key={log.id}
                className={cn(
                  "pb-3",
                  index < logs.length - 1 && "border-b border-border/30"
                )}
              >
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-xs font-mono text-muted-foreground">
                    {format(log.timestamp, 'HH:mm:ss')}
                  </span>
                  <span className="text-xs font-medium">{log.friendUsername}</span>
                </div>
                <p className={cn("text-sm", statusColors[log.status])}>
                  {log.action}
                </p>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </GlassCard>
  );
}
