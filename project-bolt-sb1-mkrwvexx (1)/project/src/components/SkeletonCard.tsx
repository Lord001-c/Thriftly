export default function SkeletonCard() {
  const heights = [280, 340, 400, 320, 360, 300];
  const h = heights[Math.floor(Math.random() * heights.length)];

  return (
    <div className="break-inside-avoid mb-4 rounded-[20px] border border-zinc-100 bg-white overflow-hidden">
      <div className="shimmer rounded-t-[20px]" style={{ height: `${h}px` }} />
      <div className="p-4 space-y-3">
        <div className="shimmer h-4 w-3/4 rounded-full" />
        <div className="shimmer h-4 w-1/3 rounded-full" />
        <div className="flex gap-2">
          <div className="shimmer h-3 w-16 rounded-full" />
          <div className="shimmer h-3 w-12 rounded-full" />
        </div>
      </div>
    </div>
  );
}
