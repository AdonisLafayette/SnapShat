import BatchControls from '../BatchControls';

export default function BatchControlsExample() {
  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="max-w-4xl mx-auto space-y-4">
        <BatchControls
          selectedCount={5}
          totalCount={10}
          isProcessing={false}
          processedCount={0}
        />
        <BatchControls
          selectedCount={10}
          totalCount={10}
          isProcessing={true}
          processedCount={7}
        />
      </div>
    </div>
  );
}
