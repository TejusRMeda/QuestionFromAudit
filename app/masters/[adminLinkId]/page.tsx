"use client";

import { useState, useEffect, Fragment } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Dialog, Transition } from "@headlessui/react";
import toast from "react-hot-toast";

interface Instance {
  id: number;
  trust_name: string;
  trust_link_id: string;
  created_at: string;
}

interface MasterData {
  id: number;
  name: string;
  adminLinkId: string;
  createdAt: string;
  questionCount: number;
}

interface DashboardData {
  master: MasterData;
  instances: Instance[];
}

export default function MasterDashboardPage() {
  const params = useParams();
  const adminLinkId = params.adminLinkId as string;

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Share modal state
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [trustName, setTrustName] = useState("");
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    fetchData();
  }, [adminLinkId]);

  const fetchData = async () => {
    try {
      const response = await fetch(`/api/masters/${adminLinkId}`);
      if (!response.ok) {
        throw new Error("Master questionnaire not found");
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!trustName.trim()) {
      toast.error("Please enter a trust name");
      return;
    }

    setIsSharing(true);
    try {
      const response = await fetch(`/api/masters/${adminLinkId}/instances`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ trustName: trustName.trim() }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Failed to create instance");
      }

      const result = await response.json();

      // Copy trust link to clipboard
      const trustUrl = `${window.location.origin}/instance/${result.trustLinkId}`;
      await navigator.clipboard.writeText(trustUrl);
      toast.success("Trust link copied to clipboard!", { duration: 4000 });

      // Reset modal and refresh data
      setShareModalOpen(false);
      setTrustName("");
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to share");
    } finally {
      setIsSharing(false);
    }
  };

  const copyTrustLink = async (trustLinkId: string) => {
    const url = `${window.location.origin}/instance/${trustLinkId}`;
    await navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-error mb-2">Error</h1>
          <p className="text-base-content/60">{error || "Failed to load"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-base-100 rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">{data.master.name}</h1>
              <p className="text-base-content/60 mt-1">
                {data.master.questionCount} questions • Created{" "}
                {new Date(data.master.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/masters/${adminLinkId}/suggestions`}
                className="btn btn-outline btn-primary"
              >
                <svg
                  className="w-5 h-5 mr-2"
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
                View All Suggestions
              </Link>
              <button
                onClick={() => setShareModalOpen(true)}
                className="btn btn-primary"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
                Share with Trust
              </button>
            </div>
          </div>
        </div>

        {/* Instances List */}
        <div className="bg-base-100 rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4">
            Shared Instances ({data.instances.length})
          </h2>

          {data.instances.length === 0 ? (
            <div className="text-center py-12 text-base-content/60">
              <svg
                className="w-16 h-16 mx-auto mb-4 opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <p>No instances shared yet</p>
              <p className="text-sm mt-1">
                Click &quot;Share with Trust&quot; to create your first instance
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Trust Name</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.instances.map((instance) => (
                    <tr key={instance.id}>
                      <td className="font-medium">{instance.trust_name}</td>
                      <td className="text-base-content/60">
                        {new Date(instance.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button
                            onClick={() => copyTrustLink(instance.trust_link_id)}
                            className="btn btn-sm btn-ghost"
                            title="Copy link"
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
                                d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                              />
                            </svg>
                          </button>
                          <a
                            href={`/instance/${instance.trust_link_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-ghost"
                            title="Open link"
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
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                              />
                            </svg>
                          </a>
                          <a
                            href={`/instance/${instance.trust_link_id}/suggestions`}
                            className="btn btn-sm btn-primary"
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
                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                              />
                            </svg>
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Share Modal */}
      <Transition appear show={shareModalOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setShareModalOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-base-100 p-6 shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-lg font-semibold">
                    Share with Trust
                  </Dialog.Title>

                  <div className="mt-4">
                    <label className="label">
                      <span className="label-text">Trust Name</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter trust name (e.g., NHS Foundation Trust)"
                      value={trustName}
                      onChange={(e) => setTrustName(e.target.value)}
                      className="input input-bordered w-full"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleShare();
                      }}
                    />
                    <p className="text-sm text-base-content/60 mt-2">
                      A unique link will be generated for this trust to access
                      the questionnaire.
                    </p>
                  </div>

                  <div className="mt-6 flex gap-3 justify-end">
                    <button
                      onClick={() => setShareModalOpen(false)}
                      className="btn btn-ghost"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleShare}
                      disabled={!trustName.trim() || isSharing}
                      className="btn btn-primary"
                    >
                      {isSharing ? (
                        <>
                          <span className="loading loading-spinner loading-sm"></span>
                          Creating...
                        </>
                      ) : (
                        "Create & Copy Link"
                      )}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
