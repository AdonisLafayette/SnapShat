import GlassCard from '../GlassCard';

export default function GlassCardExample() {
  return (
    <div className="p-8 bg-background min-h-screen">
      <GlassCard>
        <h3 className="text-xl font-semibold mb-2">Glassmorphic Card</h3>
        <p className="text-sm text-muted-foreground">
          This is a beautiful glass card with backdrop blur and transparency effects.
        </p>
      </GlassCard>
    </div>
  );
}
