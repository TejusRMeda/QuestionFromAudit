"use client";

import { useState, useRef } from "react";
import { Fragment } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Dialog, Transition } from "@headlessui/react";
import toast from "react-hot-toast";

interface MasterQuestionnaire {
  id: number;
  name: string;
  admin_link_id: string;
  created_at: string;
  question_count: number;
}

interface DashboardQuestionnairesProps {
  questionnaires: MasterQuestionnaire[];
}

export default function DashboardQuestionnaires({
  questionnaires,
}: DashboardQuestionnairesProps) {
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<MasterQuestionnaire | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  async function handleDelete() {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/masters/${deleteTarget.admin_link_id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to delete questionnaire");
      }

      toast.success("Questionnaire deleted successfully");
      setDeleteTarget(null);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete questionnaire"
      );
    } finally {
      setIsDeleting(false);
    }
  }

  if (questionnaires.length === 0) {
    return (
      <div className="p-12 text-center">
        <svg
          className="w-16 h-16 mx-auto text-base-content/20 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="text-lg font-medium text-base-content/60 mb-2">
          No questionnaires yet
        </h3>
        <p className="text-base-content/40 mb-4">
          Upload your first master CSV to get started
        </p>
        <Link href="/dashboard/upload" className="btn btn-primary">
          Upload CSV
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Questions</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {questionnaires.map((q) => (
              <tr key={q.id} className="hover">
                <td className="font-medium">{q.name}</td>
                <td>{q.question_count}</td>
                <td className="text-base-content/60">
                  {new Date(q.created_at).toLocaleDateString("en-US")}
                </td>
                <td>
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/masters/${q.admin_link_id}`}
                      className="btn btn-sm btn-ghost"
                    >
                      Manage
                    </Link>
                    <button
                      className="btn btn-sm btn-ghost text-error"
                      onClick={() => setDeleteTarget(q)}
                      aria-label={`Delete ${q.name}`}
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
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      <Transition appear show={deleteTarget !== null} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => {
            if (!isDeleting) setDeleteTarget(null);
          }}
          initialFocus={cancelButtonRef}
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
            <div className="fixed inset-0 bg-neutral/50" />
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
                <Dialog.Panel className="w-full max-w-sm transform overflow-hidden rounded-box bg-base-100 p-6 shadow-xl transition-all">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-error/20 flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-error"
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
                    <div>
                      <Dialog.Title className="text-lg font-semibold">
                        Delete Questionnaire
                      </Dialog.Title>
                      <p className="mt-2 text-sm text-base-content/70">
                        Are you sure you want to delete{" "}
                        <strong>{deleteTarget?.name}</strong>? This will
                        permanently remove all associated instances and
                        suggestions. This action cannot be undone.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-end gap-3">
                    <button
                      ref={cancelButtonRef}
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => setDeleteTarget(null)}
                      disabled={isDeleting}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-error"
                      onClick={handleDelete}
                      disabled={isDeleting}
                    >
                      {isDeleting && (
                        <span className="loading loading-spinner loading-sm" />
                      )}
                      Delete
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
