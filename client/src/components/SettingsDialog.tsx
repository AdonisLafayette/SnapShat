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
import { Settings as SettingsIcon, Trash2 } from "lucide-react";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username?: string;
  email?: string;
  phone?: string;
  onSave?: (settings: { username: string; email: string; phone: string }) => void;
  onClearCookies?: () => void;
}

export default function SettingsDialog({
  open,
  onOpenChange,
  username: initialUsername = "",
  email: initialEmail = "",
  phone: initialPhone = "",
  onSave,
  onClearCookies,
}: SettingsDialogProps) {
  const [username, setUsername] = useState(initialUsername);
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState(initialPhone);

  const handleSave = () => {
    console.log('Saving settings:', { username, email, phone });
    onSave?.({ username, email, phone });
    onOpenChange(false);
  };

  const handleClearCookies = () => {
    console.log('Clearing cookies');
    onClearCookies?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card/95 backdrop-blur-3xl border-card-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5" />
            Settings
          </DialogTitle>
          <DialogDescription>
            Configure your Snapchat account details and application preferences.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="settings-username">Snapchat Username</Label>
            <Input
              id="settings-username"
              placeholder="your_username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-background/50 border-border/50 rounded-xl"
              data-testid="input-settings-username"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="settings-email">Email</Label>
            <Input
              id="settings-email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-background/50 border-border/50 rounded-xl"
              data-testid="input-settings-email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="settings-phone">Phone Number</Label>
            <Input
              id="settings-phone"
              type="tel"
              placeholder="+1 234 567 8900"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="bg-background/50 border-border/50 rounded-xl"
              data-testid="input-settings-phone"
            />
          </div>

          <div className="pt-4 border-t border-border/50">
            <Button
              variant="outline"
              onClick={handleClearCookies}
              className="w-full rounded-xl text-destructive hover:text-destructive"
              data-testid="button-clear-cookies"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Saved Cookies
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              This will require you to solve captcha again on the next submission.
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl"
            data-testid="button-cancel-settings"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="rounded-xl"
            data-testid="button-save-settings"
          >
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
