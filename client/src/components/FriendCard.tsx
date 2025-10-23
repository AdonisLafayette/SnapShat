import { useState } from "react";
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
  const [isChecked, setIsChecked] = useState(selected);

  const handleCheckChange = (checked: boolean) => {
    setIsChecked(checked);
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
      "relative transition-all duration-200",
      isChecked && "ring-2 ring-primary/50"
    )}>
      <div className="flex items-start gap-4">
        <Avatar className="w-12 h-12 ring-2 ring-border/50">
          <AvatarImage src={friend.profilePictureUrl || undefined} alt={friend.username} />
          <AvatarFallback className="bg-primary/10 text-primary font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-2">
            <h3 className="text-base font-medium truncate">{friend.username}</h3>
            <Checkbox
              checked={isChecked}
              onCheckedChange={handleCheckChange}
              className="w-5 h-5 rounded-md data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              data-testid={`checkbox-friend-${friend.id}`}
            />
          </div>
          
          <StatusBadge status={status} />
        </div>
      </div>
    </GlassCard>
  );
}
