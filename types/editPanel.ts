/**
 * Edit Panel Types
 *
 * Type definitions for the split-screen edit panel used in the instance review page.
 * Supports component-level editing (Settings, Content, Help, Logic) with structured changes.
 */

export type TabId = "settings" | "content" | "help" | "logic" | "review";

/**
 * Tab configuration for the edit panel
 */
export interface TabConfig {
  id: TabId;
  label: string;
  icon: string;
}

export const EDIT_PANEL_TABS: TabConfig[] = [
  { id: "settings", label: "Settings", icon: "Cog6Tooth" },
  { id: "content", label: "Content", icon: "PencilSquare" },
  { id: "help", label: "Help", icon: "QuestionMarkCircle" },
  { id: "logic", label: "Logic", icon: "ArrowsRightLeft" },
  { id: "review", label: "Review", icon: "CheckCircle" },
] as const;

/**
 * Changes to question settings (required field, etc.)
 */
export interface SettingsChanges {
  required?: {
    from: boolean;
    to: boolean;
  };
}

/**
 * Single option for a question (radio/checkbox)
 */
export interface OptionChange {
  text: string;
  characteristic: string;
  comment?: string;
}

/**
 * Modified option tracking
 */
export interface ModifiedOption {
  index: number;
  from: string;
  to: string;
  fromCharacteristic?: string;
  toCharacteristic?: string;
  comment?: string;
}

/**
 * Changes to question content (text, answer type, options)
 */
export interface ContentChanges {
  questionText?: {
    from: string;
    to: string;
  };
  answerType?: {
    from: string;
    to: string;
  };
  options?: {
    added: OptionChange[];
    modified: ModifiedOption[];
    removed: number[];
  };
}

/**
 * Changes to helper information (help content, web links)
 */
export interface HelpChanges {
  hasHelper?: {
    from: boolean;
    to: boolean;
  };
  helperName?: {
    from: string | null;
    to: string;
  };
  helperValue?: {
    from: string | null;
    to: string;
  };
  helperType?: {
    from: string | null;
    to: string;
  };
}

/**
 * Changes to conditional logic (free text description for now)
 */
export interface LogicChanges {
  description: string;
}

/**
 * All component changes combined
 */
export interface ComponentChanges {
  settings?: SettingsChanges;
  content?: ContentChanges;
  help?: HelpChanges;
  logic?: LogicChanges;
}

/**
 * Question data structure as used in the edit panel
 */
export interface EditableQuestion {
  id: number;
  questionId: string;
  category: string;
  questionText: string;
  answerType: string | null;
  answerOptions: string | null;
  characteristic: string | null;
  section: string | null;
  page: string | null;
  enableWhen: import("@/types/question").EnableWhen | null;
  hasHelper: boolean | null;
  helperType: string | null;
  helperName: string | null;
  helperValue: string | null;
  suggestionCount: number;
  required?: boolean;
}

/**
 * Validation errors for the edit panel
 */
export interface ValidationErrors {
  settings?: string[];
  content?: string[];
  help?: string[];
  logic?: string[];
  notes?: string;
}

/**
 * Full edit panel state
 */
export interface EditPanelState {
  selectedQuestionId: number | null;
  activeTab: TabId;
  changes: {
    settings: SettingsChanges | null;
    content: ContentChanges | null;
    help: HelpChanges | null;
    logic: LogicChanges | null;
  };
  submitterName: string;
  submitterEmail: string;
  notes: string;
  isDirty: boolean;
}

/**
 * Initial state for the edit panel
 */
export const INITIAL_EDIT_PANEL_STATE: EditPanelState = {
  selectedQuestionId: null,
  activeTab: "settings",
  changes: {
    settings: null,
    content: null,
    help: null,
    logic: null,
  },
  submitterName: "",
  submitterEmail: "",
  notes: "",
  isDirty: false,
};

/**
 * Validation constants
 */
export const VALIDATION_LIMITS = {
  MIN_NOTES_LENGTH: 50,
  MAX_NOTES_LENGTH: 2000,
  MAX_SUGGESTION_TEXT_LENGTH: 2000,
  MIN_OPTIONS_FOR_CHOICE: 2,
} as const;
