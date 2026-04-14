/**
 * Pure helpers for encoding/decoding TestingConfig in URL search params.
 *
 * Format: ?h=casod,changes&v=patient
 *   - h: comma list of HideableControl keys to hide
 *   - v: optional locked view style ("audit" | "patient")
 *
 * Used by both the GenerateTestingLinkModal (build) and the
 * /instance/[trustLinkId]/testing route (parse).
 */

import {
  HIDEABLE_CONTROLS,
  type HideableControl,
  type LockedViewStyle,
  type TestingConfig,
} from "@/types/testing";

const VALID_HIDEABLE = new Set<HideableControl>(HIDEABLE_CONTROLS.map((c) => c.key));
const VALID_VIEW_STYLES: LockedViewStyle[] = ["audit", "patient"];

/** Read a single search-param value from either a Next searchParams object or URLSearchParams. */
function readParam(
  source: URLSearchParams | Record<string, string | string[] | undefined>,
  key: string
): string | null {
  if (source instanceof URLSearchParams) {
    return source.get(key);
  }
  const raw = source[key];
  if (Array.isArray(raw)) return raw[0] ?? null;
  return raw ?? null;
}

export function parseTestingConfig(
  source: URLSearchParams | Record<string, string | string[] | undefined>
): TestingConfig {
  const hide = new Set<HideableControl>();
  const hideRaw = readParam(source, "h");
  if (hideRaw) {
    for (const part of hideRaw.split(",")) {
      const trimmed = part.trim() as HideableControl;
      if (VALID_HIDEABLE.has(trimmed)) hide.add(trimmed);
    }
  }

  const vRaw = readParam(source, "v");
  const lockedViewStyle: LockedViewStyle | null =
    vRaw && (VALID_VIEW_STYLES as string[]).includes(vRaw) ? (vRaw as LockedViewStyle) : null;

  return { hide, lockedViewStyle };
}

/**
 * Build a fully-qualified testing URL. Pass `origin` (e.g. window.location.origin)
 * to get an absolute URL suitable for copying to the clipboard; omit it to get
 * a relative path.
 */
export function buildTestingUrl(
  trustLinkId: string,
  config: TestingConfig,
  origin?: string
): string {
  const params = new URLSearchParams();

  if (config.hide.size > 0) {
    // Stable order matches HIDEABLE_CONTROLS so the URL is deterministic.
    const ordered = HIDEABLE_CONTROLS
      .map((c) => c.key)
      .filter((k) => config.hide.has(k));
    params.set("h", ordered.join(","));
  }
  if (config.lockedViewStyle) params.set("v", config.lockedViewStyle);

  const path = `/instance/${trustLinkId}/testing`;
  const qs = params.toString();
  const rel = qs ? `${path}?${qs}` : path;
  return origin ? `${origin}${rel}` : rel;
}

/** Convenience: is a given control hidden by this config? */
export function isHidden(config: TestingConfig | null | undefined, control: HideableControl): boolean {
  return !!config?.hide.has(control);
}
