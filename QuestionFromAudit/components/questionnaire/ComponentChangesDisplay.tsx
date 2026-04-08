"use client";

import {
  SettingsChanges,
  ContentChanges,
  HelpChanges,
  LogicChanges,
  NewQuestionData,
} from "@/types/editPanel";

interface ComponentChanges {
  settings?: SettingsChanges;
  content?: ContentChanges;
  help?: HelpChanges;
  logic?: LogicChanges;
  newQuestion?: NewQuestionData;
}

interface ComponentChangesDisplayProps {
  componentChanges: ComponentChanges | null;
  fallbackText?: string;
}

/**
 * Displays structured component changes in a readable format
 * Falls back to plain text if no structured changes are available
 */
export default function ComponentChangesDisplay({
  componentChanges,
  fallbackText,
}: ComponentChangesDisplayProps) {
  // If no component changes, show fallback text
  if (!componentChanges || Object.keys(componentChanges).length === 0) {
    return <span>{fallbackText || "No changes specified"}</span>;
  }

  const changes: { label: string; value: string; icon: string }[] = [];

  // Settings changes
  if (componentChanges.settings?.required) {
    const { from, to } = componentChanges.settings.required;
    changes.push({
      label: "Required",
      value: `${from ? "Required" : "Optional"} → ${to ? "Required" : "Optional"}`,
      icon: "⚙️",
    });
  }

  // Content changes
  if (componentChanges.content) {
    if (componentChanges.content.questionText) {
      changes.push({
        label: "Question Text",
        value: "Updated",
        icon: "📝",
      });
    }

    if (componentChanges.content.answerType) {
      const { from, to } = componentChanges.content.answerType;
      changes.push({
        label: "Answer Type",
        value: `${from || "None"} → ${to}`,
        icon: "🔄",
      });
    }

    if (componentChanges.content.options) {
      const { added, modified, removed } = componentChanges.content.options;
      const parts: string[] = [];
      if (added?.length) parts.push(`+${added.length} added`);
      if (modified?.length) parts.push(`${modified.length} modified`);
      if (removed?.length) parts.push(`-${removed.length} removed`);
      if (parts.length > 0) {
        changes.push({
          label: "Options",
          value: parts.join(", "),
          icon: "📋",
        });
      }
    }
  }

  // Help changes
  if (componentChanges.help) {
    if (componentChanges.help.hasHelper) {
      const { from, to } = componentChanges.help.hasHelper;
      changes.push({
        label: "Helper",
        value: `${from ? "Enabled" : "Disabled"} → ${to ? "Enabled" : "Disabled"}`,
        icon: "❓",
      });
    } else if (componentChanges.help.helperValue || componentChanges.help.helperName) {
      changes.push({
        label: "Helper Content",
        value: "Updated",
        icon: "❓",
      });
    }

    if (componentChanges.help.helperType) {
      changes.push({
        label: "Helper Type",
        value: `${componentChanges.help.helperType.from || "None"} → ${componentChanges.help.helperType.to}`,
        icon: "🔗",
      });
    }
  }

  // Logic changes
  if (componentChanges.logic?.description) {
    changes.push({
      label: "Logic",
      value: componentChanges.logic.description.length > 50
        ? componentChanges.logic.description.substring(0, 50) + "..."
        : componentChanges.logic.description,
      icon: "🔀",
    });
  }

  // New question suggestion
  if (componentChanges.newQuestion) {
    const { position, questionText } = componentChanges.newQuestion;
    changes.push({
      label: "New Question",
      value: `${position === "before" ? "Before" : "After"} anchor: "${questionText.length > 60 ? questionText.substring(0, 60) + "..." : questionText}"`,
      icon: "➕",
    });
  }

  // If no changes were parsed, fall back to text
  if (changes.length === 0) {
    return <span>{fallbackText || "Component changes suggested"}</span>;
  }

  return (
    <div className="space-y-2">
      {changes.map((change, idx) => (
        <div key={idx} className="flex items-start gap-2">
          <span className="text-base-content/60 text-sm w-5">{change.icon}</span>
          <div className="flex-1">
            <span className="font-medium text-sm text-base-content/80">
              {change.label}:
            </span>{" "}
            <span className="text-sm text-base-content">{change.value}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Compact inline version for use in tables or lists
 */
export function ComponentChangesInline({
  componentChanges,
  fallbackText,
}: ComponentChangesDisplayProps) {
  // If no component changes, show fallback text
  if (!componentChanges || Object.keys(componentChanges).length === 0) {
    return <span className="text-base-content/70">{fallbackText || "No changes specified"}</span>;
  }

  const parts: string[] = [];

  // Settings changes
  if (componentChanges.settings?.required) {
    const { to } = componentChanges.settings.required;
    parts.push(`Required: ${to ? "Yes" : "No"}`);
  }

  // Content changes
  if (componentChanges.content) {
    if (componentChanges.content.questionText) {
      parts.push("Question Text: Updated");
    }
    if (componentChanges.content.answerType) {
      parts.push(`Answer Type: ${componentChanges.content.answerType.from} → ${componentChanges.content.answerType.to}`);
    }
    if (componentChanges.content.options) {
      const { added, modified, removed } = componentChanges.content.options;
      const optionParts: string[] = [];
      if (added?.length) optionParts.push(`+${added.length}`);
      if (modified?.length) optionParts.push(`~${modified.length}`);
      if (removed?.length) optionParts.push(`-${removed.length}`);
      if (optionParts.length > 0) {
        parts.push(`Options: ${optionParts.join(", ")}`);
      }
    }
  }

  // Help changes
  if (componentChanges.help) {
    if (componentChanges.help.hasHelper) {
      parts.push(`Helper: ${componentChanges.help.hasHelper.to ? "Enabled" : "Disabled"}`);
    } else if (componentChanges.help.helperValue) {
      parts.push("Helper: Updated");
    }
  }

  // Logic changes
  if (componentChanges.logic?.description) {
    parts.push("Logic: Changed");
  }

  // New question
  if (componentChanges.newQuestion) {
    parts.push(`New Question (${componentChanges.newQuestion.position})`);
  }

  if (parts.length === 0) {
    return <span className="text-base-content/70">{fallbackText}</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {parts.map((part, idx) => (
        <span
          key={idx}
          className="inline-flex items-center px-2 py-0.5 rounded-md bg-base-200 text-xs font-medium text-base-content/80"
        >
          {part}
        </span>
      ))}
    </div>
  );
}
