export default function EditWorkspaceLoading() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 rounded-lg bg-slate-200 animate-pulse" />
          <div>
            <div className="h-6 w-48 rounded bg-slate-200 animate-pulse" />
            <div className="h-4 w-32 rounded bg-slate-200 animate-pulse mt-1" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-8 w-20 rounded-lg bg-slate-200 animate-pulse" />
          <div className="h-8 w-24 rounded-lg bg-slate-200 animate-pulse" />
        </div>
      </div>

      {/* Toolbar skeleton */}
      <div className="flex items-center gap-3 mb-4">
        <div className="h-8 w-64 rounded-lg bg-slate-200 animate-pulse" />
        <div className="h-8 w-32 rounded-lg bg-slate-200 animate-pulse" />
        <div className="h-8 w-28 rounded-lg bg-slate-200 animate-pulse" />
      </div>

      {/* Stats skeleton */}
      <div className="h-4 w-56 rounded bg-slate-200 animate-pulse mb-4" />

      {/* Section + rows skeleton */}
      {[1, 2, 3].map((section) => (
        <div key={section} className="mb-4">
          <div className="h-10 w-full rounded-lg bg-slate-200 animate-pulse mb-2" />
          {[1, 2, 3, 4].map((row) => (
            <div
              key={row}
              className="h-12 w-full rounded bg-slate-100 animate-pulse mb-1"
            />
          ))}
        </div>
      ))}
    </div>
  );
}
