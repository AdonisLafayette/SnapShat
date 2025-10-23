import { useState, useMemo } from "react";
import AppHeader from "@/components/AppHeader";
import BatchControls from "@/components/BatchControls";
import FriendCard from "@/components/FriendCard";
import ActivityLogPanel from "@/components/ActivityLogPanel";
import AddFriendDialog from "@/components/AddFriendDialog";
import SettingsDialog from "@/components/SettingsDialog";
import CaptchaModal from "@/components/CaptchaModal";
import EmptyState from "@/components/EmptyState";
import SearchBar from "@/components/SearchBar";
import { Button } from "@/components/ui/button";
import { UserPlus, Upload } from "lucide-react";
import type { Friend, SubmissionStatus } from "@shared/schema";

export default function Dashboard() {
  // TODO: remove mock functionality - Replace with real data from API
  const [friends, setFriends] = useState<Friend[]>([
    { id: '1', username: 'suroojnadeem', profilePictureUrl: null, addedAt: new Date() },
    { id: '2', username: 'zaib_khann1', profilePictureUrl: null, addedAt: new Date() },
    { id: '3', username: 'rashaad_007', profilePictureUrl: null, addedAt: new Date() },
    { id: '4', username: 'ar_mujahid22', profilePictureUrl: null, addedAt: new Date() },
    { id: '5', username: 'mehakay2020', profilePictureUrl: null, addedAt: new Date() },
    { id: '6', username: 'menahim_20', profilePictureUrl: null, addedAt: new Date() },
    { id: '7', username: 'sarahgill007', profilePictureUrl: null, addedAt: new Date() },
    { id: '8', username: 'dawoodnadeem28', profilePictureUrl: null, addedAt: new Date() },
  ]);

  // TODO: remove mock functionality
  const [friendStatuses, setFriendStatuses] = useState<Record<string, SubmissionStatus>>({
    '1': 'success',
    '2': 'pending',
    '3': 'running',
    '4': 'pending',
    '5': 'captcha',
    '6': 'failed',
    '7': 'pending',
    '8': 'pending',
  });

  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(3);
  const [searchQuery, setSearchQuery] = useState("");
  const [addFriendOpen, setAddFriendOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [captchaOpen, setCaptchaOpen] = useState(false);
  const [captchaFriend, setCaptchaFriend] = useState<string>();

  // TODO: remove mock functionality
  const [logs, setLogs] = useState([
    {
      id: '1',
      timestamp: new Date(Date.now() - 120000),
      friendUsername: 'suroojnadeem',
      action: 'Form submitted successfully',
      status: 'success' as const,
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 60000),
      friendUsername: 'zaib_khann1',
      action: 'Loaded Snapchat ticket page',
      status: 'info' as const,
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 30000),
      friendUsername: 'rashaad_007',
      action: 'Filling form fields...',
      status: 'info' as const,
    },
    {
      id: '4',
      timestamp: new Date(Date.now() - 10000),
      friendUsername: 'mehakay2020',
      action: 'CAPTCHA detected - pausing workflow',
      status: 'warning' as const,
    },
    {
      id: '5',
      timestamp: new Date(Date.now() - 5000),
      friendUsername: 'menahim_20',
      action: 'Network error - will retry',
      status: 'error' as const,
    },
  ]);

  const [settings, setSettings] = useState({
    username: 'azal.daniel',
    email: 'arabicphysicist@gmail.com',
    phone: '+92 306 407 8867',
  });

  const filteredFriends = useMemo(() => {
    if (!searchQuery.trim()) return friends;
    const query = searchQuery.toLowerCase();
    return friends.filter(f => f.username.toLowerCase().includes(query));
  }, [friends, searchQuery]);

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
    console.log('Starting batch processing for:', Array.from(selectedFriends));
    setIsProcessing(true);
    // TODO: remove mock functionality - Start real automation
    setTimeout(() => {
      setCaptchaFriend('mehakay2020');
      setCaptchaOpen(true);
    }, 2000);
  };

  const handleStopProcessing = () => {
    console.log('Stopping batch processing');
    setIsProcessing(false);
  };

  const handleAddFriend = (username: string) => {
    console.log('Adding new friend:', username);
    // TODO: remove mock functionality - Add via API
    const newFriend: Friend = {
      id: String(friends.length + 1),
      username,
      profilePictureUrl: null,
      addedAt: new Date(),
    };
    setFriends([...friends, newFriend]);
    setFriendStatuses({ ...friendStatuses, [newFriend.id]: 'pending' });
    
    setLogs([
      {
        id: String(logs.length + 1),
        timestamp: new Date(),
        friendUsername: username,
        action: 'Friend added to list',
        status: 'info',
      },
      ...logs,
    ]);
  };

  const handleSaveSettings = (newSettings: typeof settings) => {
    console.log('Saving settings:', newSettings);
    setSettings(newSettings);
    setLogs([
      {
        id: String(logs.length + 1),
        timestamp: new Date(),
        friendUsername: 'System',
        action: 'Settings updated',
        status: 'success',
      },
      ...logs,
    ]);
  };

  const handleClearCookies = () => {
    console.log('Clearing cookies');
    setLogs([
      {
        id: String(logs.length + 1),
        timestamp: new Date(),
        friendUsername: 'System',
        action: 'Cookies cleared - captcha will be required',
        status: 'warning',
      },
      ...logs,
    ]);
  };

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
                        status={friendStatuses[friend.id]}
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
        username={settings.username}
        email={settings.email}
        phone={settings.phone}
        onSave={handleSaveSettings}
        onClearCookies={handleClearCookies}
      />

      <CaptchaModal
        open={captchaOpen}
        friendUsername={captchaFriend}
        onCancel={() => {
          setCaptchaOpen(false);
          setIsProcessing(false);
        }}
      />
    </div>
  );
}
