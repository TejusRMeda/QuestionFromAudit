"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import CreateTrustModal from "./CreateTrustModal";

interface TrustRow {
  id: number;
  trust_name: string;
  trust_link_id: string;
  created_at: string;
  masterName: string;
  adminLinkId: string;
}

interface Questionnaire {
  id: number;
  name: string;
  admin_link_id: string;
}

interface Props {
  trustRows: TrustRow[];
  questionnaires: Questionnaire[];
}

export default function TrustsPageClient({ trustRows, questionnaires }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const router = useRouter();

  function handleCreated() {
    router.refresh();
  }

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-full">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Trusts</h1>
          <p className="text-sm text-slate-400 mt-0.5">All trust instances sharing your questionnaires</p>
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
        {trustRows.length === 0 ? (
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
            <p className="text-sm text-slate-400 mb-5">
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trust Name</TableHead>
                <TableHead>Questionnaire</TableHead>
                <TableHead>Shared Date</TableHead>
                <TableHead>Share Link</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {trustRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium text-slate-800">{row.trust_name}</TableCell>
                  <TableCell className="text-slate-500">{row.masterName}</TableCell>
                  <TableCell className="text-slate-500">
                    {new Date(row.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/instance/${row.trust_link_id}`}
                      className="text-xs text-blue-600 hover:underline font-mono"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      /instance/{row.trust_link_id.slice(0, 8)}…
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/masters/${row.adminLinkId}`}
                      className="text-xs text-blue-600 hover:text-blue-700 hover:underline font-medium"
                    >
                      Manage
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <CreateTrustModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleCreated}
        questionnaires={questionnaires}
      />
    </div>
  );
}
