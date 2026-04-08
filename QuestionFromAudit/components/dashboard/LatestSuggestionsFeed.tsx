import Link from "next/link";

export interface SuggestionItem {
  id: number;
  status: string;
  submitter_name: string;
  created_at: string;
  suggestion_text: string;
  masterName: string;
  adminLinkId: string;
  trustName: string;
}

interface LatestSuggestionsFeedProps {
  suggestions: SuggestionItem[];
}

const statusDot: Record<string, string> = {
  pending: "bg-amber-400",
  approved: "bg-green-400",
  rejected: "bg-red-400",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function LatestSuggestionsFeed({ suggestions }: LatestSuggestionsFeedProps) {
  if (suggestions.length === 0) {
    return (
      <div className="py-10 text-center text-slate-400">
        <svg
          className="w-12 h-12 mx-auto mb-3 text-slate-200"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
        <p className="text-sm">No suggestions received yet.</p>
      </div>
    );
  }

  return (
    <ul>
      {suggestions.map((s) => (
        <li
          key={s.id}
          className="px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div
                className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${statusDot[s.status] || "bg-slate-300"}`}
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                  <span className="text-xs font-medium text-slate-700">{s.submitter_name}</span>
                  <span className="text-xs text-slate-400">·</span>
                  <span className="text-xs text-slate-400">{s.trustName}</span>
                </div>
                <p className="text-sm text-slate-600 truncate">{s.suggestion_text}</p>
                <p className="text-xs text-slate-400 mt-0.5">{s.masterName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-slate-400 whitespace-nowrap">
                {timeAgo(s.created_at)}
              </span>
              <Link
                href={`/masters/${s.adminLinkId}/suggestions`}
                className="text-xs text-blue-600 hover:text-blue-700 hover:underline font-medium"
              >
                View
              </Link>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
