"use client";

interface Comment {
  id: number;
  authorType: "admin" | "trust_user";
  authorName: string;
  authorEmail: string | null;
  message: string;
  createdAt: string;
}

interface ConversationThreadProps {
  comments: Comment[];
  loading?: boolean;
}

export default function ConversationThread({
  comments,
  loading = false,
}: ConversationThreadProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    // Relative time for recent comments
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    // Full date for older comments
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="loading loading-spinner loading-sm"></span>
        <span className="ml-2 text-sm text-base-content/60">Loading...</span>
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="text-center py-12 text-base-content/50">
        <svg
          className="w-10 h-10 mx-auto mb-3 opacity-30"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <p className="text-sm font-medium">No comments yet</p>
        <p className="text-xs mt-1">Be the first to add a comment</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-base-200">
      {comments.map((comment) => {
        const isAdmin = comment.authorType === "admin";

        return (
          <div key={comment.id} className="py-4 first:pt-0 last:pb-0">
            <div className="flex gap-3">
              {/* Avatar */}
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                  isAdmin
                    ? "bg-primary/10 text-primary"
                    : "bg-base-300 text-base-content/70"
                }`}
              >
                {getInitials(comment.authorName)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="font-medium text-sm text-base-content">
                    {comment.authorName}
                  </span>
                  {isAdmin && (
                    <span className="text-[10px] font-medium uppercase tracking-wider text-primary/70">
                      Admin
                    </span>
                  )}
                  <span className="text-xs text-base-content/40">
                    {formatDate(comment.createdAt)}
                  </span>
                </div>

                {/* Message */}
                <p className="mt-1 text-sm text-base-content/80 whitespace-pre-wrap break-words">
                  {comment.message}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
