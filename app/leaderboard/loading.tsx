export default function Loading() {
  return (
    <div className="p-5">
      <div className="mb-6 h-10 w-52 skeleton" />
      <div className="mb-4 h-10 w-64 skeleton rounded-lg" />
      <div className="card p-5">
        <div className="mb-5 h-5 w-full max-w-lg skeleton" />
        <div className="space-y-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-9 w-9 shrink-0 rounded-full skeleton" />
              <div className="h-9 flex-1 skeleton" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
