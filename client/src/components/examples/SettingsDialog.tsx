import { useState } from 'react';
import SettingsDialog from '../SettingsDialog';
import { Button } from '@/components/ui/button';

export default function SettingsDialogExample() {
  const [open, setOpen] = useState(true);

  return (
    <div className="p-8 bg-background min-h-screen">
      <Button onClick={() => setOpen(true)}>Open Settings</Button>
      <SettingsDialog
        open={open}
        onOpenChange={setOpen}
        username="azal.daniel"
        email="arabicphysicist@gmail.com"
        phone="+92 306 407 8867"
      />
    </div>
  );
}
