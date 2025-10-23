import StatusBadge from '../StatusBadge';

export default function StatusBadgeExample() {
  return (
    <div className="p-8 bg-background min-h-screen flex flex-wrap gap-3">
      <StatusBadge status="pending" />
      <StatusBadge status="running" />
      <StatusBadge status="success" />
      <StatusBadge status="failed" />
      <StatusBadge status="captcha" />
    </div>
  );
}
