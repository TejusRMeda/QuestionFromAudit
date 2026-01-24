"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import toast from "react-hot-toast";

interface ParsedQuestion {
  Question_ID: string;
  Category: string;
  Question_Text: string;
  Answer_Type: string;
  Answer_Options: string;
}

interface ValidationResult {
  questions: ParsedQuestion[];
  warnings: string[];
}

const VALID_ANSWER_TYPES = ["text", "radio", "multi_select"];

export default function MasterUploadPage() {
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
      Papa.parse<ParsedQuestion>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const requiredColumns = [
            "Question_ID",
            "Category",
            "Question_Text",
            "Answer_Type",
            "Answer_Options",
          ];
          const headers = results.meta.fields || [];

          // Check for required columns
          const missingColumns = requiredColumns.filter(
            (col) => !headers.includes(col)
          );
          if (missingColumns.length > 0) {
            reject(`Missing required columns: ${missingColumns.join(", ")}`);
            return;
          }

          // Validate data
          const questions = results.data as ParsedQuestion[];
          if (questions.length === 0) {
            reject("CSV file contains no data rows");
            return;
          }

          if (questions.length > 500) {
            reject("CSV file exceeds maximum of 500 questions");
            return;
          }

          const warnings: string[] = [];
          const questionIds = new Set<string>();
          const categoryCounts: Record<string, number> = {};

          for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            const rowNum = i + 2; // Account for header row

            // Required field validations
            if (!q.Question_ID?.trim()) {
              reject(`Row ${rowNum}: Question_ID is empty`);
              return;
            }
            if (!q.Category?.trim()) {
              reject(`Row ${rowNum}: Category is empty`);
              return;
            }
            if (!q.Question_Text?.trim()) {
              reject(`Row ${rowNum}: Question_Text is empty`);
              return;
            }
            if (q.Question_Text.length > 1000) {
              reject(`Row ${rowNum}: Question_Text exceeds 1000 character limit`);
              return;
            }
            if (questionIds.has(q.Question_ID)) {
              reject(`Duplicate Question_ID found: ${q.Question_ID}`);
              return;
            }
            questionIds.add(q.Question_ID);

            // Track category counts for warnings
            categoryCounts[q.Category] = (categoryCounts[q.Category] || 0) + 1;

            // Answer_Type validation
            const answerType = q.Answer_Type?.trim().toLowerCase();
            if (!answerType) {
              reject(`Row ${rowNum}: Answer_Type is required`);
              return;
            }
            if (!VALID_ANSWER_TYPES.includes(answerType)) {
              reject(
                `Row ${rowNum}: Answer_Type must be one of: text, radio, multi_select (got "${q.Answer_Type}")`
              );
              return;
            }

            // Normalize Answer_Type to lowercase
            q.Answer_Type = answerType;

            // Answer_Options validation
            const answerOptions = q.Answer_Options?.trim() || "";

            if (answerType === "text") {
              // Text type should have empty Answer_Options
              if (answerOptions) {
                reject(
                  `Row ${rowNum}: Answer_Options must be empty for "text" type questions`
                );
                return;
              }
            } else {
              // radio and multi_select require at least 2 options
              if (!answerOptions) {
                reject(
                  `Row ${rowNum}: Answer_Options is required for "${answerType}" type questions`
                );
                return;
              }

              const options = answerOptions.split("|").map((o) => o.trim()).filter(Boolean);

              if (options.length < 2) {
                reject(
                  `Row ${rowNum}: Answer_Options must have at least 2 options for "${answerType}" type (found ${options.length})`
                );
                return;
              }

              // Warnings (non-blocking)
              if (options.length > 20) {
                warnings.push(
                  `Row ${rowNum} (${q.Question_ID}): More than 20 options may affect usability`
                );
              }

              options.forEach((opt, idx) => {
                if (opt.length > 100) {
                  warnings.push(
                    `Row ${rowNum} (${q.Question_ID}): Option ${idx + 1} exceeds 100 characters`
                  );
                }
              });
            }
          }

          // Check for single-question categories (warning only)
          Object.entries(categoryCounts).forEach(([cat, count]) => {
            if (count === 1) {
              warnings.push(`Category "${cat}" has only 1 question`);
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
        toast.success(`Validated ${result.questions.length} questions (${result.warnings.length} warnings)`);
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

      const data = await response.json();

      // Copy admin link to clipboard and show toast
      const adminUrl = `${window.location.origin}/masters/${data.adminLinkId}`;
      await navigator.clipboard.writeText(adminUrl);
      toast.success("Dashboard link copied to clipboard!", { duration: 4000 });

      // Redirect to master dashboard
      router.push(`/masters/${data.adminLinkId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200 py-12 px-4">
      <div className="max-w-2xl mx-auto">
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
                    Maximum 500 questions, 5MB file size limit
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
                  <span className="font-medium text-sm">Warnings (non-blocking)</span>
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
            <h3 className="font-medium mb-2">CSV Format Requirements</h3>
            <p className="text-sm text-base-content/60 mb-2">
              All 5 columns are required:
            </p>
            <ul className="text-sm text-base-content/60 mb-3 space-y-1">
              <li><code className="bg-base-300 px-1 rounded">Question_ID</code> - Unique identifier</li>
              <li><code className="bg-base-300 px-1 rounded">Category</code> - Question category</li>
              <li><code className="bg-base-300 px-1 rounded">Question_Text</code> - The question (max 1000 chars)</li>
              <li><code className="bg-base-300 px-1 rounded">Answer_Type</code> - <code className="bg-base-300 px-1 rounded">text</code>, <code className="bg-base-300 px-1 rounded">radio</code>, or <code className="bg-base-300 px-1 rounded">multi_select</code></li>
              <li><code className="bg-base-300 px-1 rounded">Answer_Options</code> - Pipe-separated options (empty for text type)</li>
            </ul>
            <code className="block bg-base-300 rounded p-3 text-sm font-mono overflow-x-auto whitespace-pre">
{`Question_ID,Category,Question_Text,Answer_Type,Answer_Options
Q001,Demographics,What is your age?,radio,"Under 18|18-30|31-50|Over 50"
Q002,Health,Any allergies?,multi_select,"Peanuts|Dairy|Gluten|None"
Q003,Feedback,Additional comments?,text,`}
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
