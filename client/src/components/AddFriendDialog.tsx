import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus } from "lucide-react";

interface AddFriendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd?: (username: string) => void;
}

export default function AddFriendDialog({ open, onOpenChange, onAdd }: AddFriendDialogProps) {
  const [username, setUsername] = useState("");

  const handleAdd = () => {
    if (username.trim()) {
      console.log('Adding friend:', username);
      onAdd?.(username.trim());
      setUsername("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-3xl border-card-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Add Friend
          </DialogTitle>
          <DialogDescription>
            Enter the Snapchat username of the friend you want to add to the restoration list.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="username">Snapchat Username</Label>
            <Input
              id="username"
              placeholder="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              className="bg-background/50 border-border/50 rounded-xl"
              data-testid="input-friend-username"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl"
            data-testid="button-cancel-add-friend"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAdd}
            disabled={!username.trim()}
            className="rounded-xl"
            data-testid="button-confirm-add-friend"
          >
            Add Friend
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
