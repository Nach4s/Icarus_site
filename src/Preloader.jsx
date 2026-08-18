export default function Preloader({ isVisible = false }) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-950">
      <div className="text-center">
        <div className="mb-4 text-2xl font-black tracking-[0.35em] text-white">
          ICARUS
        </div>
        <div className="mx-auto h-1 w-32 overflow-hidden rounded-full bg-neutral-800">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-yellow-500" />
        </div>
      </div>
    </div>
  );
}
