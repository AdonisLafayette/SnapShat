import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import GlassCard from "./GlassCard";

interface EmptyStateProps {
  onAddFriend?: () => void;
}

export default function EmptyState({ onAddFriend }: EmptyStateProps) {
  return (
    <GlassCard className="py-20 shadow-xl">
      <div className="text-center space-y-8 max-w-md mx-auto">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mx-auto shimmer">
          <UserPlus className="w-12 h-12 text-primary" />
        </div>
        
        <div className="space-y-3">
          <h3 className="text-2xl font-bold text-gradient">No Friends Added Yet</h3>
          <p className="text-base text-muted-foreground/80 leading-relaxed">
            Get started by adding friends whose streaks you want to restore.
            You can add them one by one or import from a file.
          </p>
        </div>
        
        <Button
          onClick={() => {
            console.log('Add first friend clicked');
            onAddFriend?.();
          }}
          className="rounded-2xl px-8 py-6 font-semibold text-base shadow-lg hover:shadow-xl transition-all hover:scale-105 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500"
          data-testid="button-add-first-friend"
        >
          <UserPlus className="w-5 h-5 mr-2" />
          Add Your First Friend
        </Button>
      </div>
    </GlassCard>
  );
}
