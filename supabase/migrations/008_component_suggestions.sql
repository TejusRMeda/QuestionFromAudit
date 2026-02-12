-- Add component_changes column for structured suggestion data
-- This supports the new split-screen panel feature with component-level editing

-- Add to instance_suggestions table (used by /instance/[trustLinkId] pages)
ALTER TABLE instance_suggestions
ADD COLUMN IF NOT EXISTS component_changes JSONB DEFAULT NULL;

COMMENT ON COLUMN instance_suggestions.component_changes IS 'Structured component-level changes: { settings?: SettingsChanges, content?: ContentChanges, help?: HelpChanges, logic?: LogicChanges }';

CREATE INDEX IF NOT EXISTS idx_instance_suggestions_component_changes
ON instance_suggestions USING GIN (component_changes);

-- Add to suggestions table (used by /review/[linkId] pages)
ALTER TABLE suggestions
ADD COLUMN IF NOT EXISTS component_changes JSONB DEFAULT NULL;

COMMENT ON COLUMN suggestions.component_changes IS 'Structured component-level changes: { settings?: SettingsChanges, content?: ContentChanges, help?: HelpChanges, logic?: LogicChanges }';

CREATE INDEX IF NOT EXISTS idx_suggestions_component_changes
ON suggestions USING GIN (component_changes);
