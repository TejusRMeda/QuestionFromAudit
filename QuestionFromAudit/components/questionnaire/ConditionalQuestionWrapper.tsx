import { ReactNode } from "react";
import EnableWhenDisplay from "./EnableWhenDisplay";
import { TranslatedEnableWhen } from "@/lib/enableWhen";

interface ConditionalQuestionWrapperProps {
  translatedEnableWhen: TranslatedEnableWhen;
  children: ReactNode;
}

/**
 * Visual container for conditional questions
 * Shows a left border indicator and the EnableWhen condition
 */
export default function ConditionalQuestionWrapper({
  translatedEnableWhen,
  children,
}: ConditionalQuestionWrapperProps) {
  return (
    <div className="border-l-4 border-sky-400 pl-4">
      <EnableWhenDisplay translatedEnableWhen={translatedEnableWhen} />
      {children}
    </div>
  );
}
