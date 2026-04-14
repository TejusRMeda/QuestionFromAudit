"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  HIDEABLE_CONTROLS,
  type HideableControl,
  type LockedViewStyle,
  type TestingConfig,
} from "@/types/testing";
import { buildTestingUrl } from "@/lib/testingConfig";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trustLinkId: string;
  trustName: string;
  /**
   * App origin (e.g. "https://example.com"). Optional — if omitted, the URL
   * shown is relative. Useful for tests; in the browser pass
   * `window.location.origin`.
   */
  origin?: string;
}

const VIEW_STYLE_OPTIONS: Array<{ value: LockedViewStyle | ""; label: string }> = [
  { value: "", label: "Reviewer can toggle" },
  { value: "audit", label: "Audit only" },
  { value: "patient", label: "Patient preview only" },
];

export default function GenerateTestingLinkModal({
  open,
  onOpenChange,
  trustLinkId,
  trustName,
  origin,
}: Props) {
  // Sensible defaults for first-time-reviewer usability sessions: hide the
  // CASOD report and Change-Requests admin tabs.
  const [hide, setHide] = useState<Set<HideableControl>>(
    () => new Set<HideableControl>(["casod", "changes"])
  );
  const [lockedViewStyle, setLockedViewStyle] = useState<LockedViewStyle | "">("");

  const config: TestingConfig = useMemo(
    () => ({
      hide,
      lockedViewStyle: lockedViewStyle || null,
    }),
    [hide, lockedViewStyle]
  );

  const url = useMemo(
    () => buildTestingUrl(trustLinkId, config, origin),
    [trustLinkId, config, origin]
  );

  const toggleHide = (key: HideableControl) => {
    setHide((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Testing link copied to clipboard");
      onOpenChange(false);
    } catch {
      toast.error("Failed to copy link");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate testing link</DialogTitle>
          <DialogDescription>
            Build a slimmed-down review link for usability testing with{" "}
            <span className="font-medium">{trustName}</span>. Suggestions submitted
            through this link are tagged as test-session and hidden from the real
            review queue by default.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 py-2">
          <fieldset>
            <legend className="text-sm font-medium text-slate-700 mb-2">
              Hide these controls
            </legend>
            <div className="flex flex-col gap-2">
              {HIDEABLE_CONTROLS.map((c) => {
                const id = `hide-${c.key}`;
                const checked = hide.has(c.key);
                return (
                  <label
                    key={c.key}
                    htmlFor={id}
                    className="flex items-start gap-2 cursor-pointer rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50 transition-colors"
                  >
                    <input
                      id={id}
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleHide(c.key)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#4A90A4] focus:ring-[#4A90A4]"
                    />
                    <span className="flex flex-col">
                      <span className="text-sm font-medium text-slate-800">{c.label}</span>
                      <span className="text-xs text-slate-500">{c.description}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="view-style-lock">View style</Label>
            <select
              id="view-style-lock"
              value={lockedViewStyle}
              onChange={(e) => setLockedViewStyle(e.target.value as LockedViewStyle | "")}
              className="flex h-9 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {VIEW_STYLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="testing-url-preview">Link preview</Label>
            <input
              id="testing-url-preview"
              readOnly
              value={url}
              onFocus={(e) => e.currentTarget.select()}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-700"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCopy}>Copy link</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
