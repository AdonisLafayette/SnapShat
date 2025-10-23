import FriendCard from '../FriendCard';

export default function FriendCardExample() {
  const mockFriend = {
    id: '1',
    username: 'suroojnadeem',
    profilePictureUrl: null,
    addedAt: new Date(),
  };

  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="max-w-sm">
        <FriendCard friend={mockFriend} status="pending" selected={false} />
      </div>
    </div>
  );
}
