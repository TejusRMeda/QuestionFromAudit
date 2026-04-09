"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import CreateTrustModal from "./CreateTrustModal";

interface TrustInstance {
  id: number;
  trust_name: string;
  trust_link_id: string;
  created_at: string;
}

interface MasterWithTrusts {
  id: number;
  name: string;
  admin_link_id: string;
  trust_instances: TrustInstance[];
}

interface Questionnaire {
  id: number;
  name: string;
  admin_link_id: string;
}

interface Props {
  masters: MasterWithTrusts[];
  questionnaires: Questionnaire[];
}

/** A single form instance row grouped under a trust name */
interface FormRow {
  trustInstance: TrustInstance;
  masterName: string;
  adminLinkId: string;
}

/** Trust name group with all its form instances */
interface TrustGroup {
  trustName: string;
  forms: FormRow[];
}

async function copyTrustLink(trustLinkId: string) {
  const url = `${window.location.origin}/instance/${trustLinkId}`;
  try {
    await navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
  } catch {
    toast.error("Failed to copy link");
  }
}

export default function TrustsPageClient({ masters, questionnaires }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [addFormsModalOpen, setAddFormsModalOpen] = useState(false);
  const [addFormsTrustName, setAddFormsTrustName] = useState("");
  const [addFormsExcludeIds, setAddFormsExcludeIds] = useState<string[]>([]);
  const [deletingTrustId, setDeletingTrustId] = useState<string | null>(null);
  const router = useRouter();

  function handleCreated() {
    router.refresh();
  }

  function openAddFormsModal(trustName: string, existingAdminLinkIds: string[]) {
    setAddFormsTrustName(trustName);
    setAddFormsExcludeIds(existingAdminLinkIds);
    setAddFormsModalOpen(true);
  }

  async function handleDeleteTrust(adminLinkId: string, trustLinkId: string, trustName: string) {
    if (!confirm(`Are you sure you want to delete "${trustName}"? This will remove all its questions, suggestions, and comments.`)) {
      return;
    }
    setDeletingTrustId(trustLinkId);
    try {
      const res = await fetch(`/api/masters/${adminLinkId}/instances/${trustLinkId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to delete trust instance");
      }
      toast.success(`"${trustName}" deleted successfully`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete trust");
    } finally {
      setDeletingTrustId(null);
    }
  }

  // Group by trust name instead of by master questionnaire
  const trustGroups: TrustGroup[] = [];
  const trustGroupMap = new Map<string, FormRow[]>();
  for (const master of masters) {
    for (const trust of master.trust_instances) {
      const forms = trustGroupMap.get(trust.trust_name) || [];
      forms.push({
        trustInstance: trust,
        masterName: master.name,
        adminLinkId: master.admin_link_id,
      });
      trustGroupMap.set(trust.trust_name, forms);
    }
  }
  for (const [trustName, forms] of trustGroupMap) {
    // Sort forms within each trust by date descending
    forms.sort((a, b) => new Date(b.trustInstance.created_at).getTime() - new Date(a.trustInstance.created_at).getTime());
    trustGroups.push({ trustName, forms });
  }
  // Sort trust groups alphabetically
  trustGroups.sort((a, b) => a.trustName.localeCompare(b.trustName));

  const hasTrusts = trustGroups.length > 0;

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-full">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Trusts</h1>
          <p className="text-sm text-slate-500 mt-0.5">All trust instances sharing your questionnaires</p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 bg-[#4A90A4] hover:bg-[#3d7a8c] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New Trust
        </button>
      </div>

      <Card>
        {!hasTrusts ? (
          <div className="py-16 text-center">
            <svg
              className="w-16 h-16 mx-auto text-slate-200 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <h3 className="text-base font-medium text-slate-500 mb-2">No trusts yet</h3>
            <p className="text-sm text-slate-500 mb-5">
              Share a master questionnaire with a trust to get started.
            </p>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 bg-[#4A90A4] hover:bg-[#3d7a8c] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Add New Trust
            </button>
          </div>
        ) : (
          <TooltipProvider>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Form Name</TableHead>
                  <TableHead>Shared Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trustGroups.map((group) => (
                  <Fragment key={group.trustName}>
                    {/* Trust name header */}
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableCell colSpan={2} className="py-2">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          {group.trustName}
                        </span>
                      </TableCell>
                      <TableCell className="py-2 text-right">
                        <button
                          type="button"
                          onClick={() => openAddFormsModal(
                            group.trustName,
                            group.forms.map((f) => f.adminLinkId)
                          )}
                          className="text-xs text-[#4A90A4] hover:text-[#3d7a8c] hover:underline font-medium"
                        >
                          + Add Form
                        </button>
                      </TableCell>
                    </TableRow>
                    {/* Form instance rows under this trust */}
                    {group.forms.map((form) => (
                      <TableRow key={form.trustInstance.id}>
                        <TableCell className="font-medium text-slate-800 pl-8">
                          {form.masterName}
                        </TableCell>
                        <TableCell className="text-slate-500">
                          {new Date(form.trustInstance.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="inline-flex items-center gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  onClick={() => copyTrustLink(form.trustInstance.trust_link_id)}
                                  className="inline-flex items-center justify-center w-8 h-8 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                                    />
                                  </svg>
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>Copy link</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <a
                                  href={`/instance/${form.trustInstance.trust_link_id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center justify-center w-8 h-8 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                    />
                                  </svg>
                                </a>
                              </TooltipTrigger>
                              <TooltipContent>Open link</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Link
                                  href={`/instance/${form.trustInstance.trust_link_id}/suggestions`}
                                  className="inline-flex items-center justify-center w-8 h-8 rounded-md text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                    />
                                  </svg>
                                </Link>
                              </TooltipTrigger>
                              <TooltipContent>View suggestions</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTrust(form.adminLinkId, form.trustInstance.trust_link_id, form.trustInstance.trust_name)}
                                  disabled={deletingTrustId === form.trustInstance.trust_link_id}
                                  className="inline-flex items-center justify-center w-8 h-8 rounded-md text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                                >
                                  {deletingTrustId === form.trustInstance.trust_link_id ? (
                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                  ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  )}
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>Delete form</TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </TooltipProvider>
        )}
      </Card>

      <CreateTrustModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleCreated}
        questionnaires={questionnaires}
      />

      <CreateTrustModal
        isOpen={addFormsModalOpen}
        onClose={() => setAddFormsModalOpen(false)}
        onCreated={handleCreated}
        questionnaires={questionnaires}
        initialTrustName={addFormsTrustName}
        excludeAdminLinkIds={addFormsExcludeIds}
      />
    </div>
  );
}
