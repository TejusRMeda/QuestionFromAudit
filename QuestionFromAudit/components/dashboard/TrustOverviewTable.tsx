import Link from "next/link";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export interface TrustRow {
  trustId: number;
  trustName: string;
  trustLinkId: string;
  masterName: string;
  adminLinkId: string;
  pendingCount: number;
  totalSuggestions: number;
  createdAt: string;
}

interface TrustOverviewTableProps {
  rows: TrustRow[];
}

export default function TrustOverviewTable({ rows }: TrustOverviewTableProps) {
  if (rows.length === 0) {
    return (
      <div className="py-10 text-center text-slate-500">
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
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        <p className="text-sm">Share a master questionnaire with a trust to get started.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Trust</TableHead>
          <TableHead>Questionnaire</TableHead>
          <TableHead>Pending</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Shared</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.trustId}>
            <TableCell className="font-medium text-slate-800">{row.trustName}</TableCell>
            <TableCell className="text-slate-500 text-sm">{row.masterName}</TableCell>
            <TableCell>
              {row.pendingCount > 0 ? (
                <Badge variant="warning">{row.pendingCount}</Badge>
              ) : (
                <span className="text-slate-300 text-sm">—</span>
              )}
            </TableCell>
            <TableCell className="text-slate-500 text-sm">{row.totalSuggestions}</TableCell>
            <TableCell className="text-slate-500 text-sm">
              {new Date(row.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </TableCell>
            <TableCell>
              <Link
                href="/dashboard/trusts"
                className="text-xs text-blue-600 hover:text-blue-700 hover:underline font-medium"
              >
                Manage
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
