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
            Please solve the CAPTCHA below to continue processing {friendUsername && `for ${friendUsername}`}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="min-h-[500px] bg-background/50 rounded-xl border border-border/50 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <ShieldAlert className="w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Embedded Browser View</p>
                <p className="text-xs text-muted-foreground">
                  The live Snapchat page will be displayed here
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
                <Loader2 className="w-3 h-3 animate-spin" />
                Waiting for CAPTCHA solve...
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
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
