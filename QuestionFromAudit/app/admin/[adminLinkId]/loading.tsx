export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-base-200 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="h-8 w-64 bg-slate-200 rounded animate-pulse mb-2" />
        <div className="h-4 w-32 bg-slate-200 rounded animate-pulse mb-8" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-100 p-5 animate-pulse">
              <div className="flex justify-between items-start mb-3">
                <div className="h-4 w-2/3 bg-slate-200 rounded" />
                <div className="h-5 w-16 bg-slate-200 rounded-full" />
              </div>
              <div className="h-3 w-1/2 bg-slate-100 rounded mb-2" />
              <div className="h-3 w-1/3 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
