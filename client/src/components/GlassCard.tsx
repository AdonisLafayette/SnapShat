import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function GlassCard({ children, className, onClick }: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-card/40 backdrop-blur-2xl border border-card-border/50 rounded-2xl p-6",
        "shadow-lg shadow-black/20",
        onClick && "cursor-pointer hover-elevate active-elevate-2 transition-transform",
        className
      )}
    >
      {children}
    </div>
  );
}
