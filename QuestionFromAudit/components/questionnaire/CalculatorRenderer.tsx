"use client";

import { useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import {
  CalculatorConfig,
  CalculatorFieldConfig,
  parseCalculatorAnswer,
  serializeCalculatorAnswer,
  CalculatorValues,
} from "@/lib/calculators";

interface CalculatorRendererProps {
  config: CalculatorConfig;
  questionId: number;
  currentAnswer: string | string[] | undefined;
  onAnswerChange: (questionId: number, value: string) => void;
  variant: "default" | "patient";
}

export default function CalculatorRenderer({
  config,
  questionId,
  currentAnswer,
  onAnswerChange,
  variant,
}: CalculatorRendererProps) {
  const values = useMemo(
    () => parseCalculatorAnswer(currentAnswer),
    [currentAnswer]
  );

  const computeAndUpdate = useCallback(
    (fieldKey: string, rawValue: string) => {
      const updated: CalculatorValues = { ...values, [fieldKey]: rawValue };

      // Build numeric inputs for compute
      const numericInputs: Record<string, number | null> = {};
      for (const field of config.fields) {
        if (field.role === "input") {
          const v = field.key === fieldKey ? rawValue : updated[field.key];
          const num = v != null && v !== "" ? parseFloat(v) : null;
          numericInputs[field.key] = num != null && !isNaN(num) ? num : null;
        }
      }

      // Compute outputs
      const outputs = config.compute(numericInputs);
      for (const field of config.fields) {
        if (field.role === "output") {
          const val = outputs[field.key];
          updated[field.key] =
            val != null
              ? val.toFixed(field.decimalPlaces ?? 1)
              : "";
        }
      }

      onAnswerChange(questionId, serializeCalculatorAnswer(updated));
    },
    [values, config, questionId, onAnswerChange]
  );

  const isPatient = variant === "patient";

  return (
    <div
      className={isPatient ? "pt-2 space-y-4" : "space-y-3"}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Input fields */}
      {config.fields
        .filter((f) => f.role === "input")
        .map((field) => (
          <InputField
            key={field.key}
            field={field}
            value={values[field.key] ?? ""}
            onChange={(val) => computeAndUpdate(field.key, val)}
            isPatient={isPatient}
          />
        ))}

      {/* Output fields */}
      {config.fields
        .filter((f) => f.role === "output")
        .map((field) => (
          <OutputField
            key={field.key}
            field={field}
            value={values[field.key] ?? ""}
            isPatient={isPatient}
          />
        ))}

      {/* Conversion note */}
      {config.conversionNote && (
        <p
          className={`text-slate-500 ${isPatient ? "text-sm mt-3" : "text-xs mt-2"}`}
        >
          {config.conversionNote}
        </p>
      )}

      {/* Formula */}
      <p
        className={`text-slate-500 italic ${isPatient ? "text-sm" : "text-xs"}`}
      >
        {config.formulaDescription}
      </p>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────

function InputField({
  field,
  value,
  onChange,
  isPatient,
}: {
  field: CalculatorFieldConfig;
  value: string;
  onChange: (val: string) => void;
  isPatient: boolean;
}) {
  if (isPatient) {
    return (
      <div className="flex items-center gap-3">
        <label className="text-lg font-medium text-slate-700 w-20 shrink-0">
          {field.label}
        </label>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min={field.min}
          max={field.max}
          step={field.step}
          placeholder={field.label}
          className="flex-1 border border-gray-500 rounded-lg px-3 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-[#4A90A4] focus:border-[#4A90A4]"
          onClick={(e) => e.stopPropagation()}
        />
        <span className="text-base text-slate-500 w-12 shrink-0">
          {field.unit}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-slate-600 w-16 shrink-0">
        {field.label}
      </label>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={field.min}
        max={field.max}
        step={field.step}
        placeholder={field.label}
        className="flex-1"
        onClick={(e) => e.stopPropagation()}
      />
      <span className="text-xs text-slate-500 w-10 shrink-0">{field.unit}</span>
    </div>
  );
}

function OutputField({
  field,
  value,
  isPatient,
}: {
  field: CalculatorFieldConfig;
  value: string;
  isPatient: boolean;
}) {
  const hasValue = value !== "";

  if (isPatient) {
    return (
      <div className="flex items-center gap-3 border-t border-slate-200 pt-4 mt-2">
        <span className="text-lg font-semibold text-slate-700 w-20 shrink-0">
          {field.label}
        </span>
        <span
          className={`text-2xl font-bold ${hasValue ? "text-[#4A90A4]" : "text-slate-300"}`}
        >
          {hasValue ? value : "—"}
        </span>
        {hasValue && (
          <span className="text-base text-slate-500">{field.unit}</span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-2">
      <span className="text-sm font-medium text-slate-600 w-16 shrink-0">
        {field.label}
      </span>
      <span
        className={`text-lg font-semibold ${hasValue ? "text-[#4A90A4]" : "text-slate-300"}`}
      >
        {hasValue ? value : "—"}
      </span>
      {hasValue && (
        <span className="text-xs text-slate-500">{field.unit}</span>
      )}
    </div>
  );
}
