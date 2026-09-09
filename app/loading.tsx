export default function Loading() {
  return (
    <div className="p-5">
      <div className="mb-6 h-10 w-48 skeleton" />
      <div className="space-y-7">
        <div className="card h-52 p-6 sm:h-56" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card h-24 p-5" />
          ))}
        </div>
        <div className="card h-40 p-5" />
        <div className="card h-80 p-5">
          <div className="mb-5 h-6 w-40 skeleton" />
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-9 w-full skeleton" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
