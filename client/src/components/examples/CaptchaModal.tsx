import { useState } from 'react';
import CaptchaModal from '../CaptchaModal';
import { Button } from '@/components/ui/button';

export default function CaptchaModalExample() {
  const [open, setOpen] = useState(true);

  return (
    <div className="p-8 bg-background min-h-screen">
      <Button onClick={() => setOpen(true)}>Open Captcha Modal</Button>
      <CaptchaModal
        open={open}
        friendUsername="suroojnadeem"
        onCancel={() => setOpen(false)}
      />
    </div>
  );
}
