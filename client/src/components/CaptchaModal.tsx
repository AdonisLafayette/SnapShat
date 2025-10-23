import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Loader2 } from "lucide-react";

interface CaptchaModalProps {
  open: boolean;
  friendUsername?: string;
  onCancel?: () => void;
}

export default function CaptchaModal({ open, friendUsername, onCancel }: CaptchaModalProps) {
  return (
    <Dialog open={open} onOpenChange={() => onCancel?.()}>
      <DialogContent className="sm:max-w-4xl bg-card/95 backdrop-blur-3xl border-card-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            CAPTCHA Required
          </DialogTitle>
          <DialogDescription>
            A CAPTCHA has been detected {friendUsername && `while processing ${friendUsername}`}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="min-h-[400px] bg-background/50 rounded-xl border border-border/50 p-8">
            <div className="text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto">
                <ShieldAlert className="w-8 h-8 text-amber-400" />
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-semibold">Browser Window Open</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  The automation has opened a browser window where you can see the Snapchat support page.
                  Please solve the CAPTCHA in that window to continue.
                </p>
                <div className="space-y-2 text-xs text-muted-foreground pt-4">
                  <p className="font-medium text-foreground">Instructions:</p>
                  <ol className="list-decimal list-inside space-y-1 text-left max-w-md mx-auto">
                    <li>Look for the browser window that opened automatically</li>
                    <li>Complete the CAPTCHA challenge on the page</li>
                    <li>The automation will automatically detect when solved</li>
                    <li>Processing will resume automatically</li>
                  </ol>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center pt-4">
                <Loader2 className="w-3 h-3 animate-spin" />
                Waiting for CAPTCHA to be solved...
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <p className="text-xs text-muted-foreground">
            The browser window will close automatically after completion
          </p>
          <Button
            variant="outline"
            onClick={() => {
              console.log('Captcha cancelled');
              onCancel?.();
            }}
            className="rounded-xl"
            data-testid="button-cancel-captcha"
          >
            Cancel Processing
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
