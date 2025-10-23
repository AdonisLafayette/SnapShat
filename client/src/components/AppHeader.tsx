import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

interface AppHeaderProps {
  onOpenSettings?: () => void;
}

export default function AppHeader({ onOpenSettings }: AppHeaderProps) {
  return (
    <div className="bg-card/20 backdrop-blur-2xl border-b border-card-border/50 px-8 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/25">
            <Zap className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Snapstreak Restore</h1>
            <p className="text-xs text-muted-foreground">Automated streak restoration tool</p>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            console.log('Settings clicked');
            onOpenSettings?.();
          }}
          className="rounded-lg"
          data-testid="button-settings"
        >
          <Settings className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
