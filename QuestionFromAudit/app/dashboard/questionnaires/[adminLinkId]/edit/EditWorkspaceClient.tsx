"use client";

import { useState, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import EditSlideOver from "@/components/workspace/EditSlideOver";
import ChangesSummaryDialog from "@/components/workspace/ChangesSummaryDialog";

// ───────────────────────────── Types ──────────────────────────────

interface MasterQuestion {
  id: number;
  question_id: string;
  category: string;
  question_text: string;
  answer_type: string;
  answer_options: string | null;
  characteristic: string | null;
  section: string | null;
  page: string | null;
  enable_when: string | null;
  required: boolean;
  has_helper: boolean;
  helper_type: string | null;
  helper_name: string | null;
  helper_value: string | null;
  is_hidden: boolean;
  is_locked: boolean;
}

interface Master {
  id: number;
  name: string;
  status: string;
  admin_link_id: string;
}

interface Props {
  master: Master;
  questions: MasterQuestion[];
}

type StatusFilter = "all" | "locked" | "hidden" | "edited" | "normal";

// ───────────────────────────── Icons ──────────────────────────────

function ArrowLeftIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 19l-7-7m0 0l7-7m-7 7h18"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      className="w-4 h-4 text-slate-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

function LockIcon({ locked }: { locked: boolean }) {
  if (locked) {
    return (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
        />
      </svg>
    );
  }
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
      />
    </svg>
  );
}

function EyeIcon({ hidden }: { hidden: boolean }) {
  if (hidden) {
    return (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
        />
      </svg>
    );
  }
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
      />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-4 h-4 transition-transform ${open ? "rotate-90" : ""}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5l7 7-7 7"
      />
    </svg>
  );
}

// ───────────────────────────── Helpers ─────────────────────────────

function buildChangedFields(
  current: MasterQuestion,
  original: MasterQuestion
): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  if (current.question_text !== original.question_text) patch.questionText = current.question_text;
  if (current.required !== original.required) patch.required = current.required;
  if (current.is_hidden !== original.is_hidden) patch.isHidden = current.is_hidden;
  if (current.is_locked !== original.is_locked) patch.isLocked = current.is_locked;
  if (current.has_helper !== original.has_helper) patch.hasHelper = current.has_helper;
  if (current.helper_type !== original.helper_type) patch.helperType = current.helper_type;
  if (current.helper_name !== original.helper_name) patch.helperName = current.helper_name;
  if (current.helper_value !== original.helper_value) patch.helperValue = current.helper_value;
  return patch;
}

function isQuestionEdited(
  current: MasterQuestion,
  original: MasterQuestion
): boolean {
  return (
    current.question_text !== original.question_text ||
    current.required !== original.required ||
    current.has_helper !== original.has_helper ||
    current.helper_type !== original.helper_type ||
    current.helper_name !== original.helper_name ||
    current.helper_value !== original.helper_value ||
    current.is_hidden !== original.is_hidden ||
    current.is_locked !== original.is_locked
  );
}

function describeChange(
  current: MasterQuestion,
  original: MasterQuestion
): string[] {
  const changes: string[] = [];
  if (current.question_text !== original.question_text)
    changes.push("Question text changed");
  if (current.required !== original.required)
    changes.push(current.required ? "Set as required" : "Set as optional");
  if (current.is_hidden !== original.is_hidden)
    changes.push(current.is_hidden ? "Hidden" : "Unhidden");
  if (current.is_locked !== original.is_locked)
    changes.push(current.is_locked ? "Locked" : "Unlocked");
  if (current.has_helper !== original.has_helper)
    changes.push(current.has_helper ? "Helper enabled" : "Helper disabled");
  if (current.helper_type !== original.helper_type)
    changes.push("Helper type changed");
  if (current.helper_name !== original.helper_name)
    changes.push("Helper name changed");
  if (current.helper_value !== original.helper_value)
    changes.push("Helper value changed");
  return changes;
}

// ───────────────────────────── Component ──────────────────────────

export default function EditWorkspaceClient({ master, questions: initialQuestions }: Props) {
  const router = useRouter();

  // ── State ──
  const [questions, setQuestions] = useState<MasterQuestion[]>(initialQuestions);
  const originalQuestionsRef = useRef<MasterQuestion[]>(initialQuestions);
  const [searchTerm, setSearchTerm] = useState("");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [showPublishDialog, setShowPublishDialog] = useState(false);

  // ── Derived state ──
  const originalMap = useMemo(() => {
    const map = new Map<number, MasterQuestion>();
    for (const q of originalQuestionsRef.current) {
      map.set(q.id, q);
    }
    return map;
  }, []);

  const isDirty = useMemo(() => {
    return questions.some((q) => {
      const orig = originalMap.get(q.id);
      return orig ? isQuestionEdited(q, orig) : false;
    });
  }, [questions, originalMap]);

  const sections = useMemo(() => {
    const sectionSet = new Set<string>();
    for (const q of questions) {
      sectionSet.add(q.section || "Uncategorised");
    }
    return Array.from(sectionSet);
  }, [questions]);

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      // Search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesId = q.question_id.toLowerCase().includes(term);
        const matchesText = q.question_text.toLowerCase().includes(term);
        if (!matchesId && !matchesText) return false;
      }
      // Section filter
      if (sectionFilter !== "all") {
        const qSection = q.section || "Uncategorised";
        if (qSection !== sectionFilter) return false;
      }
      // Status filter
      if (statusFilter !== "all") {
        const orig = originalMap.get(q.id);
        const edited = orig ? isQuestionEdited(q, orig) : false;
        switch (statusFilter) {
          case "locked":
            if (!q.is_locked) return false;
            break;
          case "hidden":
            if (!q.is_hidden) return false;
            break;
          case "edited":
            if (!edited) return false;
            break;
          case "normal":
            if (q.is_locked || q.is_hidden || edited) return false;
            break;
        }
      }
      return true;
    });
  }, [questions, searchTerm, sectionFilter, statusFilter, originalMap]);

  const questionsBySection = useMemo(() => {
    const map = new Map<string, MasterQuestion[]>();
    for (const q of filteredQuestions) {
      const section = q.section || "Uncategorised";
      if (!map.has(section)) map.set(section, []);
      map.get(section)!.push(q);
    }
    return map;
  }, [filteredQuestions]);

  const stats = useMemo(() => {
    let hidden = 0;
    let locked = 0;
    let edited = 0;
    for (const q of questions) {
      if (q.is_hidden) hidden++;
      if (q.is_locked) locked++;
      const orig = originalMap.get(q.id);
      if (orig && isQuestionEdited(q, orig)) edited++;
    }
    return {
      total: questions.length,
      showing: filteredQuestions.length,
      hidden,
      locked,
      edited,
    };
  }, [questions, filteredQuestions, originalMap]);

  const editingQuestion = useMemo(
    () => questions.find((q) => q.id === editingQuestionId) ?? null,
    [questions, editingQuestionId]
  );

  const changesList = useMemo(() => {
    const list: { questionId: string; changes: string[] }[] = [];
    for (const q of questions) {
      const orig = originalMap.get(q.id);
      if (orig && isQuestionEdited(q, orig)) {
        const label = q.question_text.length > 60
          ? q.question_text.slice(0, 60) + "..."
          : q.question_text;
        list.push({
          questionId: label || "Untitled question",
          changes: describeChange(q, orig),
        });
      }
    }
    return list;
  }, [questions, originalMap]);

  // ── Handlers ──
  const toggleLock = useCallback((id: number) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, is_locked: !q.is_locked } : q))
    );
  }, []);

  const toggleHide = useCallback((id: number) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, is_hidden: !q.is_hidden } : q))
    );
  }, []);

  const toggleSelect = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleSelectSection = useCallback(
    (sectionQuestions: MasterQuestion[]) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        const sectionIds = sectionQuestions.map((q) => q.id);
        const allSelected = sectionIds.every((id) => next.has(id));
        if (allSelected) {
          for (const id of sectionIds) next.delete(id);
        } else {
          for (const id of sectionIds) next.add(id);
        }
        return next;
      });
    },
    []
  );

  const toggleSectionCollapse = useCallback((section: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  }, []);

  const bulkLock = useCallback(() => {
    setQuestions((prev) =>
      prev.map((q) => (selectedIds.has(q.id) ? { ...q, is_locked: true } : q))
    );
    setSelectedIds(new Set());
  }, [selectedIds]);

  const bulkHide = useCallback(() => {
    setQuestions((prev) =>
      prev.map((q) => (selectedIds.has(q.id) ? { ...q, is_hidden: true } : q))
    );
    setSelectedIds(new Set());
  }, [selectedIds]);

  const handleSlideOverSave = useCallback(
    (updated: Partial<MasterQuestion>) => {
      if (editingQuestionId === null) return;
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === editingQuestionId ? { ...q, ...updated } : q
        )
      );
      setEditingQuestionId(null);
    },
    [editingQuestionId]
  );

  const handleSlideOverClose = useCallback(() => {
    setEditingQuestionId(null);
  }, []);

  const handleDiscard = useCallback(() => {
    setQuestions(originalQuestionsRef.current);
    setSelectedIds(new Set());
    toast.success("Changes discarded");
  }, []);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const changedQuestions = questions.filter((q) => {
        const orig = originalMap.get(q.id);
        return orig ? isQuestionEdited(q, orig) : false;
      });

      if (changedQuestions.length === 0) {
        toast("No changes to save");
        setIsSaving(false);
        return;
      }

      const results = await Promise.all(
        changedQuestions.map((q) => {
          const orig = originalMap.get(q.id)!;
          return fetch(
            `/api/masters/${master.admin_link_id}/questions/${q.id}`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(buildChangedFields(q, orig)),
            }
          );
        })
      );

      const allOk = results.every((r) => r.ok);
      if (allOk) {
        originalQuestionsRef.current = questions.map((q) => ({ ...q }));
        toast.success(`Saved ${changedQuestions.length} question(s)`);
      } else {
        toast.error("Some changes failed to save. Please try again.");
      }
    } catch {
      toast.error("Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  }, [questions, originalMap, master.admin_link_id]);

  const handlePublishClick = useCallback(() => {
    setShowPublishDialog(true);
  }, []);

  const handlePublishConfirm = useCallback(async () => {
    setShowPublishDialog(false);
    setIsPublishing(true);
    try {
      // Save pending changes first
      const changedQuestions = questions.filter((q) => {
        const orig = originalMap.get(q.id);
        return orig ? isQuestionEdited(q, orig) : false;
      });

      if (changedQuestions.length > 0) {
        const saveResults = await Promise.all(
          changedQuestions.map(async (q) => {
            const orig = originalMap.get(q.id)!;
            const res = await fetch(
              `/api/masters/${master.admin_link_id}/questions/${q.id}`,
              {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(buildChangedFields(q, orig)),
              }
            );
            if (!res.ok) {
              const errData = await res.json().catch(() => ({}));
              console.error("Save question failed:", q.id, errData);
            }
            return res;
          })
        );
        if (!saveResults.every((r) => r.ok)) {
          toast.error("Failed to save changes before publishing");
          setIsPublishing(false);
          return;
        }
      }

      const res = await fetch(
        `/api/masters/${master.admin_link_id}/publish`,
        { method: "PATCH" }
      );
      if (res.ok) {
        toast.success("Questionnaire published!");
        router.push("/dashboard/questionnaires");
      } else {
        const data = await res.json().catch(() => ({}));
        console.error("Publish failed:", data);
        toast.error(data.message || "Failed to publish");
      }
    } catch {
      toast.error("Failed to publish");
    } finally {
      setIsPublishing(false);
    }
  }, [questions, originalMap, master.admin_link_id, router]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, action: () => void) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        action();
      }
    },
    []
  );

  // ── Render ──
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/questionnaires"
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ArrowLeftIcon />
              <span className="hidden sm:inline">Back</span>
            </Link>
            <div className="h-5 w-px bg-slate-200" aria-hidden="true" />
            <div>
              <h1 className="text-lg font-semibold text-slate-800 leading-tight">
                {master.name}
              </h1>
            </div>
            <Badge
              variant={master.status === "published" ? "success" : "ghost"}
              className="uppercase text-[10px] tracking-wider"
            >
              {master.status}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {isDirty && (
              <span className="text-xs text-amber-600 font-medium hidden sm:inline">
                Unsaved changes
              </span>
            )}
            {master.status === "draft" && (
              <Button
                variant="default"
                className="bg-[#4A90A4] hover:bg-[#3d7a8c]"
                onClick={handlePublishClick}
                disabled={isPublishing}
              >
                {isPublishing ? "Publishing..." : "Publish"}
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* ─── Toolbar ─── */}
      <div className="sticky top-[57px] z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <div className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none">
                <SearchIcon />
              </div>
              <Input
                type="text"
                placeholder="Search questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                aria-label="Search questions by ID or text"
              />
            </div>

            {/* Section filter */}
            <Select
              value={sectionFilter}
              onValueChange={(val) => setSectionFilter(val as string)}
            >
              <SelectTrigger className="w-[180px]" aria-label="Filter by section">
                <SelectValue placeholder="All Sections" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sections</SelectItem>
                {sections.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status filter */}
            <Select
              value={statusFilter}
              onValueChange={(val) => setStatusFilter(val as StatusFilter)}
            >
              <SelectTrigger className="w-[140px]" aria-label="Filter by status">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="locked">Locked</SelectItem>
                <SelectItem value="hidden">Hidden</SelectItem>
                <SelectItem value="edited">Edited</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
              </SelectContent>
            </Select>

            {/* Bulk actions */}
            <div className="flex items-center gap-2 ml-auto">
              <Button
                variant="outline"
                size="sm"
                disabled={selectedIds.size === 0}
                onClick={bulkLock}
              >
                <LockIcon locked={true} />
                <span className="hidden sm:inline ml-1">Lock Selected</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={selectedIds.size === 0}
                onClick={bulkHide}
              >
                <EyeIcon hidden={true} />
                <span className="hidden sm:inline ml-1">Hide Selected</span>
              </Button>
            </div>
          </div>

          {/* Stats line */}
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-3">
            <span>{stats.showing} showing</span>
            <span aria-hidden="true" className="text-slate-300">|</span>
            <span>{stats.hidden} hidden</span>
            <span aria-hidden="true" className="text-slate-300">|</span>
            <span>{stats.locked} locked</span>
            {stats.edited > 0 && (
              <>
                <span aria-hidden="true" className="text-slate-300">|</span>
                <span className="text-amber-600">{stats.edited} edited</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ─── Question List ─── */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-4">
        {filteredQuestions.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <p className="text-lg font-medium">No questions found</p>
            <p className="text-sm mt-1">Try adjusting your search or filters.</p>
          </div>
        ) : (
          Array.from(questionsBySection.entries()).map(
            ([section, sectionQuestions]) => {
              const isCollapsed = collapsedSections.has(section);
              const sectionLockedCount = sectionQuestions.filter(
                (q) => q.is_locked
              ).length;
              const sectionHiddenCount = sectionQuestions.filter(
                (q) => q.is_hidden
              ).length;
              const allSectionSelected = sectionQuestions.every((q) =>
                selectedIds.has(q.id)
              );
              const someSectionSelected =
                !allSectionSelected &&
                sectionQuestions.some((q) => selectedIds.has(q.id));

              return (
                <div key={section} className="mb-3">
                  {/* Section header */}
                  <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-2.5 select-none">
                    <input
                      type="checkbox"
                      checked={allSectionSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = someSectionSelected;
                      }}
                      onChange={() => toggleSelectSection(sectionQuestions)}
                      className="checkbox checkbox-sm border-slate-300"
                      aria-label={`Select all in ${section}`}
                    />
                    <div
                      role="button"
                      tabIndex={0}
                      className="flex items-center gap-2 flex-1 cursor-pointer"
                      onClick={() => toggleSectionCollapse(section)}
                      onKeyDown={(e) =>
                        handleKeyDown(e, () =>
                          toggleSectionCollapse(section)
                        )
                      }
                      aria-expanded={!isCollapsed}
                      aria-label={`${section} section, ${sectionQuestions.length} questions`}
                    >
                      <ChevronIcon open={!isCollapsed} />
                      <span className="font-medium text-sm text-slate-800">
                        {section}
                      </span>
                      <span className="text-xs text-slate-500">
                        ({sectionQuestions.length} question
                        {sectionQuestions.length !== 1 ? "s" : ""}
                        {sectionLockedCount > 0 &&
                          `, ${sectionLockedCount} locked`}
                        {sectionHiddenCount > 0 &&
                          `, ${sectionHiddenCount} hidden`}
                        )
                      </span>
                    </div>
                  </div>

                  {/* Question rows */}
                  {!isCollapsed && (
                    <div className="mt-1 space-y-px">
                      {sectionQuestions.map((q) => {
                        const orig = originalMap.get(q.id);
                        const edited = orig
                          ? isQuestionEdited(q, orig)
                          : false;
                        const isSelected = selectedIds.has(q.id);

                        return (
                          <div
                            key={q.id}
                            className={`
                              flex items-center gap-2 sm:gap-3 px-3 py-2.5 border-b border-slate-200 transition-colors
                              ${q.is_hidden ? "opacity-50" : ""}
                              ${q.is_locked ? "border-l-4 border-l-[#4A90A4]" : "border-l-4 border-l-transparent"}
                              ${isSelected ? "bg-[#4A90A4]/5" : "bg-white hover:bg-slate-50"}
                            `}
                          >
                            {/* Checkbox */}
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(q.id)}
                              className="checkbox checkbox-sm border-slate-300 shrink-0"
                              aria-label="Select question"
                            />

                            {/* Question text */}
                            <span
                              className={`flex-1 text-sm text-slate-800 truncate min-w-0 ${
                                q.is_hidden ? "line-through" : ""
                              }`}
                              title={q.question_text}
                            >
                              {q.question_text}
                            </span>

                            {/* Badges */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              <Badge variant="ghost" className="text-[10px] hidden sm:inline-flex">
                                {q.answer_type}
                              </Badge>
                              {q.required && (
                                <Badge
                                  variant="info"
                                  className="text-[10px] hidden sm:inline-flex"
                                >
                                  REQ
                                </Badge>
                              )}
                              {q.is_locked && (
                                <Badge variant="primary" className="text-[10px]">
                                  LOCKED
                                </Badge>
                              )}
                              {q.is_hidden && (
                                <Badge variant="ghost" className="text-[10px]">
                                  HIDDEN
                                </Badge>
                              )}
                              {edited && (
                                <Badge variant="warning" className="text-[10px]">
                                  EDITED
                                </Badge>
                              )}
                            </div>

                            {/* Action buttons */}
                            <div className="flex items-center gap-0.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => toggleLock(q.id)}
                                className={`p-1.5 rounded-md transition-colors ${
                                  q.is_locked
                                    ? "text-[#4A90A4] bg-[#4A90A4]/10 hover:bg-[#4A90A4]/20"
                                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                                }`}
                                aria-label={
                                  q.is_locked
                                    ? "Unlock question"
                                    : "Lock question"
                                }
                              >
                                <LockIcon locked={q.is_locked} />
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleHide(q.id)}
                                className={`p-1.5 rounded-md transition-colors ${
                                  q.is_hidden
                                    ? "text-slate-400 bg-slate-100 hover:bg-slate-200"
                                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                                }`}
                                aria-label={
                                  q.is_hidden
                                    ? "Show question"
                                    : "Hide question"
                                }
                              >
                                <EyeIcon hidden={q.is_hidden} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingQuestionId(q.id)}
                                className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                                aria-label="Edit question"
                              >
                                <PencilIcon />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }
          )
        )}
      </main>

      {/* ─── Footer bar ─── */}
      {isDirty && (
        <div className="sticky bottom-0 z-20 border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 flex items-center justify-end gap-3">
            <Button variant="outline" onClick={handleDiscard} disabled={isSaving}>
              Discard Changes
            </Button>
            <Button
              variant="secondary"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Draft"}
            </Button>
            {master.status === "draft" && (
              <Button
                variant="default"
                className="bg-[#4A90A4] hover:bg-[#3d7a8c]"
                onClick={handlePublishClick}
                disabled={isPublishing || isSaving}
              >
                Publish
              </Button>
            )}
          </div>
        </div>
      )}

      {/* ─── Edit Slide-Over ─── */}
      {editingQuestion && (
        <EditSlideOver
          question={editingQuestion}
          onSave={handleSlideOverSave}
          onClose={handleSlideOverClose}
        />
      )}

      {/* ─── Publish Confirmation Dialog ─── */}
      <ChangesSummaryDialog
        open={showPublishDialog}
        onOpenChange={setShowPublishDialog}
        lockedCount={stats.locked}
        hiddenCount={stats.hidden}
        editedCount={stats.edited}
        changes={changesList}
        onConfirm={handlePublishConfirm}
        isPublishing={isPublishing}
      />
    </div>
  );
}
