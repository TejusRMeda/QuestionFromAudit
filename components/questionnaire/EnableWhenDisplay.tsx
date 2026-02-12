import { TranslatedEnableWhen } from "@/lib/enableWhen";

interface EnableWhenDisplayProps {
  translatedEnableWhen: TranslatedEnableWhen;
}

/**
 * Displays the conditional logic for a question in human-readable format
 */
export default function EnableWhenDisplay({
  translatedEnableWhen,
}: EnableWhenDisplayProps) {
  const { conditions, logic } = translatedEnableWhen;

  if (conditions.length === 0) {
    return null;
  }

  return (
    <div className="text-sm text-base-content/70 mb-3">
      <span className="font-medium">Shown when: </span>
      {conditions.map((condition, index) => (
        <span key={index}>
          {condition.raw ? (
            // Raw condition - show characteristic name in monospace
            <span className="font-mono text-xs bg-base-200 px-1 py-0.5 rounded">
              {condition.readable}
            </span>
          ) : (
            // Translated condition
            <span>
              <span className="text-primary">&ldquo;{condition.questionText}&rdquo;</span>
              {condition.optionText ? (
                <>
                  {" is answered "}
                  <span className="text-primary">&ldquo;{condition.optionText}&rdquo;</span>
                </>
              ) : (
                <span>
                  {" "}
                  {condition.operator === "=" && condition.value === "true"
                    ? "is answered"
                    : condition.operator === "=" && condition.value === "false"
                    ? "is not answered"
                    : `${condition.operator} ${condition.value || ""}`}
                </span>
              )}
            </span>
          )}
          {condition.logicalOp && (
            <span className="mx-1 font-medium text-base-content/50">
              {logic === "OR" ? "or" : "and"}
            </span>
          )}
        </span>
      ))}
    </div>
  );
}
