import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Monitor, Activity } from "lucide-react";

interface BrowserViewProps {
  isActive: boolean;
  currentFriend?: { id: string; username: string } | null;
}

export default function BrowserView({ isActive, currentFriend }: BrowserViewProps) {
  const [isCaptchaDetected, setIsCaptchaDetected] = useState(false);

  useEffect(() => {
    if (!isActive) {
      setIsCaptchaDetected(false);
      return;
    }

    const checkStatus = async () => {
      try {
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

    checkStatus();
    const interval = setInterval(checkStatus, 2000);

    return () => clearInterval(interval);
  }, [isActive]);

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
                  <p className="text-xs text-gray-300 mb-2">
                    The automation has encountered a CAPTCHA challenge.
                  </p>
                  <div className="bg-yellow-900/30 border border-yellow-600/40 rounded-md p-3">
                    <p className="text-xs text-yellow-100 font-semibold mb-1.5">
                      → Switch to the Chrome window on your desktop
                    </p>
                    <p className="text-xs text-gray-300">
                      A Chrome browser window should be open on your Windows desktop. Click on it to bring it to the front, then solve the CAPTCHA. The automation will automatically resume once you're done!
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 text-center italic">
                  ✨ After solving, your session will be saved to minimize future CAPTCHAs
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
            <li>🖥️ <strong>Native Windows:</strong> Chrome opens directly on your desktop for easy CAPTCHA solving</li>
            <li>✅ <strong>Auto-Resume:</strong> Once you solve the CAPTCHA, automation continues automatically</li>
            <li>🍪 <strong>Smart Cookies:</strong> Your session is saved to minimize future CAPTCHAs</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
