import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Monitor, AlertCircle, ExternalLink, RefreshCw } from "lucide-react";

interface BrowserViewProps {
  isActive: boolean;
  currentFriend?: { id: string; username: string } | null;
}

export default function BrowserView({ isActive, currentFriend }: BrowserViewProps) {
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Fetch screenshot when automation is active
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
          setError(null);
          setLastUpdate(new Date());
        } else {
          setError('Browser not ready yet...');
        }
      } catch (err) {
        console.error('Error fetching screenshot:', err);
        setError('Failed to get browser view');
      }
    };

    // Initial fetch
    fetchScreenshot();

    // Poll for screenshots every 2 seconds
    const interval = setInterval(fetchScreenshot, 2000);

    return () => clearInterval(interval);
  }, [isActive]);

  const handleOpenCaptcha = () => {
    const snapchatUrl = 'https://help.snapchat.com/hc/en-us/requests/new?co=true&ticket_form_id=149423';
    window.open(snapchatUrl, '_blank', 'width=1200,height=800');
  };

  const handleRefresh = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/process/screenshot');
      if (response.ok) {
        const data = await response.json();
        setScreenshot(data.screenshot);
        setError(null);
        setLastUpdate(new Date());
      }
    } catch (err) {
      console.error('Error refreshing screenshot:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isActive || !currentFriend) {
    return null;
  }

  return (
    <Card className="bg-white/5 backdrop-blur-md border-white/10" data-testid="browser-view-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Browser View
          </span>
          {isActive && (
            <span className="flex items-center gap-2 text-sm font-normal text-blue-400">
              <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              Live - Processing {currentFriend.username}
            </span>
          )}
        </CardTitle>
        <CardDescription>
          The automation is working on Snapchat's website. If CAPTCHA appears, click the button below to solve it manually.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border border-white/10 rounded-lg overflow-hidden bg-black">
          {error ? (
            <div className="flex items-center justify-center h-full min-h-[400px] p-8 text-center">
              <div className="space-y-2">
                <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto" />
                <p className="text-gray-400">{error}</p>
                {error.includes('not ready') && (
                  <p className="text-sm text-gray-500">The browser is starting up...</p>
                )}
              </div>
            </div>
          ) : !screenshot ? (
            <div className="flex items-center justify-center h-full min-h-[400px] p-8 text-center">
              <div className="space-y-2">
                <Loader2 className="h-8 w-8 animate-spin text-blue-400 mx-auto" />
                <p className="text-gray-400">Loading browser view...</p>
              </div>
            </div>
          ) : (
            <div className="relative">
              <img 
                src={screenshot} 
                alt="Browser screenshot"
                className="w-full h-auto"
                data-testid="browser-screenshot"
              />
              <div className="absolute top-2 right-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="bg-black/50 hover:bg-black/70"
                  data-testid="button-refresh-screenshot"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
            <p className="text-sm text-yellow-200 font-semibold mb-2">🤖 CAPTCHA Detected - Action Required!</p>
            <p className="text-xs text-gray-300 mb-3">
              The automation has detected a CAPTCHA and is waiting for you to solve it. Click the button below to open the page in a popup window.
            </p>
            <Button
              onClick={handleOpenCaptcha}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
              data-testid="button-solve-captcha"
            >
              <ExternalLink className="h-5 w-5 mr-2" />
              Open CAPTCHA Page to Solve
            </Button>
          </div>
        </div>

        <div className="text-sm text-gray-400 bg-black/20 p-3 rounded-lg border border-white/5">
          <p className="font-semibold mb-1 flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            How it works:
          </p>
          <ul className="space-y-1 text-xs">
            <li>• <strong>Automation:</strong> The bot fills forms automatically in the background</li>
            <li>• <strong>CAPTCHA appears:</strong> Click "Open Page to Solve CAPTCHA" button above</li>
            <li>• <strong>Solve manually:</strong> Complete the CAPTCHA in the popup window</li>
            <li>• <strong>Auto-resume:</strong> Once solved, close the popup and automation continues</li>
            <li>• <strong>Live view:</strong> The screenshot updates every 2 seconds</li>
          </ul>
        </div>

        {screenshot && (
          <div className="text-xs text-center text-gray-500 flex items-center justify-center gap-2">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
