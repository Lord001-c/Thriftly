export default function SkeletonCard() {
  return (
    <div className="rounded-[16px] sm:rounded-[20px] border border-zinc-100 bg-white overflow-hidden">
      <div className="shimmer w-full aspect-[4/5]" />
      <div className="p-2.5 sm:p-3 space-y-2">
        <div className="shimmer h-3.5 w-3/4 rounded-full" />
        <div className="shimmer h-4 w-1/2 rounded-full" />
        <div className="flex gap-2">
          <div className="shimmer h-2.5 w-14 rounded-full" />
          <div className="shimmer h-2.5 w-10 rounded-full" />
        </div>
      </div>
    </div>
  );
}
