import { Button } from "@/components/ui/button";
import { Play, Square, CheckSquare, XSquare } from "lucide-react";
import GlassCard from "./GlassCard";
import { Progress } from "@/components/ui/progress";

interface BatchControlsProps {
  selectedCount: number;
  totalCount: number;
  isProcessing: boolean;
  processedCount: number;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
  onStartProcessing?: () => void;
  onStopProcessing?: () => void;
}

export default function BatchControls({
  selectedCount,
  totalCount,
  isProcessing,
  processedCount,
  onSelectAll,
  onDeselectAll,
  onStartProcessing,
  onStopProcessing,
}: BatchControlsProps) {
  const progressPercentage = totalCount > 0 ? (processedCount / totalCount) * 100 : 0;

  return (
    <GlassCard className="shadow-[0_12px_40px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.18)]">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                console.log('Select all clicked');
                onSelectAll?.();
              }}
              className="rounded-xl border-white/20 hover:bg-white/10 hover:border-white/30 transition-all"
              data-testid="button-select-all"
            >
              <CheckSquare className="w-4 h-4 mr-2" />
              Select All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                console.log('Deselect all clicked');
                onDeselectAll?.();
              }}
              className="rounded-xl border-white/20 hover:bg-white/10 hover:border-white/30 transition-all"
              data-testid="button-deselect-all"
            >
              <XSquare className="w-4 h-4 mr-2" />
              Deselect All
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground/90 font-semibold">
              {selectedCount} of {totalCount} selected
            </span>
            {isProcessing ? (
              <Button
                variant="destructive"
                onClick={() => {
                  console.log('Stop processing clicked');
                  onStopProcessing?.();
                }}
                className="rounded-xl shadow-lg shadow-destructive/30"
                data-testid="button-stop-processing"
              >
                <Square className="w-4 h-4 mr-2" />
                Stop Processing
              </Button>
            ) : (
              <Button
                variant="default"
                onClick={() => {
                  console.log('Start processing clicked');
                  onStartProcessing?.();
                }}
                disabled={selectedCount === 0}
                className="rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-lg shadow-primary/40 disabled:opacity-50 disabled:shadow-none transition-all"
                data-testid="button-start-processing"
              >
                <Play className="w-4 h-4 mr-2" />
                Start Processing
              </Button>
            )}
          </div>
        </div>

        {isProcessing && (
          <div className="space-y-2 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground/80 font-medium">Processing Progress</span>
              <span className="font-mono font-semibold text-primary">
                {processedCount} / {totalCount}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2.5" />
          </div>
        )}
      </div>
    </GlassCard>
  );
}
