"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Fragment, useState, useEffect, useRef, useCallback, KeyboardEvent } from "react";

interface Questionnaire {
  id: number;
  name: string;
  admin_link_id: string;
}

interface CreatedLink {
  questionnaireName: string;
  trustLinkId: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  questionnaires: Questionnaire[];
  /** Pre-fill trust name and skip to form selection (for "Add Forms" flow) */
  initialTrustName?: string;
  /** Questionnaire admin_link_ids already shared with this trust (to exclude from selection) */
  excludeAdminLinkIds?: string[];
}

type Step = 1 | 2 | 3 | 4 | 5;

const STEP_LABELS = ["Name", "Members", "Forms", "Review", "Share"];

export default function CreateTrustModal({ isOpen, onClose, onCreated, questionnaires, initialTrustName, excludeAdminLinkIds }: Props) {
  const isAddFormsMode = !!initialTrustName;
  const [step, setStep] = useState<Step>(isAddFormsMode ? 3 : 1);
  const [trustName, setTrustName] = useState(initialTrustName || "");
  const [memberInput, setMemberInput] = useState("");
  const [members, setMembers] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [createdLinks, setCreatedLinks] = useState<CreatedLink[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(8);

  const nameInputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(isAddFormsMode ? 3 : 1);
      setTrustName(initialTrustName || "");
      setMemberInput("");
      setMembers([]);
      setSelectedIds([]);
      setIsCreating(false);
      setCreatedLinks([]);
      setError(null);
      setCopiedIndex(null);
      setCountdown(8);
    }
  }, [isOpen, isAddFormsMode, initialTrustName]);

  const handleDone = useCallback(() => {
    onCreated();
    onClose();
  }, [onCreated, onClose]);

  // Auto-close countdown on step 5
  useEffect(() => {
    if (step !== 5) return;
    setCountdown(8);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleDone();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [step, handleDone]);

  function addMember() {
    const email = memberInput.trim();
    if (!email) return;
    if (members.includes(email)) {
      setMemberInput("");
      return;
    }
    setMembers((prev) => [...prev, email]);
    setMemberInput("");
  }

  function removeMember(email: string) {
    setMembers((prev) => prev.filter((m) => m !== email));
  }

  function handleMemberKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addMember();
    }
  }

  function toggleQuestionnaire(adminLinkId: string) {
    setSelectedIds((prev) =>
      prev.includes(adminLinkId) ? prev.filter((id) => id !== adminLinkId) : [...prev, adminLinkId]
    );
  }

  async function handleCreate() {
    setIsCreating(true);
    setError(null);
    const links: CreatedLink[] = [];

    try {
      for (const adminLinkId of selectedIds) {
        const q = questionnaires.find((q) => q.admin_link_id === adminLinkId);
        const res = await fetch(`/api/masters/${adminLinkId}/instances`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ trustName }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || `Failed to create instance for "${q?.name}"`);
        }

        const data = await res.json();
        links.push({
          questionnaireName: q?.name ?? adminLinkId,
          trustLinkId: data.trustLinkId,
        });
      }

      setCreatedLinks(links);
      setStep(5);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsCreating(false);
    }
  }

  async function copyLink(url: string, index: number) {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      // fallback: do nothing
    }
  }

  function canAdvance(): boolean {
    if (step === 1) return trustName.trim().length > 0;
    if (step === 3) return selectedIds.length > 0;
    return true;
  }

  function handleNext() {
    if (!canAdvance()) return;
    setStep((prev) => (prev < 4 ? ((prev + 1) as Step) : prev));
  }

  function handleBack() {
    const minStep = isAddFormsMode ? 3 : 1;
    setStep((prev) => (prev > minStep ? ((prev - 1) as Step) : prev));
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const availableQuestionnaires = excludeAdminLinkIds
    ? questionnaires.filter((q) => !excludeAdminLinkIds.includes(q.admin_link_id))
    : questionnaires;
  const selectedQuestionnaires = questionnaires.filter((q) => selectedIds.includes(q.admin_link_id));

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !isCreating) onClose(); }}>
      <DialogContent className="w-full sm:max-w-md bg-white rounded-2xl shadow-xl overflow-hidden p-0" showCloseButton={false}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
                  <DialogTitle className="text-base font-semibold text-slate-800">
                    {isAddFormsMode ? `Add Forms to ${initialTrustName}` : "Create New Trust"}
                  </DialogTitle>
                  {!isCreating && (
                    <button
                      type="button"
                      onClick={onClose}
                      className="text-slate-500 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-100"
                      aria-label="Close"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Step indicator */}
                <div className="px-6 py-4 border-b border-slate-100">
                  <div className="flex items-center">
                    {STEP_LABELS.map((label, i) => {
                      const stepNum = (i + 1) as Step;
                      const isDone = step > stepNum;
                      const isActive = step === stepNum;
                      return (
                        <Fragment key={label}>
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                                isActive
                                  ? "bg-[#4A90A4]"
                                  : isDone
                                  ? "bg-slate-300"
                                  : "bg-slate-100 border border-slate-200"
                              }`}
                            />
                            <span className="text-[10px] text-slate-500 mt-1 w-10 text-center">{label}</span>
                          </div>
                          {i < STEP_LABELS.length - 1 && (
                            <div
                              className={`flex-1 h-px mx-1 mb-4 transition-colors ${
                                isDone ? "bg-slate-300" : "bg-slate-100"
                              }`}
                            />
                          )}
                        </Fragment>
                      );
                    })}
                  </div>
                </div>

                {/* Step content */}
                <div className="px-6 py-6 min-h-[200px]">
                  {step === 1 && (
                    <Step1
                      trustName={trustName}
                      onChange={setTrustName}
                      inputRef={nameInputRef}
                      onEnter={handleNext}
                    />
                  )}
                  {step === 2 && (
                    <Step2
                      memberInput={memberInput}
                      onMemberInputChange={setMemberInput}
                      members={members}
                      onAdd={addMember}
                      onRemove={removeMember}
                      onKeyDown={handleMemberKeyDown}
                    />
                  )}
                  {step === 3 && (
                    <Step3
                      questionnaires={availableQuestionnaires}
                      selectedIds={selectedIds}
                      onToggle={toggleQuestionnaire}
                    />
                  )}
                  {step === 4 && (
                    <Step4
                      trustName={trustName}
                      members={members}
                      selectedQuestionnaires={selectedQuestionnaires}
                      isCreating={isCreating}
                      error={error}
                      onCreate={handleCreate}
                    />
                  )}
                  {step === 5 && (
                    <Step5
                      createdLinks={createdLinks}
                      members={members}
                      origin={origin}
                      copiedIndex={copiedIndex}
                      onCopy={copyLink}
                    />
                  )}
                </div>

                {/* Footer */}
                {step < 5 && (
                  <div className="flex items-center justify-between px-6 pb-5 pt-2 border-t border-slate-100">
                    <div>
                      {step > 1 && step < 4 && (
                        <button
                          type="button"
                          onClick={handleBack}
                          className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
                        >
                          Back
                        </button>
                      )}
                      {step === 4 && !isCreating && (
                        <button
                          type="button"
                          onClick={handleBack}
                          className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
                        >
                          Back
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {step === 2 && (
                        <button
                          type="button"
                          onClick={handleNext}
                          className="text-sm text-slate-500 hover:text-slate-600 transition-colors"
                        >
                          Skip
                        </button>
                      )}
                      {step < 4 && (
                        <button
                          type="button"
                          onClick={handleNext}
                          disabled={!canAdvance()}
                          className="bg-[#4A90A4] hover:bg-[#3d7a8c] disabled:bg-slate-200 disabled:text-slate-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                        >
                          Next
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {step === 5 && (
                  <div className="flex justify-end px-6 pb-5 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleDone}
                      className="bg-[#4A90A4] hover:bg-[#3d7a8c] text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
                    >
                      Done (<span aria-live="polite">{countdown}</span>)
                    </button>
                  </div>
                )}
      </DialogContent>
    </Dialog>
  );
}

// ── Step sub-components ──────────────────────────────────────────────────────

function Step1({
  trustName,
  onChange,
  inputRef,
  onEnter,
}: {
  trustName: string;
  onChange: (v: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onEnter: () => void;
}) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-slate-800 mb-1">What&apos;s the name of this trust?</h2>
      <p className="text-xs text-slate-500 mb-4">e.g. NHS Foundation Trust, Barts Health</p>
      <input
        ref={inputRef}
        type="text"
        value={trustName}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onEnter()}
        placeholder="Trust name"
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#4A90A4]/30 focus:border-[#4A90A4]/50"
      />
    </div>
  );
}

function Step2({
  memberInput,
  onMemberInputChange,
  members,
  onAdd,
  onRemove,
  onKeyDown,
}: {
  memberInput: string;
  onMemberInputChange: (v: string) => void;
  members: string[];
  onAdd: () => void;
  onRemove: (email: string) => void;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
}) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-slate-800 mb-1">Who are the internal members?</h2>
      <p className="text-xs text-slate-500 mb-4">Their email addresses will be shown when you share the link.</p>

      {members.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {members.map((email) => (
            <span key={email} className="bg-slate-100 text-slate-700 text-xs rounded-full px-2.5 py-1 flex items-center gap-1">
              {email}
              <button
                type="button"
                onClick={() => onRemove(email)}
                className="text-slate-500 hover:text-slate-600 ml-0.5 min-w-6 min-h-6 flex items-center justify-center"
                aria-label={`Remove ${email}`}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="email"
          value={memberInput}
          onChange={(e) => onMemberInputChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="name@example.com"
          className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#4A90A4]/30 focus:border-[#4A90A4]/50"
        />
        <button
          type="button"
          onClick={onAdd}
          disabled={!memberInput.trim()}
          className="bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 text-sm font-medium px-3 py-2 rounded-lg transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  );
}

function Step3({
  questionnaires,
  selectedIds,
  onToggle,
}: {
  questionnaires: Questionnaire[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  if (questionnaires.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-slate-500 mb-3">No questionnaires available.</p>
        <a href="/dashboard/questionnaires" className="text-sm text-[#4A90A4] hover:underline">
          Upload a questionnaire first →
        </a>
      </div>
    );
  }

  const selectedQuestionnaires = questionnaires.filter((q) => selectedIds.includes(q.admin_link_id));

  return (
    <div>
      <h2 className="text-sm font-semibold text-slate-800 mb-1">Which questionnaires to share?</h2>
      <p className="text-xs text-slate-500 mb-4">Select one or more questionnaires to share with this trust.</p>

      {selectedQuestionnaires.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {selectedQuestionnaires.map((q) => (
            <span key={q.admin_link_id} className="bg-slate-100 text-slate-700 text-xs rounded-full px-2.5 py-1 flex items-center gap-1">
              {q.name}
              <button
                type="button"
                onClick={() => onToggle(q.admin_link_id)}
                className="text-slate-500 hover:text-slate-600 ml-0.5"
                aria-label={`Deselect ${q.name}`}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="border border-slate-200 rounded-lg overflow-hidden max-h-52 overflow-y-auto">
        {questionnaires.map((q, i) => {
          const isSelected = selectedIds.includes(q.admin_link_id);
          return (
            <button
              key={q.admin_link_id}
              type="button"
              onClick={() => onToggle(q.admin_link_id)}
              aria-pressed={isSelected}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                i > 0 ? "border-t border-slate-100" : ""
              } ${isSelected ? "bg-[#4A90A4]/5" : "hover:bg-slate-50"}`}
            >
              <div
                className={`w-4 h-4 rounded flex-shrink-0 border flex items-center justify-center transition-colors ${
                  isSelected ? "bg-[#4A90A4] border-[#4A90A4]" : "border-slate-300 bg-white"
                }`}
              >
                {isSelected && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-sm text-slate-700 truncate">{q.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Step4({
  trustName,
  members,
  selectedQuestionnaires,
  isCreating,
  error,
  onCreate,
}: {
  trustName: string;
  members: string[];
  selectedQuestionnaires: Questionnaire[];
  isCreating: boolean;
  error: string | null;
  onCreate: () => void;
}) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-slate-800 mb-4">Review & Create</h2>

      <div className="bg-slate-50 rounded-xl p-4 space-y-3 mb-5">
        <div>
          <p className="text-xs text-slate-500 mb-0.5">Trust name</p>
          <p className="text-sm font-medium text-slate-800">{trustName}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-0.5">Members</p>
          <p className="text-sm text-slate-700">{members.length > 0 ? members.join(", ") : "None"}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1">Questionnaires</p>
          <ul className="space-y-0.5">
            {selectedQuestionnaires.map((q) => (
              <li key={q.admin_link_id} className="text-sm text-slate-700 flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-[#4A90A4] flex-shrink-0" />
                {q.name}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <button
        type="button"
        onClick={onCreate}
        disabled={isCreating}
        className="w-full bg-[#4A90A4] hover:bg-[#3d7a8c] disabled:bg-slate-200 disabled:text-slate-500 text-white text-sm font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {isCreating ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Creating…
          </>
        ) : (
          "Create Trust"
        )}
      </button>

      {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
    </div>
  );
}

function Step5({
  createdLinks,
  members,
  origin,
  copiedIndex,
  onCopy,
}: {
  createdLinks: CreatedLink[];
  members: string[];
  origin: string;
  copiedIndex: number | null;
  onCopy: (url: string, index: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-sm font-semibold text-slate-800">Trust created!</h2>
      </div>

      {members.length > 0 && (
        <div className="bg-blue-50 rounded-lg px-3 py-2.5 mb-4">
          <p className="text-xs text-blue-700 font-medium mb-1">Send to:</p>
          <p className="text-xs text-blue-600">{members.join(", ")}</p>
        </div>
      )}

      <div className="space-y-3">
        {createdLinks.map((link, i) => {
          const url = `${origin}/instance/${link.trustLinkId}`;
          return (
            <div key={i} className="border border-slate-200 rounded-xl p-3">
              <p className="text-xs font-medium text-slate-700 mb-2 truncate">{link.questionnaireName}</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs text-slate-500 bg-slate-50 px-2 py-1.5 rounded-lg truncate border border-slate-100 font-mono">
                  {url}
                </code>
                <button
                  type="button"
                  onClick={() => onCopy(url, i)}
                  className={`flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                    copiedIndex === i
                      ? "bg-green-100 text-green-700"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  {copiedIndex === i ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
