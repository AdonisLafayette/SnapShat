import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import GlassCard from "./GlassCard";

interface EmptyStateProps {
  onAddFriend?: () => void;
}

export default function EmptyState({ onAddFriend }: EmptyStateProps) {
  return (
    <GlassCard className="py-16">
      <div className="text-center space-y-6 max-w-md mx-auto">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <UserPlus className="w-10 h-10 text-primary" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">No Friends Added Yet</h3>
          <p className="text-sm text-muted-foreground">
            Get started by adding friends whose streaks you want to restore.
            You can add them one by one or import from a file.
          </p>
        </div>
        
        <Button
          onClick={() => {
            console.log('Add first friend clicked');
            onAddFriend?.();
          }}
          className="rounded-xl"
          data-testid="button-add-first-friend"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Add Your First Friend
        </Button>
      </div>
    </GlassCard>
  );
}
