import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Monitor, AlertCircle } from "lucide-react";

declare global {
  interface Window {
    RFB: any;
  }
}

interface BrowserViewProps {
  isActive: boolean;
  currentFriend?: { id: string; username: string } | null;
}

export default function BrowserView({ isActive, currentFriend }: BrowserViewProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vncUrl, setVncUrl] = useState<string | null>(null);
  const [noVNCReady, setNoVNCReady] = useState(false);
  const vncContainerRef = useRef<HTMLDivElement>(null);
  const rfbRef = useRef<any>(null);

  // Load noVNC from local vendored bundle
  useEffect(() => {
    if (typeof window.RFB !== 'undefined') {
      console.log('[noVNC] Library already loaded');
      setNoVNCReady(true);
      return;
    }

    // Load locally vendored noVNC UMD bundle
    const script = document.createElement('script');
    script.src = '/novnc/rfb.js';
    script.type = 'text/javascript';
    
    script.onload = () => {
      console.log('[noVNC] Library loaded from local bundle');
      if (typeof window.RFB !== 'undefined') {
        console.log('[noVNC] RFB class is available');
        setNoVNCReady(true);
      } else {
        console.error('[noVNC] RFB class not available after load');
        setError('VNC library loaded but RFB class not available');
      }
    };
    
    script.onerror = () => {
      console.error('[noVNC] Failed to load local bundle');
      setError('Failed to load VNC client library. Please refresh the page.');
    };
    
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // Fetch VNC URL when automation starts
  useEffect(() => {
    if (!isActive) {
      return;
    }

    const fetchVncUrl = async () => {
      try {
        const response = await fetch('/api/process/vnc-url');
        if (response.ok) {
          const data = await response.json();
          setVncUrl(data.url);
        } else {
          setError('VNC server not available yet...');
          // Retry after 2 seconds
          setTimeout(fetchVncUrl, 2000);
        }
      } catch (err) {
        console.error('Error fetching VNC URL:', err);
        setError('Failed to connect to browser');
      }
    };

    fetchVncUrl();
  }, [isActive]);

  // Initialize noVNC when URL is available
  useEffect(() => {
    if (!vncUrl || !vncContainerRef.current || !isActive || !noVNCReady || !window.RFB) {
      return;
    }

    try {
      // Clear any existing connection
      if (rfbRef.current) {
        rfbRef.current.disconnect();
        rfbRef.current = null;
      }

      // Clear container
      vncContainerRef.current.innerHTML = '';

      // Connect to noVNC - it creates its own canvas elements
      const rfb = new window.RFB(vncContainerRef.current, vncUrl, {
        credentials: {}
      });

      // Set up event handlers
      rfb.addEventListener('connect', () => {
        console.log('[noVNC] Connected');
        setIsConnected(true);
        setError(null);
      });

      rfb.addEventListener('disconnect', (e: any) => {
        console.log('[noVNC] Disconnected:', e.detail.clean ? 'clean' : 'unclean');
        setIsConnected(false);
        if (!e.detail.clean) {
          setError('Connection lost');
        }
      });

      rfb.addEventListener('credentialsrequired', () => {
        console.log('[noVNC] Credentials required');
        setError('Authentication required');
      });

      rfb.addEventListener('securityfailure', (e: any) => {
        console.error('[noVNC] Security failure:', e.detail);
        setError('Security failure');
      });

      // Configure RFB
      rfb.scaleViewport = true;
      rfb.resizeSession = false;
      rfb.showDotCursor = true;
      rfb.viewOnly = false; // Allow interaction

      rfbRef.current = rfb;

    } catch (err: any) {
      console.error('[noVNC] Error initializing:', err);
      setError(err.message || 'Failed to initialize VNC');
    }

    return () => {
      if (rfbRef.current) {
        rfbRef.current.disconnect();
        rfbRef.current = null;
      }
    };
  }, [vncUrl, isActive, noVNCReady]);

  // Cleanup on unmount or when inactive
  useEffect(() => {
    if (!isActive) {
      setIsConnected(false);
      setError(null);
      setVncUrl(null);
      if (rfbRef.current) {
        rfbRef.current.disconnect();
        rfbRef.current = null;
      }
    }
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
            Interactive Browser View
          </span>
          {isActive && (
            <span className="flex items-center gap-2 text-sm font-normal text-blue-400">
              {isConnected ? (
                <>
                  <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                  Live - Processing {currentFriend.username}
                </>
              ) : (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Connecting...
                </>
              )}
            </span>
          )}
        </CardTitle>
        <CardDescription>
          Click directly in the browser to solve CAPTCHAs. The automation will pause when CAPTCHA appears and resume automatically after you solve it.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border border-white/10 rounded-lg overflow-hidden bg-black aspect-video">
          {error ? (
            <div className="flex items-center justify-center h-full min-h-[400px] p-8 text-center">
              <div className="space-y-2">
                <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto" />
                <p className="text-gray-400">{error}</p>
                <p className="text-sm text-gray-500">Waiting for VNC server to start...</p>
              </div>
            </div>
          ) : !vncUrl ? (
            <div className="flex items-center justify-center h-full min-h-[400px] p-8 text-center">
              <div className="space-y-2">
                <Loader2 className="h-8 w-8 animate-spin text-blue-400 mx-auto" />
                <p className="text-gray-400">Starting browser...</p>
              </div>
            </div>
          ) : (
            <div 
              ref={vncContainerRef} 
              className="w-full h-full min-h-[400px]"
              data-testid="vnc-container"
            />
          )}
        </div>

        <div className="text-sm text-gray-400 bg-black/20 p-3 rounded-lg border border-white/5">
          <p className="font-semibold mb-1 flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            How to use:
          </p>
          <ul className="space-y-1 text-xs">
            <li>• <strong>Click directly:</strong> You can click and type in the browser above to solve CAPTCHAs</li>
            <li>• <strong>Automation pauses:</strong> When CAPTCHA appears, automation waits for you to solve it</li>
            <li>• <strong>Auto-resume:</strong> After solving CAPTCHA, automation continues automatically</li>
            <li>• <strong>Full control:</strong> This is a real browser - interact with it like any website</li>
          </ul>
        </div>

        {isConnected && (
          <div className="text-xs text-center text-green-400 flex items-center justify-center gap-2">
            <span className="h-2 w-2 bg-green-500 rounded-full" />
            Connected - Browser is ready for interaction
          </div>
        )}
      </CardContent>
    </Card>
  );
}
