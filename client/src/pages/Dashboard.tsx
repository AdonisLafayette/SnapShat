import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useWebSocket } from "@/hooks/useWebSocket";
import AppHeader from "@/components/AppHeader";
import BatchControls from "@/components/BatchControls";
import FriendCard from "@/components/FriendCard";
import ActivityLogPanel from "@/components/ActivityLogPanel";
import AddFriendDialog from "@/components/AddFriendDialog";
import SettingsDialog from "@/components/SettingsDialog";
import CaptchaModal from "@/components/CaptchaModal";
import EmptyState from "@/components/EmptyState";
import SearchBar from "@/components/SearchBar";
import BrowserView from "@/components/BrowserView";
import { Button } from "@/components/ui/button";
import { UserPlus, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Friend, Submission, Settings, SubmissionStatus } from "@shared/schema";

interface LogEntry {
  id: string;
  timestamp: Date;
  friendUsername: string;
  action: string;
  status: 'info' | 'success' | 'error' | 'warning';
}

export default function Dashboard() {
  const { toast } = useToast();
  const { setMessageHandler } = useWebSocket('/ws');
  
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [addFriendOpen, setAddFriendOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [captchaOpen, setCaptchaOpen] = useState(false);
  const [captchaFriend, setCaptchaFriend] = useState<string>();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [friendStatuses, setFriendStatuses] = useState<Record<string, SubmissionStatus>>({});
  
  // Use refs to avoid dependency issues in WebSocket effect
  const friendsMapRef = useRef<Map<string, Friend>>(new Map());
  const toastRef = useRef(toast);
  
  // Keep toast ref updated
  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  // Fetch friends
  const { data: friends = [], isLoading: friendsLoading } = useQuery<Friend[]>({
    queryKey: ['/api/friends'],
  });

  // Fetch submissions
  const { data: submissions = [] } = useQuery<Submission[]>({
    queryKey: ['/api/submissions'],
  });

  // Fetch settings
  const { data: settings } = useQuery<Settings | null>({
    queryKey: ['/api/settings'],
  });

  // Fetch process status
  const { data: processStatus } = useQuery<{ isProcessing: boolean; currentFriend: { id: string; username: string } | null }>({
    queryKey: ['/api/process/status'],
    refetchInterval: 1000, // Always poll to stay in sync with server
  });

  // Sync local isProcessing state with server
  useEffect(() => {
    if (processStatus) {
      setIsProcessing(processStatus.isProcessing);
    }
  }, [processStatus]);

  // Update friends map when friends change
  useEffect(() => {
    const newMap = new Map<string, Friend>();
    friends.forEach(friend => {
      newMap.set(friend.id, friend);
    });
    friendsMapRef.current = newMap;
  }, [friends]);

  // Update friend statuses when submissions change
  useEffect(() => {
    const statusMap: Record<string, SubmissionStatus> = {};
    submissions.forEach(sub => {
      statusMap[sub.friendId] = sub.status as SubmissionStatus;
    });
    setFriendStatuses(statusMap);
  }, [submissions]);

  // Set up WebSocket message handler
  useEffect(() => {
    const addLogEntry = (entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
      setLogs(prev => [
        {
          ...entry,
          id: `${Date.now()}-${Math.random()}`,
          timestamp: new Date(),
        },
        ...prev,
      ].slice(0, 100));
    };

    setMessageHandler((message) => {
      const { type, data } = message;

      switch (type) {
        case 'status_update':
          setFriendStatuses(prev => ({
            ...prev,
            [data.friendId]: data.status,
          }));
          
          // Look up friend name from ref to avoid dependency on friends array
          const friend = friendsMapRef.current.get(data.friendId);
          if (friend) {
            addLogEntry({
              friendUsername: friend.username,
              action: data.message,
              status: data.status === 'failed' ? 'error' : 
                     data.status === 'captcha' ? 'warning' :
                     data.status === 'success' ? 'success' : 'info',
            });

            if (data.status === 'captcha') {
              setCaptchaFriend(friend.username);
              setCaptchaOpen(true);
            }
          }
          break;

        case 'friend_added':
        case 'friends_imported':
          queryClient.invalidateQueries({ queryKey: ['/api/friends'] });
          break;

        case 'processing_stopped':
          setIsProcessing(false);
          addLogEntry({
            friendUsername: 'System',
            action: 'Batch processing stopped',
            status: 'warning',
          });
          break;

        case 'processing_error':
          setIsProcessing(false);
          toastRef.current({
            title: "Processing Error",
            description: data.error,
            variant: "destructive",
          });
          break;
      }
    });
  }, [setMessageHandler]);

  const filteredFriends = useMemo(() => {
    if (!searchQuery.trim()) return friends;
    const query = searchQuery.toLowerCase();
    return friends.filter(f => f.username.toLowerCase().includes(query));
  }, [friends, searchQuery]);

  const processedCount = useMemo(() => {
    return Object.values(friendStatuses).filter(s => s === 'success' || s === 'failed').length;
  }, [friendStatuses]);

  const addLog = (entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
    setLogs(prev => [
      {
        ...entry,
        id: `${Date.now()}-${Math.random()}`,
        timestamp: new Date(),
      },
      ...prev,
    ].slice(0, 100));
  };

  // Mutations
  const addFriendMutation = useMutation({
    mutationFn: async (username: string) => {
      const res = await apiRequest('POST', '/api/friends', { username, profilePictureUrl: null });
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/friends'] });
      toast({
        title: "Friend Added",
        description: `${data.username} has been added to your list.`,
      });
      addLog({
        friendUsername: data.username,
        action: 'Friend added to list',
        status: 'info',
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add friend",
        variant: "destructive",
      });
    },
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: { username: string; email: string; phone: string }) => {
      const res = await apiRequest('POST', '/api/settings', newSettings);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({
        title: "Settings Saved",
        description: "Your account settings have been updated.",
      });
      addLog({
        friendUsername: 'System',
        action: 'Settings updated',
        status: 'success',
      });
    },
  });

  const clearCookiesMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('DELETE', '/api/cookies');
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Cookies Cleared",
        description: "You will need to solve CAPTCHA on the next submission.",
      });
      addLog({
        friendUsername: 'System',
        action: 'Cookies cleared - CAPTCHA will be required',
        status: 'warning',
      });
    },
  });

  const startProcessingMutation = useMutation({
    mutationFn: async (friendIds: string[]) => {
      const res = await apiRequest('POST', '/api/process/start', { friendIds });
      return await res.json();
    },
    onSuccess: () => {
      setIsProcessing(true);
      toast({
        title: "Processing Started",
        description: `Starting batch restoration for ${selectedFriends.size} friends.`,
      });
      addLog({
        friendUsername: 'System',
        action: `Batch processing started for ${selectedFriends.size} friends`,
        status: 'info',
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start processing",
        variant: "destructive",
      });
    },
  });

  const stopProcessingMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/process/stop');
      return await res.json();
    },
    onSuccess: () => {
      setIsProcessing(false);
    },
  });

  const importFriendsMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/friends/import', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Import failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/friends'] });
      toast({
        title: "Import Complete",
        description: `Successfully imported ${data.imported} friends.`,
      });
      addLog({
        friendUsername: 'System',
        action: `Imported ${data.imported} friends from file`,
        status: 'success',
      });
    },
    onError: () => {
      toast({
        title: "Import Failed",
        description: "Failed to import friends from file",
        variant: "destructive",
      });
    },
  });

  const handleToggleFriend = (friendId: string, checked: boolean) => {
    const newSelected = new Set(selectedFriends);
    if (checked) {
      newSelected.add(friendId);
    } else {
      newSelected.delete(friendId);
    }
    setSelectedFriends(newSelected);
  };

  const handleSelectAll = () => {
    setSelectedFriends(new Set(filteredFriends.map(f => f.id)));
  };

  const handleDeselectAll = () => {
    setSelectedFriends(new Set());
  };

  const handleStartProcessing = () => {
    if (!settings) {
      toast({
        title: "Settings Required",
        description: "Please configure your account settings before processing.",
        variant: "destructive",
      });
      setSettingsOpen(true);
      return;
    }

    startProcessingMutation.mutate(Array.from(selectedFriends));
  };

  const handleStopProcessing = () => {
    stopProcessingMutation.mutate();
  };

  const handleAddFriend = (username: string) => {
    addFriendMutation.mutate(username);
  };

  const handleSaveSettings = (newSettings: { username: string; email: string; phone: string }) => {
    saveSettingsMutation.mutate(newSettings);
  };

  const handleClearCookies = () => {
    clearCookiesMutation.mutate();
  };

  const handleImportClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        importFriendsMutation.mutate(file);
      }
    };
    input.click();
  };

  if (friendsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader onOpenSettings={() => setSettingsOpen(true)} />
      
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {friends.length === 0 ? (
            <EmptyState onAddFriend={() => setAddFriendOpen(true)} />
          ) : (
            <>
              <BatchControls
                selectedCount={selectedFriends.size}
                totalCount={friends.length}
                isProcessing={isProcessing}
                processedCount={processedCount}
                onSelectAll={handleSelectAll}
                onDeselectAll={handleDeselectAll}
                onStartProcessing={handleStartProcessing}
                onStopProcessing={handleStopProcessing}
              />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {/* Browser View when processing */}
                  {processStatus?.isProcessing && processStatus?.currentFriend && (
                    <BrowserView 
                      isActive={processStatus.isProcessing} 
                      currentFriend={processStatus.currentFriend}
                    />
                  )}

                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <SearchBar
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder="Search friends..."
                      />
                    </div>
                    <Button
                      onClick={() => setAddFriendOpen(true)}
                      className="rounded-xl"
                      data-testid="button-add-friend"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Friend
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleImportClick}
                      disabled={importFriendsMutation.isPending}
                      className="rounded-xl"
                      data-testid="button-import-friends"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Import
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredFriends.map(friend => (
                      <FriendCard
                        key={friend.id}
                        friend={friend}
                        status={friendStatuses[friend.id] || 'pending'}
                        selected={selectedFriends.has(friend.id)}
                        onToggle={handleToggleFriend}
                      />
                    ))}
                  </div>

                  {filteredFriends.length === 0 && searchQuery && (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>No friends found matching "{searchQuery}"</p>
                    </div>
                  )}
                </div>

                <div className="lg:col-span-1">
                  <ActivityLogPanel logs={logs} />
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      <AddFriendDialog
        open={addFriendOpen}
        onOpenChange={setAddFriendOpen}
        onAdd={handleAddFriend}
      />

      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        username={settings?.username || ''}
        email={settings?.email || ''}
        phone={settings?.phone || ''}
        onSave={handleSaveSettings}
        onClearCookies={handleClearCookies}
      />

      <CaptchaModal
        open={captchaOpen}
        friendUsername={captchaFriend}
        onCancel={() => {
          setCaptchaOpen(false);
        }}
      />
    </div>
  );
}
