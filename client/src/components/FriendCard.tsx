import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import StatusBadge from "./StatusBadge";
import GlassCard from "./GlassCard";
import { cn } from "@/lib/utils";
import type { Friend, SubmissionStatus } from "@shared/schema";

interface FriendCardProps {
  friend: Friend;
  status?: SubmissionStatus;
  selected?: boolean;
  onToggle?: (friendId: string, checked: boolean) => void;
}

export default function FriendCard({ friend, status = 'pending', selected = false, onToggle }: FriendCardProps) {
  const handleCheckChange = (checked: boolean) => {
    onToggle?.(friend.id, checked);
    console.log(`Friend ${friend.username} ${checked ? 'selected' : 'deselected'}`);
  };

  const initials = friend.username
    .split(/[._-]/)
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <GlassCard className={cn(
      "relative transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.2)]",
      selected && "ring-2 ring-primary/60 shadow-[0_0_0_2px_rgba(59,130,246,0.3),0_12px_40px_rgba(0,0,0,0.3)]"
    )}>
      <div className="flex items-start gap-4">
        <Avatar className="w-14 h-14 ring-2 ring-white/20 shadow-lg">
          <AvatarImage src={friend.profilePictureUrl || undefined} alt={friend.username} />
          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold text-base">
            {initials}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-2">
            <h3 className="text-base font-semibold truncate text-foreground/95">{friend.username}</h3>
            <Checkbox
              checked={selected}
              onCheckedChange={handleCheckChange}
              className="w-5 h-5 rounded-lg data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-all"
              data-testid={`checkbox-friend-${friend.id}`}
            />
          </div>
          
          <StatusBadge status={status} />
        </div>
      </div>
    </GlassCard>
  );
}
