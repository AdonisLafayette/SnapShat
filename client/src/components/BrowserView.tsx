import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Send, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BrowserViewProps {
  isActive: boolean;
  currentFriend?: { id: string; username: string } | null;
}

export default function BrowserView({ isActive, currentFriend }: BrowserViewProps) {
  const { toast } = useToast();
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Fetch screenshot periodically when active
  useEffect(() => {
    if (!isActive) {
      setScreenshot(null);
      return;
    }

    const fetchScreenshot = async () => {
      try {
        const response = await fetch('/api/process/screenshot');
        if (response.ok) {
          const data = await response.json();
          setScreenshot(data.screenshot);
          setLastUpdate(new Date());
        }
      } catch (error) {
        console.error('Error fetching screenshot:', error);
      }
    };

    // Initial fetch
    fetchScreenshot();

    // Fetch every 2 seconds while active
    const interval = setInterval(fetchScreenshot, 2000);

    return () => clearInterval(interval);
  }, [isActive]);

  const refreshMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/process/manual-refresh');
      return await res.json();
    },
    onSuccess: (data: { success: boolean }) => {
      if (data.success) {
        toast({
          title: "Page refreshed",
          description: "The browser page has been reloaded",
        });
      } else {
        toast({
          title: "Refresh failed",
          description: "Could not refresh the page",
          variant: "destructive",
        });
      }
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/process/manual-submit');
      return await res.json();
    },
    onSuccess: (data: { success: boolean }) => {
      if (data.success) {
        toast({
          title: "Form submitted",
          description: "The submit button was clicked successfully",
        });
      } else {
        toast({
          title: "Submit failed",
          description: "Could not find or click the submit button",
          variant: "destructive",
        });
      }
    },
  });

  if (!isActive || !currentFriend) {
    return null;
  }

  return (
    <Card className="bg-white/5 backdrop-blur-md border-white/10" data-testid="browser-view-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Live Browser View</span>
          {isActive && (
            <span className="flex items-center gap-2 text-sm font-normal text-blue-400">
              <Loader2 className="h-3 w-3 animate-spin" />
              Processing {currentFriend.username}
            </span>
          )}
        </CardTitle>
        <CardDescription>
          Watch the automation in real-time. If it gets stuck on CAPTCHA or can't submit, use the manual controls below.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {screenshot ? (
          <div className="border border-white/10 rounded-lg overflow-hidden bg-black">
            <img
              src={screenshot}
              alt="Browser screenshot"
              className="w-full h-auto"
              data-testid="browser-screenshot"
            />
            <div className="p-2 bg-black/50 text-xs text-gray-400">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </div>
          </div>
        ) : (
          <div className="border border-white/10 rounded-lg p-8 text-center text-gray-400">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p>Loading browser view...</p>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={() => refreshMutation.mutate()}
            disabled={refreshMutation.isPending}
            variant="outline"
            className="flex-1"
            data-testid="button-refresh-page"
          >
            {refreshMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh Page
          </Button>
          <Button
            onClick={() => submitMutation.mutate()}
            disabled={submitMutation.isPending}
            className="flex-1"
            data-testid="button-manual-submit"
          >
            {submitMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Click Submit
          </Button>
        </div>

        <div className="text-sm text-gray-400 bg-black/20 p-3 rounded-lg border border-white/5">
          <p className="font-semibold mb-1">Manual Controls:</p>
          <ul className="space-y-1 text-xs">
            <li>• <strong>Refresh Page:</strong> Reload the browser if it's stuck or you solved CAPTCHA</li>
            <li>• <strong>Click Submit:</strong> Manually trigger the submit button if automation can't find it</li>
            <li>• The browser window is open on the server - solve CAPTCHA there if needed</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
