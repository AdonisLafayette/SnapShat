import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Monitor, ExternalLink, Activity } from "lucide-react";

interface BrowserViewProps {
  isActive: boolean;
  currentFriend?: { id: string; username: string } | null;
}

export default function BrowserView({ isActive, currentFriend }: BrowserViewProps) {
  const [isCaptchaDetected, setIsCaptchaDetected] = useState(false);

  // Poll for CAPTCHA status
  useEffect(() => {
    if (!isActive) {
      setIsCaptchaDetected(false);
      return;
    }

    const checkStatus = async () => {
      try {
        // Add timestamp to bypass all caching (browser + server ETag)
        const timestamp = Date.now();
        const response = await fetch(`/api/process/status?_=${timestamp}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        const data = await response.json();
        setIsCaptchaDetected(data.isCaptchaDetected || false);
      } catch (err) {
        console.error('Error fetching status:', err);
      }
    };

    // Initial check
    checkStatus();

    // Poll every 2 seconds
    const interval = setInterval(checkStatus, 2000);

    return () => clearInterval(interval);
  }, [isActive]);

  const handleOpenVNC = () => {
    // Open VNC viewer in a popup window
    const width = 1280;
    const height = 800;
    const left = (screen.width - width) / 2;
    const top = (screen.height - height) / 2;
    
    window.open(
      '/vnc.html',
      'vnc-viewer',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
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
            Live Browser Status
          </span>
          <span className="flex items-center gap-2 text-sm font-normal text-blue-400">
            <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
            Processing {currentFriend.username}
          </span>
        </CardTitle>
        <CardDescription>
          The automation is working in the background. If CAPTCHA is detected, you'll be prompted to solve it.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isCaptchaDetected ? (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <Activity className="h-5 w-5 text-yellow-400 animate-pulse" />
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-yellow-200 mb-1">
                    🤖 CAPTCHA Detected - Action Required!
                  </h3>
                  <p className="text-xs text-gray-300">
                    The automation has encountered a CAPTCHA challenge. Click the button below to open the live browser view and solve it.
                  </p>
                </div>
                <Button
                  onClick={handleOpenVNC}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                  size="lg"
                  data-testid="button-open-vnc"
                >
                  <ExternalLink className="h-5 w-5 mr-2" />
                  Open Live Browser View
                </Button>
                <p className="text-xs text-gray-400 text-center">
                  A popup window will open with real-time browser access
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Monitor className="h-5 w-5 text-blue-400" />
              <div>
                <h3 className="text-sm font-semibold text-blue-200 mb-1">
                  Automation Running Smoothly
                </h3>
                <p className="text-xs text-gray-300">
                  The bot is currently filling out the form. No action needed right now.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="text-sm text-gray-400 bg-black/20 p-3 rounded-lg border border-white/5">
          <p className="font-semibold mb-2 flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            How it works:
          </p>
          <ul className="space-y-1.5 text-xs">
            <li>✨ <strong>Automatic:</strong> The bot fills forms automatically in the background</li>
            <li>🔍 <strong>CAPTCHA Detection:</strong> When CAPTCHA appears, you'll see an alert above</li>
            <li>🖱️ <strong>Live Browser:</strong> Click "Open Live Browser View" for real-time interaction</li>
            <li>✅ <strong>Auto-Resume:</strong> Once you solve the CAPTCHA, automation continues automatically</li>
            <li>🍪 <strong>Smart Cookies:</strong> Your session is saved to minimize future CAPTCHAs</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
