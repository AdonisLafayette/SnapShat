import ActivityLogPanel from '../ActivityLogPanel';

export default function ActivityLogPanelExample() {
  const mockLogs = [
    {
      id: '1',
      timestamp: new Date(),
      friendUsername: 'suroojnadeem',
      action: 'Started processing streak restoration',
      status: 'info' as const,
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 30000),
      friendUsername: 'zaib_khann1',
      action: 'Form submitted successfully',
      status: 'success' as const,
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 60000),
      friendUsername: 'rashaad_007',
      action: 'Captcha detected - waiting for manual solve',
      status: 'warning' as const,
    },
  ];

  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="max-w-md">
        <ActivityLogPanel logs={mockLogs} />
      </div>
    </div>
  );
}
