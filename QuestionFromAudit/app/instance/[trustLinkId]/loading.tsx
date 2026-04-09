export default function InstanceLoading() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Skeleton header */}
      <div className="bg-white border-b border-slate-200 px-4 py-4">
        <div className="max-w-[1800px] mx-auto">
          <div className="h-6 w-48 bg-slate-200 rounded animate-pulse mb-2" />
          <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
        </div>
      </div>
      {/* Skeleton cards */}
      <div className="max-w-[1800px] mx-auto p-4 flex flex-col gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-100 border-l-4 border-l-slate-200 p-4 animate-pulse">
            <div className="h-4 w-3/4 bg-slate-200 rounded mb-3" />
            <div className="flex gap-2 mb-2">
              <div className="h-5 w-16 bg-slate-200 rounded-full" />
              <div className="h-5 w-20 bg-slate-200 rounded-full" />
            </div>
            <div className="h-3 w-1/2 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
