"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

interface SuggestionCount {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

interface Trust {
  id: number;
  trustName: string;
  trustLinkId: string;
  createdAt: string;
  suggestionCounts: SuggestionCount;
}

interface SuggestionsData {
  masterName: string;
  trusts: Trust[];
}

export default function MasterSuggestionsOverviewPage() {
  const params = useParams();
  const adminLinkId = params.adminLinkId as string;

  const [data, setData] = useState<SuggestionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOnlyWithPending, setShowOnlyWithPending] = useState(false);

  useEffect(() => {
    fetchData();
  }, [adminLinkId]);

  const fetchData = async () => {
    try {
      const response = await fetch(`/api/masters/${adminLinkId}/suggestions`);
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Failed to load suggestions");
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
      toast.error("Failed to load suggestions data");
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals across all trusts
  const totals = data?.trusts.reduce(
    (acc, trust) => ({
      total: acc.total + trust.suggestionCounts.total,
      pending: acc.pending + trust.suggestionCounts.pending,
      approved: acc.approved + trust.suggestionCounts.approved,
      rejected: acc.rejected + trust.suggestionCounts.rejected,
    }),
    { total: 0, pending: 0, approved: 0, rejected: 0 }
  ) || { total: 0, pending: 0, approved: 0, rejected: 0 };

  // Filter trusts
  const filteredTrusts = showOnlyWithPending
    ? data?.trusts.filter((t) => t.suggestionCounts.pending > 0)
    : data?.trusts;

  if (loading) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="mt-4 text-base-content/60">Loading suggestions...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-error/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-error"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold mb-2">Unable to Load Suggestions</h1>
          <p className="text-base-content/60 mb-4">
            {error || "The link may be invalid or expired."}
          </p>
          <Link href={`/masters/${adminLinkId}`} className="btn btn-primary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200">
      {/* Header */}
      <div className="bg-base-100 border-b border-base-300 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <Link
                  href={`/masters/${adminLinkId}`}
                  className="text-sm text-primary hover:underline flex items-center gap-1 mb-1"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  Back to Dashboard
                </Link>
                <h1 className="text-2xl font-bold">{data.masterName}</h1>
                <p className="text-sm text-base-content/60">
                  Suggestions Overview
                </p>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-base-200 rounded-box p-3">
                <div className="text-2xl font-bold">{totals.total}</div>
                <div className="text-xs text-base-content/60">Total Suggestions</div>
              </div>
              <div className="bg-warning/10 rounded-box p-3">
                <div className="text-2xl font-bold text-warning">{totals.pending}</div>
                <div className="text-xs text-base-content/60">Pending</div>
              </div>
              <div className="bg-success/10 rounded-box p-3">
                <div className="text-2xl font-bold text-success">{totals.approved}</div>
                <div className="text-xs text-base-content/60">Approved</div>
              </div>
              <div className="bg-error/10 rounded-box p-3">
                <div className="text-2xl font-bold text-error">{totals.rejected}</div>
                <div className="text-xs text-base-content/60">Rejected</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Filter */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            Trusts ({filteredTrusts?.length || 0})
          </h2>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="checkbox checkbox-sm checkbox-primary"
              checked={showOnlyWithPending}
              onChange={(e) => setShowOnlyWithPending(e.target.checked)}
            />
            <span className="text-sm">Show only with pending</span>
          </label>
        </div>

        {filteredTrusts && filteredTrusts.length > 0 ? (
          <div className="bg-base-100 rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Trust Name</th>
                    <th className="text-center">Total</th>
                    <th className="text-center">Pending</th>
                    <th className="text-center">Approved</th>
                    <th className="text-center">Rejected</th>
                    <th>Created</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTrusts.map((trust) => (
                    <tr key={trust.id} className="hover">
                      <td>
                        <Link
                          href={`/instance/${trust.trustLinkId}/suggestions`}
                          className="font-medium hover:text-primary hover:underline"
                        >
                          {trust.trustName}
                        </Link>
                      </td>
                      <td className="text-center">
                        <span className="badge badge-ghost">
                          {trust.suggestionCounts.total}
                        </span>
                      </td>
                      <td className="text-center">
                        {trust.suggestionCounts.pending > 0 ? (
                          <span className="badge badge-warning">
                            {trust.suggestionCounts.pending}
                          </span>
                        ) : (
                          <span className="text-base-content/40">0</span>
                        )}
                      </td>
                      <td className="text-center">
                        {trust.suggestionCounts.approved > 0 ? (
                          <span className="badge badge-success badge-outline">
                            {trust.suggestionCounts.approved}
                          </span>
                        ) : (
                          <span className="text-base-content/40">0</span>
                        )}
                      </td>
                      <td className="text-center">
                        {trust.suggestionCounts.rejected > 0 ? (
                          <span className="badge badge-error badge-outline">
                            {trust.suggestionCounts.rejected}
                          </span>
                        ) : (
                          <span className="text-base-content/40">0</span>
                        )}
                      </td>
                      <td className="text-base-content/60">
                        {new Date(trust.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <Link
                          href={`/instance/${trust.trustLinkId}/suggestions`}
                          className="btn btn-sm btn-ghost"
                          title="View suggestions"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-base-100 rounded-xl shadow-lg p-12 text-center">
            <div className="w-16 h-16 bg-base-300 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-base-content/40"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <p className="text-base-content/60">
              {showOnlyWithPending
                ? "No trusts have pending suggestions"
                : data.trusts.length === 0
                ? "No trusts have been shared yet"
                : "No suggestions have been submitted yet"}
            </p>
            {showOnlyWithPending && data.trusts.length > 0 && (
              <button
                className="btn btn-ghost btn-sm mt-2"
                onClick={() => setShowOnlyWithPending(false)}
              >
                Show all trusts
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
