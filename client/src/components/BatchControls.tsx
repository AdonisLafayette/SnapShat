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
    <GlassCard>
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
              className="rounded-xl"
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
              className="rounded-xl"
              data-testid="button-deselect-all"
            >
              <XSquare className="w-4 h-4 mr-2" />
              Deselect All
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground font-medium">
              {selectedCount} of {totalCount} selected
            </span>
            {isProcessing ? (
              <Button
                variant="destructive"
                onClick={() => {
                  console.log('Stop processing clicked');
                  onStopProcessing?.();
                }}
                className="rounded-xl"
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
                className="rounded-xl bg-primary hover:bg-primary/90"
                data-testid="button-start-processing"
              >
                <Play className="w-4 h-4 mr-2" />
                Start Processing
              </Button>
            )}
          </div>
        </div>

        {isProcessing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-mono font-medium">
                {processedCount} / {totalCount}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        )}
      </div>
    </GlassCard>
  );
}
