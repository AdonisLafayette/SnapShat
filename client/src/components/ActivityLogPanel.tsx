import { ScrollArea } from "@/components/ui/scroll-area";
import GlassCard from "./GlassCard";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";

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
    <GlassCard className="h-[600px] flex flex-col shadow-[0_12px_40px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.18)]">
      <h2 className="text-xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">Activity Log</h2>
      
      <ScrollArea className="flex-1 pr-4">
        <div className="space-y-3">
          {logs.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                <Clock className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground/70 font-medium">
                No activity yet. Start processing to see logs.
              </p>
            </div>
          ) : (
            logs.map((log, index) => (
              <div
                key={log.id}
                className={cn(
                  "pb-3 transition-all hover:bg-white/5 rounded-lg p-2 -mx-2",
                  index < logs.length - 1 && "border-b border-white/10"
                )}
              >
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-xs font-mono text-muted-foreground/70 bg-white/5 px-2 py-0.5 rounded">
                    {format(log.timestamp, 'HH:mm:ss')}
                  </span>
                  <span className="text-xs font-semibold text-foreground/80">{log.friendUsername}</span>
                </div>
                <p className={cn("text-sm font-medium", statusColors[log.status])}>
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
