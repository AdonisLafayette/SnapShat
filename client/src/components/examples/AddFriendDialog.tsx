import { useState } from 'react';
import AddFriendDialog from '../AddFriendDialog';
import { Button } from '@/components/ui/button';

export default function AddFriendDialogExample() {
  const [open, setOpen] = useState(true);

  return (
    <div className="p-8 bg-background min-h-screen">
      <Button onClick={() => setOpen(true)}>Open Dialog</Button>
      <AddFriendDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
