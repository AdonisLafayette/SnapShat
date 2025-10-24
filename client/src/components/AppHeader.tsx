import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

interface AppHeaderProps {
  onOpenSettings?: () => void;
}

export default function AppHeader({ onOpenSettings }: AppHeaderProps) {
  return (
    <div className="relative bg-white/[0.06] backdrop-blur-2xl backdrop-saturate-150 border-b border-white/[0.12] px-8 py-5 shadow-[0_1px_0_rgba(255,255,255,0.1),0_4px_24px_rgba(0,0,0,0.2)]">
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.08] to-transparent pointer-events-none" />
      <div className="max-w-7xl mx-auto flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-primary/60 flex items-center justify-center shadow-[0_8px_24px_rgba(59,130,246,0.35),inset_0_1px_0_rgba(255,255,255,0.3)]">
            <Zap className="w-7 h-7 text-primary-foreground drop-shadow-lg" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">Snapstreak Restore</h1>
            <p className="text-xs text-muted-foreground/80 font-medium">Automated streak restoration tool</p>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            console.log('Settings clicked');
            onOpenSettings?.();
          }}
          className="rounded-xl hover:bg-white/10 transition-all duration-200"
          data-testid="button-settings"
        >
          <Settings className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
