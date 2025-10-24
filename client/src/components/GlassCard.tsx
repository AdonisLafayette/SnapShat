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
        "relative overflow-hidden rounded-3xl p-6",
        "bg-white/[0.08] dark:bg-white/[0.06]",
        "backdrop-blur-xl backdrop-saturate-150",
        "border border-white/[0.15] dark:border-white/[0.12]",
        "shadow-[0_8px_32px_rgba(0,0,0,0.25),0_2px_8px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.15)]",
        "transition-all duration-300 ease-out",
        onClick && "cursor-pointer hover:scale-[1.02] hover:shadow-[0_12px_40px_rgba(0,0,0,0.3),0_4px_12px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.2)] active:scale-[0.98]",
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.12] via-transparent to-transparent pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
