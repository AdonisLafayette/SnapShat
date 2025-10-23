import { Badge } from "@/components/ui/badge";
import { Clock, Loader2, CheckCircle2, XCircle, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SubmissionStatus } from "@shared/schema";

interface StatusBadgeProps {
  status: SubmissionStatus;
  className?: string;
}

const statusConfig = {
  pending: {
    icon: Clock,
    label: "Pending",
    className: "bg-muted/50 text-muted-foreground border-muted-border",
  },
  running: {
    icon: Loader2,
    label: "Running",
    className: "bg-primary/20 text-primary border-primary/30",
    animate: true,
  },
  success: {
    icon: CheckCircle2,
    label: "Success",
    className: "bg-green-500/20 text-green-400 border-green-500/30",
  },
  failed: {
    icon: XCircle,
    label: "Failed",
    className: "bg-destructive/20 text-destructive border-destructive/30",
  },
  captcha: {
    icon: ShieldAlert,
    label: "Captcha",
    className: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  },
};

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide font-mono",
        "backdrop-blur-sm",
        config.className,
        className
      )}
    >
      <Icon className={cn("w-3 h-3 mr-1.5", config.animate && "animate-spin")} />
      {config.label}
    </Badge>
  );
}
