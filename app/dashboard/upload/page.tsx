"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Papa from "papaparse";
import toast from "react-hot-toast";
import {
  MyPreOpCsvRow,
  ParsedQuestion,
  MYPREOP_REQUIRED_COLUMNS,
  MYPREOP_ITEM_TYPES,
  ITEM_TYPES_REQUIRING_OPTIONS,
  ITEM_TYPES_NO_OPTIONS,
  groupRowsByQuestion,
  rowsToQuestion,
  MyPreOpItemType,
} from "@/types/question";

interface ValidationResult {
  questions: ParsedQuestion[];
  warnings: string[];
}

export default function DashboardUploadPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateCSV = (file: File): Promise<ValidationResult> => {
    return new Promise((resolve, reject) => {
      Papa.parse<MyPreOpCsvRow>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const headers = results.meta.fields || [];

          // Check for required columns
          const missingColumns = MYPREOP_REQUIRED_COLUMNS.filter(
            (col) => !headers.includes(col)
          );
          if (missingColumns.length > 0) {
            reject(`Missing required columns: ${missingColumns.join(", ")}`);
            return;
          }

          const rows = results.data as MyPreOpCsvRow[];
          if (rows.length === 0) {
            reject("CSV file contains no data rows");
            return;
          }

          // Group rows by Id to create questions
          const groupedRows = groupRowsByQuestion(rows);

          if (groupedRows.size === 0) {
            reject("No valid questions found in CSV");
            return;
          }

          if (groupedRows.size > 2000) {
            reject("CSV file exceeds maximum of 2000 questions");
            return;
          }

          const warnings: string[] = [];
          const questions: ParsedQuestion[] = [];
          const sectionCounts: Record<string, number> = {};

          // Process each group of rows into a question
          for (const [id, questionRows] of groupedRows) {
            const rowNums = questionRows
              .map((_, i) => rows.indexOf(questionRows[i]) + 2)
              .join(", ");

            try {
              const question = rowsToQuestion(questionRows);

              // Validate Id
              if (!question.id) {
                reject(`Rows ${rowNums}: Id is empty`);
                return;
              }

              // Validate Section (used as category)
              if (!question.section) {
                reject(`Question ${question.id}: Section is empty`);
                return;
              }

              // Track section counts for warnings
              sectionCounts[question.section] =
                (sectionCounts[question.section] || 0) + 1;

              // Validate ItemType
              const itemType = question.itemType as MyPreOpItemType;
              if (!itemType) {
                reject(`Question ${question.id}: ItemType is required`);
                return;
              }
              if (!MYPREOP_ITEM_TYPES.includes(itemType)) {
                reject(
                  `Question ${question.id}: ItemType must be one of: ${MYPREOP_ITEM_TYPES.join(", ")} (got "${question.itemType}")`
                );
                return;
              }

              // Validate options based on item type
              if (ITEM_TYPES_REQUIRING_OPTIONS.includes(itemType)) {
                // radio and checkbox require 2+ options
                if (question.options.length < 2) {
                  reject(
                    `Question ${question.id}: ${itemType} type requires at least 2 options (found ${question.options.length})`
                  );
                  return;
                }
              } else if (ITEM_TYPES_NO_OPTIONS.includes(itemType)) {
                // These types should have empty options (but we allow them for flexibility)
                if (question.options.length > 0) {
                  warnings.push(
                    `Question ${question.id}: ${itemType} type typically has no options, but ${question.options.length} were provided`
                  );
                }
              }

              // Validate helper fields
              if (question.hasHelper) {
                if (!question.helperType) {
                  warnings.push(
                    `Question ${question.id}: HasHelper is TRUE but HelperType is empty`
                  );
                }
                if (!question.helperValue) {
                  warnings.push(
                    `Question ${question.id}: HasHelper is TRUE but HelperValue is empty`
                  );
                }
              }

              // Validate Question text length (allow empty for text-paragraph, age)
              if (question.questionText.length > 1000) {
                reject(
                  `Question ${question.id}: Question text exceeds 1000 character limit`
                );
                return;
              }

              // Warnings for many options
              if (question.options.length > 20) {
                warnings.push(
                  `Question ${question.id}: More than 20 options may affect usability`
                );
              }

              // Warnings for long options
              question.options.forEach((opt, idx) => {
                if (opt.value.length > 100) {
                  warnings.push(
                    `Question ${question.id}: Option ${idx + 1} exceeds 100 characters`
                  );
                }
              });

              questions.push(question);
            } catch (error) {
              reject(
                `Error processing question ${id}: ${error instanceof Error ? error.message : "Unknown error"}`
              );
              return;
            }
          }

          // Check for single-question sections (warning only)
          Object.entries(sectionCounts).forEach(([section, count]) => {
            if (count === 1) {
              warnings.push(`Section "${section}" has only 1 question`);
            }
          });

          resolve({ questions, warnings });
        },
        error: (error) => {
          reject(`Failed to parse CSV: ${error.message}`);
        },
      });
    });
  };

  const handleFileSelect = async (selectedFile: File) => {
    setValidationError(null);
    setValidationWarnings([]);
    setParsedQuestions([]);

    if (!selectedFile.name.endsWith(".csv")) {
      setValidationError("Please select a CSV file");
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setValidationError("File exceeds 5MB limit");
      return;
    }

    try {
      const result = await validateCSV(selectedFile);
      setFile(selectedFile);
      setParsedQuestions(result.questions);
      setValidationWarnings(result.warnings);

      if (result.warnings.length > 0) {
        toast.success(
          `Validated ${result.questions.length} questions (${result.warnings.length} warnings)`
        );
      } else {
        toast.success(`Validated ${result.questions.length} questions`);
      }
    } catch (error) {
      setValidationError(error as string);
      setFile(null);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!name.trim()) {
      toast.error("Please enter a questionnaire name");
      return;
    }
    if (!file || parsedQuestions.length === 0) {
      toast.error("Please select a valid CSV file");
      return;
    }

    setIsUploading(true);
    try {
      const response = await fetch("/api/masters", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          questions: parsedQuestions,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Upload failed");
      }

      toast.success("Master questionnaire created successfully!");

      // Redirect back to dashboard
      router.push("/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Back to Dashboard link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-base-content/60 hover:text-base-content mb-6"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Dashboard
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Upload Master Questionnaire</h1>
          <p className="text-base-content/60 mt-2">
            Upload a CSV file to create a reusable questionnaire template
          </p>
        </div>

        <div className="bg-base-100 rounded-xl shadow-lg p-8">
          {/* Questionnaire Name Input */}
          <div className="mb-6">
            <label className="label">
              <span className="label-text font-medium">Questionnaire Name</span>
            </label>
            <input
              type="text"
              placeholder="Enter questionnaire name (e.g., Annual Compliance Survey)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input input-bordered w-full"
            />
          </div>

          {/* File Upload */}
          <div className="mb-6">
            <label className="label">
              <span className="label-text font-medium">Questions CSV</span>
            </label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : validationError
                    ? "border-error bg-error/5"
                    : file
                      ? "border-success bg-success/5"
                      : "border-base-300 hover:border-primary"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleInputChange}
                className="hidden"
              />

              {file ? (
                <div>
                  <svg
                    className="w-12 h-12 mx-auto text-success mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-base-content/60 mt-1">
                    {parsedQuestions.length} questions ready to upload
                  </p>
                </div>
              ) : (
                <div>
                  <svg
                    className="w-12 h-12 mx-auto text-base-content/40 mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <p className="font-medium">
                    Drop your CSV file here, or click to browse
                  </p>
                  <p className="text-sm text-base-content/60 mt-1">
                    Maximum 2000 questions, 5MB file size limit
                  </p>
                </div>
              )}
            </div>

            {validationError && (
              <div className="mt-3 text-error text-sm flex items-start gap-2">
                <svg
                  className="w-5 h-5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{validationError}</span>
              </div>
            )}

            {validationWarnings.length > 0 && (
              <div className="mt-3 p-3 bg-warning/10 border border-warning/30 rounded-lg">
                <div className="flex items-center gap-2 text-warning mb-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <span className="font-medium text-sm">
                    Warnings (non-blocking)
                  </span>
                </div>
                <ul className="text-sm text-base-content/70 space-y-1">
                  {validationWarnings.map((warning, idx) => (
                    <li key={idx}>- {warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* CSV Format Info */}
          <div className="bg-base-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium mb-2">CSV Format Requirements (MyPreOp Format)</h3>
            <p className="text-sm text-base-content/60 mb-2">
              All 13 columns are required. Each option gets its own row (same Id repeated):
            </p>
            <ul className="text-sm text-base-content/60 mb-3 space-y-1">
              <li>
                <code className="bg-base-300 px-1 rounded">Id</code> - Question identifier (same Id for all options)
              </li>
              <li>
                <code className="bg-base-300 px-1 rounded">Section</code> - Section grouping
              </li>
              <li>
                <code className="bg-base-300 px-1 rounded">Page</code> - Page within section
              </li>
              <li>
                <code className="bg-base-300 px-1 rounded">ItemType</code> -{" "}
                <code className="bg-base-300 px-1 rounded">radio</code>,{" "}
                <code className="bg-base-300 px-1 rounded">checkbox</code>,{" "}
                <code className="bg-base-300 px-1 rounded">text-field</code>,{" "}
                <code className="bg-base-300 px-1 rounded">text-area</code>,{" "}
                <code className="bg-base-300 px-1 rounded">text-paragraph</code>,{" "}
                <code className="bg-base-300 px-1 rounded">phone-number</code>,{" "}
                <code className="bg-base-300 px-1 rounded">age</code>,{" "}
                <code className="bg-base-300 px-1 rounded">number-input</code>,{" "}
                <code className="bg-base-300 px-1 rounded">allergy-list</code>
              </li>
              <li>
                <code className="bg-base-300 px-1 rounded">Question</code> - The question text
              </li>
              <li>
                <code className="bg-base-300 px-1 rounded">Option</code> - Single option value (one per row)
              </li>
              <li>
                <code className="bg-base-300 px-1 rounded">Characteristic</code> - Option identifier/tag
              </li>
              <li>
                <code className="bg-base-300 px-1 rounded">Required</code> - TRUE or FALSE
              </li>
              <li>
                <code className="bg-base-300 px-1 rounded">EnableWhen</code> - Conditional display logic
              </li>
              <li>
                <code className="bg-base-300 px-1 rounded">HasHelper</code> - TRUE or FALSE
              </li>
              <li>
                <code className="bg-base-300 px-1 rounded">HelperType</code>,{" "}
                <code className="bg-base-300 px-1 rounded">HelperName</code>,{" "}
                <code className="bg-base-300 px-1 rounded">HelperValue</code> - Helper content
              </li>
            </ul>
            <code className="block bg-base-300 rounded p-3 text-sm font-mono overflow-x-auto whitespace-pre">
              {`Id,Section,Page,ItemType,Question,Option,Characteristic,Required,EnableWhen,HasHelper,HelperType,HelperName,HelperValue
Q001,Who I Am,Personal Details,radio,Select your gender,Male,patient_is_male,TRUE,,FALSE,,,
Q001,Who I Am,Personal Details,radio,Select your gender,Female,patient_is_female,TRUE,,FALSE,,,
Q002,Who I Am,Personal Details,text-field,What is your name?,,patient_name,TRUE,,FALSE,,,`}
            </code>
          </div>

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={!name.trim() || !file || isUploading}
            className="btn btn-primary w-full"
          >
            {isUploading ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Creating Master Questionnaire...
              </>
            ) : (
              "Create Master Questionnaire"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
